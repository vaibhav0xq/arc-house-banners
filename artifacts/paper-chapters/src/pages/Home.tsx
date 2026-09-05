import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { TemplateCatalog } from '@/components/TemplateCatalog';
import { Studio } from '@/components/Studio';
import { DesignStory } from '@/components/DesignStory';
import { Footer } from '@/components/Footer';
import { RenderFlowProvider } from '@/hooks/use-render-flow';
import { useStudioLinkSync } from '@/hooks/use-studio-link-sync';
import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';

/**
 * The browser tries to scroll to a #fragment before React has rendered the
 * sections, so a link like /#studio would open at the top. Do it once after mount.
 */
function useHashOnLoad(): void {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);
}

export function Home() {
  useStudioLinkSync();
  useHashOnLoad();
  return (
    <MotionConfig reducedMotion="user">
      <RenderFlowProvider>
        <div className="min-h-[100dvh] flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Hero />
            <TemplateCatalog />
            <Studio />
            <DesignStory />
          </main>
          <Footer />
        </div>
      </RenderFlowProvider>
    </MotionConfig>
  );
}
