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

export interface SiteData {
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

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
