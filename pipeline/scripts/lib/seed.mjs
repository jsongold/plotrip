// Seed cities for Plotrip ETL. IDs are resolved at runtime by querying
// catalog_cities by name (see resolveCityId in supa.mjs). Do not hardcode IDs.
export const SEED_CITIES = [
  { name: 'Tokyo',         country: 'Japan',          lat: 35.6762, lng: 139.6503 },
  { name: 'Lisbon',        country: 'Portugal',       lat: 38.7223, lng: -9.1393  },
  { name: 'Reykjavik',     country: 'Iceland',        lat: 64.1466, lng: -21.9426 },
  { name: 'Bangkok',       country: 'Thailand',       lat: 13.7563, lng: 100.5018 },
  { name: 'Cape Town',     country: 'South Africa',   lat: -33.9249, lng: 18.4241 },
  { name: 'New York',      country: 'United States',  lat: 40.7128, lng: -74.0060 },
  { name: 'Kyoto',         country: 'Japan',          lat: 35.0116, lng: 135.7681 },
  { name: 'Denpasar',      country: 'Indonesia',      lat: -8.6705, lng: 115.2126 }, // Bali
  { name: 'Cairo',         country: 'Egypt',          lat: 30.0444, lng: 31.2357  },
  { name: 'Buenos Aires',  country: 'Argentina',      lat: -34.6037, lng: -58.3816 },
  { name: 'Stockholm',     country: 'Sweden',         lat: 59.3293, lng: 18.0686  },
  { name: 'Helsinki',      country: 'Finland',        lat: 60.1699, lng: 24.9384  },
  { name: 'Split',         country: 'Croatia',        lat: 43.5081, lng: 16.4402  },
];
