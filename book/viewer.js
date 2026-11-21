const cardList = document.querySelector("#card-list");
const card = document.querySelector("#card");
const category = document.querySelector("#category");
const search = document.querySelector("#search");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const position = document.querySelector("#position");
const message = document.querySelector("#message");

let catalog = [];
let visibleCards = [];
let currentIndex = -1;
let activeRequest;

function updateList() {
  const selected = visibleCards[currentIndex]?.url;
  const query = search.value.trim().toLocaleLowerCase();
  visibleCards = catalog.filter((entry) =>
    (!category.value || entry.category === category.value) &&
    entry.title.toLocaleLowerCase().includes(query)
  );
  cardList.replaceChildren(...visibleCards.map((entry, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.lang = entry.language;
    button.textContent = entry.title;
    button.addEventListener("click", () => showCard(index));
    item.append(button);
    return item;
  }));
  showCard(Math.max(0, visibleCards.findIndex((entry) => entry.url === selected)));
}

async function showCard(index) {
  activeRequest?.abort();
  const entry = visibleCards[index];
  currentIndex = entry ? index : -1;

  for (const [buttonIndex, button] of [...cardList.querySelectorAll("button")].entries()) {
    if (buttonIndex === currentIndex) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }
  previous.disabled = currentIndex <= 0;
  next.disabled = !entry || currentIndex === visibleCards.length - 1;
  position.textContent = entry ? `Card ${index + 1} of ${visibleCards.length}` : "";
  card.hidden = true;
  message.hidden = false;
  if (!entry) {
    message.textContent = catalog.length ? "No cards match your filters." : "The library is empty.";
    return;
  }

  message.textContent = "Loading card…";
  const request = new AbortController();
  activeRequest = request;
  try {
    const response = await fetch(entry.url, { signal: request.signal });
    if (!response.ok) throw new Error("Card unavailable");
    const xhtml = await response.text();
    if (request.signal.aborted) return;

    renderCard(card, xhtml, new URL(entry.url, document.baseURI), entry.language);
    message.hidden = true;
    card.hidden = false;
  } catch {
    if (!request.signal.aborted) message.textContent = "This card could not be opened.";
  }
}

async function openLibrary() {
  try {
    const response = await fetch("catalog.json");
    if (!response.ok) throw new Error("Library unavailable");
    catalog = await response.json();
    document.querySelector("#deck-total").textContent =
      `${catalog.length} ${catalog.length === 1 ? "card" : "cards"} in the library`;
    search.addEventListener("input", updateList);
    category.addEventListener("change", updateList);
    previous.addEventListener("click", () => showCard(currentIndex - 1));
    next.addEventListener("click", () => showCard(currentIndex + 1));
    updateList();
  } catch {
    message.textContent = "The library could not be loaded. Refresh to try again.";
  }
}

openLibrary();
