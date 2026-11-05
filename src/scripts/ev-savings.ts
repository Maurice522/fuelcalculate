import { evSavings, type EvSavingsInput } from "../lib/evSavings";

const FIELDS = ["annualDistance", "gasPrice", "gasMileage", "tariff", "evEfficiency", "premium"] as const;
type Field = (typeof FIELDS)[number];

/**
 * Live recalculation for the EV savings page. The server already rendered a complete
 * result from the same `evSavings` function, so this only takes over on edits; field
 * values round-trip through the URL so a result can be shared.
 */
class EvSavingsElement extends HTMLElement {
  private fmt!: Intl.NumberFormat;
  private unit = "km";

  connectedCallback(): void {
    this.unit = this.getAttribute("data-unit") ?? "km";
    this.fmt = new Intl.NumberFormat(this.getAttribute("data-locale") ?? "en-US", {
      style: "currency",
      currency: this.getAttribute("data-currency") ?? "USD",
      maximumFractionDigits: 0,
    });

    const params = new URL(window.location.href).searchParams;
    for (const name of FIELDS) {
      const value = params.get(name);
      const el = this.input(name);
      if (el && value !== null) el.value = value;
      el?.addEventListener("input", () => this.update(true));
    }
    this.querySelector('[data-action="share"]')?.addEventListener("click", () => void this.share());
    this.update(false);
  }

  private input(name: Field): HTMLInputElement | null {
    return this.querySelector(`[data-field="${name}"]`);
  }

  private out(name: string): HTMLElement | null {
    return this.querySelector(`[data-out="${name}"]`);
  }

  private read(): EvSavingsInput {
    const n = (name: Field) => Number(this.input(name)?.value) || 0;
    return {
      annualDistance: n("annualDistance"),
      gasPrice: n("gasPrice"),
      gasMileage: n("gasMileage"),
      tariff: n("tariff"),
      evEfficiency: n("evEfficiency"),
      premium: n("premium"),
    };
  }

  private update(syncUrl: boolean): void {
    const input = this.read();
    const r = evSavings(input);
    const set = (name: string, text: string) => {
      const el = this.out(name);
      if (el) el.textContent = text;
    };
    const f = (v: number) => this.fmt.format(v);

    set("annualSaving", r.ok ? f(r.annualSaving) : "—");
    set("annualGas", r.ok ? f(r.annualGas) : "—");
    set("annualEv", r.ok ? f(r.annualEv) : "—");
    set("monthlySaving", r.ok ? f(r.monthlySaving) : "—");
    set("fiveYearSaving", r.ok ? f(r.fiveYearSaving) : "—");

    const dist = input.annualDistance.toLocaleString(this.getAttribute("data-locale") ?? "en-US");
    set(
      "verdict",
      !r.ok
        ? "Fill in every field to see your saving."
        : r.annualSaving >= 0
          ? `Driving ${dist} ${this.unit} a year costs about ${f(r.annualGas)} in fuel versus about ${f(r.annualEv)} in electricity — roughly ${f(r.annualSaving)} a year (${f(r.monthlySaving)} a month) less in an EV.`
          : `At these numbers the EV costs about ${f(-r.annualSaving)} a year more to run.`,
    );

    if (input.premium <= 0) {
      set("breakEven", "Enter the EV's extra price above to see how long it takes to pay for itself.");
    } else if (r.breakEvenYears === null || r.breakEvenDistance === null) {
      set("breakEven", "At these numbers the EV never pays back its extra price through running costs alone.");
    } else {
      const years = r.breakEvenYears;
      const when = years < 1 ? `${Math.max(1, Math.round(years * 12))} months` : `${years.toFixed(1)} years`;
      set(
        "breakEven",
        `Break-even: about ${when}, or roughly ${Math.round(r.breakEvenDistance).toLocaleString(this.getAttribute("data-locale") ?? "en-US")} ${this.unit} of driving, before maintenance, insurance and resale value.`,
      );
    }

    if (syncUrl) {
      const url = new URL(window.location.href);
      for (const name of FIELDS) {
        const v = this.input(name)?.value;
        if (v) url.searchParams.set(name, v);
        else url.searchParams.delete(name);
      }
      window.history.replaceState(null, "", url);
    }
  }

  private async share(): Promise<void> {
    this.update(true);
    const note = this.out("action-note");
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (note) note.textContent = "Link copied — it reopens with your exact numbers.";
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }
}

customElements.define("ev-savings-calculator", EvSavingsElement);
