let targetUsername = localStorage.getItem("swchend_target") || null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendReelToTarget() {
  if (!targetUsername) {
    const userPrompt = prompt(
      "Zadej přesný Instagram USERNAME člověka, kterému se má reel automaticky posílat (např. jan_novak):"
    );
    if (!userPrompt) return;
    targetUsername = userPrompt.trim().toLowerCase();
    localStorage.setItem("swchend_target", targetUsername);
    alert(`Příjemce uložen: ${targetUsername}\nKlikni na Swchend znovu pro odeslání.`);
    return;
  }

  // Najít originální tlačítko Send v pravé liště akcí
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

    // FILTR: Ignorujeme cokoliv v dolní liště zpráv, modalech nebo plovoucích elementech
    if (icon.closest('div[role="dialog"]') || icon.closest('div[style*="fixed"]') || icon.closest('div[style*="absolute"]') || icon.closest('footer')) return;

    const sendButtonBlock = icon.closest('div[role="button"]') || icon.closest('button');
    if (!sendButtonBlock) return;

    // Ujistíme se, že jsme opravdu v postranním sloupci Reels tlačítek (hledáme rodiče s Likes/Comments)
    const columnContainer = sendButtonBlock.parentElement;
    if (!columnContainer) return;

    // Kontrola, zda rodičovský sloupec obsahuje i další akční ikony (aby to nebylo okno zpráv)
    const hasOtherActions = columnContainer.querySelector('svg[aria-label="Like"], svg[aria-label="Comment"], svg[aria-label="To se mi líbí"], svg[aria-label="Komentář"]') ||
                             columnContainer.parentElement?.querySelector('svg[aria-label="Like"], svg[aria-label="Comment"], svg[aria-label="To se mi líbí"]');
    
    if (!hasOtherActions) return;

    // Vynutíme svislé uspořádání pro původní tlačítko Share
    sendButtonBlock.style.display = "flex";
    sendButtonBlock.style.flexDirection = "column";
    sendButtonBlock.style.alignItems = "center";
    sendButtonBlock.style.justifyContent = "center";

    // Přidání textu "Share" pod originální ikonu letadélka
    if (!sendButtonBlock.querySelector('.swchend-share-label')) {
      const shareLabel = document.createElement("span");
      shareLabel.className = "swchend-label swchend-share-label";
      shareLabel.innerText = "Share";
      sendButtonBlock.appendChild(shareLabel);
    }

    // Kontrola duplicity pro Swchend
    if (columnContainer.querySelector(".swchend-wrapper")) return;

    // Vytvoření bloku pro tlačítko Swchend
    const wrapper = document.createElement("div");
    wrapper.className = "swchend-wrapper";

    const swchendBtn = document.createElement("button");
    swchendBtn.className = "swchend-icon-btn";
    swchendBtn.title = "Swchend (Levý klik: poslat, Pravý klik: změnit příjemce)";

    swchendBtn.innerHTML = `
      <svg aria-label="Swchend" role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    `;

    const label = document.createElement("span");
    label.className = "swchend-label";
    label.innerText = "Swchend";

    wrapper.appendChild(swchendBtn);
    wrapper.appendChild(label);

    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      sendReelToTarget();
    });

    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const newTarget = prompt("Změnit příjemce (aktuální: " + (targetUsername || "žádný") + "):");
      if (newTarget) {
        targetUsername = newTarget.trim().toLowerCase();
        localStorage.setItem("swchend_target", targetUsername);
        alert(`Nový příjemce: ${targetUsername}`);
      }
    });

    sendButtonBlock.insertAdjacentElement("afterend", wrapper);
  });
}

// Klávesová zkratka: Šipka vpravo (ArrowRight) pro odeslání
document.addEventListener("keydown", (e) => {
  // Ignorujeme, pokud uživatel právě píše do textového pole nebo chatu
  const activeEl = document.activeElement;
  const isTyping =
    activeEl &&
    (activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.isContentEditable);

  if (isTyping) return;

  // Pokud je stisknuta šipka vpravo
  if (e.key === "ArrowRight") {
    e.preventDefault();
    e.stopPropagation();
    sendReelToTarget();
  }
});

setInterval(injectSwchendButton, 1000);
