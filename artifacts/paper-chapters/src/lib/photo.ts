import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES, PHOTO_UPLOAD_MAX_EDGE } from '@workspace/papercut-core';
import { SAMPLE_PHOTO_URL } from './banner-assets';

/**
 * A photo ready for both the preview and the API: the same re-encoded bytes are
 * shown in the studio and sent to the renderer, so the crop maths (which runs
 * on width/height) sees identical dimensions on both sides.
 */
export type PreparedPhoto = {
  /** unique per prepared photo, so a replaced photo with identical name/size still counts as a change */
  id: string;
  /** object URL of `blob`, for <img> previews; revoke it with releasePhoto() */
  objectUrl: string;
  /** base64 data URL of `blob`, the API payload */
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  fileName: string;
};

export class PhotoError extends Error {
  readonly name = 'PhotoError';
}

const ACCEPTED = new Set<string>(PHOTO_MIME_TYPES);

let photoCounter = 0;
function nextPhotoId(): string {
  photoCounter += 1;
  return `${Date.now().toString(36)}-${photoCounter}`;
}

/** Accept string for the file input. */
export const PHOTO_ACCEPT = PHOTO_MIME_TYPES.join(',');

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoError('That file could not be read as an image.'));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new PhotoError('Could not encode the photo.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Validate, decode (EXIF orientation applied by the browser), shrink to at most
 * 1800px on the long edge and re-encode as WebP (JPEG/PNG where WebP encoding is
 * unavailable). Throws PhotoError with a message safe to show inline.
 */
export async function preparePhoto(file: File | Blob, fileName = 'photo'): Promise<PreparedPhoto> {
  const type = file.type;
  if (!ACCEPTED.has(type)) {
    throw new PhotoError('Use a PNG, JPG or WebP photo.');
  }
  if (file.size > PHOTO_MAX_BYTES) {
    throw new PhotoError('Photos need to be 25 MB or smaller.');
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(sourceUrl);
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    if (!sw || !sh) throw new PhotoError('That image has no pixels we can use.');

    const ratio = Math.min(1, PHOTO_UPLOAD_MAX_EDGE / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * ratio));
    const height = Math.max(1, Math.round(sh * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('Your browser could not prepare the photo.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, 'image/webp', 0.92);
    if (!blob || blob.type !== 'image/webp') {
      // Older Safari cannot encode WebP; keep PNG for transparent sources, JPEG otherwise.
      blob = type === 'image/png' ? await canvasToBlob(canvas, 'image/png') : await canvasToBlob(canvas, 'image/jpeg', 0.92);
    }
    if (!blob) throw new PhotoError('Your browser could not prepare the photo.');

    const dataUrl = await blobToDataUrl(blob);
    return {
      id: nextPhotoId(),
      objectUrl: URL.createObjectURL(blob),
      dataUrl,
      blob,
      width,
      height,
      bytes: blob.size,
      fileName,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/** Free the object URL once a photo is replaced or removed. */
export function releasePhoto(photo: PreparedPhoto | null | undefined): void {
  if (photo) URL.revokeObjectURL(photo.objectUrl);
}

/** The bundled sample portrait, prepared like an upload. */
export async function loadSamplePhoto(): Promise<PreparedPhoto> {
  const res = await fetch(SAMPLE_PHOTO_URL);
  if (!res.ok) throw new PhotoError('The sample photo is missing.');
  const blob = await res.blob();
  return preparePhoto(blob.type ? blob : new Blob([blob], { type: 'image/jpeg' }), 'sample-photo.jpg');
}
