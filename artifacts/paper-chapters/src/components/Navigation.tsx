import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CREDIT } from '@/lib/share';

const LINKS = [
  { href: '#templates', label: 'Chapters' },
  { href: '#studio', label: 'Studio' },
  { href: '#design', label: 'Design' },
] as const;

/** Fixed header: transparent over the hero, a frosted paper bar once the page scrolls. */
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div className="container mx-auto px-4 sm:px-6 pt-3 sm:pt-4">
        <div
          className={`pointer-events-auto flex h-14 sm:h-16 items-center justify-between gap-4 rounded-full px-3 sm:px-4 transition-all duration-500 ${
            scrolled
              ? 'bg-[color-mix(in_srgb,var(--sheet)_88%,transparent)] backdrop-blur-md border border-[var(--line)] shadow-[0_12px_30px_-18px_color-mix(in_srgb,var(--ink)_35%,transparent)]'
              : 'bg-transparent border border-transparent'
          }`}
        >
          {/* No name or mark yet: the bar is just the section links and the credit. */}
          <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1" aria-label="Sections">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="btn btn-ghost btn-sm ink-fade px-2.5 sm:px-4">
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href={CREDIT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm ink-fade gap-1.5"
            data-testid="link-credit-nav"
          >
            <span className="hidden sm:inline">Designed &amp; built by</span>
            <span className="sm:hidden">By</span>
            <span className="font-extrabold">{CREDIT.name}</span>
            <ArrowUpRight size={14} strokeWidth={2.5} className="opacity-70" />
          </a>
        </div>
      </div>
    </header>
  );
}
