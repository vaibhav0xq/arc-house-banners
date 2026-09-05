/**
 * The ten Arc House country chapters of the papercut series.
 *
 * `ink` is the paper-ink colour used for every piece of type and the portrait
 * ring; `tag` is the lighter paper the pill is cut from; `swatch` is the
 * dominant paper of the base art. The renderer and the studio share this file so
 * the preview and the download can never disagree about a colour.
 */
export const COUNTRY_SLUGS = [
  "india",
  "argentina",
  "bangladesh",
  "brazil",
  "vietnam",
  "france",
  "nigeria",
  "portugal",
  "turkey",
  "singapore",
] as const;

export type CountrySlug = (typeof COUNTRY_SLUGS)[number];

export interface Country {
  slug: CountrySlug;
  /** English name as printed in the role line ("BUILDER · INDIA CHAPTER") */
  name: string;
  /** Two-digit chapter number baked into the base art */
  chapter: string;
  region: string;
  /** Suggested city, used as the studio's placeholder */
  defaultCity: string;
  coords: string;
  /** Paper ink: type, ring, UI re-tint */
  ink: string;
  /** Pill paper */
  tag: string;
  /** Dominant paper of the base art (palette swatches, catalog cards) */
  swatch: string;
  /** One line about what the papercut scene shows */
  scene: string;
}

export const COUNTRIES: readonly Country[] = [
  {
    slug: "india",
    name: "India",
    chapter: "01",
    region: "South Asia",
    defaultCity: "New Delhi",
    coords: "28.61° N · 77.21° E",
    ink: "#1F2A5C",
    tag: "#FBF3E0",
    swatch: "#F6EAD2",
    scene: "Taj domes, Qutub Minar, India Gate and a temple gopuram cut from layered cream paper.",
  },
  {
    slug: "argentina",
    name: "Argentina",
    chapter: "02",
    region: "South America",
    defaultCity: "Buenos Aires",
    coords: "34.60° S · 58.38° W",
    ink: "#17335A",
    tag: "#FBF3E2",
    swatch: "#F3E9D2",
    scene: "The Obelisco, Congreso dome, Casa Rosada and Puente de la Mujer over the Río de la Plata.",
  },
  {
    slug: "bangladesh",
    name: "Bangladesh",
    chapter: "03",
    region: "South Asia",
    defaultCity: "Dhaka",
    coords: "23.81° N · 90.41° E",
    ink: "#1F3F2A",
    tag: "#F4F6E8",
    swatch: "#EEF2E2",
    scene: "Parliament, Ahsan Manzil, Lalbagh Fort and the Shaheed Minar beside the Buriganga.",
  },
  {
    slug: "brazil",
    name: "Brazil",
    chapter: "04",
    region: "South America",
    defaultCity: "São Paulo",
    coords: "23.55° S · 46.63° W",
    ink: "#1D4B33",
    tag: "#FBF3DD",
    swatch: "#F5E9CF",
    scene: "Christ the Redeemer, Sugarloaf, the Copan curve and the Lapa arches in cut paper.",
  },
  {
    slug: "vietnam",
    name: "Vietnam",
    chapter: "05",
    region: "Southeast Asia",
    defaultCity: "Ho Chi Minh City",
    coords: "10.82° N · 106.63° E",
    ink: "#5A1A18",
    tag: "#FCEEE6",
    swatch: "#F7E3D6",
    scene: "Landmark 81, Bitexco, the Saigon cathedral, Ben Thanh clock tower and a tiered pagoda.",
  },
  {
    slug: "france",
    name: "France",
    chapter: "06",
    region: "Europe",
    defaultCity: "Paris",
    coords: "48.86° N · 2.35° E",
    ink: "#1B2B4C",
    tag: "#F7F5EE",
    swatch: "#F1EEE6",
    scene: "Eiffel Tower, Arc de Triomphe, Notre-Dame, Sacré-Cœur and Haussmann rooftops over the Seine.",
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    chapter: "07",
    region: "West Africa",
    defaultCity: "Lagos",
    coords: "6.52° N · 3.38° E",
    ink: "#1C4A32",
    tag: "#FBF4DF",
    swatch: "#F6EAD0",
    scene: "National Theatre, Zuma Rock, Abuja mosque, the Kano gate and Eko Atlantic towers on the lagoon.",
  },
  {
    slug: "portugal",
    name: "Portugal",
    chapter: "08",
    region: "Southern Europe",
    defaultCity: "Lisbon",
    coords: "38.72° N · 9.14° W",
    ink: "#1E2F5C",
    tag: "#FCF2E4",
    swatch: "#F8E8D8",
    scene: "Belém Tower, the Jerónimos monastery, the 25 de Abril bridge and Alfama rooftops on the Tagus.",
  },
  {
    slug: "turkey",
    name: "Turkey",
    chapter: "09",
    region: "West Asia",
    defaultCity: "Istanbul",
    coords: "41.01° N · 28.98° E",
    ink: "#5A1D24",
    tag: "#FBF1E8",
    swatch: "#F5E6DC",
    scene: "Hagia Sophia, the Blue Mosque, Galata Tower and Maiden's Tower across the Bosphorus.",
  },
  {
    slug: "singapore",
    name: "Singapore",
    chapter: "10",
    region: "Southeast Asia",
    defaultCity: "Singapore",
    coords: "1.35° N · 103.82° E",
    ink: "#153F3F",
    tag: "#F5F8F1",
    swatch: "#EFF3EA",
    scene: "Marina Bay Sands, the Merlion, Supertrees, the Esplanade and shophouse rows on the bay.",
  },
];

const BY_SLUG: Record<CountrySlug, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.slug, c]),
) as Record<CountrySlug, Country>;

export function isCountrySlug(value: unknown): value is CountrySlug {
  return typeof value === "string" && (COUNTRY_SLUGS as readonly string[]).includes(value);
}

export function getCountry(slug: CountrySlug): Country {
  return BY_SLUG[slug];
}

export function findCountry(slug: string | null | undefined): Country | undefined {
  return isCountrySlug(slug) ? BY_SLUG[slug] : undefined;
}

export const DEFAULT_COUNTRY: CountrySlug = "india";
