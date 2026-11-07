import {
  KM_PER_MILE,
  costPerDistance,
  fromKm,
  fromKmPerLitre,
  fromPricePerLitre,
  mileageFromTrip,
  tidy,
  toKm,
  toKmPerLitre,
  toPricePerLitre,
  type DistanceUnit,
  type MileageUnit,
  type PriceUnit,
  type VolumeUnit,
} from "../lib/units";

/** Shared plumbing for the two unit calculators: field lookup + URL round-tripping. */
abstract class UnitToolElement extends HTMLElement {
  protected fields = new Map<string, HTMLInputElement | HTMLSelectElement>();

  protected collect(): void {
    const found = Array.from(this.querySelectorAll("[data-field]")) as (HTMLInputElement | HTMLSelectElement)[];
    for (const el of found) this.fields.set(el.getAttribute("data-field")!, el);
    // Shared links restore every field from the query string.
    const params = new URL(window.location.href).searchParams;
    for (const [name, el] of this.fields) {
      const value = params.get(name);
      if (value !== null) el.value = value;
    }
  }

  protected value(name: string): string {
    return this.fields.get(name)?.value ?? "";
  }

  protected num(name: string): number {
    const n = Number(this.value(name));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  protected set(name: string, text: string): void {
    const el = this.querySelector<HTMLElement>(`[data-out="${name}"]`);
    if (el) el.textContent = text;
  }

  protected syncUrl(): void {
    const url = new URL(window.location.href);
    for (const [name, el] of this.fields) {
      if (el.value) url.searchParams.set(name, el.value);
      else url.searchParams.delete(name);
    }
    window.history.replaceState(null, "", url);
  }

  protected money(v: number, gb: boolean): string {
    if (gb && v < 1) return `${(v * 100).toFixed(1)}p`;
    return new Intl.NumberFormat(this.getAttribute("data-locale") ?? "en-US", {
      style: "currency",
      currency: this.getAttribute("data-currency") ?? "USD",
      maximumFractionDigits: 2,
    }).format(v);
  }
}

class MileageCalculatorElement extends UnitToolElement {
  connectedCallback(): void {
    this.collect();
    for (const el of this.fields.values()) {
      el.addEventListener("input", () => this.update(true));
      el.addEventListener("change", () => this.update(true));
    }
    this.update(false);
  }

  private update(sync: boolean): void {
    const r = mileageFromTrip(
      this.num("distance"),
      this.value("distanceUnit") as DistanceUnit,
      this.num("fuel"),
      this.value("fuelUnit") as VolumeUnit,
    );
    const f = (n: number) => n.toFixed(1);
    if (!r) {
      this.set("headline", "—");
      for (const k of ["kmpl", "l100km", "mpgUs", "mpgUk"]) this.set(k, "—");
      this.set("costLine", "Enter the distance you drove and the fuel it used.");
      return;
    }
    this.set("kmpl", f(r.kmPerLitre));
    this.set("l100km", f(r.litresPer100Km));
    this.set("mpgUs", f(r.mpgUs));
    this.set("mpgUk", f(r.mpgUk));

    // Headline in the country's own unit: the first of these the page's default implies.
    const unit = (this.getAttribute("data-trip-unit") ?? "kmpl") as MileageUnit;
    const country = this.getAttribute("data-prefix") ?? "";
    const headlineUnit: MileageUnit =
      country === "/us" ? "mpgUs" : country === "/gb" ? "mpgUk" : country === "/ca" || country === "/au" ? "l100km" : "kmpl";
    const labels: Record<MileageUnit, string> = { kmpl: "km/l", l100km: "L/100km", mpgUs: "mpg (US)", mpgUk: "mpg (UK)" };
    this.set("headline", `${f(fromKmPerLitre(r.kmPerLitre, headlineUnit))} ${labels[headlineUnit]}`);

    const cost = this.num("cost");
    if (cost > 0) {
      const km = toKm(this.num("distance"), this.value("distanceUnit") as DistanceUnit);
      const symbol = this.getAttribute("data-symbol") ?? "";
      const miles = km / KM_PER_MILE;
      this.set("costLine", `That works out at ${symbol}${(cost / km).toFixed(3)} per km, or ${symbol}${(cost / miles).toFixed(3)} per mile.`);
    } else {
      this.set("costLine", "Add what the fuel cost to see your cost per distance.");
    }

    const link = this.querySelector<HTMLAnchorElement>('[data-out="tripLink"]');
    if (link) {
      const value = Math.round(fromKmPerLitre(r.kmPerLitre, unit) * 10) / 10;
      link.href = `${country}/?fuel=petrol&mileage=${value}`;
    }
    if (sync) this.syncUrl();
  }
}

class CostPerDistanceElement extends UnitToolElement {
  private last = { mileageUnit: "", priceUnit: "", distanceUnit: "" };

  connectedCallback(): void {
    this.collect();
    this.last = {
      mileageUnit: this.value("mileageUnit"),
      priceUnit: this.value("priceUnit"),
      distanceUnit: this.value("distanceUnit"),
    };
    for (const [name, el] of this.fields) {
      el.addEventListener("input", () => this.update(true));
      el.addEventListener("change", () => {
        // Switching a unit converts the number beside it instead of reinterpreting it.
        if (name === "mileageUnit") this.convertMileage();
        else if (name === "priceUnit") this.convertPrice();
        else if (name === "distanceUnit") this.convertDistance();
        this.update(true);
      });
    }
    this.update(false);
  }

  private convertMileage(): void {
    const from = this.last.mileageUnit as MileageUnit;
    const to = this.value("mileageUnit") as MileageUnit;
    const v = this.num("mileage");
    if (v > 0) this.fields.get("mileage")!.value = String(tidy(fromKmPerLitre(toKmPerLitre(v, from), to)));
    this.last.mileageUnit = to;
  }

  private convertPrice(): void {
    const from = this.last.priceUnit as PriceUnit;
    const to = this.value("priceUnit") as PriceUnit;
    const v = this.num("price");
    if (v > 0) this.fields.get("price")!.value = String(tidy(fromPricePerLitre(toPricePerLitre(v, from), to)));
    this.last.priceUnit = to;
  }

  private convertDistance(): void {
    const from = this.last.distanceUnit as DistanceUnit;
    const to = this.value("distanceUnit") as DistanceUnit;
    const v = this.num("distance");
    if (v > 0) this.fields.get("distance")!.value = String(tidy(fromKm(toKm(v, from), to)));
    this.last.distanceUnit = to;
  }

  private update(sync: boolean): void {
    const gb = this.getAttribute("data-gb") === "1";
    const r = costPerDistance({
      mileage: this.num("mileage"),
      mileageUnit: this.value("mileageUnit") as MileageUnit,
      price: this.num("price"),
      priceUnit: this.value("priceUnit") as PriceUnit,
      distance: this.num("distance"),
      distanceUnit: this.value("distanceUnit") as DistanceUnit,
    });
    if (!r.ok) {
      this.set("primary", "—");
      this.set("secondary", "");
      this.set("verdict", "Enter your mileage and the fuel price.");
      return;
    }
    const miles = this.value("distanceUnit") === "mi";
    const m = (v: number) => this.money(v, gb);
    this.set("primary", m(miles ? r.perMile : r.perKm));
    this.set("secondary", `${m(miles ? r.perKm : r.perMile)} per ${miles ? "km" : "mile"}`);
    this.set("journey", m(r.journeyCost));
    this.set("litres", `${r.litres.toFixed(1)} L`);
    this.set("gallons", gb ? `${r.ukGallons.toFixed(1)} UK gal` : `${r.usGallons.toFixed(1)} US gal`);
    this.set("verdict", "Fuel only: no servicing, insurance, tax or depreciation.");
    // Keep the "per mile / per km" caption in step with the journey unit.
    const caption = this.querySelector<HTMLElement>(".text-caption.text-mute");
    if (caption && caption.textContent?.startsWith("Fuel cost per")) caption.textContent = `Fuel cost per ${miles ? "mile" : "km"}`;
    if (sync) this.syncUrl();
  }
}


customElements.define("mileage-calculator", MileageCalculatorElement);
customElements.define("cost-per-distance-calculator", CostPerDistanceElement);
