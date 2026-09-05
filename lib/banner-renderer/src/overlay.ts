import {
  MASTER_H,
  MASTER_W,
  PC_CITY_BASELINE,
  PC_CITY_LS,
  PC_CITY_OPACITY,
  PC_CITY_SIZE,
  PC_HANDLE_BASELINE,
  PC_HANDLE_SIZE,
  PC_PFP_CENTER,
  PC_PILL,
  PC_PLACEHOLDER,
  PC_RING,
  PC_ROLE_BASELINE,
  PC_ROLE_LS,
  PC_ROLE_OPACITY,
  PC_ROLE_SIZE,
  PC_SHADOWS,
  PC_TEXT_X,
  PC_X0,
  PFP_SIZE,
  cityLine,
  handleLine,
  pillWidthFor,
  roleLine,
  type Country,
} from "@workspace/papercut-core";
import { measureText, textPath, type TextStyle } from "./text";

export interface OverlayInput {
  country: Country;
  city: string;
  handle: string;
  /** role shown before the chapter on the second pill line; empty for none, undefined for the default */
  role?: string;
  /** draw the neutral bust (no portrait supplied) */
  placeholder: boolean;
  /** raster size for the SVG root; the viewBox stays in master units (defaults to the 7500x2500 master) */
  width?: number;
  height?: number;
}

/**
 * The personalisation layer as a 7500x2500 SVG: city line, pill, type,
 * ink ring and (optionally) the placeholder bust. Element order and filter
 * parameters mirror the studio's PapercutLockup exactly; the portrait itself is
 * composited separately as a raster so the crop is pixel-exact.
 */
export function overlaySvg({ country, city, handle, role, placeholder, width = MASTER_W, height = MASTER_H }: OverlayInput): string {
  const ink = country.ink;
  const tag = country.tag;

  const cityStyle: TextStyle = { weight: 500, size: PC_CITY_SIZE, letterSpacing: PC_CITY_LS, fill: ink, opacity: PC_CITY_OPACITY };
  const handleStyle: TextStyle = { weight: 700, size: PC_HANDLE_SIZE, letterSpacing: 0, fill: ink };
  const roleStyle: TextStyle = { weight: 500, size: PC_ROLE_SIZE, letterSpacing: PC_ROLE_LS, fill: ink, opacity: PC_ROLE_OPACITY };

  const handleText = handleLine(handle);
  const roleText = roleLine(country, role);
  const pillWidth = pillWidthFor(measureText(handleText, handleStyle), measureText(roleText, roleStyle));
  const { x: cx, y: cy } = PC_PFP_CENTER;
  const cityText = cityLine(city);

  const shadow = (id: string, s: { dy: number; blur: number; opacity: number }, box: string) =>
    `<filter id="${id}" ${box}><feDropShadow dx="0" dy="${s.dy}" stdDeviation="${s.blur}" flood-color="${ink}" flood-opacity="${s.opacity}"/></filter>`;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${MASTER_W} ${MASTER_H}">`,
    "<defs>",
    shadow("lift", PC_SHADOWS.lift, 'x="-10%" y="-30%" width="120%" height="160%"'),
    shadow("soft", PC_SHADOWS.soft, 'x="-10%" y="-30%" width="120%" height="160%"'),
    shadow("paper", PC_SHADOWS.paper, 'x="-20%" y="-20%" width="140%" height="160%"'),
    "</defs>",
    `<rect x="${PC_PILL.x}" y="${PC_PILL.y}" width="${pillWidth}" height="${PC_PILL.height}" rx="${PC_PILL.radius}" ry="${PC_PILL.radius}" fill="${tag}" filter="url(#paper)"/>`,
  );
  if (cityText) {
    parts.push(`<g filter="url(#soft)">${textPath(cityText, PC_X0, PC_CITY_BASELINE, cityStyle)}</g>`);
  }
  parts.push(
    `<g filter="url(#soft)">`,
    textPath(handleText, PC_TEXT_X, PC_HANDLE_BASELINE, handleStyle),
    textPath(roleText, PC_TEXT_X, PC_ROLE_BASELINE, roleStyle),
    `</g>`,
    `<circle cx="${cx}" cy="${cy}" r="${PFP_SIZE / 2 + PC_RING}" fill="${ink}" filter="url(#lift)"/>`,
  );
  if (placeholder) {
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${PFP_SIZE / 2}" fill="${tag}"/>`,
      `<g fill="${ink}" fill-opacity="${PC_PLACEHOLDER.opacity}" transform="translate(${cx} ${cy})">`,
      `<circle cx="0" cy="${PC_PLACEHOLDER.head.cy}" r="${PC_PLACEHOLDER.head.r}"/>`,
      `<path d="${PC_PLACEHOLDER.shoulders}"/>`,
      `</g>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
