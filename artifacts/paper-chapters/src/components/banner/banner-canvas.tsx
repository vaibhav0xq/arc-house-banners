import { useCallback, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AUTO_PAN_ZOOM,
  MASTER_H,
  MASTER_W,
  PC_PFP_ORIGIN,
  PFP_SIZE,
  canPan,
  cropImagePercentages,
  normalizeCrop,
  panCrop,
  type Country,
  type CropState,
} from '@workspace/papercut-core';
import { baseImageUrl } from '@/lib/banner-assets';
import type { PreparedPhoto } from '@/lib/photo';
import { PapercutLockup } from './papercut-lockup';

export type BannerCanvasProps = {
  country: Country;
  city: string;
  handle: string;
  /** role on the pill's second line; undefined keeps the default, '' drops it */
  role?: string;
  photo: PreparedPhoto | null;
  crop: CropState;
  /**
   * When provided, the portrait becomes draggable: pointer drags pan the crop
   * (auto-zooming to 125% first if the photo has no slack at 100%).
   */
  onCropChange?: (crop: CropState) => void;
  className?: string;
  style?: CSSProperties;
  /** eager-load the base (the studio preview); catalog cards can stay lazy */
  eager?: boolean;
  /** `thumb` serves the 1200 x 400 cut; use it for cards and decorative stacks, never for the studio preview */
  size?: 'full' | 'thumb';
};

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** Portrait circle placed in banner-relative percentages, so it lands on the ring at any display size. */
const PORTRAIT_BOX: CSSProperties = {
  position: 'absolute',
  left: pct(PC_PFP_ORIGIN.left, MASTER_W),
  top: pct(PC_PFP_ORIGIN.top, MASTER_H),
  width: pct(PFP_SIZE, MASTER_W),
  height: pct(PFP_SIZE, MASTER_H),
  borderRadius: '9999px',
  overflow: 'hidden',
  touchAction: 'none',
};

/**
 * The live 3:1 banner: the country's papercut base, the code-drawn lockup, and
 * the cropped portrait, composed with the same numbers the server uses. Wrap it
 * in whatever paper frame the page needs; keep the inside untouched.
 */
export function BannerCanvas({ country, city, handle, role, photo, crop, onCropChange, className, style, eager, size = 'full' }: BannerCanvasProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; crop: CropState; diameter: number } | null>(null);
  const interactive = Boolean(photo && onCropChange);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!photo || !onCropChange || e.button !== 0) return;
      const el = portraitRef.current;
      if (!el) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      let start = crop;
      const room = canPan(photo.width, photo.height, crop);
      if (!room.x && !room.y) {
        // A square photo at 1x has nowhere to go; nudge the zoom so the drag does something.
        start = normalizeCrop(photo.width, photo.height, { ...crop, zoom: Math.max(crop.zoom, AUTO_PAN_ZOOM) });
        onCropChange(start);
      }
      drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, crop: start, diameter: el.getBoundingClientRect().width };
    },
    [photo, onCropChange, crop],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || !photo || !onCropChange || d.pointerId !== e.pointerId) return;
      const next = panCrop(photo.width, photo.height, d.crop, e.clientX - d.x, e.clientY - d.y, d.diameter);
      onCropChange(normalizeCrop(photo.width, photo.height, next));
    },
    [photo, onCropChange],
  );

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === e.pointerId) {
      drag.current = null;
      portraitRef.current?.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      className={className}
      style={{ position: 'relative', aspectRatio: '3 / 1', overflow: 'hidden', userSelect: 'none', ...style }}
      data-testid="banner-canvas"
    >
      <img
        src={baseImageUrl(country.slug, size)}
        alt={`${country.name} chapter papercut banner`}
        width={1500}
        height={500}
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      <PapercutLockup
        country={country}
        city={city}
        handle={handle}
        role={role}
        placeholder={!photo}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {photo && (
        <div
          ref={portraitRef}
          style={{ ...PORTRAIT_BOX, cursor: interactive ? (drag.current ? 'grabbing' : 'grab') : 'default' }}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? endDrag : undefined}
          onPointerCancel={interactive ? endDrag : undefined}
          role={interactive ? 'img' : undefined}
          aria-label={interactive ? 'Your portrait. Drag to reposition.' : undefined}
          data-testid="banner-portrait"
        >
          <img
            src={photo.objectUrl}
            alt=""
            draggable={false}
            style={{ position: 'absolute', maxWidth: 'none', display: 'block', ...cropImagePercentages(photo.width, photo.height, crop) }}
          />
        </div>
      )}
    </div>
  );
}
