const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-menu-toggle]");
const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
const openIcon = document.querySelector<HTMLElement>("[data-menu-icon-open]");
const closeIcon = document.querySelector<HTMLElement>("[data-menu-icon-close]");

if (toggle && menu) {
  function setOpen(open: boolean): void {
    menu!.hidden = !open;
    toggle!.setAttribute("aria-expanded", String(open));
    openIcon?.classList.toggle("hidden", open);
    closeIcon?.classList.toggle("hidden", !open);
  }

  toggle.addEventListener("click", () => setOpen(Boolean(menu!.hidden)));

  // Close on navigation (link tap) and on resize past the breakpoint where the
  // mobile menu is hidden by CSS anyway, so it doesn't stay stuck open underneath.
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1280 && !menu!.hidden) setOpen(false);
  });
}
