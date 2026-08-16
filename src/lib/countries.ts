export type CountryCode = "IN" | "US" | "GB" | "CA" | "AU";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  /** URL path prefix for this country's pages — "" for India (unprefixed, existing URLs). */
  pathPrefix: string;
  flagEmoji: string;
  currency: {
    code: string;
    symbol: string;
    /** BCP 47 locale passed to Intl.NumberFormat for currency + number grouping. */
    locale: string;
  };
  /** "km" everywhere except the US, which uses miles. */
  distanceUnit: "km" | "mi";
  /** "litre" everywhere except the US, which uses gallons. CNG/LPG vehicles still price per kg regardless. */
  volumeUnit: "litre" | "gallon";
}

export const SUPPORTED_COUNTRIES: readonly CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    pathPrefix: "",
    flagEmoji: "🇮🇳",
    currency: { code: "INR", symbol: "₹", locale: "en-IN" },
    distanceUnit: "km",
    volumeUnit: "litre",
  },
  {
    code: "US",
    name: "United States",
    pathPrefix: "/us",
    flagEmoji: "🇺🇸",
    currency: { code: "USD", symbol: "$", locale: "en-US" },
    distanceUnit: "mi",
    volumeUnit: "gallon",
  },
  {
    code: "GB",
    name: "United Kingdom",
    pathPrefix: "/gb",
    flagEmoji: "🇬🇧",
    currency: { code: "GBP", symbol: "£", locale: "en-GB" },
    distanceUnit: "km",
    volumeUnit: "litre",
  },
  {
    code: "CA",
    name: "Canada",
    pathPrefix: "/ca",
    flagEmoji: "🇨🇦",
    currency: { code: "CAD", symbol: "$", locale: "en-CA" },
    distanceUnit: "km",
    volumeUnit: "litre",
  },
  {
    code: "AU",
    name: "Australia",
    pathPrefix: "/au",
    flagEmoji: "🇦🇺",
    currency: { code: "AUD", symbol: "$", locale: "en-AU" },
    distanceUnit: "km",
    volumeUnit: "litre",
  },
];

export const DEFAULT_COUNTRY_CODE: CountryCode = "IN";

export function getCountry(code: string | undefined | null): CountryConfig {
  return (
    SUPPORTED_COUNTRIES.find((c) => c.code === code?.toUpperCase()) ??
    SUPPORTED_COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE)!
  );
}

/** Maps a URL path prefix (e.g. "us" from /us/compare) back to its CountryConfig. */
export function getCountryByPathSegment(segment: string | undefined | null): CountryConfig | undefined {
  if (!segment) return undefined;
  return SUPPORTED_COUNTRIES.find((c) => c.pathPrefix === `/${segment.toLowerCase()}`);
}

/**
 * Resolves the current country purely from a URL pathname — e.g. `/us/compare` → US,
 * `/faq` → India (the unprefixed default). Used by Nav/Footer so they don't need a
 * `country` prop threaded through every page/Layout call site.
 */
export function getCountryFromPathname(pathname: string): CountryConfig {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return getCountryByPathSegment(firstSegment) ?? getCountry(DEFAULT_COUNTRY_CODE);
}
