import {
  CITY_MAX_LENGTH,
  COUNTRY_SLUGS,
  DEFAULT_COUNTRY,
  DEFAULT_ROLE,
  HANDLE_MAX_LENGTH,
  ROLE_MAX_LENGTH,
  getCountry,
  normalizeHandle,
  validateCity,
  validateHandle,
  validateRole,
  type CountrySlug,
} from '@workspace/papercut-core';

/**
 * Shareable studio links. The chapter, city, handle and role travel in the
 * query string (`?chapter=turkey&city=Istanbul&handle=vaibhav_0xq&role=Founder`)
 * so a member can send a pre-filled studio to their chapter and a refresh
 * keeps their place. The role is only written when it differs from the
 * default ("role=" on its own means the member cleared it). Photos never go
 * in the URL and nothing is stored anywhere else.
 */

export type StudioLinkValues = {
  countrySlug: CountrySlug;
  city: string;
  handle: string;
  role: string;
};

const PARAM = { chapter: 'chapter', city: 'city', handle: 'handle', role: 'role' } as const;

function isCountrySlug(value: string): value is CountrySlug {
  return (COUNTRY_SLUGS as readonly string[]).includes(value);
}

/** Parse a query string into studio values, dropping anything invalid. */
export function readStudioLink(search: string): Partial<StudioLinkValues> {
  const params = new URLSearchParams(search);
  const out: Partial<StudioLinkValues> = {};

  const chapter = params.get(PARAM.chapter)?.trim().toLowerCase();
  if (chapter && isCountrySlug(chapter)) out.countrySlug = chapter;

  const city = params.get(PARAM.city)?.trim().slice(0, CITY_MAX_LENGTH);
  if (city && !validateCity(city)) out.city = city;

  const rawHandle = params.get(PARAM.handle)?.trim();
  if (rawHandle) {
    const handle = normalizeHandle(rawHandle).slice(0, HANDLE_MAX_LENGTH);
    if (handle && !validateHandle(handle)) out.handle = handle;
  }

  const rawRole = params.get(PARAM.role);
  if (rawRole !== null) {
    const role = rawRole.trim().slice(0, ROLE_MAX_LENGTH);
    if (!validateRole(role)) out.role = role;
  }
  return out;
}

const isDefaultRole = (role: string) => role.trim() === DEFAULT_ROLE;

/** Query string for the given values; empty when everything is at its default. */
export function studioLinkSearch({ countrySlug, city, handle, role }: StudioLinkValues): string {
  const params = new URLSearchParams();
  const trimmedCity = city.trim();
  const normalizedHandle = normalizeHandle(handle);
  const isDefault =
    countrySlug === DEFAULT_COUNTRY && trimmedCity === getCountry(countrySlug).defaultCity && !normalizedHandle && isDefaultRole(role);
  if (isDefault) return '';
  params.set(PARAM.chapter, countrySlug);
  if (trimmedCity && trimmedCity !== getCountry(countrySlug).defaultCity) params.set(PARAM.city, trimmedCity);
  if (normalizedHandle) params.set(PARAM.handle, normalizedHandle);
  if (!isDefaultRole(role)) params.set(PARAM.role, role.trim());
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** Absolute, shareable URL for the current studio state. */
export function buildStudioLink(values: StudioLinkValues): string {
  const url = new URL(window.location.href);
  url.search = studioLinkSearch(values);
  url.hash = 'studio';
  return url.toString();
}

/** Mirror the current values into the address bar without adding history entries. */
export function syncAddressBar(values: StudioLinkValues): void {
  const next = studioLinkSearch(values);
  if (window.location.search === next) return;
  const url = new URL(window.location.href);
  url.search = next;
  window.history.replaceState(window.history.state, '', url.toString());
}
