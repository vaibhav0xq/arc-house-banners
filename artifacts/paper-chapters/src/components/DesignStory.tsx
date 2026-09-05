import { motion } from 'framer-motion';
import { COUNTRIES, getCountry } from '@workspace/papercut-core';
import { ExplodedBanner, LAYERS } from '@/components/ExplodedBanner';
import { SectionHeader } from '@/components/SectionHeader';
import { useStudio } from '@/store/use-studio';

const ease = [0.22, 1, 0.36, 1] as const;

export function DesignStory() {
  const countrySlug = useStudio((s) => s.countrySlug);
  const setCountry = useStudio((s) => s.setCountry);
  const activeCountry = getCountry(countrySlug);

  return (
    <section className="py-20 sm:py-28 overflow-hidden scroll-mt-6" id="design">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="The design"
          title="How the banner is built."
          aside="Each banner is a stack of paper layers. Your details are one more sheet in the stack, not text printed on top."
        />

        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <motion.div
            className="min-w-0 lg:col-span-7"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="paper-sheet p-3 sm:p-5 rounded-[28px] ink-fade">
              <ExplodedBanner country={activeCountry} />
              <p className="px-2 pb-1 pt-1 text-xs font-semibold text-[var(--muted)] ink-fade">Hover over the stack to see the layers flat.</p>
            </div>
          </motion.div>

          <ol className="lg:col-span-4 lg:col-start-9 flex flex-col divide-y divide-[var(--line)]" aria-label="Layers of the banner">
            {LAYERS.map((layer, i) => (
              <motion.li
                key={layer.n}
                className="flex gap-5 py-6 first:pt-0 last:pb-0"
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.1, ease }}
              >
                <span className="font-display text-2xl font-extrabold leading-none tabular-nums text-[var(--accent)] w-9 shrink-0 pt-0.5">{layer.n}</span>
                <span>
                  <span className="block font-display text-xl font-bold tracking-tight text-[var(--ink)] ink-fade">{layer.title}</span>
                  <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-[var(--muted)] ink-fade">{layer.text}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Palettes */}
        <div className="mt-20 sm:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Colours</span>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] ink-fade">Each chapter has its own ink, paper and swatch.</h3>
            </div>
            <p className="text-sm font-semibold text-[var(--muted)] ink-fade">Tap one to try it on the page.</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10" role="radiogroup" aria-label="Chapter palettes">
            {COUNTRIES.map((country, i) => {
              const isSelected = country.slug === countrySlug;
              return (
                <motion.button
                  key={country.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${country.name} palette`}
                  data-testid={`palette-${country.slug}`}
                  onClick={() => setCountry(country.slug)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease }}
                  className={`paper-sheet paper-sheet-hover flex flex-col gap-3 rounded-[18px] p-2.5 text-left cursor-pointer outline-offset-[3px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[var(--accent)] ${
                    isSelected ? 'outline outline-2 outline-[var(--ink)]' : ''
                  }`}
                >
                  <span className="flex h-16 overflow-hidden rounded-[12px] border border-black/5" aria-hidden="true">
                    <span className="flex-[3]" style={{ backgroundColor: country.ink }} />
                    <span className="flex-[2]" style={{ backgroundColor: country.tag }} />
                    <span className="flex-[2]" style={{ backgroundColor: country.swatch }} />
                  </span>
                  <span className="px-1 pb-0.5">
                    <span className="block text-sm font-bold leading-tight" style={{ color: country.ink }}>
                      {country.name}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wider" style={{ color: country.ink, opacity: 0.6 }}>
                      {country.chapter}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
