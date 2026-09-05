import type { CountrySlug } from '@workspace/papercut-core';

const BASE = import.meta.env.BASE_URL;

export type BaseImageSize = 'full' | 'thumb';

/**
 * Preview base for a country (served from public/bases). `full` is the
 * 3000 x 1000 WebP used wherever the banner is inspected closely (studio
 * preview, full-size dialog); `thumb` is a 1200 x 400 cut for catalog cards,
 * stacks and marquees where ten of them load at once.
 */
export function baseImageUrl(slug: CountrySlug, size: BaseImageSize = 'full'): string {
  return size === 'thumb' ? `${BASE}bases/thumbs/${slug}.webp` : `${BASE}bases/${slug}.webp`;
}

/** The sample portrait behind "Try a sample photo" (served from public). */
export const SAMPLE_PHOTO_URL = `${BASE}sample-photo.jpg`;

/** CSS font shorthand strings for the banner faces, used to wait for them before measuring. */
export const BANNER_FONT_LOADS = ['500 38px "Manrope Banner"', '700 58px "Manrope Banner"'] as const;

export const BANNER_FONT_FAMILY = '"Manrope Banner", Manrope, "Segoe UI", sans-serif';
