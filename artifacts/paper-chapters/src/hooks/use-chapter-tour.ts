import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { COUNTRY_SLUGS, type CountrySlug } from '@workspace/papercut-core';
import { useStudio } from '@/store/use-studio';
import { baseImageUrl } from '@/lib/banner-assets';

export const TOUR_INTERVAL_MS = 4200;

/** Anything a member can operate. Reaching for one of these is intent enough to end the tour. */
const INTERACTIVE = 'a[href], button, input, select, textarea, [role="button"], [role="radio"], [role="tab"], [tabindex]:not([tabindex="-1"])';

/** Warm the browser cache so the next crossfade never waits on the network. */
function preloadBase(slug: CountrySlug) {
  const img = new Image();
  img.src = baseImageUrl(slug, 'full');
}

/**
 * The hero's chapter tour: until the member does anything, the stage flips
 * through the ten chapters every few seconds, re-tinting the page as it goes.
 *
 * It drives the real studio selection (so the page stays consistent) but stops
 * for good at the first sign of intent: pressing or focusing any control on the
 * page, a chapter change the tour did not make or the stage leaving the
 * viewport. It never starts when the visitor arrived through a shared link or
 * prefers reduced motion. It pauses while the pointer rests on the stage or
 * the tab is in the background.
 */
export function useChapterTour(stageRef: RefObject<HTMLElement | null>) {
  const touring = useStudio((s) => s.touring);
  const setTouring = useStudio((s) => s.setTouring);
  const setCountry = useStudio((s) => s.setCountry);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const lastTourSlug = useRef<CountrySlug | null>(null);

  const stop = useCallback(() => setTouring(false), [setTouring]);

  // Decide once whether the tour runs at all.
  useEffect(() => {
    if (reduceMotion) return;
    if (new URLSearchParams(window.location.search).has('chapter')) return;
    setTouring(true);
    return () => setTouring(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intent detection: a chapter change the tour did not make or any control being pressed or focused.
  useEffect(() => {
    if (!touring) return;
    const unsubscribe = useStudio.subscribe((state, prev) => {
      if (state.countrySlug !== prev.countrySlug && state.countrySlug !== lastTourSlug.current) stop();
    });
    const onIntent = (e: Event) => {
      const target = e.target as Element | null;
      if (target instanceof Element && target.closest(INTERACTIVE)) stop();
    };
    // Pointer for mouse and touch, focusin for keyboard; both fire before click handlers run.
    document.addEventListener('pointerdown', onIntent, true);
    document.addEventListener('focusin', onIntent, true);
    return () => {
      unsubscribe();
      document.removeEventListener('pointerdown', onIntent, true);
      document.removeEventListener('focusin', onIntent, true);
    };
  }, [touring, stop]);

  // Stop once the stage has been seen and scrolled away or when the page opens already below it
  // (a #studio link). A stage that is merely below the fold keeps touring until it comes into view.
  useEffect(() => {
    if (!touring) return;
    const node = stageRef.current;
    let seen = false;
    const observer = node
      ? new IntersectionObserver(
          ([entry]) => {
            if (!entry) return;
            if (entry.isIntersecting) {
              seen = true;
              return;
            }
            if (seen || entry.boundingClientRect.bottom < 0) stop();
          },
          { threshold: 0.15 },
        )
      : null;
    if (node && observer) observer.observe(node);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [touring, stop, stageRef]);

  // The ticking itself.
  useEffect(() => {
    if (!touring || hovered || hidden) return;
    const advance = () => {
      const current = useStudio.getState().countrySlug;
      const i = COUNTRY_SLUGS.indexOf(current);
      const next = COUNTRY_SLUGS[(i + 1) % COUNTRY_SLUGS.length]!;
      lastTourSlug.current = next;
      setCountry(next);
      preloadBase(COUNTRY_SLUGS[(i + 2) % COUNTRY_SLUGS.length]!);
    };
    preloadBase(COUNTRY_SLUGS[(COUNTRY_SLUGS.indexOf(useStudio.getState().countrySlug) + 1) % COUNTRY_SLUGS.length]!);
    const id = window.setInterval(advance, TOUR_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [touring, hovered, hidden, setCountry]);

  return {
    touring,
    /** true while the tour is on but waiting (pointer on the stage, background tab) */
    paused: touring && (hovered || hidden),
    stop,
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  };
}
