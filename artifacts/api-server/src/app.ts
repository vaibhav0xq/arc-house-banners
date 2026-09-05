import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
// One reverse proxy sits in front of the server in development and production;
// trusting exactly that hop keeps req.ip honest for the render rate limit.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
const jsonBody = express.json();
// The banner render route parses its own, much larger JSON body (see routes/banners.ts).
app.use((req, res, next) => (req.path === "/api/banners/render" ? next() : jsonBody(req, res, next)));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Body-parser failures (oversized or malformed JSON) and anything unhandled come back as JSON, not an HTML page.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : 500;
  if (status >= 500) req.log.error({ err }, "unhandled error");
  const error =
    status === 413
      ? "That upload is too large. Photos need to be 25 MB or smaller."
      : status >= 500
        ? "Something went wrong on our side. Please try again."
        : (err as { message?: string })?.message || "Bad request.";
  res.status(status).json({ error });
});

export default app;
