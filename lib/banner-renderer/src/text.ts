import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { assetPath } from "./assets";

export type FontWeight = 500 | 700;

/** Vendored so text renders identically everywhere: glyphs become SVG paths, so the rasteriser never needs a system font. */
const FONT_FILES: Record<FontWeight, string> = {
  500: "Manrope-500.ttf",
  700: "Manrope-700.ttf",
};

const fontCache = new Map<FontWeight, opentype.Font>();

export function loadFont(weight: FontWeight): opentype.Font {
  const cached = fontCache.get(weight);
  if (cached) return cached;
  const buf = readFileSync(assetPath("fonts", FONT_FILES[weight]));
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  fontCache.set(weight, font);
  return font;
}

export interface TextStyle {
  weight: FontWeight;
  /** font-size in SVG user units */
  size: number;
  /** extra tracking between glyphs, in user units (same meaning as SVG letter-spacing) */
  letterSpacing: number;
  fill: string;
  /** fill opacity, 1 when omitted */
  opacity?: number;
}

/**
 * Per-glyph layout with kerning. Whole-string shaping in opentype.js trips over
 * some fonts' GSUB tables, so we advance glyph by glyph, which is also exactly
 * how the browser lays out the preview's <text> with letter-spacing.
 */
function layout(text: string, style: TextStyle): { glyphs: opentype.Glyph[]; xs: number[]; width: number } {
  const font = loadFont(style.weight);
  const scale = style.size / font.unitsPerEm;
  const glyphs: opentype.Glyph[] = [];
  const xs: number[] = [];
  let x = 0;
  let prev: opentype.Glyph | null = null;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    if (prev) {
      x += font.getKerningValue(prev, glyph) * scale + style.letterSpacing;
    }
    glyphs.push(glyph);
    xs.push(x);
    x += (glyph.advanceWidth ?? 0) * scale;
    prev = glyph;
  }
  return { glyphs, xs, width: x };
}

/**
 * Visual width of a run: advance widths with tracking between glyphs but not
 * after the last one (what the browser's getComputedTextLength reports too,
 * minus the trailing spacing).
 */
export function measureText(text: string, style: TextStyle): number {
  if (!text) return 0;
  return layout(text, style).width;
}

/** One text run as filled SVG <path>s, anchored at (x, baselineY). */
export function textPath(text: string, x: number, baselineY: number, style: TextStyle): string {
  if (!text) return "";
  const { glyphs, xs } = layout(text, style);
  let d = "";
  glyphs.forEach((glyph, i) => {
    const p = glyph.getPath(x + xs[i]!, baselineY, style.size);
    d += pathData(p.commands);
  });
  if (!d) return "";
  const opacity = style.opacity !== undefined && style.opacity < 1 ? ` fill-opacity="${style.opacity}"` : "";
  return `<path d="${d}" fill="${style.fill}"${opacity}/>`;
}

/**
 * Serialises path commands ourselves. opentype.js 1.3.x's toPathData rounds via
 * string concatenation and emits "NaN" whenever a coordinate's fractional part
 * is tiny enough to print in exponent form; one bad point silently truncates
 * the rest of the glyph run.
 */
function pathData(commands: opentype.PathCommand[]): string {
  const n = (v: number) => {
    if (!Number.isFinite(v)) throw new Error("Non-finite coordinate in glyph outline");
    return v.toFixed(2).replace(/\.?0+$/, "");
  };
  let d = "";
  for (const c of commands) {
    switch (c.type) {
      case "M":
      case "L":
        d += `${c.type}${n(c.x)} ${n(c.y)}`;
        break;
      case "Q":
        d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        break;
      case "C":
        d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        break;
      case "Z":
        d += "Z";
        break;
    }
  }
  return d;
}

/** Returns the first character the vendored font cannot draw. Null when every glyph exists. */
export function findUnrenderableChar(text: string, weight: FontWeight): string | null {
  const font = loadFont(weight);
  for (const ch of text) {
    if (ch === " ") continue;
    if (font.charToGlyphIndex(ch) === 0) return ch;
  }
  return null;
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
