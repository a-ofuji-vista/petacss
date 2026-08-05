import { bindPageInit, initElements } from "./init-elements.ts";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function setupSearchModal(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>(".js-search-dialog");
  const openButton = root.querySelector<HTMLButtonElement>(".js-search-open");
  const closeButton = root.querySelector<HTMLButtonElement>(".js-search-close");
  const shortcut = root.querySelector<HTMLElement>(".js-search-shortcut");
  const input = root.querySelector<HTMLInputElement>(".js-search-input");
  const list = root.querySelector<HTMLElement>(".js-search-list");
  const empty = root.querySelector<HTMLElement>(".js-search-empty");
  const items = [...root.querySelectorAll<HTMLElement>(".js-search-item")];

  if (!dialog || !openButton || !input || !list || !empty) {
    return () => {};
  }

  const controller = new AbortController();
  const { signal } = controller;

  if (shortcut) {
    shortcut.textContent = isApplePlatform() ? "⌘K" : "Ctrl K";
  }

  const filterItems = () => {
    const query = normalize(input.value);
    let visibleCount = 0;

    for (const item of items) {
      const label = normalize(item.dataset.label ?? "");
      const labelJa = normalize(item.dataset.labelJa ?? "");
      const slug = normalize(item.dataset.slug ?? "");
      const matched =
        query === "" ||
        label.includes(query) ||
        labelJa.includes(query) ||
        slug.includes(query);

      item.hidden = !matched;
      if (matched) visibleCount += 1;
    }

    list.hidden = visibleCount === 0;
    empty.hidden = visibleCount > 0;
  };

  const open = () => {
    if (dialog.open) return;
    input.value = "";
    filterItems();
    dialog.showModal();
    requestAnimationFrame(() => input.focus({ focusVisible: false }));
  };

  const close = () => {
    if (!dialog.open) return;
    dialog.close();
  };

  const toggle = () => {
    if (dialog.open) close();
    else open();
  };

  openButton.addEventListener("click", open, { signal });
  closeButton?.addEventListener("click", close, { signal });

  input.addEventListener("input", filterItems, { signal });

  for (const link of dialog.querySelectorAll("a[href]")) {
    link.addEventListener("click", close, { signal });
  }

  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target === dialog) close();
    },
    { signal },
  );

  dialog.addEventListener(
    "close",
    () => {
      input.value = "";
      filterItems();
    },
    { signal },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.isComposing) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }

      event.preventDefault();
      toggle();
    },
    { signal },
  );

  return () => controller.abort();
}

bindPageInit(() => initElements<HTMLElement>(".js-search", setupSearchModal));
