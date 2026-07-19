export interface ComparePair {
  slug: string;
  fuels: [string, string];
}

export const COMPARE_PAIRS: ComparePair[] = [
  { slug: "petrol-vs-diesel", fuels: ["petrol", "diesel"] },
  { slug: "petrol-vs-cng", fuels: ["petrol", "cng"] },
  { slug: "petrol-vs-e20", fuels: ["petrol", "e20"] },
  { slug: "petrol-vs-ev", fuels: ["petrol", "ev"] },
  { slug: "petrol-vs-lpg", fuels: ["petrol", "lpg"] },
  { slug: "diesel-vs-cng", fuels: ["diesel", "cng"] },
];
