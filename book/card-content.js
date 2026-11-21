function renderCard(card, xhtml, baseUrl, language) {
  const source = new DOMParser().parseFromString(xhtml, "application/xhtml+xml");
  const content = source.querySelector("main") || source.querySelector("body");
  if (!content) throw new Error("Invalid card");

  for (const element of content.querySelectorAll("img[src], a[href]")) {
    const attr = element.localName === "img" ? "src" : "href";
    const value = element.getAttribute(attr);
    if (!value.startsWith("#")) {
      element.setAttribute(attr, new URL(value, baseUrl).href);
    }
  }
  card.lang = language || source.documentElement.getAttribute("xml:lang") || "en";
  card.replaceChildren(...content.childNodes);

  const heading = card.querySelector("h1");
  if (heading) {
    const subheading = document.createElement("h2");
    subheading.className = "card-title";
    subheading.append(...heading.childNodes);
    heading.replaceWith(subheading);

    const illustration = card.querySelector(".illustration");
    const definition = card.querySelector(".definition");
    if (illustration && definition) {
      const hero = document.createElement("figure");
      hero.className = "card-hero";
      const caption = document.createElement("figcaption");
      illustration.replaceWith(hero);
      hero.append(illustration, caption);
      if (illustration.getAttribute("data-word-in-image") === "true") {
        hero.classList.add("word-in-image");
        subheading.classList.add("visually-hidden");
      } else {
        caption.append(subheading);
      }
      caption.append(definition);
      const phonetics = card.querySelector(".phonetics");
      if (phonetics) hero.after(phonetics);
    }
  }
  for (const heading of card.querySelectorAll("section > h2")) {
    const subheading = document.createElement("h3");
    subheading.append(...heading.childNodes);
    heading.replaceWith(subheading);
  }
}
