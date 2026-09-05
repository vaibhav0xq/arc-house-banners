import { useEffect, useRef, useState } from 'react';
import { StudioControls } from './StudioControls';
import { StudioPreview } from './StudioPreview';
import { SectionHeader } from './SectionHeader';

export function Studio() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 scroll-mt-6" id="studio">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="The studio"
          title="Add your details."
          aside="Your city goes under the chapter title. Your handle and role go on the pill and your photo goes in the ring. The download is the same as the preview."
        />

        {/* Phones see the banner first, then the fields; desktops get fields left, preview right. */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 lg:items-start">
          <div className="order-2 min-w-0 lg:order-1 lg:col-span-5">
            <StudioControls />
          </div>
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-7">
            <StudioPreview studioInView={inView} />
          </div>
        </div>
      </div>
    </section>
  );
}
