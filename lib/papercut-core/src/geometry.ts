/**
 * Banner geometry shared by the studio preview and the server renderer.
 *
 * The papercut series is designed on a 3000 x 1000 grid and drawn x2.5 onto the
 * 7500 x 2500 master that the bases are painted at. Every number below is in
 * master units; the preview scales the same numbers down with an SVG viewBox.
 */
export const MASTER_W = 7500;
export const MASTER_H = 2500;
/** The X header file. */
export const FINAL_W = 1500;
export const FINAL_H = 500;
/** The retina WebP. */
export const RETINA_W = 3000;
export const RETINA_H = 1000;

/** Design-grid to master scale. */
export const PC = 2.5;

/** Portrait diameter on the master (160 on the design grid). */
export const PFP_SIZE = 400;

/** Left margin: city line and the left edge of the layout. */
export const PC_X0 = 120 * PC;

export const PC_CITY_BASELINE = 502 * PC;
export const PC_CITY_SIZE = 38 * PC;
export const PC_CITY_LS = 5 * PC;
export const PC_CITY_OPACITY = 0.95;

export const PC_PFP_CENTER = { x: 200 * PC, y: 690 * PC } as const;
export const PC_PFP_ORIGIN = {
  left: PC_PFP_CENTER.x - PFP_SIZE / 2,
  top: PC_PFP_CENTER.y - PFP_SIZE / 2,
} as const;

export const PC_PILL = { x: 90 * PC, y: 584 * PC, height: 212 * PC, radius: 106 * PC } as const;
/** Gap between the portrait and the text column. */
export const PC_TEXT_GAP = 44 * PC;
export const PC_TEXT_X = PC_PFP_CENTER.x + PFP_SIZE / 2 + PC_TEXT_GAP;
/** The text column never gets narrower than this, so short handles still get a generous pill. */
export const PC_TEXT_MIN_WIDTH = 600 * PC;
export const PC_PILL_PAD = { left: 30 * PC, right: 56 * PC } as const;
/** Ink ring around the portrait. */
export const PC_RING = 7 * PC;

export const PC_HANDLE_SIZE = 58 * PC;
export const PC_HANDLE_BASELINE = PC_PFP_CENTER.y - 8 * PC;

export const PC_ROLE_SIZE = 28 * PC;
export const PC_ROLE_LS = 6 * PC;
export const PC_ROLE_BASELINE = PC_PFP_CENTER.y + 44 * PC;
export const PC_ROLE_OPACITY = 0.9;

/** Drop shadows (feDropShadow parameters, master units). */
export const PC_SHADOWS = {
  /** portrait ring */
  lift: { dy: 6 * PC, blur: 10 * PC, opacity: 0.28 },
  /** type */
  soft: { dy: 3 * PC, blur: 6 * PC, opacity: 0.28 },
  /** pill paper */
  paper: { dy: 10 * PC, blur: 12 * PC, opacity: 0.22 },
} as const;

/** Placeholder bust drawn inside the ring when no photo is loaded (coordinates relative to the portrait centre, in design units for a 400px portrait). */
export const PC_PLACEHOLDER = {
  head: { cy: -42, r: 48 },
  shoulders: "M-100 104 C-100 38 -56 12 0 12 C56 12 100 38 100 104 Z",
  opacity: 0.35,
} as const;

/**
 * Pill width for the measured handle and role line widths (master units). The
 * studio measures with the browser, the renderer with opentype.js; both feed
 * this same formula. The role line counts because a member can type their own
 * role. "COMMUNITY LEAD · BANGLADESH CHAPTER" is wider than most handles.
 */
export function pillWidthFor(handleWidth: number, roleWidth = 0): number {
  return (
    PC_PILL_PAD.left + PFP_SIZE + PC_TEXT_GAP + Math.max(handleWidth, roleWidth, PC_TEXT_MIN_WIDTH) + PC_PILL_PAD.right
  );
}

/**
 * Width of a letter-spaced run given its width without tracking: spacing sits
 * between glyphs, not after the last one. Browsers include the trailing
 * spacing in getComputedTextLength, the renderer does not, so the studio
 * measures the role line untracked and adds the tracking here.
 */
export function trackedWidth(untrackedWidth: number, text: string, letterSpacing: number): number {
  const glyphs = Array.from(text).length;
  return untrackedWidth + Math.max(0, glyphs - 1) * letterSpacing;
}
