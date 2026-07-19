import { handle } from "@astrojs/cloudflare/handler";
import { runPriceCrawl } from "./lib/priceCrawler";

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
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
