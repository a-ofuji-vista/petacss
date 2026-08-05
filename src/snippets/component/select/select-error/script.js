(function () {
  let instanceIndex = 0;
  let documentClickListenerBound = false;

  function bindDocumentClickListener() {
    if (documentClickListenerBound) return;
    documentClickListenerBound = true;

    document.addEventListener("click", (event) => {
      for (const wrapper of document.querySelectorAll(
        '.select-error__control[data-open="true"]',
      )) {
        if (wrapper.contains(event.target)) continue;
        const trigger = wrapper.querySelector(".select-error__trigger");
        const list = wrapper.querySelector(".select-error__list");
        if (trigger && list) {
          closeList(wrapper, trigger, list);
        }
      }
    });
  }

  function getSelectableOptions(select) {
    return [...select.options].filter((option) => !option.hidden);
  }

  function updateTriggerText(trigger, select) {
    const selected = select.options[select.selectedIndex];
    trigger.textContent = selected?.textContent?.trim() ?? "";
  }

  function syncOptionStates(optionItems, select) {
    optionItems.forEach(({ li, option }) => {
      li.setAttribute("aria-selected", String(option.selected));
    });
  }

  function setSelectedIndex(select, index) {
    select.selectedIndex = index;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isValidSelection(select) {
    const selected = select.options[select.selectedIndex];
    return Boolean(selected?.value);
  }

  function clearErrorState(select, trigger, messageEl) {
    if (!isValidSelection(select)) return;

    select.removeAttribute("aria-invalid");
    trigger.removeAttribute("aria-invalid");
    trigger.removeAttribute("aria-describedby");
    messageEl?.setAttribute("hidden", "");
  }

  function closeList(wrapper, trigger, list) {
    delete wrapper.dataset.open;
    trigger.setAttribute("aria-expanded", "false");
    list.hidden = true;
  }

  function openList(wrapper, trigger, list, optionItems) {
    wrapper.dataset.open = "true";
    trigger.setAttribute("aria-expanded", "true");
    list.hidden = false;

    const selectedItem =
      optionItems.find(({ option }) => option.selected) ?? optionItems[0];
    selectedItem?.li.focus();
  }

  function initSelectError(select) {
    if (select.dataset.selectErrorInit === "true") return;

    select.dataset.selectErrorInit = "true";
    instanceIndex += 1;

    const wrapper = document.createElement("div");
    wrapper.className = "select-error__control";

    const ariaLabel = select.getAttribute("aria-label");
    const ariaDescribedby = select.getAttribute("aria-describedby");
    const ariaInvalid = select.getAttribute("aria-invalid");
    const messageEl = ariaDescribedby
      ? document.getElementById(ariaDescribedby)
      : select
          .closest(".select-error")
          ?.querySelector(".select-error__message");
    const selectId = select.id;
    const listId = `select-error-list-${instanceIndex}`;
    const triggerId = selectId || `select-error-trigger-${instanceIndex}`;

    select.parentNode?.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    select.classList.add("select-error__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    if (selectId) {
      select.removeAttribute("id");
    }

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = triggerId;
    trigger.className = "select-error__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", listId);
    if (ariaLabel) {
      trigger.setAttribute("aria-label", ariaLabel);
    }
    if (ariaDescribedby) {
      trigger.setAttribute("aria-describedby", ariaDescribedby);
      select.removeAttribute("aria-describedby");
    }
    if (ariaInvalid) {
      trigger.setAttribute("aria-invalid", ariaInvalid);
      select.removeAttribute("aria-invalid");
    }

    const list = document.createElement("ul");
    list.id = listId;
    list.className = "select-error__list";
    list.setAttribute("role", "listbox");
    if (ariaLabel) {
      list.setAttribute("aria-labelledby", triggerId);
    }
    list.hidden = true;

    const optionItems = getSelectableOptions(select).map((option) => {
      const li = document.createElement("li");
      li.className = "select-error__option";
      li.setAttribute("role", "option");
      li.tabIndex = -1;
      li.textContent = option.textContent?.trim() ?? "";
      li.dataset.index = String(option.index);

      li.addEventListener("click", () => {
        setSelectedIndex(select, option.index);
        closeList(wrapper, trigger, list);
        trigger.focus();
      });

      list.appendChild(li);
      return { li, option };
    });

    wrapper.append(trigger, list);
    updateTriggerText(trigger, select);
    syncOptionStates(optionItems, select);

    trigger.addEventListener("click", () => {
      const isOpen = wrapper.dataset.open === "true";
      if (isOpen) {
        closeList(wrapper, trigger, list);
        return;
      }
      openList(wrapper, trigger, list, optionItems);
    });

    trigger.addEventListener("keydown", (event) => {
      const isOpen = wrapper.dataset.open === "true";

      if (
        !isOpen &&
        (event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " ")
      ) {
        event.preventDefault();
        openList(wrapper, trigger, list, optionItems);
        return;
      }

      if (!isOpen) return;

      const currentIndex = optionItems.findIndex(
        ({ li }) => li === document.activeElement,
      );

      if (event.key === "Escape") {
        event.preventDefault();
        closeList(wrapper, trigger, list);
        trigger.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = optionItems[currentIndex + 1] ?? optionItems[0];
        next?.li.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = optionItems[currentIndex - 1] ?? optionItems.at(-1);
        next?.li.focus();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const focused = optionItems[currentIndex];
        if (!focused) return;
        setSelectedIndex(select, focused.option.index);
        closeList(wrapper, trigger, list);
        trigger.focus();
      }
    });

    list.addEventListener("keydown", (event) => {
      const currentIndex = optionItems.findIndex(
        ({ li }) => li === document.activeElement,
      );

      if (event.key === "Escape") {
        event.preventDefault();
        closeList(wrapper, trigger, list);
        trigger.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = optionItems[currentIndex + 1] ?? optionItems[0];
        next?.li.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = optionItems[currentIndex - 1] ?? optionItems.at(-1);
        next?.li.focus();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const focused = optionItems[currentIndex];
        if (!focused) return;
        setSelectedIndex(select, focused.option.index);
        closeList(wrapper, trigger, list);
        trigger.focus();
      }
    });

    select.addEventListener("change", () => {
      updateTriggerText(trigger, select);
      syncOptionStates(optionItems, select);
      clearErrorState(select, trigger, messageEl);
    });
  }

  function initAll() {
    bindDocumentClickListener();
    document.querySelectorAll(".js-select-error").forEach(initSelectError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
