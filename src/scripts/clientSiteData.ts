export interface CityRecord {
  slug: string;
  name: string;
  state: string;
  prices: Record<string, number | null>;
}

export interface VehicleRecord {
  slug: string;
  name: string;
  type: "car" | "bike";
  segment: string;
  fuelType: string;
  mileage: number;
  mileageUnit: string;
}

export interface FuelTypeRecord {
  id: string;
  label: string;
  shortLabel: string;
  unit: string;
  unitLabel: string;
  category: string;
}

export interface EvTariffData {
  defaultTariffPerKwh: number;
  tariffByState: Record<string, number>;
  efficiencyPresetsKwhPer100Km: Record<string, number>;
}

import type { CountryCode } from "../lib/countries";

/** Mirrors CountryConfig from src/lib/countries.ts — duplicated here (rather than
 * imported wholesale) because this file ships to the browser and that module is also
 * used server-side; keeping the client-facing shape separate avoids ever accidentally
 * bundling server-only code into the client script. The `code` type import above is
 * type-only (erased at build time), so it carries no such risk. */
export interface ClientCountryConfig {
  code: CountryCode;
  name: string;
  pathPrefix: string;
  flagEmoji: string;
  currency: { code: string; symbol: string; locale: string };
  distanceUnit: "km" | "mi";
  volumeUnit: "litre" | "gallon";
}

export interface SiteData {
  country: ClientCountryConfig;
  cities: CityRecord[];
  vehicles: VehicleRecord[];
  fuelTypes: FuelTypeRecord[];
  evTariffs: EvTariffData;
}

let cached: SiteData | null = null;

export function getSiteData(): SiteData {
  if (cached) return cached;
  const el = document.getElementById("site-data");
  if (!el || !el.textContent) {
    throw new Error("getSiteData: #site-data script tag missing — include <SiteDataScript /> on this page");
  }
  cached = JSON.parse(el.textContent) as SiteData;
  return cached;
}

interface CityPriceApiResponse {
  citySlug: string;
  prices: Record<string, number | null>;
  source: string;
  lastUpdated: string;
}

const cityPriceCache = new Map<string, Promise<CityPriceApiResponse>>();

export function fetchCityPrices(citySlug: string): Promise<CityPriceApiResponse> {
  let pending = cityPriceCache.get(citySlug);
  if (!pending) {
    pending = fetch(`/api/prices/${citySlug}`).then((r) => r.json());
    cityPriceCache.set(citySlug, pending);
  }
  return pending;
}

export function formatCurrency(value: number, country: Pick<ClientCountryConfig, "currency">): string {
  return new Intl.NumberFormat(country.currency.locale, {
    style: "currency",
    currency: country.currency.code,
    maximumFractionDigits: 2,
  }).format(value);
}
