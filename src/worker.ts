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

export default {
  async fetch(request, env, ctx) {
    return withEdgeCache(request, ctx, () => handle(request, env, ctx));
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
