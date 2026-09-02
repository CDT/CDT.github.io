import { marked } from "https://cdn.jsdelivr.net/npm/marked@18.0.11/lib/marked.esm.js";

const source = document.body.dataset.markdownSource;
const content = document.querySelector("[data-markdown-content]");

const resolveRelativeLinks = () => {
    const sourceUrl = new URL(source, document.baseURI);

    content.querySelectorAll("a[href]").forEach((link) => {
        const href = link.getAttribute("href");
        if (href && !href.startsWith("#")) {
            link.href = new URL(href, sourceUrl).href;
        }
    });
};

const renderMarkdown = async () => {
    try {
        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`Unable to load ${source}`);
        }

        content.innerHTML = marked.parse(await response.text());
        resolveRelativeLinks();
    } catch (error) {
        content.textContent = error.message;
    }
};

renderMarkdown();
