/** City-centre coordinates (decimal degrees) for the non-India city pages, used only by
 * the visitor's own browser to find the nearest city with sourced local price data when
 * they press "Use my location". The visitor's position never leaves their device — the
 * nearest-city maths runs client-side. India's coordinates live in cities.json. */
export const CITY_COORDINATES: Record<string, Record<string, { lat: number; lng: number }>> = {
  US: {
    "new-york": { lat: 40.7128, lng: -74.006 },
    "los-angeles": { lat: 34.0522, lng: -118.2437 },
    chicago: { lat: 41.8781, lng: -87.6298 },
    houston: { lat: 29.7604, lng: -95.3698 },
    phoenix: { lat: 33.4484, lng: -112.074 },
    philadelphia: { lat: 39.9526, lng: -75.1652 },
    seattle: { lat: 47.6062, lng: -122.3321 },
    denver: { lat: 39.7392, lng: -104.9903 },
    atlanta: { lat: 33.749, lng: -84.388 },
    boston: { lat: 42.3601, lng: -71.0589 },
  },
  GB: {
    london: { lat: 51.5074, lng: -0.1278 },
    birmingham: { lat: 52.4862, lng: -1.8904 },
    manchester: { lat: 53.4808, lng: -2.2426 },
    glasgow: { lat: 55.8642, lng: -4.2518 },
    liverpool: { lat: 53.4084, lng: -2.9916 },
    leeds: { lat: 53.8008, lng: -1.5491 },
    edinburgh: { lat: 55.9533, lng: -3.1883 },
    bristol: { lat: 51.4545, lng: -2.5879 },
    cardiff: { lat: 51.4816, lng: -3.1791 },
    belfast: { lat: 54.5973, lng: -5.9301 },
  },
  CA: {
    toronto: { lat: 43.6532, lng: -79.3832 },
    montreal: { lat: 45.5019, lng: -73.5674 },
    vancouver: { lat: 49.2827, lng: -123.1207 },
    calgary: { lat: 51.0447, lng: -114.0719 },
    edmonton: { lat: 53.5461, lng: -113.4938 },
    ottawa: { lat: 45.4215, lng: -75.6972 },
    winnipeg: { lat: 49.8951, lng: -97.1384 },
    "quebec-city": { lat: 46.8139, lng: -71.208 },
    hamilton: { lat: 43.2557, lng: -79.8711 },
    halifax: { lat: 44.6488, lng: -63.5752 },
  },
  AU: {
    sydney: { lat: -33.8688, lng: 151.2093 },
    melbourne: { lat: -37.8136, lng: 144.9631 },
    brisbane: { lat: -27.4698, lng: 153.0251 },
    perth: { lat: -31.9505, lng: 115.8605 },
    adelaide: { lat: -34.9285, lng: 138.6007 },
    "gold-coast": { lat: -28.0167, lng: 153.4 },
    canberra: { lat: -35.2809, lng: 149.13 },
    newcastle: { lat: -32.9283, lng: 151.7817 },
    hobart: { lat: -42.8821, lng: 147.3272 },
    darwin: { lat: -12.4634, lng: 130.8456 },
  },
};
