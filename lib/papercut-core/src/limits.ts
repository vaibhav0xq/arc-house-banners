/** Upload and payload limits, identical on the client and the server. */

/** Largest photo the server will decode (bytes). */
export const PHOTO_MAX_BYTES = 25 * 1024 * 1024;
/** Photo formats accepted by the drop-zone and the renderer. */
export const PHOTO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
/** The studio shrinks photos to this longest edge before uploading; the crop is proportional so nothing changes. */
export const PHOTO_UPLOAD_MAX_EDGE = 1800;
/**
 * Most pixels the renderer will decode from a photo (6000 x 6000). The studio
 * already shrinks uploads to PHOTO_UPLOAD_MAX_EDGE; this only bounds direct API
 * callers so one request cannot pin hundreds of MB of RAM.
 */
export const PHOTO_MAX_PIXELS = 36_000_000;
/** JSON responses above this are refused with 413 instead of timing out on the wire. */
export const RESPONSE_MAX_BYTES = Math.floor(4.4 * 1024 * 1024);
