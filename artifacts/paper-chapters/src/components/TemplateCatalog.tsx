import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { COUNTRIES, DEFAULT_CROP } from '@workspace/papercut-core';
import { LINKS } from '@/lib/share';
import { useStudio } from '@/store/use-studio';
import { BannerCanvas } from '@/components/banner/banner-canvas';
import { SectionHeader } from '@/components/SectionHeader';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The ten chapters, shown big: two to a row on desktop, one on phones. Picking
 * a card selects it, re-tints the page and takes the member to the studio.
 * The grid is a roving-focus radiogroup, so arrow keys work too.
 */
export function TemplateCatalog() {
  const countrySlug = useStudio((s) => s.countrySlug);
  const setCountry = useStudio((s) => s.setCountry);

  const choose = (slug: (typeof COUNTRIES)[number]['slug']) => {
    setCountry(slug);
    document.getElementById('studio')?.scrollIntoView({ behavior: 'auto' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = COUNTRIES[(idx + step + COUNTRIES.length) % COUNTRIES.length]!;
    setCountry(next.slug);
    document.getElementById(`country-card-${next.slug}`)?.focus({ preventScroll: true });
  };

  return (
    <section className="py-20 sm:py-28 scroll-mt-6" id="templates">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="The chapters"
          title="Pick your chapter."
          aside="Each chapter has its own scene and colours. The page changes to match as soon as you pick one."
        />

        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10" role="radiogroup" aria-label="Chapters">
          {COUNTRIES.map((country, idx) => {
            const isSelected = country.slug === countrySlug;
            return (
              <motion.div
                key={country.slug}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, ease, delay: (idx % 2) * 0.08 }}
              >
                <button
                  type="button"
                  id={`country-card-${country.slug}`}
                  data-testid={`card-country-${country.slug}`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${country.name}, ${country.region}`}
                  tabIndex={isSelected ? 0 : -1}
                  onKeyDown={(e) => onKeyDown(e, idx)}
                  onClick={() => choose(country.slug)}
                  className={`group block w-full text-left rounded-[24px] cursor-pointer outline-offset-4 transition-[outline-color] duration-300 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[var(--accent)] ${
                    isSelected ? 'outline outline-2 outline-[var(--ink)]' : ''
                  }`}
                >
                  <div className="paper-sheet paper-sheet-hover p-2 sm:p-2.5 rounded-[24px]">
                    <div className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
                      <BannerCanvas
                        country={country}
                        city={country.defaultCity}
                        handle=""
                        photo={null}
                        crop={DEFAULT_CROP}
                        size="thumb"
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 px-2.5 pt-3.5 pb-1.5 sm:px-3">
                      <div className="min-w-0">
                        <div className="font-display text-xl font-bold tracking-tight text-[var(--ink)] ink-fade">{country.name}</div>
                        <div className="mt-0.5 text-sm font-semibold text-[var(--muted)] ink-fade truncate">
                          {country.region} · {country.defaultCity}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <span className="hidden sm:inline text-xs font-bold tabular-nums text-[var(--muted)] ink-fade">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                            isSelected
                              ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--tag)]'
                              : 'border-[var(--line-strong)] text-transparent group-hover:border-[var(--ink)]'
                          }`}
                          aria-hidden="true"
                        >
                          <Check size={15} strokeWidth={3} />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 sm:mt-12 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--muted)] ink-fade">
          Want a chapter without the pill? All ten are in a shared folder as blank banners at 1500 x 500, 3000 x 1000 and 6000 x 2000.{' '}
          <a
            href={LINKS.files}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[var(--ink)] underline underline-offset-4 decoration-[var(--accent)] hover:decoration-[var(--ink)] transition-colors"
            data-testid="link-files-catalog"
          >
            Open the folder
          </a>
        </p>
      </div>
    </section>
  );
}
