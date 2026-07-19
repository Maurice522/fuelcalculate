/**
 * Enhances a wrapped native <select> with a searchable, keyboard-navigable combobox
 * overlay. The <select> stays in the DOM (visually hidden) so every existing
 * `field("vehicle")`/`field("city")` accessor, form submission (no-JS fallback) and
 * `.value`/`change`-event based recalculation logic keeps working untouched — this
 * only changes how the option gets picked, not how the result is read.
 *
 * Callers that rebuild the wrapped <select>'s options at runtime (e.g. repopulating
 * the vehicle list) must call `.refresh()` on this element afterwards so the overlay
 * picks up the new option set.
 */
export class SearchableSelectElement extends HTMLElement {
  private select!: HTMLSelectElement;
  private input!: HTMLInputElement;
  private panel!: HTMLDivElement;
  private activeIndex = -1;

  connectedCallback(): void {
    const select = this.querySelector("select");
    if (!select) return;
    this.select = select;
    this.select.hidden = true;

    this.classList.add("relative", "block");

    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.autocomplete = "off";
    this.input.spellcheck = false;
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.className =
      "searchable-select-input h-10 w-full cursor-pointer rounded-sm border border-hairline bg-canvas px-sm pr-8 text-body-sm text-ink";
    if (this.select.disabled) this.input.disabled = true;

    this.panel = document.createElement("div");
    this.panel.className = "searchable-select-panel";
    this.panel.setAttribute("role", "listbox");
    this.panel.hidden = true;

    this.appendChild(this.input);
    this.appendChild(this.panel);

    this.input.addEventListener("input", () => this.onSearch());
    this.input.addEventListener("focus", () => this.open());
    this.input.addEventListener("click", () => this.open());
    this.input.addEventListener("keydown", (e) => this.onKeydown(e));
    this.input.addEventListener("blur", () => {
      // Let a click on a panel option register (mousedown fires before blur) before closing.
      window.setTimeout(() => this.close(true), 120);
    });
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target as Node)) this.close(true);
    });

    this.refresh();
  }

  /** Rebuilds the option list and synced display text from the current <select> state. */
  refresh(): void {
    this.panel.innerHTML = "";
    this.activeIndex = -1;

    const options = Array.from(this.select.options);
    for (const option of options) {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.className = "searchable-select-option";
      item.textContent = option.textContent ?? option.value;
      if (option.value === this.select.value) {
        item.setAttribute("aria-selected", "true");
        item.classList.add("is-selected");
      }
      item.addEventListener("mousedown", (e) => e.preventDefault());
      item.addEventListener("click", () => this.choose(option.value));
      this.panel.appendChild(item);
    }

    this.syncDisplay();
  }

  /** Syncs only the visible input text to the <select>'s current value (no rebuild). */
  syncDisplay(): void {
    const selected = this.select.selectedOptions[0];
    this.input.value = selected?.textContent?.trim() ?? "";
    this.input.placeholder = "Search…";
  }

  private options(): HTMLButtonElement[] {
    return Array.from(this.panel.querySelectorAll("button"));
  }

  private onSearch(): void {
    const query = this.input.value.trim().toLowerCase();

    if (!query) {
      // Restore the <select>'s natural (e.g. alphabetical) order, undoing any reorder
      // left over from a previous search.
      const byValue = new Map(this.options().map((opt) => [opt.dataset.value ?? "", opt]));
      for (const option of Array.from(this.select.options)) {
        const btn = byValue.get(option.value);
        if (btn) this.panel.appendChild(btn);
      }
      this.options().forEach((opt) => (opt.hidden = false));
      this.activeIndex = this.options().length > 0 ? 0 : -1;
      this.highlight();
      this.open();
      return;
    }

    const scored = this.options()
      .map((opt) => ({ opt, score: matchScore(query, (opt.textContent ?? "").toLowerCase()) }))
      .sort((a, b) => b.score - a.score);

    for (const { opt, score } of scored) {
      opt.hidden = score <= 0;
      this.panel.appendChild(opt); // reorders in place, best match first
    }

    this.activeIndex = scored.length > 0 && scored[0].score > 0 ? this.options().indexOf(scored[0].opt) : -1;
    this.highlight();
    this.open();
  }

  private open(): void {
    if (!this.panel.hidden) return;
    this.panel.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    this.classList.add("is-open");
  }

  private close(restoreDisplay: boolean): void {
    this.panel.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.classList.remove("is-open");
    if (restoreDisplay) {
      this.syncDisplay();
      this.options().forEach((opt) => (opt.hidden = false));
    }
  }

  private highlight(): void {
    this.options().forEach((opt, i) => {
      opt.classList.toggle("is-active", i === this.activeIndex);
      if (i === this.activeIndex) opt.scrollIntoView({ block: "nearest" });
    });
  }

  private visibleOptions(): HTMLButtonElement[] {
    return this.options().filter((opt) => !opt.hidden);
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.open();
      const visible = this.visibleOptions();
      if (visible.length === 0) return;
      const all = this.options();
      const currentPos = visible.findIndex((o) => all.indexOf(o) === this.activeIndex);
      const nextPos =
        e.key === "ArrowDown"
          ? (currentPos + 1) % visible.length
          : (currentPos - 1 + visible.length) % visible.length;
      this.activeIndex = all.indexOf(visible[nextPos]);
      this.highlight();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = this.options()[this.activeIndex];
      if (active) this.choose(active.dataset.value ?? "");
      else this.close(true);
    } else if (e.key === "Escape") {
      this.close(true);
      this.input.blur();
    }
  }

  private choose(value: string): void {
    this.select.value = value;
    this.select.dispatchEvent(new Event("change", { bubbles: true }));
    this.close(true);
    this.refresh();
  }
}

customElements.define("searchable-select", SearchableSelectElement);

/** Iterative Levenshtein edit distance, used only for short word-level typo tolerance. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const currRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow.push(Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost));
    }
    prevRow = currRow;
  }
  return prevRow[b.length];
}

/**
 * Scores how well `query` (already lowercased, may be multiple words) matches `text`
 * (already lowercased). Every query token must match something in `text` — either as a
 * substring or, for longer tokens, within a small edit-distance of one of `text`'s words
 * (so "Splendr" still finds "Splendor") — or the option is excluded entirely (score 0).
 * Matched options are scored higher for earlier/word-boundary substring hits so the
 * closest matches sort first.
 */
function matchScore(query: string, text: string): number {
  if (text === query) return 1000;

  const tokens = query.split(/\s+/).filter(Boolean);
  const textWords = text.split(/\s+/).filter(Boolean);
  let total = 0;

  for (const token of tokens) {
    const idx = text.indexOf(token);
    if (idx !== -1) {
      const atWordBoundary = idx === 0 || /\s/.test(text[idx - 1]);
      total += 60 - Math.min(idx, 40) + (atWordBoundary ? 30 : 0) + token.length;
      continue;
    }

    // No exact substring — allow a small typo tolerance, scaled to token length so short
    // tokens (which are more likely to coincidentally near-match) stay strict.
    const maxEditDistance = token.length <= 3 ? 0 : token.length <= 5 ? 1 : 2;
    let bestDistance = Infinity;
    for (const word of textWords) {
      const distance = levenshtein(token, word);
      if (distance < bestDistance) bestDistance = distance;
    }

    if (bestDistance <= maxEditDistance) {
      total += 20 - bestDistance * 8;
    } else {
      return 0; // this token matches nothing in the option, closely or otherwise — exclude it
    }
  }

  return total;
}
