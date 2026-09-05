import { ArrowUpRight } from 'lucide-react';
import { COUNTRIES } from '@workspace/papercut-core';
import { CREDIT, LINKS } from '@/lib/share';
import { useStudio } from '@/store/use-studio';

const NAV = [
  { href: '#templates', label: 'Chapters' },
  { href: '#studio', label: 'Studio' },
  { href: '#design', label: 'Design' },
] as const;

const FILES = [
  { href: LINKS.files, label: 'Blank banners', testId: 'link-files-footer' },
  { href: LINKS.source, label: 'Source code', testId: 'link-source-footer' },
] as const;

/** A band of the chapter's ink to close the page; it re-tints with everything else. */
export function Footer() {
  const setCountry = useStudio((s) => s.setCountry);
  const countrySlug = useStudio((s) => s.countrySlug);

  const goToChapter = (slug: (typeof COUNTRIES)[number]['slug']) => {
    setCountry(slug);
    document.getElementById('studio')?.scrollIntoView({ behavior: 'auto' });
  };

  return (
    <footer className="mt-8 bg-[var(--ink)] text-[var(--tag)] ink-fade pb-10 sm:pb-12">
      <div className="container mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">Chapter banners for Arc House members.</div>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-[var(--tag)]/75">
              Ten country chapters, one banner each, with your city, handle, role and photo. Photos are only used to make your banner and are not stored.
            </p>
            <a href="#studio" className="btn btn-md mt-8 bg-[var(--tag)] text-[var(--ink)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-14px_rgba(0,0,0,0.5)]">
              Make my banner
            </a>
          </div>

          <div className="lg:col-span-2 lg:col-start-7">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--tag)]/55">On this page</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm font-bold text-[var(--tag)]/90 hover:text-[var(--tag)] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 lg:col-start-9">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--tag)]/55">Files</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FILES.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--tag)]/90 hover:text-[var(--tag)] transition-colors"
                    data-testid={l.testId}
                  >
                    {l.label}
                    <ArrowUpRight size={14} strokeWidth={2.5} className="opacity-70" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 lg:col-start-11">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--tag)]/55">Credit</p>
            <a
              href={CREDIT.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-[var(--tag)]/90 hover:text-[var(--tag)] transition-colors"
              data-testid="link-credit-footer"
            >
              Designed &amp; built by {CREDIT.name}
              <ArrowUpRight size={14} strokeWidth={2.5} className="opacity-70" />
            </a>
          </div>
        </div>

        <div className="mt-14 sm:mt-16 border-t border-[var(--tag)]/15 pt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Chapters">
            {COUNTRIES.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => goToChapter(c.slug)}
                  className={`text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                    c.slug === countrySlug ? 'text-[var(--tag)] underline underline-offset-4 decoration-[var(--accent)]' : 'text-[var(--tag)]/60 hover:text-[var(--tag)]'
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <a href="#top" className="text-xs font-bold text-[var(--tag)]/60 hover:text-[var(--tag)] transition-colors">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
