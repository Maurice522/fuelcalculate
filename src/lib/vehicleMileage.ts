import type { FuelId } from "./calculations";

interface VehicleLike {
  name: string;
  fuelType: string;
  mileage: number;
}

/**
 * Petrol, XP95, XP100 and E20 all run in the same unmodified petrol engine — only the
 * blend/octane changes — so mileage can be reasonably estimated across these from
 * whichever one a vehicle's spec sheet actually lists. Diesel/CNG/LPG/EV need a
 * different engine or drivetrain entirely, so we never extrapolate into or out of them;
 * a vehicle only gets a value there from an exact on-file match.
 */
const GASOLINE_FUELS: readonly FuelId[] = ["petrol", "xp95", "xp100", "e20"];

// Approximate real-world efficiency vs plain petrol. E20's ~6% drop is the commonly
// cited ARAI/SIAM figure (ethanol's lower calorific value); XP95/XP100's gain is a
// widely-quoted rough estimate from higher-octane combustion. Always user-overridable.
const GASOLINE_FUEL_FACTOR: Partial<Record<FuelId, number>> = {
  petrol: 1,
  xp95: 1.03,
  xp100: 1.05,
  e20: 0.94,
};

function isGasoline(fuel: string): fuel is FuelId {
  return (GASOLINE_FUELS as readonly string[]).includes(fuel);
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
 * on-file data was recorded for a different fuel. Returns null when no honest estimate
 * is possible (e.g. asking for CNG mileage on a vehicle only ever tested on petrol) —
 * callers should fall back to manual entry in that case rather than guessing.
 */
export function resolveMileageForFuel(
  vehicles: VehicleLike[],
  vehicle: VehicleLike,
  targetFuel: FuelId,
): MileageResolution | null {
  if (vehicle.fuelType === targetFuel) {
    return { mileage: vehicle.mileage, estimated: false };
  }

  if (!isGasoline(targetFuel)) return null;

  const source = isGasoline(vehicle.fuelType)
    ? vehicle
    : vehicles.find((v) => baseName(v.name) === baseName(vehicle.name) && isGasoline(v.fuelType));
  if (!source) return null;

  const sourceFactor = GASOLINE_FUEL_FACTOR[source.fuelType as FuelId] ?? 1;
  const targetFactor = GASOLINE_FUEL_FACTOR[targetFuel] ?? 1;
  const petrolEquivalent = source.mileage / sourceFactor;
  const mileage = Math.round(petrolEquivalent * targetFactor * 100) / 100;
  return { mileage, estimated: true };
}
