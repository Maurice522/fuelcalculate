/**
 * "Typical vehicle" benchmarks derived from this site's own vehicle database (never a
 * hard-coded guess), used by the verdict line and the EV savings calculator so the
 * comparison is always against something the visitor can inspect: the median of the
 * listed vehicles of that kind. Shared by server (SSR first paint) and browser code,
 * so it must stay free of server-only imports.
 */

export interface BenchmarkVehicle {
  type: string;
  fuelType: string;
  mileage: number;
}

/** Median `mileage` of listed vehicles of `type` running on `fuelType`; null if none. */
export function medianMileage(
  vehicles: readonly BenchmarkVehicle[],
  fuelType: string,
  type: string = "car",
): number | null {
  const values = vehicles
    .filter((v) => v.type === type && v.fuelType === fuelType && v.mileage > 0)
    .map((v) => v.mileage)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  return Math.round(median * 100) / 100;
}

/**
 * Real-world conditions adjustment. Cold weather: fueleconomy.gov / energy.gov report
 * roughly 10-20% lower fuel economy for conventional gasoline cars in cold city driving
 * (we use the 15% midpoint) and about 8% lower EV efficiency before cabin heating (range
 * about 12% lower — we use 12% to stay on the cautious side).
 */
export const CONDITIONS = {
  normal: { label: "Normal conditions", iceFactor: 1, evFactor: 1 },
  cold: { label: "Cold weather (about 15% worse gas mileage, 12% worse EV range)", iceFactor: 0.85, evFactor: 0.88 },
} as const;

export type ConditionId = keyof typeof CONDITIONS;

/** Applies a conditions factor to a mileage figure (EV mileage is kWh per 100 units, so
 * worse efficiency means a *larger* number; ICE mileage is units per volume, so smaller). */
export function adjustMileage(fuelId: string, mileage: number, condition: ConditionId): number {
  const c = CONDITIONS[condition] ?? CONDITIONS.normal;
  return fuelId === "ev" ? mileage / c.evFactor : mileage * c.iceFactor;
}
