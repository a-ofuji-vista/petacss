type ElementSetup<T extends Element> = (element: T) => void | (() => void);

const cleanups = new Map<Element, () => void>();

function cleanupElement(element: Element) {
  cleanups.get(element)?.();
  cleanups.delete(element);
}

function cleanupAll() {
  for (const cleanup of cleanups.values()) {
    cleanup();
  }
  cleanups.clear();
}

export function initElements<T extends Element>(
  selector: string,
  setup: ElementSetup<T>,
): void {
  document.querySelectorAll<T>(selector).forEach((element) => {
    cleanupElement(element);
    const result = setup(element);
    if (typeof result === "function") {
      cleanups.set(element, result);
    }
  });
}

export function bindPageInit(run: () => void): void {
  run();
  document.addEventListener("astro:page-load", run);
}

document.addEventListener("astro:before-swap", cleanupAll);
