import sharp from "sharp";
import {
  DEFAULT_ROLE,
  FINAL_H,
  FINAL_W,
  MASTER_W,
  PC_PFP_ORIGIN,
  PFP_SIZE,
  RESPONSE_MAX_BYTES,
  RETINA_H,
  RETINA_W,
  chapterLine,
  cityLine,
  fileStemFor,
  getCountry,
  handleLine,
  isCountrySlug,
  normalizeHandle,
  roleLine,
  validateCity,
  validateHandle,
  validateRole,
  type CropParams,
} from "@workspace/papercut-core";
import { assetPath } from "./assets";
import { RenderError } from "./errors";
import { overlaySvg } from "./overlay";
import { decodePhotoDataUrl, portraitDisc } from "./photo";
import { findUnrenderableChar } from "./text";

export interface RenderRequest {
  country: string;
  city: string;
  handle: string;
  /** role on the pill's second line; omit for "Builder", send "" for none */
  role?: string;
  pfpDataUrl?: string | null;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface RenderResult {
  finalPngDataUrl: string;
  finalWidth: number;
  finalHeight: number;
  finalBytes: number;
  masterDataUrl: string;
  masterWidth: number;
  masterHeight: number;
  masterFormat: "webp";
  masterBytes: number;
  fileStem: string;
  chapterLine: string;
}

/** Overhead of `data:image/...;base64,` prefixes and the JSON envelope, kept out of the 4.4 MB budget. */
const RESPONSE_ENVELOPE_BYTES = 2_048;

const base64Size = (bytes: number) => Math.ceil(bytes / 3) * 4;

/** Light sharpen after the lanczos downscale, so paper edges stay crisp at 1500 px. */
const FINAL_SHARPEN = { sigma: 0.5, m1: 0.3, m2: 0.2 } as const;

/**
 * Compose at the retina size rather than on the 7500x2500 master. Geometry is
 * still expressed in master units (the overlay keeps its master viewBox, the
 * portrait origin is scaled), so the result is the same picture; but the
 * overlay's drop-shadow blurs cost ~8 s to rasterise at 7500 px and ~0.5 s
 * here. 3000x1000 is the largest file we ever return anyway.
 */
const COMPOSE_W = RETINA_W;
const COMPOSE_H = RETINA_H;
const COMPOSE_SCALE = COMPOSE_W / MASTER_W;

/**
 * Compose one banner: validate, draw the overlay + portrait onto the country's
 * papercut base, then emit the 1500x500 PNG and the 3000x1000 retina WebP as
 * data URLs. The 7500 px master is never returned. Nothing is written to disk
 * or logged.
 */
export async function renderBanner(req: RenderRequest): Promise<RenderResult> {
  if (!isCountrySlug(req.country)) {
    throw new RenderError(400, "Pick one of the ten chapters.", "country");
  }
  const country = getCountry(req.country);

  const city = req.city.trim();
  const cityError = validateCity(city);
  if (cityError) throw new RenderError(400, cityError, "city");

  const handleError = validateHandle(req.handle);
  if (handleError) throw new RenderError(400, handleError, "handle");
  const handle = normalizeHandle(req.handle);

  const role = req.role === undefined ? DEFAULT_ROLE : req.role.trim();
  const roleError = validateRole(role);
  if (roleError) throw new RenderError(400, roleError, "role");

  const badCity = findUnrenderableChar(cityLine(city), 500);
  if (badCity) {
    throw new RenderError(422, `The banner font has no glyph for "${badCity}". Try spelling the city without it.`, "city");
  }
  const badHandle = findUnrenderableChar(handleLine(handle), 700);
  if (badHandle) {
    throw new RenderError(422, `The banner font has no glyph for "${badHandle}".`, "handle");
  }
  const badRole = findUnrenderableChar(roleLine(country, role), 500);
  if (badRole) {
    throw new RenderError(422, `The banner font has no glyph for "${badRole}". Try spelling the role without it.`, "role");
  }

  const crop: CropParams = {
    scale: req.scale ?? 1,
    offsetX: req.offsetX ?? 0,
    offsetY: req.offsetY ?? 0,
  };

  const portrait = req.pfpDataUrl
    ? await portraitDisc(decodePhotoDataUrl(req.pfpDataUrl), crop, Math.round(PFP_SIZE * COMPOSE_SCALE))
    : null;

  const layers: sharp.OverlayOptions[] = [
    {
      input: Buffer.from(overlaySvg({ country, city, handle, role, placeholder: !portrait, width: COMPOSE_W, height: COMPOSE_H })),
      top: 0,
      left: 0,
    },
  ];
  if (portrait) {
    layers.push({
      input: portrait,
      left: Math.round(PC_PFP_ORIGIN.left * COMPOSE_SCALE),
      top: Math.round(PC_PFP_ORIGIN.top * COMPOSE_SCALE),
    });
  }

  const composed = await sharp(assetPath("bases", `${country.slug}.webp`), { limitInputPixels: false })
    .resize(COMPOSE_W, COMPOSE_H, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .composite(layers)
    .removeAlpha()
    .raw()
    .toBuffer();

  const fromComposed = () => sharp(composed, { raw: { width: COMPOSE_W, height: COMPOSE_H, channels: 3 } });

  const [finalPng, retinaWebp] = await Promise.all([
    fromComposed()
      .resize(FINAL_W, FINAL_H, { kernel: sharp.kernel.lanczos3 })
      .sharpen(FINAL_SHARPEN)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer(),
    fromComposed().webp({ quality: 95, effort: 4 }).toBuffer(),
  ]);

  const payload = base64Size(finalPng.length) + base64Size(retinaWebp.length) + RESPONSE_ENVELOPE_BYTES;
  if (payload > RESPONSE_MAX_BYTES) {
    throw new RenderError(413, "This banner came out too large to send back. Try a simpler photo.");
  }

  return {
    finalPngDataUrl: `data:image/png;base64,${finalPng.toString("base64")}`,
    finalWidth: FINAL_W,
    finalHeight: FINAL_H,
    finalBytes: finalPng.length,
    masterDataUrl: `data:image/webp;base64,${retinaWebp.toString("base64")}`,
    masterWidth: RETINA_W,
    masterHeight: RETINA_H,
    masterFormat: "webp",
    masterBytes: retinaWebp.length,
    fileStem: fileStemFor(country.slug, city, handle),
    chapterLine: chapterLine(city, handle),
  };
}
