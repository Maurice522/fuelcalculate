/**
 * Unit conversions for the mileage and cost-per-distance calculators. Everything is
 * normalised to kilometres, litres and km/l internally, then converted back out, so any
 * unit pair (mpg UK + pence per litre, L/100km + per US gallon, ...) works.
 */

export const KM_PER_MILE = 1.609344;
export const LITRES_PER_US_GALLON = 3.785411784;
export const LITRES_PER_UK_GALLON = 4.54609;

export type DistanceUnit = "km" | "mi";
export type VolumeUnit = "litre" | "usGallon" | "ukGallon";
export type MileageUnit = "kmpl" | "l100km" | "mpgUs" | "mpgUk";
export type PriceUnit = "perLitre" | "perUsGallon" | "perUkGallon" | "pencePerLitre";

export const DISTANCE_LABELS: Record<DistanceUnit, string> = { km: "kilometres", mi: "miles" };
export const VOLUME_LABELS: Record<VolumeUnit, string> = {
  litre: "litres",
  usGallon: "US gallons",
  ukGallon: "UK gallons",
};
export const MILEAGE_LABELS: Record<MileageUnit, string> = {
  kmpl: "km/l",
  l100km: "L/100km",
  mpgUs: "mpg (US)",
  mpgUk: "mpg (UK)",
};
export const PRICE_LABELS: Record<PriceUnit, string> = {
  perLitre: "per litre",
  perUsGallon: "per US gallon",
  perUkGallon: "per UK gallon",
  pencePerLitre: "pence per litre",
};

export const toKm = (v: number, u: DistanceUnit): number => (u === "mi" ? v * KM_PER_MILE : v);
export const fromKm = (km: number, u: DistanceUnit): number => (u === "mi" ? km / KM_PER_MILE : km);

export const toLitres = (v: number, u: VolumeUnit): number =>
  u === "usGallon" ? v * LITRES_PER_US_GALLON : u === "ukGallon" ? v * LITRES_PER_UK_GALLON : v;
export const fromLitres = (l: number, u: VolumeUnit): number =>
  u === "usGallon" ? l / LITRES_PER_US_GALLON : u === "ukGallon" ? l / LITRES_PER_UK_GALLON : l;

export function toKmPerLitre(v: number, u: MileageUnit): number {
  if (v <= 0) return 0;
  switch (u) {
    case "kmpl":
      return v;
    case "l100km":
      return 100 / v;
    case "mpgUs":
      return (v * KM_PER_MILE) / LITRES_PER_US_GALLON;
    case "mpgUk":
      return (v * KM_PER_MILE) / LITRES_PER_UK_GALLON;
  }
}

export function fromKmPerLitre(kmpl: number, u: MileageUnit): number {
  if (kmpl <= 0) return 0;
  switch (u) {
    case "kmpl":
      return kmpl;
    case "l100km":
      return 100 / kmpl;
    case "mpgUs":
      return (kmpl * LITRES_PER_US_GALLON) / KM_PER_MILE;
    case "mpgUk":
      return (kmpl * LITRES_PER_UK_GALLON) / KM_PER_MILE;
  }
}

export const toPricePerLitre = (v: number, u: PriceUnit): number =>
  u === "perUsGallon" ? v / LITRES_PER_US_GALLON : u === "perUkGallon" ? v / LITRES_PER_UK_GALLON : u === "pencePerLitre" ? v / 100 : v;
export const fromPricePerLitre = (p: number, u: PriceUnit): number =>
  u === "perUsGallon" ? p * LITRES_PER_US_GALLON : u === "perUkGallon" ? p * LITRES_PER_UK_GALLON : u === "pencePerLitre" ? p * 100 : p;

export interface MileageFromTrip {
  kmPerLitre: number;
  litresPer100Km: number;
  mpgUs: number;
  mpgUk: number;
}

/** Mileage from a measured trip: distance driven and the fuel it took. */
export function mileageFromTrip(
  distance: number,
  distanceUnit: DistanceUnit,
  fuel: number,
  fuelUnit: VolumeUnit,
): MileageFromTrip | null {
  const km = toKm(distance, distanceUnit);
  const litres = toLitres(fuel, fuelUnit);
  if (km <= 0 || litres <= 0) return null;
  const kmPerLitre = km / litres;
  return {
    kmPerLitre,
    litresPer100Km: 100 / kmPerLitre,
    mpgUs: fromKmPerLitre(kmPerLitre, "mpgUs"),
    mpgUk: fromKmPerLitre(kmPerLitre, "mpgUk"),
  };
}

export interface CostPerDistanceInput {
  mileage: number;
  mileageUnit: MileageUnit;
  price: number;
  priceUnit: PriceUnit;
  distance: number;
  distanceUnit: DistanceUnit;
}

export interface CostPerDistanceResult {
  ok: boolean;
  perKm: number;
  perMile: number;
  journeyCost: number;
  litres: number;
  usGallons: number;
  ukGallons: number;
}

export function costPerDistance(input: CostPerDistanceInput): CostPerDistanceResult {
  const kmpl = toKmPerLitre(input.mileage, input.mileageUnit);
  const pricePerLitre = toPricePerLitre(input.price, input.priceUnit);
  const journeyKm = toKm(input.distance, input.distanceUnit);
  const perKm = kmpl > 0 ? pricePerLitre / kmpl : 0;
  const litres = kmpl > 0 ? journeyKm / kmpl : 0;
  return {
    ok: kmpl > 0 && pricePerLitre > 0,
    perKm,
    perMile: perKm * KM_PER_MILE,
    journeyCost: perKm * journeyKm,
    litres,
    usGallons: litres / LITRES_PER_US_GALLON,
    ukGallons: litres / LITRES_PER_UK_GALLON,
  };
}

/** Rounds for display in an input field without long float tails. */
export function tidy(n: number): number {
  return Math.round(n * 100) / 100;
}
