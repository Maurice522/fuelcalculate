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

interface IpApiResponse {
  status: "success" | "fail";
  message?: string;
  country?: string;
  countryCode?: string;
  query?: string;
}

/**
 * Looks up a country from an IP via ip-api.com's free JSON endpoint
 * (https://ip-api.com/docs/api:json — no key required, HTTP only on the free tier,
 * which is fine here since this is a server-to-server fetch from the Worker, not a
 * browser request, so there's no mixed-content restriction). Returns null on any
 * failure (request error, rate limit, timeout, unsupported country) so callers can
 * fall back to not redirecting at all rather than guessing.
 *
 * When `ip` is omitted, ip-api.com geolocates whoever is actually making this HTTP
 * call instead. In production `ip` is always passed (the real visitor's address via
 * `CF-Connecting-IP`) — omitting it there would wrongly geolocate Cloudflare's own
 * network. But `CF-Connecting-IP` only exists on Cloudflare's real edge, never on a
 * plain local `astro dev` request, so in local dev this path is what makes the
 * redirect testable from an actual browser at all: it ends up geolocating the dev
 * machine's own connection, which is a real, meaningful IP.
 */
async function lookupCountryByIp(ip: string | null): Promise<CountryConfig | null> {
  const endpoint = ip
    ? `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,query`
    : `http://ip-api.com/json?fields=status,message,country,countryCode,query`;
  console.log(
    `[geo] IP for lookup: ${ip ?? "(none — no CF-Connecting-IP header; asking ip-api.com to detect this server's own connection instead, for local-dev testing)"}`,
  );
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.log(`[geo] ip-api.com HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = (await response.json()) as IpApiResponse;
    console.log(`[geo] ip-api.com response: ${JSON.stringify(data)}`);
    if (data.status !== "success" || !data.countryCode) return null;
    const match = SUPPORTED_COUNTRIES.find((c) => c.code === data.countryCode);
    console.log(`[geo] resolved supported country: ${match?.code ?? "(none — not one of the 5 supported)"}`);
    return match ?? null;
  } catch (err) {
    console.log(`[geo] ip-api.com fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
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
      const clientIp = request.headers.get("CF-Connecting-IP");
      const geoCountry = await lookupCountryByIp(clientIp);

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
