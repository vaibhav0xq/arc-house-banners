import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

/**
 * Social scrapers need absolute image URLs. When SITE_URL is set for a
 * production build (e.g. https://banners.example), the og:image and
 * twitter:image tags in index.html are rewritten to point at it. On Vercel
 * the production domain is read from the system variable when SITE_URL is
 * not set.
 */
function siteUrl(): string | undefined {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : undefined;
}

function absoluteSocialImages(): Plugin {
  return {
    name: 'paper-chapters:absolute-social-images',
    transformIndexHtml(html) {
      const site = siteUrl()?.replace(/\/+$/, '');
      if (!site) return html;
      const prefix = `${site}${basePath.replace(/\/+$/, '')}`;
      return html.replace(/content="\/og\.png"/g, `content="${prefix}/og.png"`);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    absoluteSocialImages(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
