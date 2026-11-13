import type { CountryCode } from "../lib/countries";

export interface CityContentContext {
  cityName: string;
  region: string;
  currencySymbol: string;
}

/** Genuine, country-accurate context for why local fuel prices differ from place to
 * place — deliberately NOT the same story for every country, since the actual mechanism
 * differs: US and Canada have real state/provincial fuel tax variation, while the UK
 * and Australia set fuel duty/excise nationally and the local variation instead comes
 * from competition, distribution cost, and (for Australia) well-documented retail
 * price cycles. The calculator above each page is pre-filled with the sourced, dated
 * price shown on that page, and the copy here says so rather than describing a
 * national average. */
export const CITY_CONTENT_BY_COUNTRY: Partial<Record<CountryCode, (ctx: CityContentContext) => string[]>> = {
  US: ({ cityName, region }) => [
    `Gas prices in the US vary meaningfully from state to state — driven by state fuel tax, environmental fees, distance from refineries, and local competition. The figure on this page is the AAA average for ${region}, so it reflects ${region}'s tax and market rather than the national average; a few miles across a state line can mean a different price per gallon.`,
    `Your own pump price in ${cityName} will still differ a little from a state average. Replace the price in the calculator above with what you actually paid, then use the comparison tool to see diesel or EV running costs against it.`,
  ],
  GB: ({ cityName, region }) => [
    `Fuel duty in the UK is set nationally, so the tax portion of the price doesn't vary by where you live. What does vary is the price at the pump in ${cityName}: supermarket forecourts are typically cheaper than motorway services, and local competition, delivery distance and ${region}'s fuel market all move the number. The figure on this page is the UK-wide weekly average, so treat it as a starting point for ${cityName} rather than a local quote.`,
    `Replace the price in the calculator above with what you're actually paying in ${cityName} for an accurate journey cost, then use the comparison tool to weigh it against diesel, LPG or EV running costs.`,
  ],
  CA: ({ cityName, region }) => [
    `Gas prices in Canada vary from province to province, since fuel taxes — including provincial fuel tax and carbon pricing — aren't set at a single national rate. The figure on this page is Natural Resources Canada's daily average retail price for ${cityName}, so it reflects ${region}'s tax structure and local market.`,
    `Replace the price in the calculator above with what you're actually paying at the pump in ${cityName}, then use the comparison tool to see diesel or EV running costs against it.`,
  ],
  AU: ({ cityName, region }) => [
    `Fuel excise in Australia is set nationally, so the tax portion of the price is the same everywhere — but retail prices in ${cityName} still move through the well-documented price cycles the ACCC tracks in the capital cities, where prices rise and fall over days or weeks rather than staying flat. The figure on this page is a weekly average, so on any given day the pump price in ${cityName} may sit above or below it. Remote and regional pricing in ${region} can run higher still because of distribution distance.`,
    `Replace the price in the calculator above with what you're actually paying at the pump in ${cityName}, then use the comparison tool to weigh it against diesel, LPG or EV running costs.`,
  ],
};
