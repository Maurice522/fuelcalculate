import type { CountryCode } from "../lib/countries";

export interface Faq {
  q: string;
  a: string;
}

/** Per-country homepage FAQ content — deliberately not a straight translation of one
 * list. Each country only gets questions about fuel types it actually offers (no E20
 * or CNG outside India, no LPG for US/CA), and uses that country's real currency/unit
 * terminology (mpg/gallon for the US, km/l/litre elsewhere) rather than converting India's
 * figures. */
export const FAQS_BY_COUNTRY: Record<CountryCode, Faq[]> = {
  IN: [
    {
      q: "How much fuel will my car use?",
      a: "Enter your trip distance and your car's mileage (in km/l) into the fuel calculator above, and it works out exactly how many litres you'll use — no guessing. If you don't know your car's exact mileage, pick your model from the vehicle list and it fills in automatically.",
    },
    {
      q: "How much fuel do I need for my trip?",
      a: "Fuel needed = trip distance ÷ your vehicle's mileage. The calculator does this instantly once you enter your distance and pick your vehicle (or type in your own mileage) — for a round trip, just tick \"Round trip\" and it doubles the distance automatically.",
    },
    {
      q: "How much will my fuel cost?",
      a: "Fuel cost = (distance ÷ mileage) × price per litre. Pick your city to auto-fill today's petrol, diesel, CNG, E20 or EV price, enter your distance, and the calculator shows your exact trip cost in real time.",
    },
    {
      q: "How do I calculate my fuel consumption?",
      a: "Fuel consumption is your distance travelled divided by your vehicle's mileage. This fuel calculator works it out for you — enter your distance and either select your vehicle or type in your mileage, and it shows your consumption in litres (or kWh for EVs) instantly.",
    },
    {
      q: "How much fuel is required for 1 km?",
      a: "Fuel per km = 1 ÷ mileage (km/l). For example, a car doing 15 km/l uses about 0.067 litres per km. Enter your vehicle's mileage into the calculator and it shows your exact per-km cost and consumption automatically.",
    },
    {
      q: "Is my car compatible with E20 petrol?",
      a: "Most petrol cars manufactured in India since 2023 are E20-compatible by default, and many older BS-VI petrol vehicles can run on E20 too — check your owner's manual or the fuel-filler cap for an E20-compatible label to be sure. If your car isn't explicitly rated for E20, check with your manufacturer before switching, since ethanol blends above E10 can affect fuel lines and seals in some older engines.",
    },
    {
      q: "How much lower is my mileage with E20 fuel?",
      a: "E20 typically reduces mileage by around 6% compared to pure petrol, since ethanol has a lower calorific value — the commonly cited ARAI/SIAM estimate. This E20 fuel calculator estimates your E20 mileage from your car's petrol figure automatically, so you see the real number for your own vehicle rather than a generic percentage.",
    },
    {
      q: "How much extra does E20 fuel cost me per month?",
      a: "It depends on your monthly distance and the price gap between petrol and E20 in your city — E20 is usually priced a little below petrol, which can offset some of the mileage drop. Enter your E20 mileage and price into the monthly budget tool to see the exact extra (or saved) amount per month for your own driving.",
    },
    {
      q: "How do I calculate E20 fuel consumption?",
      a: "E20 consumption works the same way as any other fuel: distance ÷ E20 mileage. Select E20 as your fuel type and pick your vehicle, and this E20 fuel calculator estimates your E20 mileage from your car's petrol figure using the standard ~6% efficiency drop, so you don't have to guess.",
    },
    {
      q: "What is the cost difference between E10 and E20 fuel?",
      a: "Most Indian pumps have moved from E10 to E20, so \"petrol\" in this calculator reflects whatever blend is currently at your pump. E20 is typically priced slightly below plain petrol but gives slightly lower mileage, so the real cost difference depends on your vehicle's efficiency drop and the local price gap — use the petrol vs E20 comparison tool with your own price and mileage for the exact ₹ and % difference rather than a generic industry figure.",
    },
    {
      q: "Which fuel is cheaper per km: Petrol vs Diesel?",
      a: "It depends on your specific vehicle and local fuel prices — diesel is usually cheaper per litre than petrol, but that doesn't always mean cheaper per km, since mileage differs by vehicle. Use the petrol vs diesel comparison tool with your own vehicle's mileage and city prices to get the real answer instead of a general rule of thumb.",
    },
    {
      q: "How much money will I save by switching to CNG or EV?",
      a: "CNG and EV are usually significantly cheaper per km than petrol or diesel, but the exact savings depend on your driving distance, local fuel or electricity prices, and your vehicle's efficiency. Set up petrol vs CNG or petrol vs EV in the comparison tool to see the exact ₹ and % savings for your own numbers, then check the monthly budget tool to see what that adds up to over a year.",
    },
    {
      q: "How do I compare the total fuel cost of two vehicles?",
      a: "The comparison tool lets you set up two calculators side by side — pick a different vehicle (and fuel type, if needed) in each for the same distance, and it shows the exact cost, cost per km, and the ₹ and % difference between them, colour-coded so the cheaper option is obvious at a glance.",
    },
    {
      q: "How do I calculate my monthly fuel expenses?",
      a: "Enter your typical daily distance, how many trips you make per day, and how many days a month you actually drive into the monthly budget tool — it multiplies these out using your vehicle's mileage and current fuel price to give you a real daily, monthly and yearly cost, not a rough estimate.",
    },
    {
      q: "How much will I spend on fuel per month based on daily commute?",
      a: "Monthly fuel cost = (distance per trip × trips per day × days per month) ÷ mileage × price per unit. The monthly budget calculator works this out automatically — just enter your commute distance, trips per day, and your vehicle's mileage and fuel price.",
    },
    {
      q: "How do I calculate my monthly fuel budget?",
      a: "Use the monthly projection tool: enter your daily commute distance, trips per day, and the number of days you actually drive each month (not always 30), along with your vehicle's mileage and fuel price. It gives you a daily, monthly and yearly fuel budget based on your real driving pattern, not a flat assumption.",
    },
    {
      q: "How much fuel assistance will I get?",
      a: "This is a fuel cost calculator, not a fuel assistance or subsidy programme — it doesn't provide or distribute financial aid. If you're looking for a government fuel subsidy (such as the PAHAL/DBTL scheme for LPG in India), that's handled separately by your fuel provider or the relevant government department, not through this tool.",
    },
  ],
  US: [
    {
      q: "How much gas will my car use?",
      a: "Enter your trip distance and your car's fuel economy (in mpg) into the calculator above, and it works out exactly how many gallons you'll burn — no guessing. If you don't know your car's exact mpg, pick your model from the vehicle list and it fills in automatically.",
    },
    {
      q: "How much gas do I need for my trip?",
      a: "Gallons needed = trip distance ÷ your vehicle's mpg. The calculator does this instantly once you enter your distance and pick your vehicle (or type in your own mpg) — for a round trip, just tick \"Round trip\" and it doubles the distance automatically.",
    },
    {
      q: "How much will my trip cost in gas?",
      a: "Trip cost = (distance ÷ mpg) × price per gallon. Enter today's gas price at your local pump along with your distance, and the calculator shows your exact trip cost in real time.",
    },
    {
      q: "How do I calculate my fuel consumption?",
      a: "Fuel consumption is your distance travelled divided by your vehicle's mpg. This fuel calculator works it out for you — enter your distance and either select your vehicle or type in your mpg, and it shows your consumption in gallons (or kWh for EVs) instantly.",
    },
    {
      q: "How much gas is used per mile?",
      a: "Gallons per mile = 1 ÷ mpg. For example, a car rated at 30 mpg uses about 0.033 gallons per mile. Enter your vehicle's mpg into the calculator and it shows your exact per-mile cost and consumption automatically.",
    },
    {
      q: "Which is cheaper per mile: Gas vs Diesel?",
      a: "It depends on your specific vehicle and local pump prices — diesel is often priced higher than gas per gallon in the US, but diesel engines also tend to get better mpg, so the per-mile cost isn't automatic either way. Use the gas vs diesel comparison tool with your own vehicle's mpg and local prices to get the real answer instead of a rule of thumb.",
    },
    {
      q: "How much will I save switching to an EV?",
      a: "EVs are usually significantly cheaper to run per mile than gas or diesel, but the exact savings depend on your driving distance, local electricity rate, and your vehicle's efficiency (kWh/100mi). Set up gas vs EV in the comparison tool to see the exact $ and % savings for your own numbers, then check the monthly budget tool to see what that adds up to over a year.",
    },
    {
      q: "How do I compare the total fuel cost of two vehicles?",
      a: "The comparison tool lets you set up two calculators side by side — pick a different vehicle (and fuel type, if needed) in each for the same distance, and it shows the exact cost, cost per mile, and the $ and % difference between them, colour-coded so the cheaper option is obvious at a glance.",
    },
    {
      q: "How do I calculate my monthly gas expenses?",
      a: "Enter your typical daily distance, how many trips you make per day, and how many days a month you actually drive into the monthly budget tool — it multiplies these out using your vehicle's mpg and current gas price to give you a real daily, monthly and yearly cost, not a rough estimate.",
    },
    {
      q: "How much will I spend on gas per month based on daily commute?",
      a: "Monthly fuel cost = (distance per trip × trips per day × days per month) ÷ mpg × price per gallon. The monthly budget calculator works this out automatically — just enter your commute distance, trips per day, and your vehicle's mpg and gas price.",
    },
    {
      q: "What if I don't know my car's exact mpg?",
      a: "Pick your make and model from the vehicle list and this fuel calculator fills in a real EPA-based mpg figure automatically — for cars and trucks alike, including diesel pickups. If your exact trim isn't listed, enter your own mpg (check your owner's manual or dashboard trip computer) and every calculation still works the same way.",
    },
    {
      q: "How is this different from the AAA fuel cost calculator?",
      a: "This tool isn't affiliated with AAA — it's an independent, free fuel calculator that lets you plug in your own vehicle's mpg, your own gas price, and get a comparison against diesel or EV running costs side by side, plus a monthly budget projection, rather than just a single trip-cost estimate.",
    },
  ],
  GB: [
    {
      q: "How much fuel will my car use?",
      a: "Enter your trip distance and your car's mileage into the calculator above, and it works out exactly how much fuel you'll use — no guessing. If you don't know your car's exact mileage, pick your model from the vehicle list and it fills in automatically.",
    },
    {
      q: "How much fuel do I need for my trip?",
      a: "Fuel needed = trip distance ÷ your vehicle's mileage. The calculator does this instantly once you enter your distance and pick your vehicle (or type in your own mileage) — for a round trip, just tick \"Round trip\" and it doubles the distance automatically.",
    },
    {
      q: "How much will my fuel cost?",
      a: "Fuel cost = (distance ÷ mileage) × price per litre. Enter today's petrol or diesel price along with your distance, and the calculator shows your exact trip cost in real time.",
    },
    {
      q: "How do I calculate my fuel consumption?",
      a: "Fuel consumption is your distance travelled divided by your vehicle's mileage. This fuel calculator works it out for you — enter your distance and either select your vehicle or type in your mileage, and it shows your consumption in litres (or kWh for EVs) instantly.",
    },
    {
      q: "Which is cheaper: Petrol vs Diesel?",
      a: "It depends on your specific vehicle and local pump prices — diesel is often priced close to or above petrol per litre in the UK, but diesel engines also tend to get better mileage, so the real per-mile cost isn't automatic either way. Use the petrol vs diesel comparison tool with your own vehicle's mileage and local prices to get the real answer.",
    },
    {
      q: "Is switching to LPG (Autogas) worth it?",
      a: "LPG is usually priced well below petrol and diesel at UK forecourts, but converted vehicles typically use somewhat more fuel per mile to compensate. Set up petrol vs LPG in the comparison tool with your own price and mileage figures to see the exact £ and % saving for your own driving before deciding.",
    },
    {
      q: "How much will I save switching to an EV?",
      a: "EVs are usually significantly cheaper to run than petrol or diesel, but the exact savings depend on your driving distance, your electricity tariff, and your vehicle's efficiency. Set up petrol vs EV in the comparison tool to see the exact £ and % savings for your own numbers, then check the monthly budget tool to see what that adds up to over a year.",
    },
    {
      q: "How do I compare the total fuel cost of two vehicles?",
      a: "The comparison tool lets you set up two calculators side by side — pick a different vehicle (and fuel type, if needed) in each for the same distance, and it shows the exact cost, cost per mile, and the £ and % difference between them, colour-coded so the cheaper option is obvious at a glance.",
    },
    {
      q: "How do I calculate my monthly fuel expenses?",
      a: "Enter your typical daily distance, how many trips you make per day, and how many days a month you actually drive into the monthly budget tool — it multiplies these out using your vehicle's mileage and current fuel price to give you a real daily, monthly and yearly cost, not a rough estimate.",
    },
    {
      q: "How much will I spend on fuel per month based on daily commute?",
      a: "Monthly fuel cost = (distance per trip × trips per day × days per month) ÷ mileage × price per litre. The monthly budget calculator works this out automatically — just enter your commute distance, trips per day, and your vehicle's mileage and fuel price.",
    },
    {
      q: "How do I calculate my monthly fuel budget?",
      a: "Use the monthly projection tool: enter your daily commute distance, trips per day, and the number of days you actually drive each month (not always 30), along with your vehicle's mileage and fuel price. It gives you a daily, monthly and yearly fuel budget based on your real driving pattern, not a flat assumption.",
    },
    {
      q: "What if I don't know my car's exact fuel consumption?",
      a: "Pick your make and model from the vehicle list and this fuel calculator fills in a representative mileage figure automatically. If your exact trim isn't listed, enter your own mileage (check your owner's manual or trip computer) and every calculation still works the same way.",
    },
  ],
  CA: [
    {
      q: "How much fuel will my car use?",
      a: "Enter your trip distance and your car's mileage into the calculator above, and it works out exactly how much fuel you'll use — no guessing. If you don't know your car's exact mileage, pick your model from the vehicle list and it fills in automatically.",
    },
    {
      q: "How much fuel do I need for my trip?",
      a: "Fuel needed = trip distance ÷ your vehicle's mileage. The calculator does this instantly once you enter your distance and pick your vehicle (or type in your own mileage) — for a round trip, just tick \"Round trip\" and it doubles the distance automatically.",
    },
    {
      q: "How much will my fuel cost?",
      a: "Fuel cost = (distance ÷ mileage) × price per litre. Enter today's gas or diesel price along with your distance, and the calculator shows your exact trip cost in real time.",
    },
    {
      q: "How do I calculate my fuel consumption?",
      a: "Fuel consumption is your distance travelled divided by your vehicle's mileage. This fuel calculator works it out for you — enter your distance and either select your vehicle or type in your mileage, and it shows your consumption in litres (or kWh for EVs) instantly.",
    },
    {
      q: "Which is cheaper: Gas vs Diesel?",
      a: "It depends on your specific vehicle and local pump prices — diesel is often priced close to or above gasoline per litre in Canada, but diesel engines also tend to get better mileage, so the real per-km cost isn't automatic either way. Use the gas vs diesel comparison tool with your own vehicle's mileage and local prices to get the real answer.",
    },
    {
      q: "How much will I save switching to an EV?",
      a: "EVs are usually significantly cheaper to run than gas or diesel, but the exact savings depend on your driving distance, your electricity rate, and your vehicle's efficiency. Set up gas vs EV in the comparison tool to see the exact $ and % savings for your own numbers, then check the monthly budget tool to see what that adds up to over a year.",
    },
    {
      q: "How do I compare the total fuel cost of two vehicles?",
      a: "The comparison tool lets you set up two calculators side by side — pick a different vehicle (and fuel type, if needed) in each for the same distance, and it shows the exact cost, cost per km, and the $ and % difference between them, colour-coded so the cheaper option is obvious at a glance.",
    },
    {
      q: "How do I calculate my monthly fuel expenses?",
      a: "Enter your typical daily distance, how many trips you make per day, and how many days a month you actually drive into the monthly budget tool — it multiplies these out using your vehicle's mileage and current fuel price to give you a real daily, monthly and yearly cost, not a rough estimate.",
    },
    {
      q: "How much will I spend on fuel per month based on daily commute?",
      a: "Monthly fuel cost = (distance per trip × trips per day × days per month) ÷ mileage × price per litre. The monthly budget calculator works this out automatically — just enter your commute distance, trips per day, and your vehicle's mileage and fuel price.",
    },
    {
      q: "How do I calculate my monthly fuel budget?",
      a: "Use the monthly projection tool: enter your daily commute distance, trips per day, and the number of days you actually drive each month (not always 30), along with your vehicle's mileage and fuel price. It gives you a daily, monthly and yearly fuel budget based on your real driving pattern, not a flat assumption.",
    },
    {
      q: "What if I don't know my car's exact fuel consumption?",
      a: "Pick your make and model from the vehicle list and this fuel calculator fills in a representative mileage figure automatically. If your exact trim isn't listed, enter your own mileage (check your owner's manual or trip computer) and every calculation still works the same way.",
    },
  ],
  AU: [
    {
      q: "How much fuel will my car use?",
      a: "Enter your trip distance and your car's mileage into the calculator above, and it works out exactly how much fuel you'll use — no guessing. If you don't know your car's exact mileage, pick your model from the vehicle list and it fills in automatically.",
    },
    {
      q: "How much fuel do I need for my trip?",
      a: "Fuel needed = trip distance ÷ your vehicle's mileage. The calculator does this instantly once you enter your distance and pick your vehicle (or type in your own mileage) — for a round trip, just tick \"Round trip\" and it doubles the distance automatically.",
    },
    {
      q: "How much will my fuel cost?",
      a: "Fuel cost = (distance ÷ mileage) × price per litre. Enter today's unleaded or diesel price along with your distance, and the calculator shows your exact trip cost in real time.",
    },
    {
      q: "How do I calculate my fuel consumption?",
      a: "Fuel consumption is your distance travelled divided by your vehicle's mileage. This fuel calculator works it out for you — enter your distance and either select your vehicle or type in your mileage, and it shows your consumption in litres (or kWh for EVs) instantly.",
    },
    {
      q: "Which is cheaper: Unleaded vs Diesel?",
      a: "It depends on your specific vehicle and local pump prices — diesel is often priced close to or above unleaded per litre in Australia, but diesel engines also tend to get better mileage, so the real per-km cost isn't automatic either way. Use the unleaded vs diesel comparison tool with your own vehicle's mileage and local prices to get the real answer.",
    },
    {
      q: "Is switching to LPG (Autogas) worth it?",
      a: "LPG is usually priced well below unleaded and diesel at Australian pumps, but converted vehicles typically use somewhat more fuel per km to compensate. Set up unleaded vs LPG in the comparison tool with your own price and mileage figures to see the exact $ and % saving for your own driving before deciding.",
    },
    {
      q: "How much will I save switching to an EV?",
      a: "EVs are usually significantly cheaper to run than unleaded or diesel, but the exact savings depend on your driving distance, your electricity rate, and your vehicle's efficiency. Set up unleaded vs EV in the comparison tool to see the exact $ and % savings for your own numbers, then check the monthly budget tool to see what that adds up to over a year.",
    },
    {
      q: "How do I compare the total fuel cost of two vehicles?",
      a: "The comparison tool lets you set up two calculators side by side — pick a different vehicle (and fuel type, if needed) in each for the same distance, and it shows the exact cost, cost per km, and the $ and % difference between them, colour-coded so the cheaper option is obvious at a glance.",
    },
    {
      q: "How do I calculate my monthly fuel expenses?",
      a: "Enter your typical daily distance, how many trips you make per day, and how many days a month you actually drive into the monthly budget tool — it multiplies these out using your vehicle's mileage and current fuel price to give you a real daily, monthly and yearly cost, not a rough estimate.",
    },
    {
      q: "How much will I spend on fuel per month based on daily commute?",
      a: "Monthly fuel cost = (distance per trip × trips per day × days per month) ÷ mileage × price per litre. The monthly budget calculator works this out automatically — just enter your commute distance, trips per day, and your vehicle's mileage and fuel price.",
    },
    {
      q: "How do I calculate my monthly fuel budget?",
      a: "Use the monthly projection tool: enter your daily commute distance, trips per day, and the number of days you actually drive each month (not always 30), along with your vehicle's mileage and fuel price. It gives you a daily, monthly and yearly fuel budget based on your real driving pattern, not a flat assumption.",
    },
    {
      q: "What if I don't know my car's exact fuel consumption?",
      a: "Pick your make and model from the vehicle list and this fuel calculator fills in a representative mileage figure automatically. If your exact trim isn't listed, enter your own mileage (check your owner's manual or trip computer) and every calculation still works the same way.",
    },
  ],
};
