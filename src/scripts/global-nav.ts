import { bindPageInit, initElements } from "./init-elements.ts";

function setupGlobalNav(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>(".js-global-nav-dialog");
  if (!dialog) {
    return () => {};
  }

  const controller = new AbortController();
  const { signal } = controller;

  const scope = root.closest(".l-layout") ?? root;
  const openButton = dialog.id
    ? scope.querySelector<HTMLButtonElement>(
        `button[aria-controls="${CSS.escape(dialog.id)}"]`,
      )
    : null;
  const closeButton = dialog.querySelector<HTMLButtonElement>(
    ".js-global-nav-close",
  );

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
  };

  const close = () => {
    if (!dialog.open) return;
    dialog.close();
  };

  openButton?.addEventListener("click", open, { signal });
  closeButton?.addEventListener("click", close, { signal });

  for (const link of dialog.querySelectorAll("a[href]")) {
    link.addEventListener("click", close, { signal });
  }

  const suppressTransition = () => {
    dialog.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dialog.style.transition = "";
      });
    });
  };

  const desktop = window.matchMedia("(width > 960px)");
  desktop.addEventListener(
    "change",
    (event) => {
      suppressTransition();
      if (event.matches && dialog.open) {
        dialog.close();
      }
    },
    { signal },
  );

  return () => controller.abort();
}

bindPageInit(() => initElements<HTMLElement>(".js-global-nav", setupGlobalNav));
