import { costPerKm } from "./calculations";

export interface EvSavingsInput {
  /** Distance driven per year, in the country's distance unit. */
  annualDistance: number;
  gasPrice: number;
  /** Distance units per volume unit for the combustion car. */
  gasMileage: number;
  /** Electricity price per kWh. */
  tariff: number;
  /** kWh per 100 distance units for the EV. */
  evEfficiency: number;
  /** Extra up-front price of the EV over the combustion car (0 if unknown). */
  premium: number;
}

export interface EvSavingsResult {
  ok: boolean;
  gasPerDistance: number;
  evPerDistance: number;
  annualGas: number;
  annualEv: number;
  /** Positive = the EV is cheaper to run. */
  annualSaving: number;
  monthlySaving: number;
  fiveYearSaving: number;
  /** null unless a premium was entered and the EV actually saves money. */
  breakEvenYears: number | null;
  breakEvenDistance: number | null;
}

/** Fuel/electricity running cost only — see the page copy for everything this leaves out. */
export function evSavings(input: EvSavingsInput): EvSavingsResult {
  const gasPerDistance = costPerKm("petrol", input.gasPrice, input.gasMileage);
  const evPerDistance = costPerKm("ev", input.tariff, input.evEfficiency);
  const annualGas = gasPerDistance * input.annualDistance;
  const annualEv = evPerDistance * input.annualDistance;
  const annualSaving = annualGas - annualEv;
  const perDistanceSaving = gasPerDistance - evPerDistance;
  const canBreakEven = input.premium > 0 && annualSaving > 0 && perDistanceSaving > 0;
  return {
    ok: gasPerDistance > 0 && evPerDistance > 0 && input.annualDistance > 0,
    gasPerDistance,
    evPerDistance,
    annualGas,
    annualEv,
    annualSaving,
    monthlySaving: annualSaving / 12,
    fiveYearSaving: annualSaving * 5,
    breakEvenYears: canBreakEven ? input.premium / annualSaving : null,
    breakEvenDistance: canBreakEven ? input.premium / perDistanceSaving : null,
  };
}
