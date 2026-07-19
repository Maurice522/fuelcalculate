import "./searchable-select";
import { tripCost, type FuelId } from "../lib/calculations";
import { resolveMileageForFuel } from "../lib/vehicleMileage";
import {
  getSiteData,
  fetchCityPrices,
  formatInr,
  type CityRecord,
  type VehicleRecord,
  type FuelTypeRecord,
} from "./clientSiteData";

const FIELD_NAMES = ["city", "fuel", "vehicle", "mileage", "price", "distance", "roundtrip"] as const;
type FieldName = (typeof FIELD_NAMES)[number];

const STORAGE_KEY = "fuelcalculate:lastInputs";

/**
 * Progressive enhancement: the surrounding <form method="get"> already works without
 * JS (a full-page GET with query params, which the Astro page reads server-side for
 * the first paint). Once this element connects, it takes over live recalculation and
 * keeps the URL/localStorage in sync so results stay shareable.
 */
export class FuelCalculatorElement extends HTMLElement {
  private cities: CityRecord[] = [];
  private vehicles: VehicleRecord[] = [];
  private fuelTypes: FuelTypeRecord[] = [];
  private evDefaultTariff = 7.5;
  private evTariffByState: Record<string, number> = {};

  connectedCallback(): void {
    const data = getSiteData();
    this.cities = data.cities;
    this.vehicles = data.vehicles;
    this.fuelTypes = data.fuelTypes;
    this.evDefaultTariff = data.evTariffs.defaultTariffPerKwh;
    this.evTariffByState = data.evTariffs.tariffByState;

    this.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());

    this.populateVehicleOptions();
    this.restoreState();
    this.refreshSearchableSelects();
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
    if (name === "vehicle") {
      this.applyVehicleMileage();
    }
    if (name === "city") {
      await this.applyAutoPrice();
    }
    this.recalculate();
    this.persistState();
  }

  /**
   * Every vehicle is listed regardless of the currently selected fuel — a car's real
   * mileage was measured on one fuel, but riders switching to E20/XP95/XP100 (or just
   * comparing) still need to pick their actual car. `applyVehicleMileage` fills in the
   * best honest number for whatever fuel is currently selected.
   */
  private populateVehicleOptions(): void {
    const select = this.field<HTMLSelectElement>("vehicle");
    if (!select) return;
    const previous = select.value;

    select.innerHTML = "";
    const manualOption = document.createElement("option");
    manualOption.value = "";
    manualOption.textContent = "Manual entry";
    select.appendChild(manualOption);

    const sorted = [...this.vehicles].sort((a, b) => a.name.localeCompare(b.name));
    for (const vehicle of sorted) {
      const fuelLabel = this.fuelTypes.find((f) => f.id === vehicle.fuelType)?.shortLabel ?? vehicle.fuelType;
      const option = document.createElement("option");
      option.value = vehicle.slug;
      option.textContent = `${vehicle.name} — ${vehicle.type === "bike" ? "bike" : "car"} · ${fuelLabel}`;
      select.appendChild(option);
    }

    select.value = this.vehicles.some((v) => v.slug === previous) ? previous : "";
    this.refreshSearchableSelects();
  }

  private applyVehicleMileage(): void {
    const vehicleSlug = this.field<HTMLSelectElement>("vehicle")?.value;
    const mileageField = this.field("mileage");
    const note = this.out("mileage-note");
    if (!mileageField) return;
    if (!vehicleSlug) {
      if (note) note.textContent = "";
      return; // manual entry — leave whatever the user has typed
    }

    const vehicle = this.vehicles.find((v) => v.slug === vehicleSlug);
    if (!vehicle) return;

    const resolution = resolveMileageForFuel(this.vehicles, vehicle, this.currentFuel());
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

  private refreshSearchableSelects(): void {
    this.querySelectorAll("searchable-select").forEach((el) => {
      const withRefresh = el as HTMLElement & { refresh?: () => void };
      withRefresh.refresh?.();
    });
  }

  private cityState(citySlug: string): string | undefined {
    return this.cities.find((c) => c.slug === citySlug)?.state;
  }

  private async applyAutoPrice(): Promise<void> {
    const citySlug = this.field<HTMLSelectElement>("city")?.value;
    const priceField = this.field("price");
    const sourceBadge = this.out("price-source");
    if (!priceField) return;

    if (!citySlug) {
      if (sourceBadge) sourceBadge.textContent = "Custom price";
      return;
    }

    const fuel = this.currentFuel();

    if (fuel === "ev") {
      const state = this.cityState(citySlug);
      const tariff = (state && this.evTariffByState[state]) ?? this.evDefaultTariff;
      priceField.value = String(tariff);
      if (sourceBadge) sourceBadge.textContent = `Indicative tariff for ${state ?? "India"}`;
      return;
    }

    try {
      const result = await fetchCityPrices(citySlug);
      const price = result.prices[fuel];
      if (typeof price === "number") {
        priceField.value = String(price);
        if (sourceBadge) {
          const label = result.source === "crawler" ? "auto-updated" : result.source;
          sourceBadge.textContent = `${label} price for ${this.cities.find((c) => c.slug === citySlug)?.name ?? citySlug}`;
        }
      } else if (sourceBadge) {
        sourceBadge.textContent = `No ${fuel} price on file for this city — enter manually`;
      }
    } catch {
      if (sourceBadge) sourceBadge.textContent = "Couldn't fetch city price — enter manually";
    }
  }

  private updateUnitLabels(): void {
    const fuel = this.currentFuel();
    const meta = this.fuelTypes.find((f) => f.id === fuel);
    const mileageLabel = this.out("mileage-unit-label");
    const priceLabel = this.out("price-unit-label");
    if (mileageLabel) mileageLabel.textContent = meta?.unitLabel ?? "km/l";
    if (priceLabel) {
      priceLabel.textContent = fuel === "ev" ? "₹ per kWh" : `₹ per ${meta?.unit ?? "litre"}`;
    }
  }

  private recalculate(): void {
    const fuel = this.currentFuel();
    const price = Number(this.field("price")?.value ?? 0);
    const mileage = Number(this.field("mileage")?.value ?? 0);
    const distance = Number(this.field("distance")?.value ?? 0);
    const roundTrip = Boolean((this.field("roundtrip") as HTMLInputElement | null)?.checked);

    const result = tripCost({
      fuelId: fuel,
      pricePerUnit: price,
      mileage,
      distanceOneWay: distance,
      roundTrip,
    });

    const costOut = this.out("cost");
    const perKmOut = this.out("cost-per-km");
    const distanceOut = this.out("distance-used");

    if (costOut) costOut.textContent = formatInr(result.cost);
    if (perKmOut) perKmOut.textContent = `${formatInr(result.costPerKm)} / km`;
    if (distanceOut) distanceOut.textContent = `${roundTrip ? distance * 2 : distance} km`;
  }

  private currentState(): Record<string, string> {
    const state: Record<string, string> = {};
    for (const name of FIELD_NAMES) {
      const el = this.field(name);
      if (!el) continue;
      state[name] = name === "roundtrip" ? String((el as HTMLInputElement).checked) : el.value;
    }
    return state;
  }

  private persistState(): void {
    const state = this.currentState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(state)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url);
  }

  private restoreState(): void {
    const url = new URL(window.location.href);
    const hasQueryParams = FIELD_NAMES.some((name) => url.searchParams.has(name));

    let source: Record<string, string> | null = null;
    if (hasQueryParams) {
      source = Object.fromEntries(url.searchParams.entries());
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          source = JSON.parse(stored);
        } catch {
          source = null;
        }
      }
    }
    if (!source) return;

    for (const name of FIELD_NAMES) {
      const el = this.field(name);
      const value = source[name];
      if (!el || value === undefined) continue;
      if (name === "roundtrip") {
        (el as HTMLInputElement).checked = value === "true" || value === "1";
      } else {
        el.value = value;
      }
    }
  }
}

customElements.define("fuel-calculator", FuelCalculatorElement);
