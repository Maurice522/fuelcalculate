import { handle } from "@astrojs/cloudflare/handler";
import { runPriceCrawl } from "./lib/priceCrawler";

// City pages and the price API render from KV-backed data that only changes when the
// 4-hourly crawler runs, so a short edge cache removes most KV reads and page renders.
// Only bare URLs are cached (a query string means a visitor-specific prefilled
// calculator) and only successful responses.
const CACHEABLE_PATH = /^\/(?:city\/[a-z0-9-]+\/?|api\/prices\/[a-z0-9-]+)$/;
const EDGE_CACHE_SECONDS = 300;

async function withEdgeCache(
  request: Request,
  ctx: ExecutionContext,
  render: () => Promise<Response>,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.search || !CACHEABLE_PATH.test(url.pathname)) return render();

  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(url.toString(), { method: "GET" });
  const hit = await cache.match(key);
  if (hit) return hit;

  const response = await render();
  if (response.status !== 200 || response.headers.has("set-cookie")) return response;

  const cacheable = new Response(response.body, response);
  cacheable.headers.set("cache-control", `public, max-age=${EDGE_CACHE_SECONDS}`);
  ctx.waitUntil(cache.put(key, cacheable.clone()));
  return cacheable;
}

const CANONICAL_HOST = "fuelcalculate.com";

/** One canonical origin: https + no "www". Applies to requests that reach the Worker
 * (the homepage, city pages, the APIs); static pages are covered by the Cloudflare
 * "Always Use HTTPS" setting and a www -> apex Redirect Rule. Other hosts (localhost,
 * *.workers.dev previews) are left alone. */
function canonicalRedirect(url: URL): Response | null {
  const onSite = url.hostname === CANONICAL_HOST || url.hostname === `www.${CANONICAL_HOST}`;
  if (!onSite || (url.hostname === CANONICAL_HOST && url.protocol === "https:")) return null;
  return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
}

/** Astro sends HTML as a bare "text/html"; declare the charset in the header too. */
function withHtmlCharset(response: Response): Response {
  const type = response.headers.get("content-type") ?? "";
  if (!/^text\/html\s*$/i.test(type)) return response;
  const fixed = new Response(response.body, response);
  fixed.headers.set("content-type", "text/html; charset=utf-8");
  return fixed;
}

export default {
  async fetch(request, env, ctx) {
    const redirect = canonicalRedirect(new URL(request.url));
    if (redirect) return redirect;
    return withHtmlCharset(await withEdgeCache(request, ctx, () => handle(request, env, ctx)));
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      runPriceCrawl(env)
        .then((result) => {
          console.log("price crawl complete", result);
        })
        .catch((err) => {
          console.error("price crawl failed", err);
        }),
    );
  },
} satisfies ExportedHandler<Env>;
