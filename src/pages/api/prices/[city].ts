import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { resolveCityPrices } from "../../../lib/prices";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const citySlug = params.city;
  if (!citySlug) {
    return new Response(JSON.stringify({ error: "city parameter required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const resolved = await resolveCityPrices(env, citySlug);
  return new Response(JSON.stringify(resolved), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
};
