/**
 * Scrapes daily city-wise petrol/diesel prices from goodreturns.in.
 *
 * Why this source and not an OMC's own site: IOCL's public price page sits behind a
 * Sucuri JS challenge (verified — a plain fetch gets a cookie-challenge shell, no
 * headless browser is affordable on the Workers free plan). BPCL's page delegates to
 * an external JS-driven locator tool with no server-rendered city table. HPCL's price
 * page returned 403 to a direct fetch. goodreturns.in serves a clean, server-rendered
 * `table.gr-table` with city name + price on every request, robots.txt allows both
 * `/petrol-price.html` and `/diesel-price.html` (only a handful of unrelated paths are
 * disallowed), and it requires nothing but a normal browser User-Agent header (a bare
 * request without one gets a 403). This is a third-party aggregator rather than an
 * OMC-official source, so it's worth a periodic re-check that this is still the best
 * available option.
 *
 * E20/CNG/LPG are NOT sourced here: they aren't part of the daily city-wise price
 * revision cycle the OMCs publish the way petrol/diesel are, and goodreturns.in doesn't
 * track them per-city either. Those fuels stay on seed/manual values only — a
 * documented scope boundary, not a bug.
 */

const SOURCE_URLS: Record<"petrol" | "diesel", string> = {
  petrol: "https://www.goodreturns.in/petrol-price.html",
  diesel: "https://www.goodreturns.in/diesel-price.html",
};

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// goodreturns.in city names that differ from our src/data/cities.json slugs/names.
const CITY_NAME_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  cochin: "kochi",
  ernakulam: "kochi",
  trivandrum: "thiruvananthapuram",
  gurugram: "gurgaon",
  "new delhi": "delhi",
};

export interface ScrapedCityPrice {
  citySlug: string;
  price: number;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeCityName(rawName: string): string {
  const key = rawName.trim().toLowerCase();
  return CITY_NAME_ALIASES[key] ?? slugify(rawName);
}

function parsePrice(rawPrice: string): number | null {
  // HTMLRewriter passes numeric character references (e.g. the ₹ symbol as
  // "&#x20b9;") through as literal text rather than decoding them — strip the
  // whole entity token first, otherwise its own digits (the "20b9" in "&#x20b9;")
  // leak into the parsed number.
  const withoutEntities = rawPrice.replace(/&#?\w+;/g, "");
  const cleaned = withoutEntities.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Fetches and parses one fuel's city-price table via HTMLRewriter (a workerd runtime
 * global — zero bundle cost, streaming parse; only runs correctly inside a Cloudflare
 * Worker, which matches this module's only caller: the scheduled crawl handler).
 */
export async function fetchCityPrices(
  fuelId: "petrol" | "diesel",
): Promise<ScrapedCityPrice[]> {
  const response = await fetch(SOURCE_URLS[fuelId], {
    headers: { "User-Agent": BROWSER_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`priceSource: ${fuelId} fetch failed with status ${response.status}`);
  }

  const results: ScrapedCityPrice[] = [];
  let currentRowCells: string[] = [];
  let currentCellText = "";

  const rewriter = new HTMLRewriter()
    .on("table.gr-table tbody tr", {
      element(row) {
        currentRowCells = [];
        row.onEndTag(() => {
          // Cell text can arrive as multiple text-node fragments (e.g. whitespace
          // around a nested <span> in the "Price Change" column) — filter down to the
          // non-empty ones so positional indexing (city, price) stays reliable
          // regardless of how many stray whitespace fragments a column produced.
          const cells = currentRowCells.map((c) => c.trim()).filter(Boolean);
          if (cells.length < 2) return;
          const citySlug = normalizeCityName(cells[0]);
          const price = parsePrice(cells[1]);
          if (citySlug && price !== null) {
            results.push({ citySlug, price });
          }
        });
      },
    })
    .on("table.gr-table tbody tr td", {
      element() {
        currentCellText = "";
      },
      text(chunk) {
        currentCellText += chunk.text;
        if (chunk.lastInTextNode) {
          currentRowCells.push(currentCellText);
        }
      },
    });

  await rewriter.transform(response).arrayBuffer();
  return results;
}
