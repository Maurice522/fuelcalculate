// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

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

/**
 * Cloudflare serves prerendered pages as a bare "text/html" with no charset. The pages
 * already declare UTF-8 in a <meta> tag, but SEO audits (rightly) also want it in the
 * HTTP header. This appends a Content-Type rule for the HTML pages to the build's
 * `_headers` file. Only directories that contain nothing but HTML get a splat rule —
 * a catch-all would also stamp text/html on images, CSS and JS.
 */
const htmlCharsetHeaders = {
  name: 'html-charset-headers',
  hooks: {
    /** @param {{ dir: URL }} options */
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      /** @param {string} d @returns {string[]} */
      const walk = (d) =>
        readdirSync(d, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]
        );
      const files = walk(root).map((f) => relative(root, f).split(sep).join('/'));
      /** @type {Record<string, { html: number; other: number }>} */
      const bySection = {};
      const exact = new Set();
      for (const f of files) {
        const parts = f.split('/');
        const isHtml = f.endsWith('.html');
        if (parts.length === 1) {
          if (isHtml) exact.add(f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`);
          continue;
        }
        const section = parts[0];
        bySection[section] ??= { html: 0, other: 0 };
        bySection[section][isHtml ? 'html' : 'other']++;
        if (isHtml && parts.length === 2 && parts[1] === 'index.html') exact.add(`/${section}/`);
      }
      const rules = [];
      for (const [section, counts] of Object.entries(bySection)) {
        if (counts.html > 0 && counts.other === 0) rules.push(`/${section}/*`);
      }
      // Top-level pages whose section also holds non-HTML files get exact rules instead.
      for (const path of exact) {
        const section = path.split('/')[1];
        if (path === '/' || !rules.includes(`/${section}/*`)) rules.push(path);
      }
      const headersPath = join(root, '_headers');
      const existing = existsSync(headersPath) ? readFileSync(headersPath, 'utf-8').trimEnd() + '\n\n' : '';
      const block = rules.map((r) => `${r}\n  Content-Type: text/html; charset=utf-8`).join('\n');
      writeFileSync(headersPath, existing + block + '\n');
    },
  },
};

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
    htmlCharsetHeaders,
  ]
});