import type { CountryCode } from "../lib/countries";

export interface RepresentativeVehicle {
  name: string;
  fuelType: string;
  mileage: number;
}

/** A handful of real, popular vehicles per country with their real mileage figures
 * (pulled from this project's own vehicles/*.json — EPA-based for the US, ARAI for
 * India), used to build a genuine cost table rather than a hypothetical example. */
export const REPRESENTATIVE_VEHICLES: Record<Exclude<CountryCode, "IN">, RepresentativeVehicle[]> = {
  US: [
    { name: "Toyota Camry LE", fuelType: "petrol", mileage: 51 },
    { name: "Honda CR-V", fuelType: "petrol", mileage: 30 },
    { name: "Ford F-150 EcoBoost", fuelType: "petrol", mileage: 20 },
    { name: "Chevrolet Silverado Duramax", fuelType: "diesel", mileage: 26 },
    { name: "Tesla Model 3 Long Range", fuelType: "ev", mileage: 25.53 },
  ],
  GB: [
    { name: "Volkswagen Golf", fuelType: "petrol", mileage: 16.1 },
    { name: "Toyota Corolla", fuelType: "petrol", mileage: 20.2 },
    { name: "Nissan Qashqai", fuelType: "petrol", mileage: 15.2 },
    { name: "Tesla Model 3", fuelType: "ev", mileage: 15.2 },
    { name: "Nissan Leaf", fuelType: "ev", mileage: 15.9 },
  ],
  CA: [
    { name: "Toyota Corolla", fuelType: "petrol", mileage: 14.5 },
    { name: "Honda CR-V", fuelType: "petrol", mileage: 12.8 },
    { name: "Honda Civic", fuelType: "petrol", mileage: 15 },
    { name: "Tesla Model 3", fuelType: "ev", mileage: 15.5 },
    { name: "Nissan Leaf", fuelType: "ev", mileage: 16.4 },
  ],
  AU: [
    { name: "Toyota Corolla", fuelType: "petrol", mileage: 17.5 },
    { name: "Honda CR-V", fuelType: "petrol", mileage: 14.2 },
    { name: "Toyota HiLux", fuelType: "diesel", mileage: 13.5 },
    { name: "Ford Ranger", fuelType: "diesel", mileage: 13 },
    { name: "Tesla Model 3", fuelType: "ev", mileage: 14.9 },
  ],
};
