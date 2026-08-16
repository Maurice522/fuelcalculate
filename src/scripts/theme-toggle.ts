const STORAGE_KEY = "fuelcalculate:theme";
type Theme = "light" | "dark";

function effectiveTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyIcon(button: HTMLElement, theme: Theme): void {
  button.querySelector<HTMLElement>("[data-theme-icon-light]")?.classList.toggle("hidden", theme !== "light");
  button.querySelector<HTMLElement>("[data-theme-icon-dark]")?.classList.toggle("hidden", theme !== "dark");
}

const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");

// There's more than one of these now (a compact one in the mobile nav, a full one in
// the desktop nav) — both must reflect the same theme, so state lives here rather than
// per-button, and every button's icon is refreshed on any click, not just the one
// clicked (otherwise the other stays stale until its own next click).
function syncAll(theme: Theme): void {
  buttons.forEach((button) => applyIcon(button, theme));
}

let current = effectiveTheme();
syncAll(current);

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, current);
    document.documentElement.setAttribute("data-theme", current);
    syncAll(current);
  });
});
