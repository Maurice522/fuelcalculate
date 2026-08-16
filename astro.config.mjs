// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const cities = JSON.parse(
  readFileSync(fileURLToPath(new URL('./src/data/cities.json', import.meta.url)), 'utf-8')
);

// City pages render on-demand (live price lookups), so the sitemap integration
// can't discover them by crawling prerendered output like it does every other
// route — list them explicitly instead.
const cityPages = cities.cities.map(
  /** @param {{ slug: string }} city */
  (city) => `https://fuelcalculate.com/city/${city.slug}/`
);

// https://astro.build/config
export default defineConfig({
  site: 'https://fuelcalculate.com',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare(),

  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      customPages: cityPages,
    }),
  ]
});