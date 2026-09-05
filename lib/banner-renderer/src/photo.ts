import sharp from "sharp";
import { PFP_SIZE, PHOTO_MAX_BYTES, PHOTO_MAX_PIXELS, PHOTO_MIME_TYPES, cropWindow, type CropParams } from "@workspace/papercut-core";
import { RenderError } from "./errors";

const DATA_URL = /^data:([a-z0-9.+/-]+);base64,/i;
const ACCEPTED = new Set<string>(PHOTO_MIME_TYPES);

/** Decode a data URL into raw bytes, enforcing the type and size limits before touching pixels. */
export function decodePhotoDataUrl(dataUrl: string): Buffer {
  const match = DATA_URL.exec(dataUrl);
  if (!match) {
    throw new RenderError(400, "The photo must be sent as a base64 data URL.", "photo");
  }
  const mime = match[1]!.toLowerCase();
  if (!ACCEPTED.has(mime)) {
    throw new RenderError(400, "Use a PNG, JPG or WebP photo.", "photo");
  }
  const base64Length = dataUrl.length - match[0].length;
  // 3 bytes per 4 base64 chars; check before allocating so a huge string is rejected cheaply.
  if ((base64Length * 3) / 4 > PHOTO_MAX_BYTES + 3) {
    throw new RenderError(400, "Photos need to be 25 MB or smaller.", "photo");
  }
  const bytes = Buffer.from(dataUrl.slice(match[0].length), "base64");
  if (bytes.length === 0) {
    throw new RenderError(400, "The photo was empty.", "photo");
  }
  if (bytes.length > PHOTO_MAX_BYTES) {
    throw new RenderError(400, "Photos need to be 25 MB or smaller.", "photo");
  }
  return bytes;
}

/**
 * Cover-fit crop of the portrait into a circle of `diameter` px (PFP_SIZE on
 * the master grid) with a transparent outside, ready to composite at
 * PC_PFP_ORIGIN. Uses the shared cropWindow so the visible square matches the
 * studio thumbnail pixel for pixel.
 */
export async function portraitDisc(photo: Buffer, crop: CropParams, diameter: number = PFP_SIZE): Promise<Buffer> {
  let image = sharp(photo, { limitInputPixels: PHOTO_MAX_PIXELS, animated: false }).rotate();
  let meta;
  try {
    meta = await image.metadata();
  } catch {
    throw new RenderError(400, "That file could not be read as an image.", "photo");
  }
  // After autorotate the working dimensions may be swapped.
  const swapped = (meta.orientation ?? 1) >= 5;
  const width = swapped ? meta.height : meta.width;
  const height = swapped ? meta.width : meta.height;
  if (!width || !height) {
    throw new RenderError(400, "That file could not be read as an image.", "photo");
  }
  if (width * height > PHOTO_MAX_PIXELS) {
    throw new RenderError(413, "That photo has too many pixels. Resize it to 6000 x 6000 or smaller.", "photo");
  }

  const win = cropWindow(width, height, crop);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}"><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" fill="#fff"/></svg>`,
  );

  try {
    image = image.extract({ left: win.left, top: win.top, width: win.side, height: win.side });
    return await image
      .resize(diameter, diameter, { fit: "cover", kernel: sharp.kernel.lanczos3 })
      .ensureAlpha()
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch {
    throw new RenderError(400, "That photo could not be processed. Try a different file.", "photo");
  }
}
