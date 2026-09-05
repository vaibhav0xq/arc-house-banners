/**
 * Portrait crop maths, shared by the studio (CSS percentages, drag-to-pan) and
 * the renderer (pixel extract). Both sides call `cropWindow` with the same
 * image dimensions and the same parameters, so the circle the member sees is
 * the circle that gets rendered.
 */

/** Crop as sent to the API: zoom 1-4, offsets -1..1 of the available slack. */
export type CropParams = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** Crop as the studio stores it: integers so slider maths stays exact. */
export type CropState = {
  /** 100 to 400, i.e. 1x to 4x */
  zoom: number;
  /** -100 to 100, i.e. crop window pushed fully left to fully right */
  offsetX: number;
  /** -100 to 100, i.e. crop window pushed fully up to fully down */
  offsetY: number;
};

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 400;
export const PAN_MIN = -100;
export const PAN_MAX = 100;

export const DEFAULT_CROP: CropState = { zoom: 100, offsetX: 0, offsetY: 0 };

/**
 * Zoom applied automatically when someone drags a photo on an axis that has no
 * slack (a square photo at 1x). Dragging should always move something.
 */
export const AUTO_PAN_ZOOM = 125;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export type CropWindow = { left: number; top: number; side: number };

export function cropToParams(crop: CropState): CropParams {
  return {
    scale: clamp(crop.zoom / 100, 1, 4),
    offsetX: clamp(crop.offsetX / 100, -1, 1),
    offsetY: clamp(crop.offsetY / 100, -1, 1),
  };
}

/**
 * The square of the source that ends up inside the portrait circle: the largest
 * centred square divided by the zoom, then pushed around inside the available
 * slack by the offsets. Pixel-exact and identical on both sides.
 */
export function cropWindow(width: number, height: number, params: CropParams): CropWindow {
  const zoom = clamp(params.scale, 1, 4);
  const ox = clamp(params.offsetX, -1, 1);
  const oy = clamp(params.offsetY, -1, 1);
  const side = Math.max(1, Math.floor(Math.min(width, height) / zoom));
  const slackX = width - side;
  const slackY = height - side;
  const left = Math.round(slackX / 2 + (ox * slackX) / 2);
  const top = Math.round(slackY / 2 + (oy * slackY) / 2);
  return {
    left: clamp(left, 0, slackX),
    top: clamp(top, 0, slackY),
    side,
  };
}

export function cropWindowFor(width: number, height: number, crop: CropState): CropWindow {
  return cropWindow(width, height, cropToParams(crop));
}

/**
 * Percentages that place the full image inside a square box (the circle) so
 * that exactly the crop window is visible. Relative to the box, so the same
 * maths works at 48px, 300px or inside the banner preview.
 */
export function cropImagePercentages(
  width: number,
  height: number,
  crop: CropState,
): { width: string; height: string; left: string; top: string } {
  const win = cropWindowFor(width, height, crop);
  const pct = (v: number) => `${(v / win.side) * 100}%`;
  return {
    width: pct(width),
    height: pct(height),
    left: pct(-win.left),
    top: pct(-win.top),
  };
}

/**
 * Convert a pointer drag (in display pixels, within a circle of `diameter`
 * display pixels) into a new crop. Dragging the picture right reveals more of
 * its left side, so the window moves the other way.
 */
export function panCrop(
  width: number,
  height: number,
  crop: CropState,
  dx: number,
  dy: number,
  diameter: number,
): CropState {
  if (diameter <= 0) return crop;
  const win = cropWindowFor(width, height, crop);
  const scale = diameter / win.side; // display px per source px
  const slackX = width - win.side;
  const slackY = height - win.side;
  let offsetX = crop.offsetX;
  let offsetY = crop.offsetY;
  if (slackX > 0) {
    offsetX = clamp(crop.offsetX - ((2 * dx) / (scale * slackX)) * 100, PAN_MIN, PAN_MAX);
  }
  if (slackY > 0) {
    offsetY = clamp(crop.offsetY - ((2 * dy) / (scale * slackY)) * 100, PAN_MIN, PAN_MAX);
  }
  return { ...crop, offsetX, offsetY };
}

export function canPan(width: number, height: number, crop: CropState): { x: boolean; y: boolean } {
  const win = cropWindowFor(width, height, crop);
  return { x: width - win.side > 0, y: height - win.side > 0 };
}

/**
 * Clamp a crop into range and zero any offset that has no slack to act on, so
 * the stored state always describes something visible.
 */
export function normalizeCrop(width: number, height: number, next: CropState): CropState {
  const zoom = clamp(Math.round(next.zoom), ZOOM_MIN, ZOOM_MAX);
  const room = canPan(width, height, { ...next, zoom });
  return {
    zoom,
    offsetX: room.x ? clamp(Math.round(next.offsetX), PAN_MIN, PAN_MAX) : 0,
    offsetY: room.y ? clamp(Math.round(next.offsetY), PAN_MIN, PAN_MAX) : 0,
  };
}
