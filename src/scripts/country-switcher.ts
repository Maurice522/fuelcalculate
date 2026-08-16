// worker-configuration.d.ts (generated Cloudflare Workers types, included project-wide
// for `env` bindings) declares its own global `Element` for HTMLRewriter, which merges
// with and narrows the browser DOM lib's `Element` — breaking a direct `Element ->
// HTMLSelectElement` cast for anything found via a non-tag-name querySelectorAll. The
// double cast through `unknown` is TS's own suggested escape hatch for this.
document.querySelectorAll("[data-country-switcher]").forEach((el) => {
  const select = el as unknown as HTMLSelectElement;
  select.addEventListener("change", () => {
    const code = select.value.toLowerCase();
    // A year-long cookie so the choice sticks; the middleware reads this before
    // ever falling back to geo-detection on a later visit.
    document.cookie = `country=${code}; path=/; max-age=31536000; samesite=lax`;
    const prefix = code === "in" ? "" : `/${code}`;
    window.location.href = `${prefix}/`;
  });
});
