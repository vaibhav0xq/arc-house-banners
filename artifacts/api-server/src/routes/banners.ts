import express, { Router, type IRouter } from "express";
import { RenderBannerBody, RenderBannerResponse } from "@workspace/api-zod";
import { RenderError, renderBanner } from "@workspace/banner-renderer";
import { PHOTO_MAX_BYTES } from "@workspace/papercut-core";
import { logger } from "../lib/logger";
import { GateFullError, RateLimitedError, RenderGate } from "../lib/render-gate";

const router: IRouter = Router();

/**
 * A 25 MB photo becomes ~34 MB of base64 inside the JSON body, so this route
 * gets its own body limit instead of raising the global one.
 */
const RENDER_BODY_LIMIT = Math.ceil((PHOTO_MAX_BYTES * 4) / 3) + 64 * 1024;

const FIELD_FROM_PATH: Record<string, "country" | "city" | "handle" | "role" | "photo"> = {
  country: "country",
  city: "city",
  handle: "handle",
  role: "role",
  pfpDataUrl: "photo",
  scale: "photo",
  offsetX: "photo",
  offsetY: "photo",
};

const gate = new RenderGate();

/** Renders that outlive this are abandoned (the response is a 503) so a stuck libvips call cannot hold a slot forever. */
const RENDER_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RenderTimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

class RenderTimeoutError extends Error {
  readonly name = "RenderTimeoutError";
}

/**
 * Admission control runs before the body parser so refused requests never
 * buffer a 34 MB payload; the slot is released whatever happens afterwards.
 */
async function admit(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  let release: (() => void) | undefined;
  try {
    release = await gate.acquire(req.ip ?? "unknown");
  } catch (err) {
    if (err instanceof RateLimitedError || err instanceof GateFullError) {
      res.setHeader("Retry-After", String(err.retryAfterSeconds));
      res.status(err instanceof RateLimitedError ? 429 : 503).json({ error: err.message });
      return;
    }
    next(err);
    return;
  }
  res.once("close", release);
  res.once("finish", release);
  next();
}

const FRIENDLY: Record<string, string> = {
  country: "Pick one of the ten chapters.",
  city: "Cities are 1 to 28 characters: letters, digits, spaces and . ' & / ( ) -",
  handle: "Handles are 1 to 15 letters, digits or underscores, with an optional @.",
  role: "Roles are up to 18 characters: letters, digits, spaces and . ' & / ( ) -",
  pfpDataUrl: "The photo must be sent as a data URL.",
};

router.post(
  "/banners/render",
  admit,
  express.json({ limit: RENDER_BODY_LIMIT }),
  async (req, res) => {
    const parsed = RenderBannerBody.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const key = String(issue?.path[0] ?? "");
      res.status(400).json({
        error: FRIENDLY[key] ?? issue?.message ?? "Invalid request.",
        ...(FIELD_FROM_PATH[key] ? { field: FIELD_FROM_PATH[key] } : {}),
      });
      return;
    }

    try {
      const result = await withTimeout(renderBanner(parsed.data), RENDER_TIMEOUT_MS);
      res.json(RenderBannerResponse.parse(result));
    } catch (err) {
      if (err instanceof RenderError) {
        res.status(err.status).json({ error: err.message, ...(err.field ? { field: err.field } : {}) });
        return;
      }
      if (err instanceof RenderTimeoutError) {
        logger.error({ country: parsed.data.country, gate: gate.stats }, "banner render timed out");
        res.status(503).json({ error: "The render took too long. Please try again." });
        return;
      }
      // Log the failure, never the request body: it carries the member's photo.
      logger.error({ err, country: parsed.data.country }, "banner render failed");
      res.status(500).json({ error: "The banner could not be rendered. Please try again." });
    }
  },
);

export default router;
