import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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
  PC_TEXT_MIN_WIDTH,
  PC_TEXT_X,
  PC_X0,
  PFP_SIZE,
  cityLine,
  handleLine,
  pillWidthFor,
  roleLine,
  trackedWidth,
  type Country,
} from '@workspace/papercut-core';
import { BANNER_FONT_FAMILY, BANNER_FONT_LOADS } from '@/lib/banner-assets';

type Props = {
  country: Country;
  city: string;
  handle: string;
  /** role on the pill's second line; undefined keeps the default, '' drops it */
  role?: string;
  /** draw the neutral bust when no portrait is loaded */
  placeholder: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * The personalisation layer, drawn in master coordinates exactly like the
 * server renderer: city line under the baked title and the pill
 * (paper tag, ink ring, @handle, role line). The portrait itself is a separate
 * pannable element that BannerCanvas positions over the ring.
 *
 * Geometry lives in @workspace/papercut-core and is shared with the renderer;
 * change it there or the preview and the download drift apart.
 */
export function PapercutLockup({ country, city, handle, role, placeholder, className, style }: Props) {
  const uid = useId().replace(/:/g, '');
  const ink = country.ink;
  const tag = country.tag;
  const handleText = handleLine(handle);
  const roleText = roleLine(country, role);
  const cityText = cityLine(city);
  const svgRef = useRef<SVGSVGElement>(null);
  const handleRef = useRef<SVGTextElement>(null);
  const roleMeasureRef = useRef<SVGTextElement>(null);
  const [handleWidth, setHandleWidth] = useState(PC_TEXT_MIN_WIDTH);
  const [roleWidth, setRoleWidth] = useState(0);

  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const el = handleRef.current;
      const roleEl = roleMeasureRef.current;
      if (!alive || !el || !roleEl) return;
      const w = el.getComputedTextLength();
      if (w) setHandleWidth((prev) => (Math.abs(prev - w) < 0.5 ? prev : w));
      // Measured without tracking, then spaced like the renderer: between glyphs only.
      const rw = trackedWidth(roleEl.getComputedTextLength(), roleText, PC_ROLE_LS);
      if (rw) setRoleWidth((prev) => (Math.abs(prev - rw) < 0.5 ? prev : rw));
    };
    measure();
    const fonts = document.fonts;
    if (fonts) {
      Promise.all(BANNER_FONT_LOADS.map((f) => fonts.load(f))).then(measure, measure);
      fonts.ready.then(measure);
      fonts.addEventListener('loadingdone', measure);
    }
    // Text inside a closed <dialog> measures 0 (display: none). Measure again when the
    // banner gets a size, which is the moment the dialog opens.
    const observer = typeof ResizeObserver === 'undefined' || !svgRef.current ? null : new ResizeObserver(measure);
    if (svgRef.current) observer?.observe(svgRef.current);
    return () => {
      alive = false;
      fonts?.removeEventListener('loadingdone', measure);
      observer?.disconnect();
    };
  }, [handleText, roleText]);

  const pillWidth = pillWidthFor(handleWidth, roleWidth);
  const { x: cx, y: cy } = PC_PFP_CENTER;
  const lift = `pc-lift-${uid}`;
  const soft = `pc-soft-${uid}`;
  const paper = `pc-paper-${uid}`;

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${MASTER_W} ${MASTER_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      fontFamily={BANNER_FONT_FAMILY}
      // Kerning on, ligatures off: the renderer lays glyphs out one at a time
      // (GPOS kerning, no GSUB ligatures), so the browser must shape the same way
      // or handles like "@office_fi" would get a different pill width.
      style={{ fontKerning: 'normal', fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "clig" 0, "calt" 0', ...style }}
    >
      <defs>
        <filter id={lift} x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx="0" dy={PC_SHADOWS.lift.dy} stdDeviation={PC_SHADOWS.lift.blur} floodColor={ink} floodOpacity={PC_SHADOWS.lift.opacity} />
        </filter>
        <filter id={soft} x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx="0" dy={PC_SHADOWS.soft.dy} stdDeviation={PC_SHADOWS.soft.blur} floodColor={ink} floodOpacity={PC_SHADOWS.soft.opacity} />
        </filter>
        <filter id={paper} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy={PC_SHADOWS.paper.dy} stdDeviation={PC_SHADOWS.paper.blur} floodColor={ink} floodOpacity={PC_SHADOWS.paper.opacity} />
        </filter>
      </defs>
      <rect
        x={PC_PILL.x}
        y={PC_PILL.y}
        width={pillWidth}
        height={PC_PILL.height}
        rx={PC_PILL.radius}
        ry={PC_PILL.radius}
        fill={tag}
        filter={`url(#${paper})`}
      />
      {cityText && (
        <text
          x={PC_X0}
          y={PC_CITY_BASELINE}
          fontSize={PC_CITY_SIZE}
          fontWeight={500}
          letterSpacing={PC_CITY_LS}
          fill={ink}
          fillOpacity={PC_CITY_OPACITY}
          filter={`url(#${soft})`}
          style={{ whiteSpace: 'pre' }}
        >
          {cityText}
        </text>
      )}
      <g filter={`url(#${soft})`}>
        <text ref={handleRef} x={PC_TEXT_X} y={PC_HANDLE_BASELINE} fontSize={PC_HANDLE_SIZE} fontWeight={700} fill={ink}>
          {handleText}
        </text>
        <text
          x={PC_TEXT_X}
          y={PC_ROLE_BASELINE}
          fontSize={PC_ROLE_SIZE}
          fontWeight={500}
          letterSpacing={PC_ROLE_LS}
          fill={ink}
          fillOpacity={PC_ROLE_OPACITY}
          style={{ whiteSpace: 'pre' }}
        >
          {roleText}
        </text>
        {/* Untracked twin of the role line, only ever measured. */}
        <text ref={roleMeasureRef} x={PC_TEXT_X} y={PC_ROLE_BASELINE} fontSize={PC_ROLE_SIZE} fontWeight={500} visibility="hidden" style={{ whiteSpace: 'pre' }}>
          {roleText}
        </text>
      </g>
      <circle cx={cx} cy={cy} r={PFP_SIZE / 2 + PC_RING} fill={ink} filter={`url(#${lift})`} />
      {placeholder && (
        <>
          <circle cx={cx} cy={cy} r={PFP_SIZE / 2} fill={tag} />
          <g fill={ink} fillOpacity={PC_PLACEHOLDER.opacity} transform={`translate(${cx} ${cy})`}>
            <circle cx="0" cy={PC_PLACEHOLDER.head.cy} r={PC_PLACEHOLDER.head.r} />
            <path d={PC_PLACEHOLDER.shoulders} />
          </g>
        </>
      )}
    </svg>
  );
}
