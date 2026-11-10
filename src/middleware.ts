import { defineMiddleware } from "astro:middleware";
import { getCountryByPathSegment, SUPPORTED_COUNTRIES, type CountryConfig, type CountryCode } from "./lib/countries";

declare global {
  namespace App {
    interface Locals {
      country: CountryCode;
    }
  }
}

const COUNTRY_COOKIE = "country";
const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Search engine / social-preview crawlers must always see India's canonical, unprefixed
// content at "/" — redirecting them would be textbook cloaking and confuse indexing.
const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|preview|lighthouse|pagespeed|pingdom|uptimerobot|ahrefs|semrush|mj12bot/i;

/**
 * The visitor's country as determined by Cloudflare's edge — free, instant, no external
 * call and no rate limit (this replaced a third-party IP lookup that was capped at about
 * 45 requests a minute). `request.cf.country` and the `CF-IPCountry` header carry the
 * same ISO code; either may be absent (local `astro dev`, or an unknown/Tor visitor),
 * in which case we simply don't redirect rather than guess.
 */
function countryFromCloudflare(request: Request): CountryConfig | null {
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const code = (cf?.country ?? request.headers.get("CF-IPCountry") ?? "").toUpperCase();
  return SUPPORTED_COUNTRIES.find((c) => c.code === code) ?? null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, url } = context;

  const pathSegment = url.pathname.split("/").filter(Boolean)[0];
  const pathCountry = getCountryByPathSegment(pathSegment);
  const cookieValue = cookies.get(COUNTRY_COOKIE)?.value;
  const cookieIsValid = cookieValue && SUPPORTED_COUNTRIES.some((c) => c.code === cookieValue.toUpperCase());

  if (pathCountry) {
    context.locals.country = pathCountry.code;
    return next();
  }
  if (cookieIsValid) {
    context.locals.country = cookieValue!.toUpperCase() as CountryCode;
    return next();
  }

  context.locals.country = "IN";

  // One-time, bot-excluded redirect: only the bare India root, only when the visitor
  // has never chosen a country before (no cookie yet — checked above). Everyone else —
  // repeat visitors, anyone on a deep India link, and crawlers — sees India's existing
  // "/" content untouched. In production every other unprefixed page is served as a
  // static file straight from Cloudflare's assets binding (bypassing the Worker, and
  // this middleware, entirely) — see wrangler.jsonc's `run_worker_first: ["/"]` — so
  // this block is effectively scoped to "/" already, but the pathname check stays
  // explicit for correctness in local dev, where every route runs through here.
  if (url.pathname === "/") {
    const userAgent = request.headers.get("user-agent") ?? "";
    const isBot = BOT_USER_AGENT_PATTERN.test(userAgent);

    if (!isBot) {
      const geoCountry = countryFromCloudflare(request);

      if (geoCountry && geoCountry.code !== "IN") {
        cookies.set(COUNTRY_COOKIE, geoCountry.code.toLowerCase(), {
          path: "/",
          maxAge: COUNTRY_COOKIE_MAX_AGE,
          sameSite: "lax",
        });
        return context.redirect(`${geoCountry.pathPrefix}/`, 302);
      }
    }
  }

  return next();
});
