import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MASTER_H, MASTER_W, PC_PFP_ORIGIN, PFP_SIZE, type Country } from '@workspace/papercut-core';
import { PapercutLockup } from '@/components/banner/papercut-lockup';
import { baseImageUrl, SAMPLE_PHOTO_URL } from '@/lib/banner-assets';

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/** Same placement BannerCanvas uses, so the lifted portrait hovers exactly over its ring. */
const PORTRAIT_BOX: CSSProperties = {
  position: 'absolute',
  left: pct(PC_PFP_ORIGIN.left, MASTER_W),
  top: pct(PC_PFP_ORIGIN.top, MASTER_H),
  width: pct(PFP_SIZE, MASTER_W),
  height: pct(PFP_SIZE, MASTER_H),
  borderRadius: '9999px',
  overflow: 'hidden',
};

/**
 * How far the pill sheet lifts off the scene, as a fraction of the stack's
 * width. The portrait lifts twice as far. A fraction rather than a pixel
 * value keeps the gaps in proportion on every screen: a fixed lift that
 * looked right at 1200 px pushed the pill over the title and the portrait
 * off its ring on a laptop, where the whole stack is only a few hundred
 * pixels wide.
 *
 * Lifting the pill sheet moves the city line up into the bottom of the
 * title painted on the scene, so while the stack is apart the lockup's text
 * gets a thin halo in the pill colour (a stroke in master units) to stay
 * readable. It fades out when the sheets are pressed flat.
 */
const LIFT = 0.035;

export const LAYERS = [
  { n: '01', title: 'The scene', text: 'One skyline per chapter, cut from layers of paper with soft shadows between them.' },
  { n: '02', title: 'Your pill', text: 'Your handle, role and chapter in the same type as the title, sitting next to your X profile photo.' },
  { n: '03', title: 'Your portrait', text: 'Cropped into the ink ring at the spot where X shows your profile photo, so the two line up.' },
] as const;

/**
 * The banner pulled apart into its three sheets, tilted like a diagram on a
 * cutting mat. Collapsed on first sight, it lifts apart as it scrolls into
 * view. Hovering or focusing the stack squeezes it back together.
 */
export function ExplodedBanner({ country }: { country: Country }) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const [stackWidth, setStackWidth] = useState(0);

  useLayoutEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    // offsetWidth is the layout width, unaffected by the tilt transform.
    const measure = () => setStackWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lift = pressed ? 0 : stackWidth * LIFT;
  // Under reduced motion the sheets jump between the two states instead of springing.
  const settle = (delay: number) => (reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 120, damping: 18, delay });

  const sheet = 'absolute inset-0 rounded-[14px] border border-[color-mix(in_srgb,var(--ink)_16%,transparent)]';

  return (
    <div
      className="relative w-full aspect-[16/11] sm:aspect-[16/9] select-none [perspective:1900px] rounded-[26px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]/60"
      onPointerEnter={() => setPressed(true)}
      onPointerLeave={() => setPressed(false)}
      onFocus={() => setPressed(true)}
      onBlur={() => setPressed(false)}
      tabIndex={0}
      role="img"
      aria-label={`${country.name} banner separated into its scene, pill and portrait layers`}
    >
      <motion.div
        ref={stackRef}
        className="absolute left-1/2 top-[54%] w-[98%] aspect-[3/1]"
        style={{ transformStyle: 'preserve-3d', x: '-50%', y: '-50%' }}
        initial={reduceMotion ? false : { rotateX: 0, rotateZ: 0, opacity: 0 }}
        whileInView={{ rotateX: 44, rotateZ: -12, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 01 scene */}
        <div className={`${sheet} overflow-hidden bg-white shadow-[0_34px_60px_-22px_color-mix(in_srgb,var(--ink)_50%,transparent)]`}>
          <img key={country.slug} src={baseImageUrl(country.slug, 'thumb')} alt="" width={1200} height={400} loading="lazy" className="block w-full h-full" />
        </div>

        {/* 02 pill + city line */}
        <motion.div
          className={`${sheet} border-dashed bg-[color-mix(in_srgb,var(--tag)_9%,transparent)]`}
          animate={{ z: lift }}
          transition={settle(0.03)}
        >
          <PapercutLockup
            country={country}
            city={country.defaultCity}
            handle="yourhandle"
            placeholder={false}
            className={`w-full h-full [&_text]:[paint-order:stroke] [&_text]:[stroke:var(--tag)] [&_text]:[stroke-width:36] [&_text]:[stroke-linejoin:round] [&_text]:transition-[stroke-opacity] [&_text]:duration-300 ${
              pressed ? '[&_text]:[stroke-opacity:0]' : '[&_text]:[stroke-opacity:1]'
            }`}
          />
        </motion.div>

        {/* 03 portrait */}
        <motion.div className={`${sheet} border-transparent`} animate={{ z: lift * 2 }} transition={settle(0.06)}>
          <div style={PORTRAIT_BOX} className="shadow-[0_20px_34px_-10px_color-mix(in_srgb,var(--ink)_55%,transparent)]">
            <img src={SAMPLE_PHOTO_URL} alt="" className="block w-full h-full object-cover" loading="lazy" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
