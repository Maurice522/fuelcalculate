import type { FuelId } from "./calculations";
import type { CountryCode } from "./countries";

interface VehicleLike {
  name: string;
  fuelType: string;
  mileage: number;
}

/**
 * Per-country "same engine, different blend/octane" fuel families — mileage can be
 * reasonably estimated across fuels within a country's own family from whichever one a
 * vehicle's spec sheet actually lists. Diesel/CNG/LPG/EV need a different engine or
 * drivetrain entirely, so we never extrapolate into or out of those; a vehicle only gets
 * a value there from an exact on-file match. Only India currently has more than one
 * grade in its family (petrol/XP95/XP100/E20); the other countries' single-grade
 * families exist so an exact match still short-circuits — they don't estimate anything
 * further, since guessing a cross-grade factor without real data isn't worth doing.
 */
const GASOLINE_FUEL_FACTOR_BY_COUNTRY: Record<CountryCode, Partial<Record<FuelId, number>>> = {
  // E20's ~6% drop is the commonly cited ARAI/SIAM figure (ethanol's lower calorific
  // value); XP95/XP100's gain is a widely-quoted rough estimate from higher-octane
  // combustion. Always user-overridable.
  IN: { petrol: 1, xp95: 1.03, xp100: 1.05, e20: 0.94 },
  US: { petrol: 1 },
  GB: { petrol: 1 },
  CA: { petrol: 1 },
  AU: { petrol: 1 },
};

function isGasoline(fuel: string, factors: Partial<Record<FuelId, number>>): fuel is FuelId {
  return fuel in factors;
}

function baseName(name: string): string {
  return name.replace(/\s+(CNG|EV)$/i, "").trim();
}

export interface MileageResolution {
  mileage: number;
  /** true when derived from another fuel's figure rather than an exact on-file match. */
  estimated: boolean;
}

/**
 * Resolves a mileage figure for `vehicle` under `targetFuel`, even when the vehicle's
 * on-file data was recorded for a different fuel in the same country's gasoline family.
 * Returns null when no honest estimate is possible (e.g. asking for CNG mileage on a
 * vehicle only ever tested on petrol) — callers should fall back to manual entry in that
 * case rather than guessing.
 */
export function resolveMileageForFuel(
  vehicles: VehicleLike[],
  vehicle: VehicleLike,
  targetFuel: FuelId,
  countryCode: CountryCode,
): MileageResolution | null {
  if (vehicle.fuelType === targetFuel) {
    return { mileage: vehicle.mileage, estimated: false };
  }

  const factors = GASOLINE_FUEL_FACTOR_BY_COUNTRY[countryCode];
  if (!isGasoline(targetFuel, factors)) return null;

  const source = isGasoline(vehicle.fuelType, factors)
    ? vehicle
    : vehicles.find((v) => baseName(v.name) === baseName(vehicle.name) && isGasoline(v.fuelType, factors));
  if (!source) return null;

  const sourceFactor = factors[source.fuelType as FuelId] ?? 1;
  const targetFactor = factors[targetFuel] ?? 1;
  const petrolEquivalent = source.mileage / sourceFactor;
  const mileage = Math.round(petrolEquivalent * targetFactor * 100) / 100;
  return { mileage, estimated: true };
}
