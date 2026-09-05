import pino from "pino";

// Pretty printing spawns a pino-pretty worker from a file next to the bundle.
// Only the dev script sets NODE_ENV=development, so every other environment
// (Vercel functions, tests, other hosts) gets plain JSON on stdout.
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
