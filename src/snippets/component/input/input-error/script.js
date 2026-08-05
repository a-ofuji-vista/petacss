(function () {
  function clearErrorState(input, messageEl) {
    if (!input.value.trim()) return;

    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    messageEl?.setAttribute("hidden", "");
  }

  function initInputError(input) {
    if (input.dataset.inputErrorInit === "true") return;

    input.dataset.inputErrorInit = "true";

    const ariaDescribedby = input.getAttribute("aria-describedby");
    const messageEl = ariaDescribedby
      ? document.getElementById(ariaDescribedby)
      : input.closest(".input-error")?.querySelector(".input-error__message");

    input.addEventListener("input", () => {
      clearErrorState(input, messageEl);
    });
  }

  function initAll() {
    document.querySelectorAll(".js-input-error").forEach(initInputError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
