import { useEffect, useRef } from 'react';
import { useStudio } from '@/store/use-studio';
import { readStudioLink, syncAddressBar } from '@/lib/studio-link';

/**
 * Two-way binding between the studio and the query string: a shared link
 * pre-fills the studio once on load. Afterwards the address bar quietly
 * mirrors the chapter, city, handle and role so a refresh or a copied URL keeps them.
 */
export function useStudioLinkSync(): void {
  const hydrate = useStudio((s) => s.hydrate);
  const countrySlug = useStudio((s) => s.countrySlug);
  const city = useStudio((s) => s.city);
  const handle = useStudio((s) => s.handle);
  const role = useStudio((s) => s.role);
  const touring = useStudio((s) => s.touring);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const values = readStudioLink(window.location.search);
    if (Object.keys(values).length) hydrate(values);
  }, [hydrate]);

  useEffect(() => {
    // Chapters the tour flips through are not the member's choice; leave the URL alone until it stops.
    if (!hydrated.current || touring) return;
    const timer = window.setTimeout(() => syncAddressBar({ countrySlug, city, handle, role }), 250);
    return () => window.clearTimeout(timer);
  }, [countrySlug, city, handle, role, touring]);
}
