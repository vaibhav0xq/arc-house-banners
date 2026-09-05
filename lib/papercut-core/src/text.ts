import type { Country, CountrySlug } from "./countries";

export const HANDLE_MAX_LENGTH = 15;
/** X handle rules: letters, digits and underscore, 1-15 characters, with or without one leading @. */
export const HANDLE_PATTERN = /^@?[A-Za-z0-9_]{1,15}$/;

export const CITY_MAX_LENGTH = 28;
/** Letters (Latin, including accented), digits, spaces and . ' & / ( ) - */
export const CITY_PATTERN = /^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF0-9 .'&/()\-]+$/;
export const CITY_ALLOWED_CHARS_HINT = "letters, digits, spaces and . ' & / ( ) -";

/** What the role line says when the member leaves the role field as it comes. */
export const DEFAULT_ROLE = "Builder";
export const ROLE_MAX_LENGTH = 18;
/** Same alphabet as the city: it is drawn with the same font on the same pill. */
export const ROLE_PATTERN = CITY_PATTERN;

/** Handle without any leading @ or surrounding whitespace. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

/** The handle as drawn on the banner: always exactly one leading @. Falls back to the placeholder. */
export function handleLine(raw: string, placeholder = "yourhandle"): string {
  const clean = normalizeHandle(raw);
  return `@${clean || placeholder}`;
}

/** The role as drawn on the pill: trimmed, single-spaced, uppercased. Empty when the member cleared it. */
export function roleLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * The role line under the handle, e.g. "BUILDER · INDIA CHAPTER". Just
 * "INDIA CHAPTER" when the role is empty. Single spaces on purpose: the
 * approved reference banners were drawn with SVG <text>, which collapses
 * whitespace, so this is the spacing members have already seen.
 */
export function roleLine(country: Pick<Country, "name">, role: string = DEFAULT_ROLE): string {
  const chapter = `${country.name.toUpperCase()} CHAPTER`;
  const r = roleLabel(role);
  return r ? `${r} · ${chapter}` : chapter;
}

/** The city line as drawn under the chapter title. */
export function cityLine(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

/** What the finished header reads, e.g. "ISTANBUL · @vaibhav_0xq". */
export function chapterLine(city: string, handle: string): string {
  return `${cityLine(city)} · ${handleLine(handle)}`;
}

/** Error message for a city. Null when it is acceptable. */
export function validateCity(raw: string): string | null {
  const city = raw.trim();
  if (!city) return "Enter your city.";
  if (city.length > CITY_MAX_LENGTH) return `Keep the city under ${CITY_MAX_LENGTH} characters.`;
  if (!CITY_PATTERN.test(city)) return `Cities can use ${CITY_ALLOWED_CHARS_HINT}.`;
  return null;
}

/** Error message for a handle. Null when it is acceptable. */
export function validateHandle(raw: string): string | null {
  const handle = raw.trim();
  if (!handle || handle === "@") return "Enter your X handle.";
  if (!HANDLE_PATTERN.test(handle)) {
    if (normalizeHandle(handle).length > HANDLE_MAX_LENGTH) {
      return `X handles are at most ${HANDLE_MAX_LENGTH} characters.`;
    }
    return "Handles use letters, digits and underscores only.";
  }
  return null;
}

/** Error message for a role. Null when it is acceptable (an empty role is fine: the line then reads "<COUNTRY> CHAPTER"). */
export function validateRole(raw: string): string | null {
  const role = raw.trim();
  if (!role) return null;
  if (role.length > ROLE_MAX_LENGTH) return `Keep the role under ${ROLE_MAX_LENGTH} characters.`;
  if (!ROLE_PATTERN.test(role)) return `Roles can use ${CITY_ALLOWED_CHARS_HINT}.`;
  return null;
}

/** Lowercase, ASCII-only slug for file names. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Download file name without extension: arc-house-papercut-<country>-<city>-<handle>. */
export function fileStemFor(country: CountrySlug, city: string, handle: string): string {
  const citySlug = slugify(city) || "city";
  const handleSlug = slugify(normalizeHandle(handle)) || "builder";
  return `arc-house-papercut-${country}-${citySlug}-${handleSlug}`;
}
