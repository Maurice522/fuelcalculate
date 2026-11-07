import type { CountryCode } from "../lib/countries";
import type { DistanceUnit, MileageUnit, PriceUnit, VolumeUnit } from "../lib/units";

/** The units people in each country actually think in — UK drivers use miles, mpg and
 * pence per litre; Canadians and Australians use L/100km; the US uses mpg and gallons;
 * India uses km/l. The unit pickers on the calculators still let anyone switch. */
export interface CountryUnitDefaults {
  distance: DistanceUnit;
  volume: VolumeUnit;
  mileage: MileageUnit;
  price: PriceUnit;
  /** The unit this site's main trip calculator uses for mileage in this country. */
  tripCalculatorMileage: MileageUnit;
}

export const UNIT_DEFAULTS: Record<CountryCode, CountryUnitDefaults> = {
  IN: { distance: "km", volume: "litre", mileage: "kmpl", price: "perLitre", tripCalculatorMileage: "kmpl" },
  US: { distance: "mi", volume: "usGallon", mileage: "mpgUs", price: "perUsGallon", tripCalculatorMileage: "mpgUs" },
  GB: { distance: "mi", volume: "litre", mileage: "mpgUk", price: "pencePerLitre", tripCalculatorMileage: "kmpl" },
  CA: { distance: "km", volume: "litre", mileage: "l100km", price: "perLitre", tripCalculatorMileage: "kmpl" },
  AU: { distance: "km", volume: "litre", mileage: "l100km", price: "perLitre", tripCalculatorMileage: "kmpl" },
};
