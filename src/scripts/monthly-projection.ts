import "./searchable-select";
import { projectMonthly, type FuelId } from "../lib/calculations";
import { resolveMileageForFuel } from "../lib/vehicleMileage";
import {
  getSiteData,
  fetchCityPrices,
  formatCurrency,
  type CityRecord,
  type VehicleRecord,
  type FuelTypeRecord,
  type ClientCountryConfig,
} from "./clientSiteData";

const FIELD_NAMES = [
  "fuel",
  "city",
  "price",
  "vehicle",
  "mileage",
  "distance-per-trip",
  "trips-per-day",
  "days-per-month",
  "roundtrip",
] as const;
type FieldName = (typeof FIELD_NAMES)[number];

export class MonthlyProjectionElement extends HTMLElement {
  private country!: ClientCountryConfig;
  private cities: CityRecord[] = [];
  private vehicles: VehicleRecord[] = [];
  private fuelTypes: FuelTypeRecord[] = [];
  private evDefaultTariff = 7.5;
  private evTariffByState: Record<string, number> = {};

  connectedCallback(): void {
    const data = getSiteData();
    this.country = data.country;
    this.cities = data.cities;
    this.vehicles = data.vehicles;
    this.fuelTypes = data.fuelTypes;
    this.evDefaultTariff = data.evTariffs.defaultTariffPerKwh;
    this.evTariffByState = data.evTariffs.tariffByState;

    this.populateVehicleOptions();
    this.updateUnitLabels();

    for (const name of FIELD_NAMES) {
      const el = this.field(name);
      el?.addEventListener("input", () => this.onFieldChange(name));
      el?.addEventListener("change", () => this.onFieldChange(name));
    }

    void this.applyAutoPrice().then(() => this.recalculate());
  }

  private field<T extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(
    name: FieldName,
  ): T | null {
    return this.querySelector(`[data-field="${name}"]`) as T | null;
  }

  private out(name: string): HTMLElement | null {
    return this.querySelector(`[data-out="${name}"]`) as HTMLElement | null;
  }

  private currentFuel(): FuelId {
    return (this.field("fuel")?.value as FuelId) ?? "petrol";
  }

  private async onFieldChange(name: FieldName): Promise<void> {
    if (name === "fuel") {
      this.applyVehicleMileage();
      this.updateUnitLabels();
      await this.applyAutoPrice();
    }
    if (name === "vehicle") this.applyVehicleMileage();
    if (name === "city") await this.applyAutoPrice();
    this.recalculate();
  }

  // Every vehicle is listed regardless of the currently selected fuel — applyVehicleMileage()
  // fills in the best honest estimate for whichever fuel is selected.
  private populateVehicleOptions(): void {
    const select = this.field<HTMLSelectElement>("vehicle");
    if (!select) return;
    select.innerHTML = '<option value="">Manual entry</option>';
    const sorted = [...this.vehicles].sort((a, b) => a.name.localeCompare(b.name));
    for (const vehicle of sorted) {
      const fuelLabel = this.fuelTypes.find((f) => f.id === vehicle.fuelType)?.shortLabel ?? vehicle.fuelType;
      const option = document.createElement("option");
      option.value = vehicle.slug;
      option.textContent = `${vehicle.name} — ${vehicle.type === "bike" ? "bike" : "car"} · ${fuelLabel}`;
      select.appendChild(option);
    }
    (select.closest("searchable-select") as HTMLElement & { refresh?: () => void } | null)?.refresh?.();
  }

  private applyVehicleMileage(): void {
    const vehicleSlug = this.field<HTMLSelectElement>("vehicle")?.value;
    const mileageField = this.field("mileage");
    const note = this.out("mileage-note");
    if (!mileageField) return;
    if (!vehicleSlug) {
      if (note) note.textContent = "";
      return;
    }
    const vehicle = this.vehicles.find((v) => v.slug === vehicleSlug);
    if (!vehicle) return;

    const resolution = resolveMileageForFuel(this.vehicles, vehicle, this.currentFuel(), this.country.code);
    if (!resolution) {
      const fuelLabel = this.fuelTypes.find((f) => f.id === this.currentFuel())?.label ?? this.currentFuel();
      if (note) note.textContent = `No ${fuelLabel} mileage on file for ${vehicle.name} — enter it manually.`;
      return;
    }

    mileageField.value = String(resolution.mileage);
    if (note) {
      note.textContent = resolution.estimated
        ? `Estimated for this fuel from ${vehicle.name}'s on-file mileage.`
        : "";
    }
  }

  private cityState(citySlug: string): string | undefined {
    return this.cities.find((c) => c.slug === citySlug)?.state;
  }

  private async applyAutoPrice(): Promise<void> {
    const citySlug = this.field<HTMLSelectElement>("city")?.value;
    const priceField = this.field("price");
    if (!priceField || !citySlug) return;

    const fuel = this.currentFuel();
    if (fuel === "ev") {
      const state = this.cityState(citySlug);
      priceField.value = String((state && this.evTariffByState[state]) ?? this.evDefaultTariff);
      return;
    }

    try {
      const result = await fetchCityPrices(citySlug);
      const price = result.prices[fuel];
      if (typeof price === "number") priceField.value = String(price);
    } catch {
      // leave whatever price the user already has
    }
  }

  private updateUnitLabels(): void {
    const fuel = this.currentFuel();
    const meta = this.fuelTypes.find((f) => f.id === fuel);
    const mileageLabel = this.out("mileage-unit-label");
    const priceLabel = this.out("price-unit-label");
    const distanceUnit = this.country.distanceUnit;
    const volumeUnit = this.country.volumeUnit;
    if (mileageLabel) mileageLabel.textContent = meta?.unitLabel ?? `${distanceUnit}/${volumeUnit === "gallon" ? "gal" : "l"}`;
    if (priceLabel) {
      const symbol = this.country.currency.symbol;
      priceLabel.textContent = fuel === "ev" ? `${symbol} per kWh` : `${symbol} per ${meta?.unit ?? volumeUnit}`;
    }
  }

  private recalculate(): void {
    const fuel = this.currentFuel();
    const price = Number(this.field("price")?.value ?? 0);
    const mileage = Number(this.field("mileage")?.value ?? 0);
    const distancePerTrip = Number(this.field("distance-per-trip")?.value ?? 0);
    const tripsPerDay = Number(this.field("trips-per-day")?.value ?? 0);
    const daysPerMonth = Number(this.field("days-per-month")?.value ?? 30);
    const roundTrip = Boolean((this.field("roundtrip") as HTMLInputElement | null)?.checked);

    const perKm =
      fuel === "ev" ? (price * mileage) / 100 : mileage > 0 ? price / mileage : 0;

    const result = projectMonthly({
      costPerKm: perKm,
      distancePerTrip,
      tripsPerDay,
      roundTrip,
      daysPerMonth,
    });

    const distanceUnit = this.country.distanceUnit;
    this.setText("daily-cost", formatCurrency(result.dailyCost, this.country));
    this.setText("daily-distance", `${result.dailyDistance} ${distanceUnit}`);
    this.setText("monthly-cost", formatCurrency(result.monthlyCost, this.country));
    this.setText("monthly-distance", `${result.monthlyDistance} ${distanceUnit}`);
    this.setText("yearly-cost", formatCurrency(result.yearlyCost, this.country));
  }

  private setText(name: string, value: string): void {
    const el = this.out(name);
    if (el) el.textContent = value;
  }
}

customElements.define("monthly-projection", MonthlyProjectionElement);
