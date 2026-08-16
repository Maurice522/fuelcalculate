import "./searchable-select";
import { tripCost, type FuelId } from "../lib/calculations";
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

const SIDES = ["a", "b"] as const;
type Side = (typeof SIDES)[number];

const SHARED_FIELD_NAMES = ["city", "distance", "roundtrip"] as const;
const SIDE_FIELD_NAMES = ["fuel", "price", "vehicle", "mileage"] as const;
const STORAGE_KEY_PREFIX = "fuelcalculate:comparisonInputs";

/** Two independent fuel/vehicle picks, compared for the same shared city/distance/round-trip. */
export class FuelComparisonElement extends HTMLElement {
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

    this.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());

    for (const side of SIDES) {
      this.populateVehicleOptions(side);
    }

    this.restoreState();
    this.refreshSearchableSelects();

    for (const side of SIDES) {
      this.updateUnitLabels(side);
    }

    this.field("distance")?.addEventListener("input", () => this.recalculate());
    this.field("roundtrip")?.addEventListener("change", () => this.recalculate());
    this.field<HTMLSelectElement>("city")?.addEventListener("change", () => {
      void this.applyAutoPrices().then(() => this.recalculate());
    });

    for (const side of SIDES) {
      const container = this.sideEl(side);
      if (!container) continue;
      container.querySelector('[data-field="fuel"]')?.addEventListener("change", () => {
        this.updateUnitLabels(side);
        this.applyVehicleMileage(side);
        void this.applyAutoPrice(side).then(() => this.recalculate());
      });
      container.querySelector('[data-field="vehicle"]')?.addEventListener("change", () => {
        this.applyVehicleMileage(side);
        this.recalculate();
      });
      container.querySelector('[data-field="price"]')?.addEventListener("input", () => this.recalculate());
      container.querySelector('[data-field="mileage"]')?.addEventListener("input", () => this.recalculate());
    }

    void this.applyAutoPrices().then(() => this.recalculate());
  }

  private refreshSearchableSelects(): void {
    this.querySelectorAll("searchable-select").forEach((el) => {
      const withRefresh = el as HTMLElement & { refresh?: () => void };
      withRefresh.refresh?.();
    });
  }

  private sideEl(side: Side): HTMLElement | null {
    return this.querySelector(`[data-side="${side}"]`);
  }

  private resultEl(side: Side): HTMLElement | null {
    return this.querySelector(`[data-result="${side}"]`);
  }

  /** city/distance/roundtrip are the only fields shared across both sides — each appears
   * exactly once in the DOM, unlike fuel/price/vehicle/mileage which exist per side. */
  private field<T extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(
    name: string,
  ): T | null {
    return this.querySelector(`[data-field="${name}"]`) as T | null;
  }

  private sideField<T extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(
    side: Side,
    name: string,
  ): T | null {
    return this.sideEl(side)?.querySelector(`[data-field="${name}"]`) as T | null;
  }

  private sideOut(side: Side, name: string): HTMLElement | null {
    return this.sideEl(side)?.querySelector(`[data-out="${name}"]`) ?? null;
  }

  private resultOut(side: Side, name: string): HTMLElement | null {
    return this.resultEl(side)?.querySelector(`[data-out="${name}"]`) ?? null;
  }

  private sideFuel(side: Side): FuelId {
    return (this.sideField<HTMLSelectElement>(side, "fuel")?.value as FuelId) ?? "petrol";
  }

  private populateVehicleOptions(side: Side): void {
    const select = this.sideField<HTMLSelectElement>(side, "vehicle");
    if (!select) return;
    // Every vehicle is listed regardless of this side's fuel — applyVehicleMileage()
    // fills in the best honest mileage estimate for whichever one is picked.
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

  private applyVehicleMileage(side: Side): void {
    const vehicleSlug = this.sideField<HTMLSelectElement>(side, "vehicle")?.value;
    const mileageField = this.sideField(side, "mileage");
    const note = this.sideOut(side, "mileage-note");
    if (!mileageField) return;
    if (!vehicleSlug) {
      if (note) note.textContent = "";
      return;
    }

    const vehicle = this.vehicles.find((v) => v.slug === vehicleSlug);
    if (!vehicle) return;

    const resolution = resolveMileageForFuel(this.vehicles, vehicle, this.sideFuel(side), this.country.code);
    if (!resolution) {
      const fuelLabel = this.fuelTypes.find((f) => f.id === this.sideFuel(side))?.label ?? this.sideFuel(side);
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

  private async applyAutoPrice(side: Side): Promise<void> {
    const citySlug = this.field<HTMLSelectElement>("city")?.value;
    const priceField = this.sideField(side, "price");
    if (!priceField || !citySlug) return;

    const fuel = this.sideFuel(side);
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
      // leave whatever price is already there
    }
  }

  private async applyAutoPrices(): Promise<void> {
    await Promise.all(SIDES.map((side) => this.applyAutoPrice(side)));
  }

  private updateUnitLabels(side: Side): void {
    const fuel = this.sideFuel(side);
    const meta = this.fuelTypes.find((f) => f.id === fuel);
    const mileageLabel = this.sideOut(side, "mileage-unit-label");
    const priceLabel = this.sideOut(side, "price-unit-label");
    const distanceUnit = this.country.distanceUnit;
    const volumeUnit = this.country.volumeUnit;
    if (mileageLabel) mileageLabel.textContent = meta?.unitLabel ?? `${distanceUnit}/${volumeUnit === "gallon" ? "gal" : "l"}`;
    if (priceLabel) {
      const symbol = this.country.currency.symbol;
      priceLabel.textContent = fuel === "ev" ? `${symbol} per kWh` : `${symbol} per ${meta?.unit ?? volumeUnit}`;
    }
  }

  /** Tints a side's cost figures green (cheaper), red (pricier), or neutral (tie/incomplete). */
  private setResultTone(side: Side, tone: "good" | "bad" | "neutral"): void {
    const baseClasses: Record<"cost" | "cost-per-km", string> = { cost: "text-ink", "cost-per-km": "text-body" };
    for (const name of ["cost", "cost-per-km"] as const) {
      const el = this.resultOut(side, name);
      el?.classList.remove("text-good", "text-error", baseClasses[name]);
      el?.classList.add(tone === "good" ? "text-good" : tone === "bad" ? "text-error" : baseClasses[name]);
    }
  }

  private recalculate(): void {
    const distance = Number(this.field("distance")?.value ?? 0);
    const roundTrip = Boolean((this.field("roundtrip") as HTMLInputElement | null)?.checked);

    const results = SIDES.map((side) => {
      const fuel = this.sideFuel(side);
      const price = Number(this.sideField(side, "price")?.value ?? 0);
      const mileage = Number(this.sideField(side, "mileage")?.value ?? 0);
      const result = tripCost({ fuelId: fuel, pricePerUnit: price, mileage, distanceOneWay: distance, roundTrip });

      const label = this.fuelTypes.find((f) => f.id === fuel)?.label ?? fuel;
      const labelOut = this.resultOut(side, "fuel-label");
      const costOut = this.resultOut(side, "cost");
      const perKmOut = this.resultOut(side, "cost-per-km");
      if (labelOut) labelOut.textContent = label;
      if (costOut) costOut.textContent = formatCurrency(result.cost, this.country);
      if (perKmOut) perKmOut.textContent = `${formatCurrency(result.costPerKm, this.country)} / ${this.country.distanceUnit}`;

      return { side, fuel, label, cost: result.cost };
    });

    this.persistState();

    const deltaOut = this.querySelector('[data-out="delta"]');
    if (!deltaOut) return;

    const [a, b] = results;
    if (a.cost === 0 && b.cost === 0) {
      deltaOut.textContent = "Pick your fuels and fill in a price to compare.";
      this.setResultTone("a", "neutral");
      this.setResultTone("b", "neutral");
      return;
    }

    const delta = b.cost - a.cost;
    if (delta === 0 || a.cost === 0 || b.cost === 0) {
      this.setResultTone("a", "neutral");
      this.setResultTone("b", "neutral");
      if (delta === 0) {
        deltaOut.textContent = `${a.label} and ${b.label} cost exactly the same for this trip.`;
        return;
      }
    }

    const cheaper = delta < 0 ? b : a;
    const pricier = delta < 0 ? a : b;
    if (cheaper.cost > 0 && pricier.cost > 0) {
      this.setResultTone(cheaper.side, "good");
      this.setResultTone(pricier.side, "bad");
    }
    const diff = Math.abs(delta);
    const percent = pricier.cost === 0 ? 0 : (diff / pricier.cost) * 100;
    deltaOut.textContent = `${cheaper.label} is ${formatCurrency(diff, this.country)} (${percent.toFixed(1)}%) cheaper than ${pricier.label} for this trip.`;
  }

  private currentState(): Record<string, string> {
    const state: Record<string, string> = {};
    for (const name of SHARED_FIELD_NAMES) {
      const el = this.field(name);
      if (!el) continue;
      state[name] = name === "roundtrip" ? String((el as HTMLInputElement).checked) : el.value;
    }
    for (const side of SIDES) {
      for (const name of SIDE_FIELD_NAMES) {
        const el = this.sideField(side, name);
        if (el) state[`${side}_${name}`] = el.value;
      }
    }
    return state;
  }

  /**
   * Saves every field to localStorage on each recalculation, and mirrors the
   * shared city/distance/roundtrip fields into the URL (same fields the page's
   * server-rendered `initial` prop already reads back on a fresh visit) so a plain
   * reload — whatever triggers it — never wipes out what was entered.
   */
  private storageKey(): string {
    return `${STORAGE_KEY_PREFIX}:${this.country.code}`;
  }

  private persistState(): void {
    const state = this.currentState();
    localStorage.setItem(this.storageKey(), JSON.stringify(state));

    const url = new URL(window.location.href);
    for (const name of SHARED_FIELD_NAMES) {
      const value = state[name];
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    window.history.replaceState(null, "", url);
  }

  private restoreState(): void {
    const stored = localStorage.getItem(this.storageKey());
    let state: Record<string, string> | null = null;
    if (stored) {
      try {
        state = JSON.parse(stored);
      } catch {
        state = null;
      }
    }

    if (state) {
      for (const name of SHARED_FIELD_NAMES) {
        const el = this.field(name);
        const value = state[name];
        if (!el || value === undefined) continue;
        if (name === "roundtrip") (el as HTMLInputElement).checked = value === "true";
        else el.value = value;
      }
      for (const side of SIDES) {
        for (const name of SIDE_FIELD_NAMES) {
          const el = this.sideField(side, name);
          const value = state[`${side}_${name}`];
          if (el && value !== undefined) el.value = value;
        }
      }
    }

    // Explicit query params (e.g. a shared link) take priority over whatever was stored.
    const url = new URL(window.location.href);
    for (const name of SHARED_FIELD_NAMES) {
      if (!url.searchParams.has(name)) continue;
      const el = this.field(name);
      const value = url.searchParams.get(name) ?? "";
      if (!el) continue;
      if (name === "roundtrip") (el as HTMLInputElement).checked = value === "true" || value === "1";
      else el.value = value;
    }
  }
}

customElements.define("fuel-comparison", FuelComparisonElement);
