import { useEffect, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { COUNTRIES, DEFAULT_CROP, getCountry } from '@workspace/papercut-core';
import { useStudio } from '@/store/use-studio';
import { BannerCanvas } from '@/components/banner/banner-canvas';
import { useChapterTour, TOUR_INTERVAL_MS } from '@/hooks/use-chapter-tour';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The hero is the product at full width: a stage showing the current chapter's
 * banner, a row of chapter tabs beneath it and the headline set beside the
 * copy above. Left alone, the stage tours the ten chapters on its own.
 */
export function Hero() {
  const countrySlug = useStudio((s) => s.countrySlug);
  const setCountry = useStudio((s) => s.setCountry);
  const country = getCountry(countrySlug);
  const index = COUNTRIES.findIndex((c) => c.slug === countrySlug);

  const stageRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tour = useChapterTour(stageRef);

  // Keep the active tab in view when the strip scrolls (phones and narrow laptops).
  useEffect(() => {
    const list = tablistRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-slug="${countrySlug}"]`);
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }, [countrySlug]);

  const pickChapter = (slug: (typeof COUNTRIES)[number]['slug']) => {
    tour.stop();
    setCountry(slug);
  };

  // Standard tablist keyboard: arrows move and select, Home/End jump; only the active tab is in the Tab order.
  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    let nextIndex: number | null = null;
    if (step) nextIndex = (index + step + COUNTRIES.length) % COUNTRIES.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = COUNTRIES.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    const next = COUNTRIES[nextIndex]!;
    pickChapter(next.slug);
    tablistRef.current?.querySelector<HTMLElement>(`[data-slug="${next.slug}"]`)?.focus();
  };

  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24" id="top">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="lg:col-span-7"
          >
            <span className="eyebrow">Arc House · Chapter banners</span>
            <h1 className="mt-5 text-[2.75rem] leading-[0.98] sm:text-6xl lg:text-[4.9rem] text-[var(--ink)] ink-fade text-balance">
              Your city. Your handle.
              <br />
              <span className="bg-gradient-to-r from-[var(--ink)] via-[var(--ink)] to-[var(--accent)] bg-clip-text text-transparent">Cut from paper.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="lg:col-span-4 lg:col-start-9 lg:pb-2"
          >
            <p className="text-[1.0625rem] sm:text-lg leading-relaxed text-[var(--muted)] ink-fade text-balance">
              Pick your chapter, add your city, X handle and role, drop in a photo and download a 1500 × 500 header for X. Ten country chapters, each cut from layered paper. Nothing is stored.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#studio" className="btn btn-primary btn-lg ink-fade" data-testid="hero-cta-studio" onClick={tour.stop}>
                Make my banner <ArrowDown size={16} strokeWidth={2.5} />
              </a>
              <a href="#templates" className="btn btn-secondary btn-lg ink-fade" data-testid="hero-cta-templates" onClick={tour.stop}>
                See all chapters
              </a>
            </div>
          </motion.div>
        </div>

        {/* The stage */}
        <motion.div
          ref={stageRef}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="mt-12 sm:mt-16 lg:mt-20"
          onPointerEnter={tour.onPointerEnter}
          onPointerLeave={tour.onPointerLeave}
          data-testid="hero-stage"
        >
          <div className="paper-sheet p-2 sm:p-3 rounded-[24px] sm:rounded-[30px]">
            <div
              id="hero-stage-panel"
              role="tabpanel"
              aria-labelledby={`tab-chapter-${countrySlug}`}
              className="relative aspect-[3/1] overflow-hidden rounded-[16px] sm:rounded-[20px] bg-white border border-[var(--line)]"
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={country.slug}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  <BannerCanvas
                    country={country}
                    city={country.defaultCity}
                    handle=""
                    photo={null}
                    crop={DEFAULT_CROP}
                    eager
                    size="full"
                    className="w-full h-full"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4 px-1.5 pt-2.5 pb-0.5 sm:px-2 sm:pt-3">
              <span className="eyebrow hidden md:inline-flex shrink-0 tabular-nums" aria-live="polite">
                Chapter {String(index + 1).padStart(2, '0')} / {COUNTRIES.length}
              </span>
              <div
                ref={tablistRef}
                role="tablist"
                aria-label="Chapters"
                onKeyDown={onTabKeyDown}
                className="flex flex-1 gap-1 overflow-x-auto hide-scrollbar md:justify-end"
              >
                {COUNTRIES.map((c) => {
                  const active = c.slug === countrySlug;
                  return (
                    <button
                      key={c.slug}
                      id={`tab-chapter-${c.slug}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls="hero-stage-panel"
                      tabIndex={active ? 0 : -1}
                      data-slug={c.slug}
                      data-testid={`tab-chapter-${c.slug}`}
                      onClick={() => pickChapter(c.slug)}
                      className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm font-bold transition-colors duration-300 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/70 ${
                        active
                          ? 'bg-[var(--ink)] text-[var(--tag)]'
                          : 'text-[var(--ink)] hover:bg-[var(--wash)]'
                      }`}
                    >
                      {c.name}
                      {active && tour.touring && (
                        <span
                          key={`${c.slug}-progress`}
                          className="tour-progress absolute left-3.5 right-3.5 bottom-[5px] h-[2px] rounded-full bg-[var(--accent)]"
                          style={{ ['--tour-ms' as string]: `${TOUR_INTERVAL_MS}ms`, animationPlayState: tour.paused ? 'paused' : 'running' }}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-1 text-xs font-semibold text-[var(--muted)] ink-fade">
            <span className="tabular-nums">
              {country.name} · {country.region} · {country.coords}
            </span>
            <span className="hidden sm:inline">1500 × 500 PNG for X · 3000 × 1000 WebP</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
