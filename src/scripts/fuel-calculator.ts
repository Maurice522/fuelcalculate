import "./searchable-select";
import { tripCost, type FuelId } from "../lib/calculations";
import { resolveMileageForFuel } from "../lib/vehicleMileage";
import { adjustMileage, medianMileage, type ConditionId } from "../lib/benchmarks";
import {
  getSiteData,
  fetchCityPrices,
  formatCurrency,
  type CityRecord,
  type LocalPriceRecord,
  type VehicleRecord,
  type FuelTypeRecord,
  type ClientCountryConfig,
} from "./clientSiteData";

const FIELD_NAMES = [
  "city",
  "fuel",
  "vehicle",
  "mileage",
  "price",
  "distance",
  "roundtrip",
  "tolls",
  "parking",
  "people",
  "conditions",
] as const;
type FieldName = (typeof FIELD_NAMES)[number];

const STORAGE_KEY_PREFIX = "fuelcalculate:lastInputs";
const SAVED_KEY_PREFIX = "fuelcalculate:savedTrips";
const LOCATED_KEY_PREFIX = "fuelcalculate:locatedCity";
const MAX_SAVED_TRIPS = 12;
/** Beyond this the nearest priced city isn't a fair stand-in for the visitor's own area. */
const MAX_LOCATE_KM = 200;

interface SavedTrip {
  id: string;
  name: string;
  state: Record<string, string>;
  savedAt: number;
}

interface Market {
  gasPrice: number | null;
  gasLabel: string;
  evPrice: number;
  evLabel: string;
}

interface Computation {
  ok: boolean;
  fuelId: FuelId;
  fuelCost: number;
  costPerDistance: number;
  distance: number;
  tolls: number;
  parking: number;
  people: number;
  total: number;
  perPerson: number;
  condition: ConditionId;
}

/** localStorage can throw (private windows, blocked site data) — never let it break the calculator. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

const num = (value: string | undefined): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Progressive enhancement: the surrounding <form method="get"> already works without
 * JS (a full-page GET with query params, which the Astro page reads server-side for
 * the first paint). Once this element connects, it takes over live recalculation and
 * keeps the URL/localStorage in sync so results stay shareable.
 */
export class FuelCalculatorElement extends HTMLElement {
  private country!: ClientCountryConfig;
  private cities: CityRecord[] = [];
  private vehicles: VehicleRecord[] = [];
  private fuelTypes: FuelTypeRecord[] = [];
  private localPrices: LocalPriceRecord[] = [];
  private evDefaultTariff = 7.5;
  private evTariffByState: Record<string, number> = {};
  private market!: Market;
  /** True once the visitor has typed their own price — defaults must not overwrite it. */
  private priceDirty = false;
  private lastFuel = "petrol";

  connectedCallback(): void {
    const data = getSiteData();
    this.country = data.country;
    this.cities = data.cities;
    this.vehicles = data.vehicles;
    this.fuelTypes = data.fuelTypes;
    this.localPrices = data.localPrices ?? [];
    this.evDefaultTariff = data.evTariffs.defaultTariffPerKwh;
    this.evTariffByState = data.evTariffs.tariffByState;

    const attrGas = Number(this.getAttribute("data-gas-price"));
    const attrEv = Number(this.getAttribute("data-ev-price"));
    this.market = {
      gasPrice: attrGas > 0 ? attrGas : (data.nationalGas?.price ?? null),
      gasLabel: this.getAttribute("data-gas-label") || data.nationalGas?.label || "National average",
      evPrice: attrEv > 0 ? attrEv : this.evDefaultTariff,
      evLabel: this.getAttribute("data-ev-label") || "Typical residential rate (estimate)",
    };

    this.querySelector("form")?.addEventListener("submit", (e) => e.preventDefault());

    this.populateVehicleOptions();
    const restored = this.restoreState();
    this.refreshSearchableSelects();
    this.updateUnitLabels();
    this.lastFuel = this.currentFuel();

    for (const name of FIELD_NAMES) {
      const el = this.field(name);
      el?.addEventListener("input", () => this.onFieldChange(name, true));
      el?.addEventListener("change", () => this.onFieldChange(name, false));
    }

    this.addEventListener("click", (e) => this.onClick(e));
    this.setupStickyBar();
    this.renderSavedTrips();

    if (restored === "storage") this.showWelcomeBack();

    void this.applyAutoPrice().then(async () => {
      if (!this.priceDirty && this.country.code !== "IN") await this.restoreLocatedCity();
      this.recalculate();
    });
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

  private fuelLabel(id: string): string {
    return this.fuelTypes.find((f) => f.id === id)?.label ?? id;
  }

  private selectedVehicle(): VehicleRecord | undefined {
    const slug = this.field<HTMLSelectElement>("vehicle")?.value;
    return slug ? this.vehicles.find((v) => v.slug === slug) : undefined;
  }

  private async onFieldChange(name: FieldName, isTyping: boolean): Promise<void> {
    // "input" and "change" both fire for text-like fields; only react once per edit.
    if (isTyping && (name === "fuel" || name === "vehicle" || name === "city" || name === "conditions")) return;

    if (name === "price" && isTyping) {
      this.priceDirty = true;
      const badge = this.out("price-source");
      if (badge) badge.textContent = "Custom price";
    }
    if (name === "fuel") {
      await this.handleFuelChanged();
    }
    if (name === "vehicle") {
      await this.handleVehicleChanged();
    }
    if (name === "city") {
      this.priceDirty = false;
      await this.applyAutoPrice();
    }
    this.recalculate();
    this.persistState();
  }

  private async handleFuelChanged(): Promise<void> {
    const fuel = this.currentFuel();
    const priorFuel = this.lastFuel;
    this.lastFuel = fuel;
    this.applyVehicleMileage();
    this.resetMileageForFuelFamily(priorFuel, fuel);
    this.updateUnitLabels();

    const hasDefault = fuel === "ev" || (fuel === "petrol" && this.market.gasPrice !== null);
    if (this.priceDirty && fuel !== priorFuel) {
      if (hasDefault) {
        // A price typed for one fuel is meaningless for another — fall back to the default.
        this.priceDirty = false;
      } else {
        const badge = this.out("price-source");
        if (badge) {
          badge.textContent = `Check this price — it carried over from ${this.fuelLabel(priorFuel)}. Enter your ${this.fuelLabel(fuel)} price.`;
        }
        return;
      }
    }
    await this.applyAutoPrice();
  }

  /** EV efficiency (kWh per 100 distance units) and combustion mileage (distance units per
   * volume) aren't interchangeable, so a figure typed for one is nonsense for the other.
   * With no vehicle picked, swap in the median for the new fuel and say so. */
  private resetMileageForFuelFamily(priorFuel: string, fuel: string): void {
    if ((priorFuel === "ev") === (fuel === "ev") || this.selectedVehicle()) return;
    const median = medianMileage(this.vehicles, fuel === "ev" ? "ev" : "petrol", "car");
    const mileageField = this.field("mileage");
    const note = this.out("mileage-note");
    if (!median || !mileageField) return;
    mileageField.value = String(median);
    if (note) {
      note.textContent = `Set to the median ${fuel === "ev" ? "EV" : "petrol car"} in our list — pick a vehicle or enter your own.`;
    }
  }

  /** Picking a vehicle switches to the fuel it actually runs on, instead of leaving the
   * visitor with a "no mileage on file" dead end (e.g. picking an EV while on Gasoline). */
  private async handleVehicleChanged(): Promise<void> {
    const vehicle = this.selectedVehicle();
    const vehicleNote = this.out("vehicle-note");
    if (vehicleNote) vehicleNote.textContent = "";
    if (vehicle) {
      const current = this.currentFuel();
      const fits = resolveMileageForFuel(this.vehicles, vehicle, current, this.country.code);
      const fuelSelect = this.field<HTMLSelectElement>("fuel");
      if (!fits && fuelSelect && this.fuelTypes.some((f) => f.id === vehicle.fuelType)) {
        fuelSelect.value = vehicle.fuelType;
        this.refreshSearchableSelects();
        if (vehicleNote) vehicleNote.textContent = `Fuel type set to ${this.fuelLabel(vehicle.fuelType)} — that's what ${vehicle.name} runs on.`;
        await this.handleFuelChanged();
        return;
      }
    }
    this.applyVehicleMileage();
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

    const resolution = resolveMileageForFuel(this.vehicles, vehicle, this.currentFuel(), this.country.code);
    if (!resolution) {
      if (note) note.textContent = `No ${this.fuelLabel(this.currentFuel())} mileage on file for ${vehicle.name} — enter it manually.`;
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

  private setPrice(value: number, label: string): void {
    const priceField = this.field("price");
    const badge = this.out("price-source");
    if (priceField) priceField.value = String(value);
    if (badge) badge.textContent = label;
  }

  private async applyAutoPrice(): Promise<void> {
    const citySlug = this.field<HTMLSelectElement>("city")?.value;
    const priceField = this.field("price");
    const sourceBadge = this.out("price-source");
    if (!priceField) return;

    if (!citySlug) {
      this.applyMarketPrice();
      return;
    }

    const fuel = this.currentFuel();

    if (fuel === "ev") {
      const state = this.cityState(citySlug);
      const tariff = (state && this.evTariffByState[state]) ?? this.evDefaultTariff;
      priceField.value = String(tariff);
      if (sourceBadge) sourceBadge.textContent = `Indicative tariff for ${state ?? this.country.name}`;
      return;
    }

    try {
      const result = await fetchCityPrices(citySlug);
      const price = result.prices[fuel];
      if (typeof price === "number") {
        priceField.value = String(price);
        if (sourceBadge) {
          const label = result.source === "crawler" ? "auto-updated" : result.source;
          const age = result.lastUpdated ? ` (${this.describeAge(daysSince(result.lastUpdated))})` : "";
          sourceBadge.textContent = `${label} price for ${this.cities.find((c) => c.slug === citySlug)?.name ?? citySlug}${age}`;
        }
      } else if (sourceBadge) {
        sourceBadge.textContent = `No ${fuel} price on file for this city — enter manually`;
      }
    } catch {
      if (sourceBadge) sourceBadge.textContent = "Couldn't fetch city price — enter manually";
    }
  }

  /** No city picked: use the best known default for the selected fuel — the located
   * city's or national average gas price, or the matching electricity rate for EVs —
   * unless the visitor has typed their own price. */
  private applyMarketPrice(): void {
    const badge = this.out("price-source");
    if (this.priceDirty) {
      if (badge && !badge.textContent?.startsWith("Check this price")) badge.textContent = "Custom price";
      return;
    }
    const fuel = this.currentFuel();
    if (fuel === "ev") {
      this.setPrice(this.market.evPrice, this.sourceCaption(this.market.evLabel));
    } else if (fuel === "petrol" && this.market.gasPrice !== null) {
      this.setPrice(this.market.gasPrice, this.sourceCaption(this.market.gasLabel));
    } else if (badge) {
      badge.textContent = `Custom price — enter your ${this.fuelLabel(fuel)} price`;
    }
  }

  private sourceCaption(label: string): string {
    return this.located ? label : `Example: ${label} — edit for your own price`;
  }

  private located: { name: string } | null = null;

  private describeAge(days: number): string {
    if (days <= 0) return "updated today";
    if (days === 1) return "updated 1 day ago";
    return `updated ${days} days ago`;
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

  // --- Location -----------------------------------------------------------------------

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null;
    if (!target || !this.contains(target)) return;
    const action = target.getAttribute("data-action");
    if (action === "locate") this.locate();
    else if (action === "share") void this.shareLink();
    else if (action === "save") this.openSaveForm();
    else if (action === "save-confirm") this.confirmSave();
    else if (action === "reset") this.resetAll();
    else if (action === "jump-to-result") this.out("result-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (action === "load-trip") this.loadTrip(target.getAttribute("data-id") ?? "");
    else if (action === "delete-trip") this.deleteTrip(target.getAttribute("data-id") ?? "");
  }

  private locate(): void {
    const note = this.out("locate-note");
    if (!note) return;
    if (!navigator.geolocation) {
      note.textContent = "Your browser can't share a location — pick a city or enter your price.";
      return;
    }
    note.textContent = "Finding the nearest city… (your position stays on your device)";
    navigator.geolocation.getCurrentPosition(
      (pos) => void this.onPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        note.textContent =
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked — allow it in your browser, or enter your price manually."
            : "Couldn't work out your location — enter your price manually.";
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  }

  private nearest<T extends { lat: number; lng: number }>(items: T[], lat: number, lng: number): { item: T; km: number } | null {
    let best: { item: T; km: number } | null = null;
    for (const item of items) {
      const km = haversineKm(lat, lng, item.lat, item.lng);
      if (!best || km < best.km) best = { item, km };
    }
    return best;
  }

  private async onPosition(lat: number, lng: number): Promise<void> {
    const note = this.out("locate-note");
    if (!note) return;

    if (this.country.code === "IN") {
      const withCoords = this.cities.filter((c): c is CityRecord & { lat: number; lng: number } => typeof c.lat === "number" && typeof c.lng === "number");
      const hit = this.nearest(withCoords, lat, lng);
      const citySelect = this.field<HTMLSelectElement>("city");
      if (!hit || hit.km > MAX_LOCATE_KM || !citySelect) {
        note.textContent = hit
          ? `Nearest city we track is ${hit.item.name}, ${Math.round(hit.km)} km away — pick a city or enter your price.`
          : "No city data available — enter your price.";
        return;
      }
      citySelect.value = hit.item.slug;
      this.refreshSearchableSelects();
      note.textContent = `Using ${hit.item.name} (${Math.round(hit.km)} km from you).`;
      await this.onFieldChange("city", false);
      return;
    }

    const hit = this.nearest(this.localPrices, lat, lng);
    if (!hit || hit.km > MAX_LOCATE_KM) {
      note.textContent = hit
        ? `We don't have sourced local prices within ${MAX_LOCATE_KM} km of you (nearest: ${hit.item.name}, ${Math.round(hit.km)} km). Your price is unchanged — enter your own for accuracy.`
        : "No local data available — enter your price.";
      return;
    }
    this.useLocalCity(hit.item, Math.round(hit.km));
    safeSet(`${LOCATED_KEY_PREFIX}:${this.country.code}`, hit.item.slug);
    this.priceDirty = false;
    this.applyMarketPrice();
    this.recalculate();
    this.persistState();
  }

  private useLocalCity(city: LocalPriceRecord, km?: number): void {
    const note = this.out("locate-note");
    const days = daysSince(city.priceDate);
    const date = new Date(city.priceDate).toLocaleDateString(this.country.currency.locale, { month: "short", day: "numeric", year: "numeric" });
    this.located = { name: city.name };
    this.market.gasPrice = city.price;
    this.market.gasLabel = `${city.priceSource}, ${date} — ${city.name} (${this.describeAge(days).replace("updated ", "")})`;
    this.market.evPrice = city.electricityPrice;
    this.market.evLabel = `${city.name} residential electricity, ${city.electricitySource}`;
    if (note) {
      const where = km !== undefined ? `Using ${city.name} (${km} km from you).` : `Using ${city.name}, your last chosen location.`;
      note.textContent = `${where} Price is from ${date}${days > 30 ? " — that's over a month old, so check your local pump" : ""}.`;
    }
  }

  private async restoreLocatedCity(): Promise<void> {
    const slug = safeGet(`${LOCATED_KEY_PREFIX}:${this.country.code}`);
    const city = slug ? this.localPrices.find((c) => c.slug === slug) : undefined;
    // A city page already carries its own city's price — don't override it.
    if (!city || this.getAttribute("data-gas-label")) return;
    this.useLocalCity(city);
    this.applyMarketPrice();
  }

  // --- Calculation --------------------------------------------------------------------

  private compute(state: Record<string, string>): Computation {
    const fuelId = state.fuel || "petrol";
    const condition = (state.conditions === "cold" ? "cold" : "normal") as ConditionId;
    const price = Number(state.price) || 0;
    const mileage = Number(state.mileage) || 0;
    const distanceOneWay = Number(state.distance) || 0;
    const roundTrip = state.roundtrip === "true" || state.roundtrip === "1";
    const people = Math.max(1, Math.floor(num(state.people)) || 1);
    const tolls = num(state.tolls);
    const parking = num(state.parking);

    const result = tripCost({
      fuelId,
      pricePerUnit: price,
      mileage: adjustMileage(fuelId, mileage, condition),
      distanceOneWay,
      roundTrip,
    });
    const total = result.cost + tolls + parking;
    return {
      ok: price > 0 && mileage > 0,
      fuelId,
      fuelCost: result.cost,
      costPerDistance: result.costPerKm,
      distance: roundTrip ? distanceOneWay * 2 : distanceOneWay,
      tolls,
      parking,
      people,
      total,
      perPerson: total / people,
      condition,
    };
  }

  private recalculate(): void {
    const state = this.currentState();
    const c = this.compute(state);
    const fmt = (v: number) => formatCurrency(v, this.country);
    const distanceUnit = this.country.distanceUnit;

    const costOut = this.out("cost");
    const perKmOut = this.out("cost-per-km");
    const distanceOut = this.out("distance-used");
    if (costOut) costOut.textContent = fmt(c.total);
    if (perKmOut) perKmOut.textContent = `${fmt(c.costPerDistance)} / ${distanceUnit}`;
    if (distanceOut) distanceOut.textContent = `${c.distance} ${distanceUnit}`;

    const breakdown = this.out("breakdown");
    if (breakdown) {
      const parts = [`Fuel ${fmt(c.fuelCost)}`];
      if (c.tolls) parts.push(`tolls ${fmt(c.tolls)}`);
      if (c.parking) parts.push(`parking ${fmt(c.parking)}`);
      const showBreakdown = c.tolls > 0 || c.parking > 0 || c.condition === "cold";
      breakdown.textContent = showBreakdown
        ? parts.join(" + ") + (c.condition === "cold" ? " · cold-weather mileage applied" : "")
        : "";
    }
    const perPerson = this.out("per-person");
    if (perPerson) {
      perPerson.textContent = c.people > 1 ? `${fmt(c.perPerson)} each for ${c.people} people` : "";
    }

    this.renderFormula(c, state);
    this.renderVerdict(c, state);

    const sticky = this.out("sticky-cost");
    if (sticky) sticky.textContent = fmt(c.total);
  }

  private renderFormula(c: Computation, state: Record<string, string>): void {
    let formula = this.out("formula");
    if (!formula) {
      const verdict = this.out("verdict");
      if (!verdict) return;
      formula = document.createElement("p");
      formula.className = "mt-sm text-caption text-mute";
      formula.setAttribute("data-out", "formula");
      verdict.insertAdjacentElement("afterend", formula);
    }
    const fmt = (v: number) => formatCurrency(v, this.country);
    const u = this.country.distanceUnit;
    formula.textContent = c.ok
      ? `${fmt(c.costPerDistance)}/${u} × ${c.distance} ${u} = ${fmt(c.fuelCost)} fuel${state.conditions === "cold" ? " (cold-weather adjusted)" : ""}`
      : "";
  }

  /** A plain-language answer to "what does this mean for me?", comparing against a
   * typical vehicle on the other fuel — the median of the matching vehicles listed in
   * our own database, so the comparison is inspectable rather than invented. */
  private renderVerdict(c: Computation, state: Record<string, string>): void {
    const el = this.out("verdict");
    if (!el) return;
    const fmt = (v: number) => formatCurrency(v, this.country);
    if (!c.ok) {
      el.textContent = "Enter a price and mileage (or pick a vehicle) to see your trip cost.";
      return;
    }

    const u = this.country.distanceUnit;
    const kind = this.selectedVehicle()?.type ?? "car";
    const roundTrip = state.roundtrip === "true" || state.roundtrip === "1";
    const distanceOneWay = Number(state.distance) || 0;
    const headline = `Fuel for this ${c.distance} ${u} trip: about ${fmt(c.fuelCost)}${c.total !== c.fuelCost ? `, ${fmt(c.total)} with tolls and parking` : ""}.`;

    const compareTo = (altFuel: "petrol" | "ev"): string => {
      const altMileage = medianMileage(this.vehicles, altFuel, kind) ?? medianMileage(this.vehicles, altFuel, "car");
      const altPrice = altFuel === "ev" ? this.market.evPrice : this.market.gasPrice;
      if (!altMileage || !altPrice) return "";
      const alt = tripCost({
        fuelId: altFuel,
        pricePerUnit: altPrice,
        mileage: adjustMileage(altFuel, altMileage, c.condition),
        distanceOneWay,
        roundTrip,
      });
      const diff = c.fuelCost - alt.cost;
      const pct = c.fuelCost > 0 ? Math.abs(diff / c.fuelCost) * 100 : 0;
      const effLabel = altFuel === "ev"
        ? `the median EV in our list (${altMileage} kWh/100${u} at ${fmt(altPrice)}/kWh)`
        : `the median petrol ${kind} in our list (${altMileage} ${this.mileageUnitFor("petrol")} at ${fmt(altPrice)} per ${this.country.volumeUnit})`;
      if (pct < 2) return ` ${effLabel[0].toUpperCase()}${effLabel.slice(1)} would cost about the same.`;
      return diff > 0
        ? ` ${effLabel[0].toUpperCase()}${effLabel.slice(1)} would do it for about ${fmt(alt.cost)} — ${fmt(diff)} (${Math.round(pct)}%) less.`
        : ` ${effLabel[0].toUpperCase()}${effLabel.slice(1)} would cost about ${fmt(alt.cost)} — ${alt.cost >= c.fuelCost * 2 ? `about ${(alt.cost / c.fuelCost).toFixed(1)}× as much` : `${fmt(-diff)} (${Math.round(pct)}%) more`}.`;
    };

    let comparison = "";
    if (c.fuelId === "ev") comparison = compareTo("petrol");
    else if (c.fuelId === "petrol" || c.fuelId === "diesel" || c.fuelId === "e20" || c.fuelId === "xp95" || c.fuelId === "xp100") comparison = compareTo("ev");
    el.textContent = headline + comparison;
  }

  private mileageUnitFor(fuel: string): string {
    return this.fuelTypes.find((f) => f.id === fuel)?.unitLabel ?? "";
  }

  // --- State: URL, storage, restore ------------------------------------------------------

  private currentState(): Record<string, string> {
    const state: Record<string, string> = {};
    for (const name of FIELD_NAMES) {
      const el = this.field(name);
      if (!el) continue;
      state[name] = name === "roundtrip" ? String((el as HTMLInputElement).checked) : el.value;
    }
    return state;
  }

  private storageKey(): string {
    return `${STORAGE_KEY_PREFIX}:${this.country.code}`;
  }

  private shareUrl(): URL {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(this.currentState())) {
      const isDefault = (key === "conditions" && value === "normal") || (key === "roundtrip" && value === "false");
      if (value && !isDefault) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    return url;
  }

  private persistState(): void {
    safeSet(this.storageKey(), JSON.stringify(this.currentState()));
    window.history.replaceState(null, "", this.shareUrl());
  }

  private applySource(source: Record<string, string>): void {
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
    // Anything with a price in it is the visitor's own number — don't overwrite it.
    this.priceDirty = Boolean(source.price);
  }

  private restoreState(): "url" | "storage" | null {
    const url = new URL(window.location.href);
    const hasQueryParams = FIELD_NAMES.some((name) => url.searchParams.has(name));

    let source: Record<string, string> | null = null;
    let from: "url" | "storage" = "url";
    if (hasQueryParams) {
      source = Object.fromEntries(url.searchParams.entries());
    } else {
      const stored = safeGet(this.storageKey());
      if (stored) {
        try {
          source = JSON.parse(stored);
          from = "storage";
        } catch {
          source = null;
        }
      }
    }
    if (!source) return null;
    this.applySource(source);
    return from;
  }

  private showWelcomeBack(): void {
    const wrap = this.out("welcome-back");
    const text = this.out("welcome-text");
    if (!wrap || !text) return;
    const vehicle = this.selectedVehicle();
    text.textContent = vehicle
      ? `Welcome back — we've loaded your last inputs (${vehicle.name}).`
      : "Welcome back — we've loaded your last inputs.";
    wrap.hidden = false;
  }

  private resetAll(): void {
    safeRemove(this.storageKey());
    safeRemove(`${LOCATED_KEY_PREFIX}:${this.country.code}`);
    window.location.href = window.location.pathname;
  }

  // --- Share & save -----------------------------------------------------------------------

  private setActionNote(message: string): void {
    const note = this.out("action-note");
    if (note) note.textContent = message;
  }

  private async shareLink(): Promise<void> {
    this.persistState();
    const url = this.shareUrl().toString();
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    try {
      if (coarse && typeof navigator.share === "function") {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.setActionNote("Link copied — anyone who opens it sees these exact numbers.");
    } catch {
      // Clipboard can be blocked; fall back to a selectable field so the link is never lost.
      window.prompt("Copy this link:", url);
    }
  }

  private savedKey(): string {
    return `${SAVED_KEY_PREFIX}:${this.country.code}`;
  }

  private readSaved(): SavedTrip[] {
    const raw = safeGet(this.savedKey());
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SavedTrip[]) : [];
    } catch {
      return [];
    }
  }

  private openSaveForm(): void {
    const form = this.out("save-form");
    if (!form) return;
    form.hidden = false;
    const input = form.querySelector("input") as HTMLInputElement | null;
    const vehicle = this.selectedVehicle();
    if (input && !input.value) input.value = vehicle ? vehicle.name : "";
    input?.focus();
  }

  private confirmSave(): void {
    const form = this.out("save-form");
    const input = form?.querySelector("input") as HTMLInputElement | null;
    const name = input?.value.trim() || "My trip";
    const state = this.currentState();
    if (!this.compute(state).ok) {
      this.setActionNote("Fill in a price and mileage first, then save.");
      return;
    }
    const trips = this.readSaved();
    trips.unshift({ id: `${Date.now()}`, name, state, savedAt: Date.now() });
    safeSet(this.savedKey(), JSON.stringify(trips.slice(0, MAX_SAVED_TRIPS)));
    if (form) form.hidden = true;
    if (input) input.value = "";
    this.setActionNote(`Saved “${name}”.`);
    this.renderSavedTrips();
  }

  private renderSavedTrips(): void {
    const wrap = this.out("saved-wrap");
    const list = this.out("saved-list");
    if (!wrap || !list) return;
    const trips = this.readSaved();
    wrap.hidden = trips.length === 0;
    list.innerHTML = "";
    const fmt = (v: number) => formatCurrency(v, this.country);
    for (const trip of trips) {
      const c = this.compute(trip.state);
      const li = document.createElement("li");
      li.className = "flex flex-wrap items-center justify-between gap-sm rounded-sm bg-canvas p-sm";
      const label = document.createElement("span");
      label.className = "text-body-sm text-ink";
      label.textContent = `${trip.name} — ${fmt(c.total)} for ${c.distance} ${this.country.distanceUnit}`;
      const actions = document.createElement("span");
      actions.className = "flex gap-xs";
      for (const [action, text] of [["load-trip", "Load"], ["delete-trip", "Delete"]] as const) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "h-11 rounded-sm border border-hairline px-md text-button-md text-ink";
        btn.setAttribute("data-action", action);
        btn.setAttribute("data-id", trip.id);
        btn.textContent = text;
        actions.appendChild(btn);
      }
      li.appendChild(label);
      li.appendChild(actions);
      list.appendChild(li);
    }
  }

  private loadTrip(id: string): void {
    const trip = this.readSaved().find((t) => t.id === id);
    if (!trip) return;
    this.applySource(trip.state);
    this.refreshSearchableSelects();
    this.updateUnitLabels();
    this.lastFuel = this.currentFuel();
    const badge = this.out("price-source");
    if (badge) badge.textContent = `Custom price (from saved trip “${trip.name}”)`;
    this.recalculate();
    this.persistState();
    this.setActionNote(`Loaded “${trip.name}”.`);
    this.out("result-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  private deleteTrip(id: string): void {
    safeSet(this.savedKey(), JSON.stringify(this.readSaved().filter((t) => t.id !== id)));
    this.renderSavedTrips();
  }

  // --- Mobile: floating result bar -------------------------------------------------------

  /** On a phone the result sits below a tall form; show a compact bar with the live cost
   * whenever the result card is scrolled out of view below the screen. */
  private setupStickyBar(): void {
    const card = this.out("result-card");
    const bar = this.out("sticky-bar");
    if (!card || !bar || typeof IntersectionObserver === "undefined") return;
    new IntersectionObserver(([entry]) => {
      bar.hidden = entry.isIntersecting || entry.boundingClientRect.top <= 0;
    }).observe(card);
  }
}

customElements.define("fuel-calculator", FuelCalculatorElement);
