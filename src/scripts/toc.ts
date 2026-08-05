import { bindPageInit, initElements } from "./init-elements.ts";

function getTocLinkId(link: HTMLAnchorElement): string | null {
  const href = link.getAttribute("href");
  if (!href?.startsWith("#")) return null;
  const id = href.slice(1);
  return id || null;
}

function setupToc(toc: HTMLElement): () => void {
  const links = toc.querySelectorAll<HTMLAnchorElement>(".js-toc-link");
  const ids = Array.from(links)
    .map(getTocLinkId)
    .filter((id): id is string => Boolean(id));
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  if (sections.length === 0) {
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((l) =>
          l.classList.toggle("l-toc__link--active", getTocLinkId(l) === id),
        );
      });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
  return () => observer.disconnect();
}

bindPageInit(() => initElements<HTMLElement>(".js-toc", setupToc));
