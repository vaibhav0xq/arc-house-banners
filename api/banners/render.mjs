// Vercel function for POST /api/banners/render. The Express app is bundled by
// artifacts/api-server/build.mjs during the build step (see vercel.json).
export { default } from "../../artifacts/api-server/dist/vercel.mjs";
