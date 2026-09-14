import type { CountryCode } from "../lib/countries";

/** One genuine, fact-checked paragraph of local driving/climate/policy context per
 * city — not a template with the name swapped. Each fact is either a well-established,
 * safely general characteristic (climate, geography, capital status) or a specific,
 * verified real-world policy (e.g. London's ULEZ, Birmingham's and Bristol's Clean Air
 * Zones, Glasgow's LEZ, NYC's congestion charge) — no invented statistics. Keyed by
 * `${countryCode}_${citySlug}`. */
export const CITY_FACTS: Partial<Record<string, string>> = {
  // United States
  "US_new-york":
    "New York is a dense, transit-heavy city where a lot of driving is short and stop-start — real-world fuel economy in the boroughs is usually well below highway figures. Manhattan below 60th Street also carries a congestion charge for entering by car, a real added cost worth factoring in alongside fuel for anyone driving into the city centre.",
  "US_los-angeles":
    "Los Angeles is one of the most car-dependent major cities in the country, built around a vast freeway network — long commute distances are the norm, and the mostly dry, hot climate means air conditioning runs often enough to measurably affect real-world fuel economy versus a rated figure.",
  US_chicago:
    "Chicago's cold winters mean more short trips starting from a cold engine, which is when fuel economy is at its worst — combined with dense stop-start traffic downtown, real-world mileage in Chicago often comes in lower than a summer highway figure would suggest.",
  US_houston:
    "Houston is a famously sprawling city with no formal zoning and correspondingly long typical drive distances, in a hot, humid climate where air conditioning is close to a year-round necessity rather than an occasional cost.",
  US_phoenix:
    "Phoenix sits in a desert climate with genuinely extreme summer heat — air conditioning load is heavy enough that real-world fuel economy during Phoenix summers is often noticeably worse than a vehicle's rated figure, worth accounting for rather than assuming a flat number year-round.",
  US_philadelphia:
    "Philadelphia's older, dense East Coast street grid means a lot of stop-start driving and limited highway-speed stretches within the city itself, both of which pull real-world mileage below what a highway-rated figure would suggest.",
  US_seattle:
    "Seattle's hilly terrain and frequent rain both work against fuel economy compared with flat, dry driving — combined with well-known traffic congestion, actual mileage in Seattle often runs behind a vehicle's official rating.",
  US_denver:
    "Denver's nickname, the \"Mile High City,\" isn't just branding — the elevation genuinely means thinner air, which can measurably affect a naturally aspirated engine's performance and efficiency compared with sea-level driving, on top of cold winters that add their own cold-start penalty.",
  US_atlanta:
    "Atlanta is a major highway hub known for some of the heaviest highway traffic in the country, in a humid subtropical climate — long highway commutes and frequent air conditioning use are both typical here.",
  US_boston:
    "Boston is dense, historic, and narrow in its street layout, with traffic congestion that regularly ranks among the worst in the US — real-world city driving here tends to sit well below highway-rated mileage.",

  // United Kingdom
  GB_london:
    "London's Ultra Low Emission Zone (ULEZ) covers the whole of Greater London and charges non-compliant vehicles a daily fee to drive within it — a real cost to factor in alongside fuel if your vehicle doesn't meet the emissions standard, on top of famously heavy traffic congestion.",
  GB_birmingham:
    "Birmingham operates a Clean Air Zone charging non-compliant cars, taxis and vans a daily fee to drive within it — worth checking your vehicle's compliance before assuming fuel is the only running cost of driving into the city centre.",
  GB_manchester:
    "Manchester is a major English city with dense inner-ring traffic and a well-developed public transport network as an alternative for the kind of short trips that are least fuel-efficient by car.",
  GB_glasgow:
    "Glasgow enforces a Low Emission Zone with penalties for non-compliant vehicles rather than a pay-to-enter option — a real, separate cost consideration from fuel for anyone driving an older vehicle into the city.",
  GB_liverpool:
    "Liverpool is a dense port city with a mix of historic narrow streets and modern ring roads, where typical driving is a mix of short urban trips rather than sustained highway distance.",
  GB_leeds:
    "Leeds is a major Yorkshire city with significant commuter traffic on its ring road network, typical of stop-start driving that runs below highway-rated fuel economy.",
  GB_edinburgh:
    "Edinburgh, Scotland's capital, has a compact, hilly old-town core where most driving is short-distance and low-speed — conditions that generally favour public transport or walking over a car for inner-city trips.",
  GB_bristol:
    "Bristol operates a Clean Air Zone charging non-compliant vehicles, including private cars, a daily fee to enter the zone — a real, separate cost from fuel worth checking your vehicle against before you drive in.",
  GB_cardiff:
    "Cardiff, the capital of Wales, has a relatively compact city centre where most local driving is short-distance rather than the longer, steadier trips where fuel efficiency tends to be best.",
  GB_belfast:
    "Belfast, the capital of Northern Ireland, has a road network shaped by its coastal and hilly surroundings — typical driving here mixes urban stop-start trips with longer rural routes to the surrounding countryside.",

  // Canada
  CA_toronto:
    "Toronto, Ontario's capital and Canada's largest city, has dense downtown traffic and a well-used transit system — short, stop-start city trips are the norm for most local driving here, well below highway-rated efficiency.",
  CA_montreal:
    "Montreal, Quebec's largest city, has cold winters that impose a real cold-start efficiency penalty on petrol and diesel vehicles alike, and a reduced-range penalty specifically for EVs.",
  CA_vancouver:
    "Vancouver has a mild, wet coastal climate by Canadian standards, but a mountainous setting and well-known bridge and tunnel congestion mean typical commute times — and fuel use — run higher than the distance alone would suggest.",
  CA_calgary:
    "Calgary, Alberta's largest city, has genuinely cold winters where both engine cold-starts and EV range are measurably affected — worth accounting for if you're comparing fuel types using only a mild-weather efficiency figure.",
  CA_edmonton:
    "Edmonton, Alberta's capital, shares Calgary's cold-winter climate, where real-world fuel and energy efficiency in winter months is meaningfully lower than a fair-weather rated figure for any vehicle type.",
  CA_ottawa:
    "Ottawa, Canada's capital, has a climate of genuinely cold winters and hot summers — both ends of which increase real-world energy use, from cold starts and heating in winter to air conditioning in summer.",
  CA_winnipeg:
    "Winnipeg is known for some of the coldest winter temperatures of any major North American city — a serious real-world efficiency penalty for cold starts and for EV range that a general efficiency figure won't reflect.",
  "CA_quebec-city":
    "Quebec City, the capital of Quebec, is a compact, historic city with cold winters similar to Montreal's, where winter driving conditions measurably affect real-world fuel and energy use.",
  CA_hamilton:
    "Hamilton is an Ontario industrial city within commuting distance of Toronto, meaning many residents drive longer highway distances than a purely local commute would suggest.",
  CA_halifax:
    "Halifax, Nova Scotia's capital on the Atlantic coast, has a maritime climate and hilly street layout that make for a mix of short urban trips and longer regional highway driving.",

  // Australia
  AU_sydney:
    "Sydney, New South Wales' capital and Australia's largest city, has harbour-crossing congestion at the Harbour Bridge and tunnel adding real time and fuel to many commutes beyond straight-line distance.",
  AU_melbourne:
    "Melbourne, Victoria's capital, is well known for its tram network — one of the few Australian cities where a well-developed alternative to driving genuinely competes with car use for short inner-city trips.",
  AU_brisbane:
    "Brisbane, Queensland's capital, has a subtropical climate and genuinely hot, humid summers that keep air conditioning running enough to measurably affect real-world fuel economy.",
  AU_perth:
    "Perth, Western Australia's capital, is one of the most isolated major cities in the world — that isolation means longer supply distances for fuel, part of why regional and remote Australian pricing tends to run higher than in the eastern capitals.",
  AU_adelaide:
    "Adelaide, South Australia's capital, is a relatively compact city with a hot, dry climate in summer and generally less severe congestion than the larger eastern capitals.",
  "AU_gold-coast":
    "The Gold Coast is a coastal Queensland city built around a long, linear urban sprawl along the coastline, meaning many trips run longer than a typical single-centre city commute.",
  AU_canberra:
    "Canberra, Australia's purpose-built capital, is planned around low-density suburbs connected by arterial roads rather than a dense central grid — typical driving here favours steadier, longer trips over short stop-start ones.",
  AU_newcastle:
    "Newcastle is a New South Wales industrial and port city with commuter traffic to Sydney adding longer highway trips on top of local driving for many residents.",
  AU_hobart:
    "Hobart, Tasmania's capital, is an island city with a cooler climate than mainland Australia and hilly terrain that affects fuel use compared with flat driving.",
  AU_darwin:
    "Darwin, the Northern Territory's capital, is tropical and remote — among the most isolated of Australia's capital cities, part of why fuel and everyday costs in Darwin tend to run higher than in the southern capitals.",
};

export function getCityFact(countryCode: CountryCode, citySlug: string): string | undefined {
  return CITY_FACTS[`${countryCode}_${citySlug}`];
}
