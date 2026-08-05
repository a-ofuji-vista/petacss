import { bindPageInit, initElements } from "./init-elements.ts";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function getCodeText(block: HTMLElement): string {
  const template = block.querySelector<HTMLTemplateElement>(
    "template.js-code-source",
  );
  const fromTemplate = template?.content.textContent;
  if (fromTemplate) return fromTemplate;

  return block.querySelector("code")?.innerText ?? "";
}

function setupCopyButton(button: HTMLButtonElement): () => void {
  const onClick = async () => {
    const block = button.closest<HTMLElement>(".js-code-block");
    if (!block) return;

    const ok = await copyText(getCodeText(block));
    if (ok) {
      button.classList.add("c-code-block__copy--copied");
      button.setAttribute("aria-label", "コピーしました");
      setTimeout(() => {
        button.classList.remove("c-code-block__copy--copied");
        button.setAttribute("aria-label", "コードをコピー");
      }, 1200);
    }
  };

  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}

bindPageInit(() =>
  initElements<HTMLButtonElement>(".js-copy-button", setupCopyButton),
);
