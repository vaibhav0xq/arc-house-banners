import app from "./app";

/**
 * Entry for Vercel. The platform calls the exported Express app as a request
 * handler, so nothing listens on a port here. build.mjs bundles this file to
 * dist/vercel.mjs and the api/*.mjs files at the repo root re-export it.
 */
export default app;
