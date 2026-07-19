import citiesData from "../data/cities.json";
import fallbackData from "../data/fuel-prices-fallback.json";
import type { CityPriceRecord } from "./priceCrawler";

export interface CityPrices {
  petrol: number | null;
  xp95?: number | null;
  xp100?: number | null;
  diesel: number | null;
  e20: number | null;
  cng: number | null;
  lpg: number | null;
}

// XP95/XP100 (branded premium petrol) aren't part of any city-wise price feed we have
// — OMCs price them as a fixed premium over regular petrol, not a separately tracked
// series — so we derive them from the resolved petrol price rather than seeding a
// third figure per city. Rough, commonly-observed premiums; always user-overridable.
const PREMIUM_OVER_PETROL: Record<"xp95" | "xp100", number> = {
  xp95: 4,
  xp100: 9,
};

function withDerivedFuels(prices: CityPrices): CityPrices {
  const petrol = prices.petrol;
  return {
    ...prices,
    xp95: prices.xp95 ?? (petrol != null ? Math.round((petrol + PREMIUM_OVER_PETROL.xp95) * 100) / 100 : null),
    xp100: prices.xp100 ?? (petrol != null ? Math.round((petrol + PREMIUM_OVER_PETROL.xp100) * 100) / 100 : null),
  };
}

export interface ResolvedCityPrices {
  citySlug: string;
  prices: CityPrices;
  source: "crawler" | "manual" | "seed" | "fallback";
  lastUpdated: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map<string, { value: ResolvedCityPrices; expiresAt: number }>();

function kvKey(citySlug: string): string {
  return `city:${citySlug}`;
}

function seedFor(citySlug: string): ResolvedCityPrices | null {
  const city = citiesData.cities.find((c) => c.slug === citySlug);
  if (!city) return null;
  return {
    citySlug,
    prices: city.prices as CityPrices,
    source: "seed",
    lastUpdated: citiesData.lastUpdated,
  };
}

function nationalFallback(citySlug: string): ResolvedCityPrices {
  return {
    citySlug,
    prices: fallbackData.prices as CityPrices,
    source: "fallback",
    lastUpdated: fallbackData.lastUpdated,
  };
}

/**
 * Read path: KV (live crawler data) → in-memory cache (warm-isolate only, cuts KV
 * reads under real traffic) → checked-in seed → national fallback. Never blocks a
 * page/API request on a live scrape — the crawler only ever runs on its own cron.
 * `env` is optional so this also works during local `astro dev` without Cloudflare
 * bindings wired up (falls straight to seed/fallback).
 */
export async function resolveCityPrices(
  env: Env | undefined,
  citySlug: string,
): Promise<ResolvedCityPrices> {
  const cached = memoryCache.get(citySlug);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let resolved: ResolvedCityPrices | null = null;

  if (env?.FUEL_PRICES) {
    try {
      const raw = await env.FUEL_PRICES.get(kvKey(citySlug));
      if (raw) {
        const parsed = JSON.parse(raw) as CityPriceRecord;
        resolved = {
          citySlug,
          prices: parsed.prices,
          source: parsed.source,
          lastUpdated: parsed.lastUpdated,
        };
      }
    } catch {
      // KV unreachable/malformed — fall through to seed/fallback rather than failing the request.
    }
  }

  resolved ??= seedFor(citySlug) ?? nationalFallback(citySlug);
  resolved = { ...resolved, prices: withDerivedFuels(resolved.prices) };

  memoryCache.set(citySlug, { value: resolved, expiresAt: Date.now() + CACHE_TTL_MS });
  return resolved;
}

export function listCities(): Array<{ slug: string; name: string; state: string }> {
  return citiesData.cities.map(({ slug, name, state }) => ({ slug, name, state }));
}

export function findCity(citySlug: string) {
  return citiesData.cities.find((c) => c.slug === citySlug) ?? null;
}
