import { bindPageInit, initElements } from "./init-elements.ts";

const SCROLLBAR_VISIBLE_MS = 800;

function setupScrollRevealScrollbar(element: HTMLElement): () => void {
  let timeoutId: number | undefined;
  const controller = new AbortController();
  const { signal } = controller;

  const reveal = () => {
    element.classList.add("is-scrolling");
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      element.classList.remove("is-scrolling");
    }, SCROLLBAR_VISIBLE_MS);
  };

  element.addEventListener("scroll", reveal, { signal, passive: true });
  element.addEventListener("wheel", reveal, { signal, passive: true });

  return () => {
    window.clearTimeout(timeoutId);
    controller.abort();
  };
}

bindPageInit(() =>
  initElements<HTMLElement>(
    ".js-scroll-reveal-scrollbar",
    setupScrollRevealScrollbar,
  ),
);
