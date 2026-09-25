/** Real, sourced local data for the 40 non-India city pages — replaces the flat
 * national-average price these pages previously showed despite being titled "for
 * {city}". Every number here was looked up from a named public source on the date
 * given; these are periodic snapshots (like the rest of this site's non-India price
 * data), not a live feed, and are always editable by the visitor. Update the date and
 * re-check the source periodically rather than treating these as permanent. */

export interface CityLocalData {
  /** Local average price for the primary ICE fuel, in the country's own currency/unit. */
  price: number;
  /** Where the price came from. */
  priceSource: string;
  /** ISO date the price was looked up. */
  priceDate: string;
  /** Real driving-route worked example: a well-known nearby destination and distance. */
  route: { destination: string; distance: number };
  /** Local electricity price per kWh, for EV cost-per-distance context. */
  electricityPrice: number;
  electricitySource: string;
  /** US only: real state gas tax, cents per gallon (federal 18.4c/gal applies on top,
   * everywhere, in addition to this). */
  gasTaxCentsPerGallon?: number;
  gasTaxSource?: string;
}

export const US_CITY_DATA: Record<string, CityLocalData> = {
  "new-york": {
    price: 4.49,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Boston", distance: 215 },
    electricityPrice: 0.2993,
    electricitySource: "EIA-based state average, May 2026",
    gasTaxCentsPerGallon: 24.18,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  "los-angeles": {
    price: 6.29,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "San Diego", distance: 120 },
    electricityPrice: 0.3474,
    electricitySource: "EIA-based state average, June 2026",
    gasTaxCentsPerGallon: 73.64,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  chicago: {
    price: 4.83,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Milwaukee", distance: 92 },
    electricityPrice: 0.1989,
    electricitySource: "EIA-based state average, June 2026",
    gasTaxCentsPerGallon: 70.4,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  houston: {
    price: 3.95,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Austin", distance: 165 },
    electricityPrice: 0.1594,
    electricitySource: "EIA-based state average",
    gasTaxCentsPerGallon: 20.0,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  phoenix: {
    price: 4.82,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Tucson", distance: 116 },
    electricityPrice: 0.155,
    electricitySource: "EIA-based state average",
    gasTaxCentsPerGallon: 19.0,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  philadelphia: {
    price: 4.55,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "New York City", distance: 97 },
    electricityPrice: 0.215,
    electricitySource: "EIA-based state average",
    gasTaxCentsPerGallon: 58.7,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  seattle: {
    price: 5.55,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Portland", distance: 175 },
    electricityPrice: 0.144,
    electricitySource: "EIA-based state average",
    gasTaxCentsPerGallon: 60.17,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  denver: {
    price: 4.28,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Colorado Springs", distance: 70 },
    electricityPrice: 0.1713,
    electricitySource: "EIA-based state average, June 2026",
    gasTaxCentsPerGallon: 30.18,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  atlanta: {
    price: 4.17,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "Savannah", distance: 249 },
    electricityPrice: 0.1636,
    electricitySource: "EIA-based state average, June 2026",
    gasTaxCentsPerGallon: 34.05,
    gasTaxSource: "Tax Foundation, July 2026",
  },
  boston: {
    price: 4.4,
    priceSource: "AAA state average",
    priceDate: "2026-09-25",
    route: { destination: "New York City", distance: 215 },
    electricityPrice: 0.294,
    electricitySource: "EIA-based state average",
    gasTaxCentsPerGallon: 27.56,
    gasTaxSource: "Tax Foundation, July 2026",
  },
};

export const GB_CITY_DATA: Record<string, CityLocalData> = {
  london: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Oxford", distance: 97 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  birmingham: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Coventry", distance: 39 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  manchester: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Liverpool", distance: 50 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  glasgow: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Edinburgh", distance: 68 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  liverpool: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Manchester", distance: 50 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  leeds: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "York", distance: 43 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  edinburgh: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Glasgow", distance: 68 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  bristol: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Bath", distance: 19 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  cardiff: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Swansea", distance: 68 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
  belfast: {
    price: 1.736,
    priceSource: "RAC Fuel Watch, UK average",
    priceDate: "2026-09-24",
    route: { destination: "Derry", distance: 114 },
    electricityPrice: 0.2611,
    electricitySource: "Ofgem price cap, Q3 2026",
  },
};

export const CA_CITY_DATA: Record<string, CityLocalData> = {
  toronto: {
    price: 1.649,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Niagara Falls", distance: 147 },
    electricityPrice: 0.126,
    electricitySource: "Ontario tier rate average",
  },
  montreal: {
    price: 1.879,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Quebec City", distance: 251 },
    electricityPrice: 0.073,
    electricitySource: "Hydro-Québec residential rate",
  },
  vancouver: {
    price: 1.94,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Whistler", distance: 127 },
    electricityPrice: 0.102,
    electricitySource: "BC Hydro Step 1 rate",
  },
  calgary: {
    price: 1.57,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Banff", distance: 129 },
    electricityPrice: 0.15,
    electricitySource: "Alberta Regulated Rate Option, approx.",
  },
  edmonton: {
    price: 1.6,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Red Deer", distance: 171 },
    electricityPrice: 0.15,
    electricitySource: "Alberta Regulated Rate Option, approx.",
  },
  ottawa: {
    price: 1.889,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Kingston", distance: 195 },
    electricityPrice: 0.126,
    electricitySource: "Ontario tier rate average",
  },
  winnipeg: {
    price: 1.72,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Brandon", distance: 212 },
    electricityPrice: 0.099,
    electricitySource: "Manitoba Hydro residential rate",
  },
  "quebec-city": {
    price: 2.029,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Montreal", distance: 251 },
    electricityPrice: 0.073,
    electricitySource: "Hydro-Québec residential rate",
  },
  hamilton: {
    price: 1.879,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Toronto", distance: 69 },
    electricityPrice: 0.126,
    electricitySource: "Ontario tier rate average",
  },
  halifax: {
    price: 2.006,
    priceSource: "Local pump price average",
    priceDate: "2026-09-25",
    route: { destination: "Truro", distance: 89 },
    electricityPrice: 0.15,
    electricitySource: "Nova Scotia Power residential rate, approx.",
  },
};

export const AU_CITY_DATA: Record<string, CityLocalData> = {
  sydney: {
    price: 2.378,
    priceSource: "NSW average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Wollongong", distance: 84 },
    electricityPrice: 0.33,
    electricitySource: "NSW residential average, approx.",
  },
  melbourne: {
    price: 2.355,
    priceSource: "VIC average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Geelong", distance: 77 },
    electricityPrice: 0.29,
    electricitySource: "VIC residential average, approx.",
  },
  brisbane: {
    price: 2.4,
    priceSource: "QLD average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Gold Coast", distance: 85 },
    electricityPrice: 0.31,
    electricitySource: "QLD residential average, approx.",
  },
  perth: {
    price: 2.39,
    priceSource: "WA average, FuelWatch-tracked",
    priceDate: "2026-09-25",
    route: { destination: "Fremantle", distance: 23 },
    electricityPrice: 0.31,
    electricitySource: "WA residential average, approx.",
  },
  adelaide: {
    price: 2.398,
    priceSource: "SA average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Victor Harbor", distance: 85 },
    electricityPrice: 0.4191,
    electricitySource: "SA regulated tariff, from 1 July 2026",
  },
  "gold-coast": {
    price: 2.4,
    priceSource: "QLD average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Brisbane", distance: 85 },
    electricityPrice: 0.31,
    electricitySource: "QLD residential average, approx.",
  },
  canberra: {
    price: 2.378,
    priceSource: "NSW/ACT average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Goulburn", distance: 90 },
    electricityPrice: 0.3,
    electricitySource: "ACT residential average, approx.",
  },
  newcastle: {
    price: 2.378,
    priceSource: "NSW average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Sydney", distance: 159 },
    electricityPrice: 0.33,
    electricitySource: "NSW residential average, approx.",
  },
  hobart: {
    price: 2.405,
    priceSource: "TAS average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Launceston", distance: 200 },
    electricityPrice: 0.336,
    electricitySource: "TAS residential average, approx.",
  },
  darwin: {
    price: 2.728,
    priceSource: "NT average, fuel price tracker",
    priceDate: "2026-09-25",
    route: { destination: "Katherine", distance: 300 },
    electricityPrice: 0.28,
    electricitySource: "NT residential average, approx.",
  },
};

export const CITY_DATA_BY_COUNTRY: Record<string, Record<string, CityLocalData>> = {
  US: US_CITY_DATA,
  GB: GB_CITY_DATA,
  CA: CA_CITY_DATA,
  AU: AU_CITY_DATA,
};

/** Real national averages (not a per-city figure) — used on each country's homepage,
 * which isn't tied to one city, so a national number is the honest choice there. */
export const NATIONAL_EXAMPLE_BY_COUNTRY: Record<string, { price: number; sourceLabel: string }> = {
  US: { price: 4.49, sourceLabel: "AAA national average, Sep 25, 2026" },
  GB: { price: 1.736, sourceLabel: "RAC Fuel Watch, UK average, Sep 24, 2026" },
  CA: { price: 1.87, sourceLabel: "National average, Sep 2026" },
  AU: { price: 2.399, sourceLabel: "National average, Sep 25, 2026" },
};
