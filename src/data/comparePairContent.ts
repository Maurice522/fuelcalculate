export interface ComparePairContentContext {
  aLabel: string;
  bLabel: string;
  symbol: string;
  distanceUnit: "km" | "mi";
}

/** Genuine explanatory content for each fuel-pair matchup, keyed by `${fuelA}_${fuelB}`
 * exactly as the tuples appear in comparePairs.ts. Reused across every country that
 * offers that pair — the underlying tradeoffs (availability, running cost drivers,
 * what the number on this page does and doesn't capture) are the same regardless of
 * currency, only the wording is parametrised per country. */
export const COMPARE_PAIR_CONTENT: Record<string, (ctx: ComparePairContentContext) => string[]> = {
  petrol_diesel: ({ aLabel, bLabel, symbol, distanceUnit }) => [
    `${bLabel} is usually priced differently from ${aLabel.toLowerCase()} at the pump, but that alone doesn't tell you which is actually cheaper to run — mileage matters just as much as price. A diesel engine that returns noticeably better ${distanceUnit}-per-unit than its petrol equivalent can still come out ahead even when diesel costs more per litre, and the reverse is true too. That's the whole reason this calculator asks for your own mileage rather than assuming one.`,
    `Price and mileage aside, there are running-cost factors this comparison doesn't capture: diesel vehicles are often pricier to buy and service, while petrol engines are usually cheaper to maintain but can be thirstier under hard acceleration or heavy loads. Use the ${symbol} and % figure above as the fuel-cost half of the decision, not the whole one — and enter your vehicle's real mileage instead of a brochure figure for the most accurate number.`,
  ],
  petrol_cng: () => [
    "CNG is almost always significantly cheaper per unit than petrol, and most factory-fitted or well-installed CNG kits don't cost you as much mileage as the price gap would suggest — which is why the switch tends to pay off for anyone doing meaningful daily distance. The catch is availability: CNG stations are far less common than petrol pumps outside a handful of cities, and boot space usually shrinks to fit the cylinder.",
    "If you're deciding whether to convert an existing petrol vehicle rather than buying CNG-ready, factor in the conversion cost and any insurance implications alongside the running-cost savings this calculator shows — the per-km number here only covers fuel, not the upfront cost of getting there.",
  ],
  petrol_e20: () => [
    "E20 is India's current standard petrol blend at most pumps, priced a little below pure petrol but with a modest efficiency drop from the added ethanol — this calculator estimates that drop from your vehicle's petrol mileage rather than assuming a flat percentage for every car, since the real difference varies by engine.",
    "For most E20-compatible vehicles the price discount roughly offsets the mileage loss, so the net cost difference tends to be small either way — the exact ₹ and % figure above is what matters for your own vehicle and price, not a generic industry claim. If you're unsure whether your car is E20-compatible, check the fuel-filler cap or your owner's manual before relying on this comparison.",
  ],
  petrol_ev: ({ aLabel, symbol, distanceUnit }) => [
    `Electricity is typically far cheaper per ${distanceUnit} than ${aLabel.toLowerCase()}, which is why EVs usually win this comparison by a wide margin — but the exact gap depends heavily on your electricity tariff and how efficient your specific EV is, both of which vary a lot more than fuel prices do. That's why this calculator uses your own tariff and efficiency figures rather than a single national estimate.`,
    `What this page doesn't capture: charging convenience, home-charging setup cost, and the higher upfront price of most EVs compared to their petrol equivalents. The ${symbol} and % savings shown here are real for your running costs, but weigh them against the full picture — including how many years of driving it takes for fuel savings to offset any price premium — before treating it as the whole answer.`,
  ],
  petrol_lpg: () => [
    "LPG (Autogas) is usually priced well below petrol, and converted vehicles typically lose only a modest amount of efficiency in exchange — which is why the per-km cost gap shown here tends to favour LPG for anyone driving meaningful distance. The tradeoff is fuel-station availability, which is more limited than petrol, and reduced boot space for the tank.",
    "If you're weighing an LPG conversion rather than comparing an already-converted vehicle, remember the number above only reflects ongoing fuel cost — it doesn't include the conversion cost itself, which you'd need to offset against the savings over time.",
  ],
  diesel_cng: () => [
    "Diesel and CNG sit at opposite ends of the availability-versus-price tradeoff: diesel pumps are everywhere, CNG stations are not, but CNG is usually meaningfully cheaper per unit. For vehicles that do high daily distance and have reasonable access to CNG stations along their usual routes, the running-cost gap shown here can add up fast over a year.",
    "As with any fuel switch, enter your vehicle's actual mileage on each fuel rather than a generic figure — diesel and CNG engines don't lose or gain efficiency by the same margin across every vehicle, so the accuracy of this comparison depends entirely on the numbers you put in.",
  ],
  diesel_ev: ({ symbol, distanceUnit }) => [
    `Diesel and EV running costs usually aren't close — electricity is typically much cheaper per ${distanceUnit} than diesel, especially for vehicles that do a lot of stop-start city driving where diesel efficiency drops the most. The ${symbol} and % figure above reflects your own price and efficiency inputs, not a generic estimate, since electricity tariffs and EV efficiency both vary more than diesel prices do.`,
    "This comparison only covers fuel cost, though — it doesn't account for the typically higher upfront price of an EV versus an equivalent diesel vehicle, home-charging setup, or diesel's advantage for long-range driving without needing to plan charging stops. Treat the number above as one input into that decision, not the full picture.",
  ],
};
