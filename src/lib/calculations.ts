/**
 * A fuel type id, scoped per-country (see `src/lib/countries.ts`) — e.g. India has
 * petrol/xp95/xp100/diesel/e20/cng/lpg/ev, the US has petrol/diesel/ev. The one id every
 * country shares is "ev", since `costPerKm` special-cases it below.
 */
export type FuelId = string;

export interface TripInput {
  fuelId: FuelId;
  /** currency per litre/gallon/kg for ICE & gas fuels; currency per kWh (electricity tariff) for EV. */
  pricePerUnit: number;
  /** distance-unit per litre/gallon/kg for ICE & gas fuels; kWh per 100 distance-units (efficiency) for EV. */
  mileage: number;
  distanceOneWay: number;
  roundTrip: boolean;
}

export interface FuelCost {
  fuelId: FuelId;
  costPerKm: number;
  cost: number;
}

export interface ComparisonResult extends FuelCost {
  deltaVsBaseline: number;
  percentDiff: number;
}

export interface MonthlyProjectionInput {
  costPerKm: number;
  distancePerTrip: number;
  tripsPerDay: number;
  roundTrip: boolean;
  /** Defaults to 30. Editable so a workday-only commuter can set e.g. 22-26. */
  daysPerMonth?: number;
}

export interface MonthlyProjectionResult {
  dailyDistance: number;
  dailyCost: number;
  monthlyDistance: number;
  monthlyCost: number;
  yearlyCost: number;
}

export function effectiveDistance(distanceOneWay: number, roundTrip: boolean): number {
  return roundTrip ? distanceOneWay * 2 : distanceOneWay;
}

/**
 * EV mileage is expressed as kWh per 100 distance-units (kWh/100km or kWh/100mi,
 * depending on the country) rather than distance-units/kWh, to avoid an inverted-unit
 * mistake when reusing the ICE cost formula.
 */
export function costPerKm(fuelId: FuelId, pricePerUnit: number, mileage: number): number {
  if (mileage <= 0) return 0;
  if (fuelId === "ev") {
    return (pricePerUnit * mileage) / 100;
  }
  return pricePerUnit / mileage;
}

export function tripCost(input: TripInput): FuelCost {
  const perKm = costPerKm(input.fuelId, input.pricePerUnit, input.mileage);
  const distance = effectiveDistance(input.distanceOneWay, input.roundTrip);
  return { fuelId: input.fuelId, costPerKm: perKm, cost: perKm * distance };
}

/**
 * Compares a set of fuels for the same trip distance against one baseline fuel.
 * Negative delta/percentDiff means cheaper than the baseline.
 */
export function compareFuels(
  entries: TripInput[],
  baselineFuelId: FuelId,
): ComparisonResult[] {
  const costs = entries.map(tripCost);
  const baseline = costs.find((c) => c.fuelId === baselineFuelId) ?? costs[0];

  return costs.map((c) => {
    const deltaVsBaseline = c.cost - baseline.cost;
    const percentDiff = baseline.cost === 0 ? 0 : (deltaVsBaseline / baseline.cost) * 100;
    return { ...c, deltaVsBaseline, percentDiff };
  });
}

export function projectMonthly(input: MonthlyProjectionInput): MonthlyProjectionResult {
  const daysPerMonth = input.daysPerMonth ?? 30;
  const dailyDistance =
    input.distancePerTrip * input.tripsPerDay * (input.roundTrip ? 2 : 1);
  const dailyCost = input.costPerKm * dailyDistance;
  const monthlyDistance = dailyDistance * daysPerMonth;
  const monthlyCost = dailyCost * daysPerMonth;
  // Derived from monthlyCost (not a separate ×365 daily calc) so the yearly figure
  // always stays internally consistent with whatever daysPerMonth was chosen.
  const yearlyCost = monthlyCost * 12;

  return { dailyDistance, dailyCost, monthlyDistance, monthlyCost, yearlyCost };
}
