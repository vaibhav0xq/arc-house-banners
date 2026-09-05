import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRenderBanner } from '@workspace/api-client-react';
import {
  chapterLine,
  cropToParams,
  getCountry,
  normalizeHandle,
  validateCity,
  validateHandle,
  validateRole,
  FINAL_H,
  FINAL_W,
  RETINA_H,
  RETINA_W,
} from '@workspace/papercut-core';
import { useStudio } from '@/store/use-studio';
import { dataUrlToBlob, triggerDownload } from '@/lib/download';
import { buildStudioLink } from '@/lib/studio-link';
import {
  copyImageToClipboard,
  copyTextToClipboard,
  shareFile,
  supportsFileShare,
  supportsImageClipboard,
  xPostIntentUrl,
} from '@/lib/share';
import { burstPaperConfetti } from '@/lib/confetti';

/**
 * Everything around "make the banner": validation, the render request, the
 * two resulting files, stale detection, downloads, clipboard and sharing.
 * Lives in a context so the hero, the controls and the preview all drive the
 * same flow.
 */

export type RenderStage = 'idle' | 'preparing' | 'cutting' | 'packaging' | 'done';

export type ApiFieldError = { field?: 'country' | 'city' | 'handle' | 'role' | 'photo' | string; error: string };

export type RenderResult = {
  png: { url: string; blob: Blob; bytes: number; fileName: string; width: number; height: number };
  webp: { url: string; blob: Blob; bytes: number; fileName: string; width: number; height: number };
  fileStem: string;
  chapterLine: string;
  /** which inputs produced these files */
  signature: string;
  renderedAt: number;
  durationMs: number;
};

export type Readiness = {
  chapter: true;
  city: boolean;
  handle: boolean;
  /** optional; true when a portrait is loaded */
  photo: boolean;
  /** required fields all valid */
  ready: boolean;
};

export type RenderFlow = {
  stage: RenderStage;
  /** true while a request is in flight */
  busy: boolean;
  result: RenderResult | null;
  /** files exist but inputs changed since they were made */
  isStale: boolean;
  apiError: ApiFieldError | null;
  clearApiError: () => void;
  readiness: Readiness;
  /** "ISTANBUL · @vaibhav_0xq" */
  headerReads: string;
  /** Validate, render and auto-download the PNG. Resolves true on success. */
  render: (opts?: { origin?: { x: number; y: number } }) => Promise<boolean>;
  downloadPng: () => void;
  downloadWebp: () => void;
  downloadBoth: () => void;
  supportsCopyImage: boolean;
  copyPng: () => Promise<boolean>;
  /** Web Share with the PNG attached, where the platform supports it (mostly phones). */
  supportsShareFile: boolean;
  sharePng: () => Promise<'shared' | 'cancelled' | 'unsupported'>;
  /** Absolute URL that reopens the studio with this chapter, city and handle. */
  studioLink: string;
  copyStudioLink: () => Promise<boolean>;
  /** X composer pre-filled with a line about the banner. */
  xPostUrl: string;
};

const RenderFlowContext = createContext<RenderFlow | null>(null);

function friendlyRenderError(err: unknown): ApiFieldError {
  const e = err as { status?: number; data?: { error?: string; field?: string } | null; name?: string };
  if (e?.data?.error) return { field: e.data.field, error: e.data.error };
  if (e?.status === 429) return { error: 'Too many downloads in a short time. Wait a moment and try again.' };
  if (e?.status === 503) return { error: 'The server is busy right now. Try again in a few seconds.' };
  if (e?.status === 413) return { error: 'That photo is too large. Photos need to be 25 MB or smaller.' };
  if (typeof e?.status === 'number' && e.status >= 500) return { error: 'The banner could not be made. Please try again.' };
  return { error: 'Could not reach the server. Check your connection and try again.' };
}

export function RenderFlowProvider({ children }: { children: ReactNode }) {
  const { countrySlug, city, handle, role, photo, crop, markSubmitAttempted } = useStudio();
  const country = getCountry(countrySlug);
  const mutation = useRenderBanner();

  const [stage, setStage] = useState<RenderStage>('idle');
  const [result, setResult] = useState<RenderResult | null>(null);
  const [apiError, setApiError] = useState<ApiFieldError | null>(null);

  const signature = `${countrySlug}|${city.trim()}|${normalizeHandle(handle)}|${role.trim()}|${photo?.id ?? 'none'}|${crop.zoom}|${crop.offsetX}|${crop.offsetY}`;
  const isStale = Boolean(result && result.signature !== signature);

  // Release object URLs of a superseded or abandoned result. Make sure a
  // render that resolves after the provider is gone neither touches state nor
  // leaks the URLs it just created.
  const resultRef = useRef(result);
  resultRef.current = result;
  const mountedRef = useRef(true);
  const stageTimerRef = useRef<number | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (stageTimerRef.current) window.clearTimeout(stageTimerRef.current);
      if (resultRef.current) {
        URL.revokeObjectURL(resultRef.current.png.url);
        URL.revokeObjectURL(resultRef.current.webp.url);
      }
    };
  }, []);

  const readiness = useMemo<Readiness>(() => {
    const cityOk = !validateCity(city);
    const handleOk = !validateHandle(handle);
    return { chapter: true, city: cityOk, handle: handleOk, photo: Boolean(photo), ready: cityOk && handleOk };
  }, [city, handle, photo]);

  const headerReads = chapterLine(city, handle);

  const render = useCallback<RenderFlow['render']>(
    async (opts) => {
      const cErr = validateCity(city);
      const hErr = validateHandle(handle);
      const rErr = validateRole(role);
      if (cErr || hErr || rErr) {
        // Reveal the inline errors and take the member to the first problem field.
        markSubmitAttempted();
        const field = document.getElementById(cErr ? 'city-input' : hErr ? 'handle-input' : 'role-input');
        // 'auto' defers to the html scroll-behavior rule, which is smooth only when motion is welcome.
        field?.scrollIntoView({ behavior: 'auto', block: 'center' });
        field?.focus({ preventScroll: true });
        return false;
      }
      if (mutation.isPending) return false;

      setApiError(null);
      setStage(photo ? 'preparing' : 'cutting');
      const started = performance.now();
      const stageTimer = photo ? window.setTimeout(() => setStage('cutting'), 450) : null;
      stageTimerRef.current = stageTimer;
      const clearStageTimer = () => {
        if (stageTimer) window.clearTimeout(stageTimer);
        if (stageTimerRef.current === stageTimer) stageTimerRef.current = null;
      };
      try {
        const res = await mutation.mutateAsync({
          data: {
            country: countrySlug,
            city: city.trim(),
            handle: normalizeHandle(handle),
            role: role.trim(),
            pfpDataUrl: photo?.dataUrl,
            ...cropToParams(crop),
          },
        });
        clearStageTimer();
        if (!mountedRef.current) return false;
        setStage('packaging');

        const pngBlob = dataUrlToBlob(res.finalPngDataUrl);
        const webpBlob = dataUrlToBlob(res.masterDataUrl);
        const next: RenderResult = {
          png: {
            url: URL.createObjectURL(pngBlob),
            blob: pngBlob,
            bytes: res.finalBytes,
            fileName: `${res.fileStem}-${FINAL_W}x${FINAL_H}.png`,
            width: FINAL_W,
            height: FINAL_H,
          },
          webp: {
            url: URL.createObjectURL(webpBlob),
            blob: webpBlob,
            bytes: res.masterBytes,
            fileName: `${res.fileStem}-${RETINA_W}x${RETINA_H}.webp`,
            width: RETINA_W,
            height: RETINA_H,
          },
          fileStem: res.fileStem,
          chapterLine: res.chapterLine,
          signature,
          renderedAt: Date.now(),
          durationMs: Math.round(performance.now() - started),
        };
        if (!mountedRef.current) {
          URL.revokeObjectURL(next.png.url);
          URL.revokeObjectURL(next.webp.url);
          return false;
        }
        setResult((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev.png.url);
            URL.revokeObjectURL(prev.webp.url);
          }
          return next;
        });
        triggerDownload(next.png.url, next.png.fileName);
        setStage('done');
        burstPaperConfetti({ x: opts?.origin?.x, y: opts?.origin?.y, colors: [country.ink, country.tag, '#E8934A', country.swatch] });
        return true;
      } catch (err) {
        clearStageTimer();
        console.error('Render failed', err);
        if (!mountedRef.current) return false;
        setStage(resultRef.current ? 'done' : 'idle');
        setApiError(friendlyRenderError(err));
        return false;
      }
    },
    [city, handle, role, photo, crop, countrySlug, country, signature, markSubmitAttempted, mutation],
  );

  const downloadPng = useCallback(() => {
    if (result) triggerDownload(result.png.url, result.png.fileName);
  }, [result]);
  const downloadWebp = useCallback(() => {
    if (result) triggerDownload(result.webp.url, result.webp.fileName);
  }, [result]);
  const downloadBoth = useCallback(() => {
    if (!result) return;
    triggerDownload(result.png.url, result.png.fileName);
    // Browsers drop a second synchronous download; give the first one a beat.
    window.setTimeout(() => triggerDownload(result.webp.url, result.webp.fileName), 350);
  }, [result]);

  const supportsCopyImage = useMemo(() => supportsImageClipboard(), []);
  const copyPng = useCallback(async () => (result ? copyImageToClipboard(result.png.blob) : false), [result]);

  const pngFile = useMemo(() => (result ? new File([result.png.blob], result.png.fileName, { type: 'image/png' }) : null), [result]);
  const supportsShareFile = useMemo(() => Boolean(pngFile && supportsFileShare(pngFile)), [pngFile]);
  const sharePng = useCallback(
    async () => (pngFile ? shareFile(pngFile, `My Arc House ${country.name} chapter banner`) : ('unsupported' as const)),
    [pngFile, country.name],
  );

  const studioLink = useMemo(
    () => (typeof window === 'undefined' ? '' : buildStudioLink({ countrySlug, city, handle, role })),
    [countrySlug, city, handle, role],
  );
  const copyStudioLink = useCallback(() => copyTextToClipboard(studioLink), [studioLink]);

  const xPostUrl = useMemo(() => {
    const line = `New header for the Arc House ${country.name} chapter${city.trim() ? ` from ${city.trim()}` : ''}. Make yours here:`;
    const origin = typeof window === 'undefined' ? '' : `${window.location.origin}${import.meta.env.BASE_URL}`;
    return xPostIntentUrl(line, origin || undefined);
  }, [country.name, city]);

  const value = useMemo<RenderFlow>(
    () => ({
      stage,
      busy: mutation.isPending,
      result,
      isStale,
      apiError,
      clearApiError: () => setApiError(null),
      readiness,
      headerReads,
      render,
      downloadPng,
      downloadWebp,
      downloadBoth,
      supportsCopyImage,
      copyPng,
      supportsShareFile,
      sharePng,
      studioLink,
      copyStudioLink,
      xPostUrl,
    }),
    [
      stage,
      mutation.isPending,
      result,
      isStale,
      apiError,
      readiness,
      headerReads,
      render,
      downloadPng,
      downloadWebp,
      downloadBoth,
      supportsCopyImage,
      copyPng,
      supportsShareFile,
      sharePng,
      studioLink,
      copyStudioLink,
      xPostUrl,
    ],
  );

  return <RenderFlowContext.Provider value={value}>{children}</RenderFlowContext.Provider>;
}

export function useRenderFlow(): RenderFlow {
  const ctx = useContext(RenderFlowContext);
  if (!ctx) throw new Error('useRenderFlow must be used inside <RenderFlowProvider>');
  return ctx;
}
