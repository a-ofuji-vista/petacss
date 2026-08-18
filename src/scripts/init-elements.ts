type ElementSetup<T extends Element> = (element: T) => void | (() => void);

const cleanups = new Map<ElementSetup<Element>, Map<Element, () => void>>();

function cleanupSetup(setup: ElementSetup<Element>) {
  const byElement = cleanups.get(setup);
  if (!byElement) return;

  for (const cleanup of byElement.values()) {
    cleanup();
  }
  byElement.clear();
}

function cleanupAll() {
  for (const setup of cleanups.keys()) {
    cleanupSetup(setup);
  }
  cleanups.clear();
}

export function initElements<T extends Element>(
  selector: string,
  setup: ElementSetup<T>,
): void {
  const sharedSetup = setup as ElementSetup<Element>;
  let byElement = cleanups.get(sharedSetup);
  if (!byElement) {
    byElement = new Map();
    cleanups.set(sharedSetup, byElement);
  }

  document.querySelectorAll<T>(selector).forEach((element) => {
    byElement.get(element)?.();
    byElement.delete(element);
    const result = setup(element);
    if (typeof result === "function") {
      byElement.set(element, result);
    }
  });
}

export function bindPageInit(run: () => void): void {
  run();
  document.addEventListener("astro:page-load", run);
}

document.addEventListener("astro:before-swap", cleanupAll);
