/** Clipboard and share helpers. Everything here degrades gracefully: callers check the `supports*` flags before showing a control. */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Chromium and Safari can take PNG blobs; Firefox needs a flag. */
export function supportsImageClipboard(): boolean {
  return typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write);
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!supportsImageClipboard()) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Web Share with files (mobile Safari, Android Chrome) so the PNG can go straight into the X app. */
export function supportsFileShare(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

export async function shareFile(file: File, text: string): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!supportsFileShare(file)) return 'unsupported';
  try {
    await navigator.share({ files: [file], text });
    return 'shared';
  } catch (err) {
    return (err as { name?: string })?.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

/** Pre-filled X post composer. */
export function xPostIntentUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text });
  if (url) params.set('url', url);
  return `https://x.com/intent/post?${params.toString()}`;
}

export const CREDIT = {
  name: 'Vaibhav',
  handle: '@vaibhav_0xq',
  url: 'https://x.com/vaibhav_0xq',
} as const;

/** Where the files live outside the studio: the source and the ready-made banner packs. */
export const LINKS = {
  source: 'https://github.com/vaibhav0xq/arc-house-banners',
  /** Shared folder with every chapter as a blank banner (no pill) at 1500 x 500, 3000 x 1000 and 6000 x 2000, plus personalised examples. */
  files: 'https://drive.google.com/drive/folders/183-BVc7GH3nDJuPOZ1bH2LTsu-QC6Owf',
} as const;
