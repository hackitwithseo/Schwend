let defaultTarget = localStorage.getItem("swchend_target") || "";
let buttonLabelText = localStorage.getItem("swchend_label") || "Swchend";
let keyMappings = JSON.parse(localStorage.getItem("swchend_key_mappings") || "{}");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Najde tlačítko Share toho Reelu, který je aktuálně uprostřed obrazovky
function getActiveShareButton() {
  const windowCenter = window.innerHeight / 2;
  const allShareIcons = document.querySelectorAll(
    'svg[aria-label="Share"], svg[aria-label="Sdílet příspěvek"], svg[aria-label="Share Post"], svg[aria-label="Sdílet"], path[d*="M13.973 20.046"]'
  );

  let bestBtn = null;
  let minDistance = Infinity;

  allShareIcons.forEach((icon) => {
    const btn = icon.closest('div[role="button"]') || icon.closest('button');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    
    // Ignorovat plovoucí chat vpravo dole
    const isBottomRightChat = rect.top > window.innerHeight - 180 && rect.left > window.innerWidth - 400;
    if (isBottomRightChat || btn.closest('div[role="dialog"]') || btn.closest('footer')) return;

    if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
      const btnCenter = (rect.top + rect.bottom) / 2;
      const distance = Math.abs(btnCenter - windowCenter);
      if (distance < minDistance) {
        minDistance = distance;
        bestBtn = btn;
      }
    }
  });

  return bestBtn;
}

// GUI Nastavení
function openSettingsGUI() {
  if (document.querySelector(".swchend-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "swchend-modal-overlay";

  const keysList = ["ArrowLeft", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  
  let keyInputsHTML = keysList.map(k => `
    <div class="swchend-field-group">
      <label>Key [${k}] Target Username</label>
      <input type="text" class="swchend-key-input" data-key="${k}" value="${keyMappings[k] || ""}" placeholder="username pro klávesu ${k}" />
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="swchend-modal-card">
      <div class="swchend-modal-header">
        <span class="swchend-modal-title">Swchend Settings</span>
        <button class="swchend-modal-close" id="swchend-close-btn">&times;</button>
      </div>
      <div class="swchend-modal-scrollable">
        <div class="swchend-field-group">
          <label>Default Target (Click / ArrowRight)</label>
          <input type="text" id="swchend-input-user" value="${defaultTarget}" placeholder="např. jan_novak" />
        </div>
        <div class="swchend-field-group">
          <label>Button Label</label>
          <input type="text" id="swchend-input-label" value="${buttonLabelText}" placeholder="Název tlačítka" />
        </div>
        <hr style="border: 0; border-top: 1px solid #363636; margin: 16px 0;">
        <p style="font-size: 12px; color: #a8a8a8; margin-bottom: 12px; font-weight: 600; text-transform: uppercase;">Přiřazení kláves (různí lidé):</p>
        ${keyInputsHTML}
      </div>
      <div class="swchend-modal-actions">
        <button class="swchend-btn-cancel" id="swchend-cancel-btn">Zrušit</button>
        <button class="swchend-btn-save" id="swchend-save-btn">Uložit</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  overlay.querySelector("#swchend-close-btn").addEventListener("click", closeModal);
  overlay.querySelector("#swchend-cancel-btn").addEventListener("click", closeModal);

  overlay.querySelector("#swchend-save-btn").addEventListener("click", () => {
    defaultTarget = overlay.querySelector("#swchend-input-user").value.trim().toLowerCase();
    buttonLabelText = overlay.querySelector("#swchend-input-label").value.trim() || "Swchend";

    localStorage.setItem("swchend_target", defaultTarget);
    localStorage.setItem("swchend_label", buttonLabelText);

    const newMappings = {};
    overlay.querySelectorAll(".swchend-key-input").forEach(input => {
      const k = input.getAttribute("data-key");
      const val = input.value.trim().toLowerCase();
      if (val) {
        newMappings[k] = val;
      }
    });
    keyMappings = newMappings;
    localStorage.setItem("swchend_key_mappings", JSON.stringify(keyMappings));

    document.querySelectorAll(".swchend-main-label").forEach((el) => {
      el.innerText = buttonLabelText;
    });

    closeModal();
  });
}

// Společná logika pro provedení odeslání
async function executeSend(sendButton, target) {
  if (!target) {
    openSettingsGUI();
    return;
  }
  if (!sendButton) {
    alert("Nebylo možné najít tlačítko Send pro tento Reel!");
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
  searchInput.value = target;
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

// Injektování tlačítek na stránku
function injectSwchendButton() {
  const sendIcons = document.querySelectorAll(
    'svg[aria-label="Share"], svg[aria-label="Sdílet příspěvek"], svg[aria-label="Share Post"], svg[aria-label="Sdílet"], path[d*="M13.973 20.046"]'
  );

  sendIcons.forEach((element) => {
    const icon = element.tagName.toLowerCase() === 'path' ? element.closest('svg') : element;
    if (!icon) return;

    const sendButtonBlock = icon.closest('div[role="button"]') || icon.closest('button');
    if (!sendButtonBlock) return;

    const rect = sendButtonBlock.getBoundingClientRect();
    
    // Ignorovat výhradně plovoucí chat v pravém dolním rohu
    const isBottomRightChat = rect.top > window.innerHeight - 180 && rect.left > window.innerWidth - 400;
    if (isBottomRightChat || icon.closest('div[role="dialog"]') || icon.closest('footer')) return;

    const columnContainer = sendButtonBlock.parentElement;
    if (!columnContainer) return;

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

    let nextEl = sendButtonBlock.nextElementSibling;
    if (nextEl && nextEl.classList.contains("swchend-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "swchend-wrapper";

    const swchendBtn = document.createElement("button");
    swchendBtn.className = "swchend-icon-btn";
    swchendBtn.title = `${buttonLabelText} (Levý klik: poslat, Pravý klik: nastavení GUI)`;

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

    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      executeSend(sendButtonBlock, defaultTarget);
    });

    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSettingsGUI();
    });

    sendButtonBlock.insertAdjacentElement("afterend", wrapper);
  });
}

setInterval(injectSwchendButton, 1000);

// Globální klávesové zkratky
document.addEventListener("keydown", (e) => {
  const activeEl = document.activeElement;
  const isTyping =
    activeEl &&
    (activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.isContentEditable);

  if (isTyping) return;

  let targetForAction = null;

  if (e.key === "ArrowRight") {
    targetForAction = defaultTarget;
  } else if (e.key === "ArrowLeft" || (e.key >= "1" && e.key <= "9")) {
    targetForAction = keyMappings[e.key];
  }

  if (targetForAction) {
    e.preventDefault();
    e.stopPropagation();
    const activeShareBtn = getActiveShareButton();
    executeSend(activeShareBtn, targetForAction);
  }
});