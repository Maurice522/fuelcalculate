import type { CountryCode } from "../lib/countries";

export interface CityContentContext {
  cityName: string;
  region: string;
  currencySymbol: string;
}

/** Genuine, country-accurate context for why local fuel prices differ from the flat
 * national average this calculator defaults to — deliberately NOT the same story for
 * every country, since the actual mechanism differs: US and Canada have real state/
 * provincial fuel tax variation, while the UK and Australia set fuel duty/excise
 * nationally and the local variation instead comes from competition, distribution
 * cost, and (for Australia) well-documented retail price cycles. No page fabricates a
 * specific city price we don't actually have — the flat national-average figure is
 * what the calculator below still uses, editable by the visitor. */
export const CITY_CONTENT_BY_COUNTRY: Partial<Record<CountryCode, (ctx: CityContentContext) => string[]>> = {
  US: ({ cityName, region }) => [
    `Unlike a single national pump price, gas prices in the US vary meaningfully from state to state — driven by differences in state fuel tax, environmental fees, distance from refineries, and local competition. ${cityName}'s real price can end up noticeably above or below the flat national average this calculator starts you with, simply because state tax and local market conditions in ${region} aren't the same as the next state over.`,
    `The calculator below defaults to a national-average gas price so it always has a starting number, but it's fully editable — enter what you're actually paying at the pump in ${cityName} for the most accurate trip cost, then use the comparison tool to see diesel or EV running costs against it.`,
  ],
  GB: ({ cityName, region }) => [
    `Fuel duty in the UK is set nationally, so unlike some countries the tax portion of the price doesn't vary by where you live. What does vary is the price you actually pay at the pump in ${cityName} — supermarket forecourts are typically cheaper than motorway services, and local competition, delivery distance and ${region}'s specific fuel market all shift the number the flat national average this calculator starts with doesn't capture.`,
    `Enter what you're actually paying in ${cityName} into the calculator below for an accurate trip cost, rather than relying on the national-average starting figure — then use the comparison tool to weigh it against diesel, LPG or EV running costs.`,
  ],
  CA: ({ cityName, region }) => [
    `Gas prices in Canada vary meaningfully from province to province, since fuel taxes — including provincial fuel tax and carbon pricing — aren't set at a single national rate. ${cityName}'s real price can differ noticeably from the flat national average this calculator starts you with, because ${region}'s tax structure and local market aren't the same as every other province's.`,
    `The calculator below is fully editable — enter what you're actually paying at the pump in ${cityName} for the most accurate trip cost, then use the comparison tool to see diesel or EV running costs against it.`,
  ],
  AU: ({ cityName, region }) => [
    `Fuel excise in Australia is set nationally, so the tax portion of the price is the same everywhere — but retail prices in ${cityName} still move through the well-documented price cycles the ACCC tracks in Australia's capital cities, where prices rise and fall over days or weeks rather than staying flat. Remote and regional pricing in ${region} can also run higher than the flat national average this calculator starts with, due to distribution distance.`,
    `Enter what you're actually paying at the pump in ${cityName} into the calculator below for an accurate trip cost, rather than relying on the national-average starting figure — then use the comparison tool to weigh it against diesel, LPG or EV running costs.`,
  ],
};
