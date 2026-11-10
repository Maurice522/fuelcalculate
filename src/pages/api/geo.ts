import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Diagnostic: shows what the Worker sees for country detection on this request, so a
 * "the redirect didn't happen" report can be traced to its actual cause (a stale
 * `country` cookie, Cloudflare reporting a different country for the visitor's IP, or
 * the geo data being unavailable). Reveals nothing beyond the caller's own request.
 */
export const GET: APIRoute = ({ request, cookies }) => {
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  return new Response(
    JSON.stringify(
      {
        cfCountry: cf?.country ?? null,
        headerCountry: request.headers.get("CF-IPCountry"),
        countryCookie: cookies.get("country")?.value ?? null,
        note: "A country cookie takes priority over geo-detection and disables the one-time redirect.",
      },
      null,
      2,
    ),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } },
  );
};
