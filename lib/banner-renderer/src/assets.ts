import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let assetsRoot: string | undefined;

/**
 * Locate lib/banner-renderer/assets (fonts + 7500x2500 bases).
 *
 * Next to the source when the package runs unbundled (tsx, tests). The API
 * server bundles this module with esbuild into artifacts/api-server/dist, so
 * we also try repo-relative paths from the bundle location and the working
 * directory, plus an explicit BANNER_ASSETS_DIR override for anything else.
 */
export function resolveAssetsRoot(): string {
  if (assetsRoot) return assetsRoot;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.BANNER_ASSETS_DIR,
    path.resolve(here, "../assets"),
    path.resolve(here, "../../lib/banner-renderer/assets"),
    path.resolve(here, "../../../lib/banner-renderer/assets"),
    path.resolve(process.cwd(), "lib/banner-renderer/assets"),
    path.resolve(process.cwd(), "../../lib/banner-renderer/assets"),
  ].filter((p): p is string => Boolean(p));
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "fonts")) && existsSync(path.join(candidate, "bases"))) {
      assetsRoot = candidate;
      return candidate;
    }
  }
  throw new Error(`Banner renderer assets not found. Looked in: ${candidates.join(", ")}`);
}

/** Absolute path inside lib/banner-renderer/assets. */
export function assetPath(...segments: string[]): string {
  return path.join(resolveAssetsRoot(), ...segments);
}
