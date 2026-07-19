import citiesData from "../data/cities.json";
import { fetchCityPrices } from "./priceSource";

export interface CityPriceRecord {
  prices: {
    petrol: number | null;
    diesel: number | null;
    e20: number | null;
    cng: number | null;
    lpg: number | null;
  };
  source: "crawler" | "manual";
  lastUpdated: string;
  locked: boolean;
}

function kvKey(citySlug: string): string {
  return `city:${citySlug}`;
}

export interface CrawlResult {
  updated: number;
  skippedLocked: number;
  unmatched: string[];
}

/**
 * Runs one crawl pass: fetches petrol+diesel city tables, merges into each city's KV
 * blob (preserving e20/cng/lpg, which aren't sourced by the crawler — see priceSource.ts),
 * and skips any city an admin has flagged `locked: true`. Writes one KV blob per
 * matched city, keeping the free-tier write budget in check (see wrangler.jsonc cron
 * comment for the math).
 */
export async function runPriceCrawl(env: Env): Promise<CrawlResult> {
  const [petrolRows, dieselRows] = await Promise.all([
    fetchCityPrices("petrol"),
    fetchCityPrices("diesel"),
  ]);

  const petrolBySlug = new Map(petrolRows.map((r) => [r.citySlug, r.price]));
  const dieselBySlug = new Map(dieselRows.map((r) => [r.citySlug, r.price]));

  let updated = 0;
  let skippedLocked = 0;
  const matchedSlugs = new Set<string>();

  for (const city of citiesData.cities) {
    const scrapedPetrol = petrolBySlug.get(city.slug);
    const scrapedDiesel = dieselBySlug.get(city.slug);
    if (scrapedPetrol === undefined && scrapedDiesel === undefined) continue;

    matchedSlugs.add(city.slug);

    const existingRaw = await env.FUEL_PRICES.get(kvKey(city.slug));
    const existing: CityPriceRecord | null = existingRaw ? JSON.parse(existingRaw) : null;

    if (existing?.locked) {
      skippedLocked++;
      continue;
    }

    const record: CityPriceRecord = {
      prices: {
        petrol: scrapedPetrol ?? existing?.prices.petrol ?? city.prices.petrol ?? null,
        diesel: scrapedDiesel ?? existing?.prices.diesel ?? city.prices.diesel ?? null,
        e20: existing?.prices.e20 ?? city.prices.e20 ?? null,
        cng: existing?.prices.cng ?? city.prices.cng ?? null,
        lpg: existing?.prices.lpg ?? city.prices.lpg ?? null,
      },
      source: "crawler",
      lastUpdated: new Date().toISOString(),
      locked: false,
    };

    await env.FUEL_PRICES.put(kvKey(city.slug), JSON.stringify(record));
    updated++;
  }

  const unmatched = citiesData.cities
    .map((c) => c.slug)
    .filter((slug) => !matchedSlugs.has(slug));

  return { updated, skippedLocked, unmatched };
}
