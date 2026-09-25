import type { CountryCode } from "../lib/countries";

export interface CountrySection {
  heading: string;
  body: string;
}

/** Real, country-specific content — not the same three paragraphs with the currency
 * symbol swapped. Each fact here is sourced (see src/data/realLocalData.ts for the
 * underlying figures) rather than a generic claim that happens to apply everywhere. */
export const COUNTRY_DIFFERENTIATION: Partial<Record<CountryCode, CountrySection[]>> = {
  US: [
    {
      heading: "Why gas prices vary so much by state",
      body: "Unlike a single national number, US gas prices are shaped by state fuel tax on top of the federal 18.4¢/gallon rate that applies everywhere. State gas taxes range from around 18-20¢/gallon in low-tax states like Arizona and Texas to 70¢+/gallon in California and Illinois (Tax Foundation, July 2026) — a real, permanent gap that no national average captures. Add state-level environmental fees and distance from refineries, and two drivers a few states apart can pay meaningfully different prices for the same fill-up.",
    },
    {
      heading: "What EV charging actually costs",
      body: "Home electricity rates vary even more than gas prices do — from around 14-16¢/kWh in Washington and Texas to 30¢+/kWh in California, New York and Massachusetts (EIA-based state averages, 2026). That's why this calculator asks for your own electricity rate rather than assuming a flat national figure: the same EV can cost twice as much to charge depending on which state you're in.",
    },
    {
      heading: "Where these numbers come from",
      body: "Gas prices are sourced from AAA's daily state averages, gas tax rates from the Tax Foundation, and electricity rates from EIA-based state data — all real, dated figures, not estimates. Vehicle mileage figures use EPA-style ratings. Every number is fully editable if your own price or mileage differs.",
    },
  ],
  GB: [
    {
      heading: "Why fuel duty doesn't explain local price differences",
      body: "Fuel duty in the UK is set nationally, so — unlike the US — the tax portion of the price is identical everywhere in the country. What does vary locally is the retail price itself: supermarket forecourts are typically cheaper than motorway services, and cities with Clean Air Zones or Low Emission Zones (London's ULEZ, Birmingham's and Bristol's CAZ, Glasgow's LEZ) add a real, separate daily charge for non-compliant vehicles on top of fuel cost.",
    },
    {
      heading: "What EV charging actually costs",
      body: "Home electricity under Ofgem's price cap runs at 26.11p/kWh as of Q3 2026 for a typical Direct Debit customer — but public rapid chargers are usually priced well above that, sometimes 2-3x the home rate. The gap between home and public charging is often larger in the UK than the gap between petrol and diesel, which is worth factoring in if you can't charge at home.",
    },
    {
      heading: "Where these numbers come from",
      body: "Fuel prices are sourced from RAC Fuel Watch's daily UK average, and electricity rates from Ofgem's published price cap. Vehicle mileage figures are manufacturer-published. Every number is fully editable if your own price or mileage differs.",
    },
  ],
  CA: [
    {
      heading: "Why gas prices vary so much by province",
      body: "Canadian gas prices are shaped by provincial fuel tax and carbon pricing, which aren't set at a single national rate. Alberta consistently has some of the lowest prices in the country, partly due to lower provincial fuel tax and its own refining capacity, while British Columbia and Atlantic provinces carry higher fuel taxes — a real, structural difference that a single national average hides.",
    },
    {
      heading: "What EV charging actually costs",
      body: "Electricity prices differ more by province than almost anything else in Canada: Quebec's hydro-heavy grid runs around 7.3¢/kWh, among the cheapest in North America, while Alberta's market-based rates can run 12-18¢/kWh. Charging the same EV can cost roughly twice as much depending on which province you're in — worth checking your own rate rather than assuming a flat figure.",
    },
    {
      heading: "Where these numbers come from",
      body: "Gas prices are sourced from local pump-price averages checked in September 2026, and electricity rates from published provincial utility rates (Hydro-Québec, BC Hydro, Alberta's Regulated Rate Option, and others). Vehicle mileage figures are manufacturer-published. Every number is fully editable if your own price or mileage differs.",
    },
  ],
  AU: [
    {
      heading: "Why fuel excise doesn't explain local price differences",
      body: "Fuel excise in Australia is set nationally, so the tax portion of the price is the same everywhere — but retail prices still move through the well-documented price cycles the ACCC tracks in Australia's largest cities, where prices rise and fall over days or weeks. Regional and remote pricing (Darwin and Perth especially) also tends to run higher than the eastern capitals, due to distribution distance rather than tax.",
    },
    {
      heading: "What EV charging actually costs",
      body: "Electricity prices vary meaningfully by state — from around 27-32c/kWh in Victoria and the ACT to over 40c/kWh on South Australia's regulated tariff (state utility data, 2026). That's a bigger gap than most people expect, and it's why this calculator asks for your own rate rather than a single national figure.",
    },
    {
      heading: "Where these numbers come from",
      body: "Fuel prices are sourced from state-level fuel price trackers checked in September 2026, and electricity rates from published state utility/regulator data. Vehicle mileage figures are manufacturer-published. Every number is fully editable if your own price or mileage differs.",
    },
  ],
};
