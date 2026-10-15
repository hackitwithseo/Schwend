let targetUsername = localStorage.getItem("swchend_target") || null;
let buttonLabelText = localStorage.getItem("swchend_label") || "Swchend";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Funkce pro otevření GUI Nastavení
function openSettingsGUI() {
  if (document.querySelector(".swchend-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "swchend-modal-overlay";

  overlay.innerHTML = `
    <div class="swchend-modal-card">
      <div class="swchend-modal-header">
        <span class="swchend-modal-title">Swchend Settings</span>
        <button class="swchend-modal-close" id="swchend-close-btn">&times;</button>
      </div>
      <div class="swchend-field-group">
        <label>Target Username</label>
        <input type="text" id="swchend-input-user" value="${targetUsername || ""}" placeholder="e.g. jan_novak" />
      </div>
      <div class="swchend-field-group">
        <label>Button Label</label>
        <input type="text" id="swchend-input-label" value="${buttonLabelText}" placeholder="Button name" />
      </div>
      <div class="swchend-modal-actions">
        <button class="swchend-btn-cancel" id="swchend-cancel-btn">Cancel</button>
        <button class="swchend-btn-save" id="swchend-save-btn">Save Changes</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector("#swchend-close-btn");
  const cancelBtn = overlay.querySelector("#swchend-cancel-btn");
  const saveBtn = overlay.querySelector("#swchend-save-btn");

  const closeModal = () => overlay.remove();

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", () => {
    const userVal = overlay.querySelector("#swchend-input-user").value.trim().toLowerCase();
    const labelVal = overlay.querySelector("#swchend-input-label").value.trim() || "Swchend";

    if (userVal) {
      targetUsername = userVal;
      localStorage.setItem("swchend_target", targetUsername);
    }

    buttonLabelText = labelVal;
    localStorage.setItem("swchend_label", buttonLabelText);

    // Aktualizovat popisky tlačítek v DOMu
    document.querySelectorAll(".swchend-main-label").forEach((el) => {
      el.innerText = buttonLabelText;
    });

    closeModal();
  });
}

// Funkce pro automatické odeslání Reel
async function sendReelToTarget() {
  if (!targetUsername) {
    openSettingsGUI();
    return;
  }

  const sendButton = document.querySelector('svg[aria-label="Share"], svg[aria-label="Sdílet příspěvek"], svg[aria-label="Share Post"], svg[aria-label="Sdílet"]')?.closest('div[role="button"]') ||
                     document.querySelector('path[d*="M13.973 20.046"]')?.closest('div[role="button"]') ||
                     document.querySelector('path[d*="M13.973 20.046"]')?.closest('button');

  if (!sendButton) {
    alert("Nebylo možné najít originální tlačítko Send!");
    return;
  }

  sendButton.click();
  await sleep(600);

  const searchInput = document.querySelector('input[placeholder*="Hledat"], input[placeholder*="Search"]');
  if (!searchInput) {
    alert("Nebylo možné najít vyhledávací pole.");
    return;
  }

  searchInput.focus();
  searchInput.value = targetUsername;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  await sleep(1000);

  const userCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  if (userCheckboxes.length > 0) {
    userCheckboxes[0].click();
  } else {
    const firstUserRow = document.querySelector('div[role="dialog"] div[role="button"]');
    if (firstUserRow) firstUserRow.click();
  }

  await sleep(400);

  const submitSendBtn = Array.from(document.querySelectorAll('div[role="button"], button')).find(
    (el) => el.textContent.trim() === "Odeslat" || el.textContent.trim() === "Send"
  );

  if (submitSendBtn) {
    submitSendBtn.click();
  }
}

function injectSwchendButton() {
  const sendIcons = document.querySelectorAll(
    'svg[aria-label="Share"], svg[aria-label="Sdílet příspěvek"], svg[aria-label="Share Post"], svg[aria-label="Sdílet"], path[d*="M13.973 20.046"]'
  );

  sendIcons.forEach((element) => {
    const icon = element.tagName.toLowerCase() === 'path' ? element.closest('svg') : element;
    if (!icon) return;

    if (icon.closest('div[role="dialog"]') || icon.closest('div[style*="fixed"]') || icon.closest('div[style*="absolute"]') || icon.closest('footer')) return;

    const sendButtonBlock = icon.closest('div[role="button"]') || icon.closest('button');
    if (!sendButtonBlock) return;

    const columnContainer = sendButtonBlock.parentElement;
    if (!columnContainer) return;

    const hasOtherActions = columnContainer.querySelector('svg[aria-label="Like"], svg[aria-label="Comment"], svg[aria-label="To se mi líbí"], svg[aria-label="Komentář"]') ||
                             columnContainer.parentElement?.querySelector('svg[aria-label="Like"], svg[aria-label="Comment"], svg[aria-label="To se mi líbí"]');
    
    if (!hasOtherActions) return;

    sendButtonBlock.style.display = "flex";
    sendButtonBlock.style.flexDirection = "column";
    sendButtonBlock.style.alignItems = "center";
    sendButtonBlock.style.justifyContent = "center";

    if (!sendButtonBlock.querySelector('.swchend-share-label')) {
      const shareLabel = document.createElement("span");
      shareLabel.className = "swchend-label swchend-share-label";
      shareLabel.innerText = "Share";
      sendButtonBlock.appendChild(shareLabel);
    }

    if (columnContainer.querySelector(".swchend-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "swchend-wrapper";

    const swchendBtn = document.createElement("button");
    swchendBtn.className = "swchend-icon-btn";
    swchendBtn.title = `${buttonLabelText} (Levý klik / Šipka doprava: poslat, Pravý klik: nastavení GUI)`;

    swchendBtn.innerHTML = `
      <svg aria-label="Swchend" role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    `;

    const label = document.createElement("span");
    label.className = "swchend-label swchend-main-label";
    label.innerText = buttonLabelText;

    wrapper.appendChild(swchendBtn);
    wrapper.appendChild(label);

    // Levý klik = Odeslat
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      sendReelToTarget();
    });

    // Pravý klik = Otevřít GUI Nastavení
    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSettingsGUI();
    });

    sendButtonBlock.insertAdjacentElement("afterend", wrapper);
  });
}

setInterval(injectSwchendButton, 1000);

// Klávesová zkratka: Šipka doprava (ArrowRight)
document.addEventListener("keydown", (e) => {
  const activeEl = document.activeElement;
  const isTyping =
    activeEl &&
    (activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.isContentEditable);

  if (isTyping) return;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    e.stopPropagation();
    sendReelToTarget();
  }
});
