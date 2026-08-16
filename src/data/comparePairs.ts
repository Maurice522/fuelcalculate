import type { CountryCode } from "../lib/countries";

export interface ComparePair {
  slug: string;
  fuels: [string, string];
}

/** Per-country popular fuel-pair comparisons, used to generate static SEO-friendly
 * `/compare/[pair]` (India) and `/[country]/compare/[pair]` (others) routes — each
 * country only lists pairs drawn from its own fuel-types list. */
export const COMPARE_PAIRS_BY_COUNTRY: Record<CountryCode, ComparePair[]> = {
  IN: [
    { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
    { slug: "petrol-vs-cng", fuels: ["petrol", "cng"] },
    { slug: "petrol-vs-e20", fuels: ["petrol", "e20"] },
    { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
    { slug: "petrol-vs-lpg", fuels: ["petrol", "lpg"] },
    { slug: "diesel-vs-cng", fuels: ["diesel", "cng"] },
  ],
  US: [
    { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
    { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
    { slug: "diesel-vs-ev", fuels: ["diesel", "ev"] },
  ],
  GB: [
    { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
    { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
    { slug: "petrol-vs-lpg", fuels: ["petrol", "lpg"] },
    { slug: "diesel-vs-ev", fuels: ["diesel", "ev"] },
  ],
  CA: [
    { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
    { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
    { slug: "diesel-vs-ev", fuels: ["diesel", "ev"] },
  ],
  AU: [
    { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
    { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
    { slug: "petrol-vs-lpg", fuels: ["petrol", "lpg"] },
    { slug: "diesel-vs-ev", fuels: ["diesel", "ev"] },
  ],
};
