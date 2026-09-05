import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2, Download, Link as LinkIcon, Maximize2, X, Check } from 'lucide-react';
import { getCountry } from '@workspace/papercut-core';
import { useStudio } from '@/store/use-studio';
import { BannerCanvas } from '@/components/banner/banner-canvas';
import { formatBytes } from '@/lib/download';
import { useRenderFlow, type RenderStage } from '@/hooks/use-render-flow';

const STAGE_LABEL: Record<RenderStage, string> = {
  idle: 'Download high-res',
  preparing: 'Preparing photo',
  cutting: 'Making banner',
  packaging: 'Saving files',
  done: 'Download again',
};
const STAGE_PROGRESS: Record<RenderStage, string> = { idle: '0%', preparing: '25%', cutting: '65%', packaging: '92%', done: '100%' };

const XGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** A secondary action that flashes a tick for a moment after it succeeds. */
function ActionButton({
  onClick,
  href,
  icon,
  children,
  testId,
}: {
  onClick?: () => Promise<unknown> | void;
  href?: string;
  icon: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  const [done, setDone] = useState(false);
  const cls = 'btn btn-secondary btn-sm ink-fade';
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={testId}>
        {icon} {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      data-testid={testId}
      onClick={async () => {
        const ok = await onClick?.();
        if (ok === false || ok === 'cancelled' || ok === 'unsupported') return;
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <Check size={14} strokeWidth={3} /> : icon} {children}
    </button>
  );
}

export function StudioPreview({ studioInView = true }: { studioInView?: boolean }) {
  const { countrySlug, city, handle, role, photo, crop, setCrop } = useStudio();
  const country = getCountry(countrySlug);
  const {
    stage: downloadStage,
    result,
    isStale,
    render,
    headerReads,
    supportsCopyImage,
    copyPng,
    supportsShareFile,
    sharePng,
    downloadPng,
    downloadWebp,
    downloadBoth,
    copyStudioLink,
    xPostUrl,
  } = useRenderFlow();

  const [dialogOpen, setDialogOpen] = useState(false);

  // Bring a freshly cut result into view; on phones it lands above the fields the member was just editing.
  // 'auto' defers to the html scroll-behavior rule (smooth unless the member prefers reduced motion).
  const resultRef = useRef<HTMLDivElement>(null);
  const renderedAt = result?.renderedAt;
  useEffect(() => {
    if (!renderedAt) return;
    const id = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }, 200);
    return () => window.clearTimeout(id);
  }, [renderedAt]);

  useEffect(() => {
    const dialogPreview = document.getElementById('dialog-preview');
    const dialogCrop = document.getElementById('dialog-crop');
    const ob = new MutationObserver(() => {
      setDialogOpen(dialogPreview?.hasAttribute('open') || dialogCrop?.hasAttribute('open') || false);
    });
    if (dialogPreview) ob.observe(dialogPreview, { attributes: true, attributeFilter: ['open'] });
    if (dialogCrop) ob.observe(dialogCrop, { attributes: true, attributeFilter: ['open'] });
    return () => ob.disconnect();
  }, []);

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    void render({ origin: { x: rect.left + rect.width / 2, y: rect.top } });
  };
  const busy = downloadStage !== 'idle' && downloadStage !== 'done';
  const showMobileBar = studioInView && !dialogOpen;
  const openDialog = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.showModal();
  const closeDialog = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.close();

  const downloadLabel = (
    <>
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {STAGE_LABEL[downloadStage]}
        {!busy && <Download size={18} strokeWidth={2.5} />}
      </span>
      {busy && (
        <motion.span
          className="absolute inset-y-0 left-0 bg-[var(--accent)]/35"
          initial={{ width: 0 }}
          animate={{ width: STAGE_PROGRESS[downloadStage] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* The preview sheet */}
      <div className="paper-sheet p-2 sm:p-3 rounded-[24px] ink-fade">
        <div className="relative aspect-[3/1] overflow-hidden rounded-[16px] border border-[var(--line)] bg-white ink-fade">
          <AnimatePresence initial={false}>
            <motion.div
              key={countrySlug}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <BannerCanvas country={country} city={city} handle={handle} role={role} photo={photo} crop={crop} onCropChange={setCrop} eager size="full" className="w-full h-full" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between gap-4 px-2 pt-3 pb-1 sm:px-3">
          <p className="min-w-0 truncate text-xs font-semibold text-[var(--muted)] ink-fade" data-testid="text-chapter-line">
            <span className="hidden sm:inline">Header reads: </span>
            <span className="sm:hidden">Reads: </span>
            <span className="font-bold text-[var(--ink)] ink-fade">{headerReads}</span>
          </p>
          <button
            type="button"
            onClick={() => openDialog('dialog-preview')}
            className="btn btn-ghost btn-sm -mr-2 shrink-0 ink-fade"
            data-testid="button-preview-full"
          >
            <Maximize2 size={14} strokeWidth={2.5} /> Preview full size
          </button>
        </div>
      </div>

      {/* Download */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handleDownload}
          disabled={busy}
          data-testid="button-download"
          className="btn btn-primary btn-lg relative w-full overflow-hidden text-[1.0625rem] ink-fade sm:w-auto sm:min-w-[260px] disabled:opacity-90"
        >
          {downloadLabel}
        </button>
        <p className="text-xs font-semibold leading-relaxed text-[var(--muted)] ink-fade sm:max-w-[300px] sm:text-right">
          You get a 1500 × 500 PNG for X and a 3000 × 1000 WebP. Your photo is not stored.
        </p>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`paper-sheet p-5 sm:p-6 ink-fade ${isStale ? 'border-[#E0B45C]' : ''}`}
            data-testid="card-result"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-[var(--ink)] ink-fade">Your banner is ready.</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--muted)] ink-fade">The PNG is already in your downloads.</p>
              </div>
              {isStale && (
                <span className="rounded-full border border-[#E0B45C] bg-[#FFF6DF] px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-widest text-[#8A5A00]" data-testid="badge-stale">
                  Inputs changed
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={downloadPng}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--ink)] cursor-pointer ink-fade"
                data-testid="button-download-png"
              >
                <span>
                  <span className="block text-sm font-bold text-[var(--ink)] ink-fade">X header · PNG</span>
                  <span className="mt-0.5 block text-xs font-semibold text-[var(--muted)] ink-fade">1500 × 500 · {formatBytes(result.png.bytes)}</span>
                </span>
                <Download size={16} strokeWidth={2.5} className="shrink-0 text-[var(--ink)] ink-fade" />
              </button>
              <button
                type="button"
                onClick={downloadWebp}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--ink)] cursor-pointer ink-fade"
                data-testid="button-download-webp"
              >
                <span>
                  <span className="block text-sm font-bold text-[var(--ink)] ink-fade">Retina · WebP</span>
                  <span className="mt-0.5 block text-xs font-semibold text-[var(--muted)] ink-fade">3000 × 1000 · {formatBytes(result.webp.bytes)}</span>
                </span>
                <Download size={16} strokeWidth={2.5} className="shrink-0 text-[var(--ink)] ink-fade" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ActionButton onClick={downloadBoth} icon={<Download size={14} strokeWidth={2.5} />} testId="button-download-both">
                Download both
              </ActionButton>
              {supportsCopyImage && (
                <ActionButton onClick={copyPng} icon={<Copy size={14} strokeWidth={2.5} />} testId="button-copy-image">
                  Copy image
                </ActionButton>
              )}
              {supportsShareFile && (
                <ActionButton onClick={sharePng} icon={<Share2 size={14} strokeWidth={2.5} />} testId="button-share">
                  Share
                </ActionButton>
              )}
              <ActionButton href={xPostUrl} icon={<XGlyph />} testId="link-post-x">
                Post on X
              </ActionButton>
              <ActionButton onClick={copyStudioLink} icon={<LinkIcon size={14} strokeWidth={2.5} />} testId="button-copy-link">
                Copy studio link
              </ActionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <dialog
        id="dialog-preview"
        aria-labelledby="dialog-preview-title"
        className="m-auto w-full max-w-[96vw] sm:max-w-6xl bg-transparent p-0 outline-none backdrop:bg-[var(--ink)]/85 backdrop:backdrop-blur-sm open:flex flex-col"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="paper-sheet p-3 sm:p-5 rounded-[24px]">
          <div className="mb-3 flex items-center justify-between gap-4 px-1">
            <h3 id="dialog-preview-title" className="font-display text-lg font-bold text-[var(--ink)]">
              Full-size preview
            </h3>
            <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={() => closeDialog('dialog-preview')} data-testid="button-close-preview">
              Close <X size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
            <BannerCanvas country={country} city={city} handle={handle} role={role} photo={photo} crop={crop} eager size="full" className="w-full" />
          </div>
        </div>
      </dialog>

      <dialog
        id="dialog-crop"
        aria-labelledby="dialog-crop-title"
        className="m-auto w-full max-w-[96vw] sm:max-w-2xl bg-transparent p-0 outline-none backdrop:bg-[var(--ink)]/85 backdrop:backdrop-blur-sm open:flex flex-col"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="paper-sheet p-4 sm:p-6 rounded-[24px]">
          <div className="mb-4 flex items-center justify-between gap-4 px-1">
            <h3 id="dialog-crop-title" className="font-display text-lg font-bold text-[var(--ink)]">
              Crop your portrait
            </h3>
            <button type="button" className="btn btn-ghost btn-sm -mr-2" onClick={() => closeDialog('dialog-crop')} data-testid="button-close-crop">
              Close <X size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
            <BannerCanvas country={country} city={city} handle={handle} role={role} photo={photo} crop={crop} onCropChange={setCrop} eager size="full" className="w-full" />
          </div>
          <p className="mt-3 px-1 text-xs font-semibold text-[var(--muted)]">Drag the portrait to move it. Zoom in to fill the ring.</p>
          <div className="mt-5 flex flex-col gap-2 px-1">
            <div className="flex items-center justify-between text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              <label htmlFor="crop-zoom">Zoom</label>
              <span className="tabular-nums">{crop.zoom}%</span>
            </div>
            <input
              id="crop-zoom"
              type="range"
              min="100"
              max="400"
              value={crop.zoom}
              onChange={(e) => setCrop({ ...crop, zoom: parseInt(e.target.value, 10) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--wash)] accent-[var(--ink)]"
            />
          </div>
          <button type="button" className="btn btn-primary btn-md mt-6 w-full" onClick={() => closeDialog('dialog-crop')} data-testid="button-crop-done">
            Done
          </button>
        </div>
      </dialog>

      {/* Mobile sticky bar */}
      <AnimatePresence>
        {showMobileBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden ink-fade"
          >
            <button
              onClick={handleDownload}
              disabled={busy}
              className="btn btn-primary btn-lg relative w-full overflow-hidden ink-fade disabled:opacity-90"
              data-testid="button-download-mobile"
            >
              {downloadLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
