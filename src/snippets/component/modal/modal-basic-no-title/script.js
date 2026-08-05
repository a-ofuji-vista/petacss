(function () {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".js-modal-basic-no-title").forEach((root) => {
    const openButton = root.querySelector(".js-modal-basic-no-title-open");
    const dialog = root.querySelector(".js-modal-basic-no-title-dialog");
    if (!openButton || !dialog) return;

    const visibleClass = "modal-basic-no-title__dialog--visible";
    let isClosing = false;
    let openRafId = 0;
    let closeTransitionHandler = null;
    let closeFallbackTimer = 0;

    function getCloseTransitionMs() {
      const duration = getComputedStyle(root)
        .getPropertyValue("--modal-duration")
        .trim();
      if (!duration) return 0;
      const ms = duration.endsWith("ms")
        ? parseFloat(duration)
        : parseFloat(duration) * 1000;
      return Number.isFinite(ms) ? ms : 0;
    }

    function cleanupCloseTransition() {
      if (closeTransitionHandler) {
        dialog.removeEventListener("transitionend", closeTransitionHandler);
        closeTransitionHandler = null;
      }
      if (closeFallbackTimer) {
        clearTimeout(closeFallbackTimer);
        closeFallbackTimer = 0;
      }
    }

    function finishClose() {
      if (!isClosing) return;

      cleanupCloseTransition();
      dialog.classList.remove(visibleClass);

      if (dialog.open) {
        dialog.close();
      }

      isClosing = false;
    }

    function openDialog() {
      if (dialog.open && !isClosing) return;

      if (isClosing) {
        cleanupCloseTransition();
        isClosing = false;
        dialog.classList.add(visibleClass);
        return;
      }

      dialog.showModal();
      openRafId = requestAnimationFrame(() => {
        openRafId = 0;
        if (!dialog.open || isClosing) return;
        dialog.classList.add(visibleClass);
      });
    }

    function closeDialog() {
      if (!dialog.open) {
        cleanupCloseTransition();
        isClosing = false;
        return;
      }

      if (isClosing) return;

      cleanupCloseTransition();

      if (openRafId) {
        cancelAnimationFrame(openRafId);
        openRafId = 0;
        dialog.classList.remove(visibleClass);
        dialog.close();
        return;
      }

      const hasVisibleClass = dialog.classList.contains(visibleClass);

      if (reducedMotion.matches || !hasVisibleClass) {
        dialog.classList.remove(visibleClass);
        dialog.close();
        return;
      }

      isClosing = true;
      dialog.classList.remove(visibleClass);

      closeTransitionHandler = (event) => {
        if (event.target !== dialog) return;
        finishClose();
      };

      dialog.addEventListener("transitionend", closeTransitionHandler);
      closeFallbackTimer = window.setTimeout(
        finishClose,
        getCloseTransitionMs() + 50,
      );
    }

    openButton.addEventListener("click", openDialog);

    dialog
      .querySelectorAll(".js-modal-basic-no-title-close")
      .forEach((button) => {
        button.addEventListener("click", closeDialog);
      });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });

    // ダイアログ本体の外側(バックドロップ)クリックで閉じる
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inDialog) {
        closeDialog();
      }
    });
  });
})();
