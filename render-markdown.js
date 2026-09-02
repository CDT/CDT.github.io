import { marked } from "https://cdn.jsdelivr.net/npm/marked@18.0.11/lib/marked.esm.js";

const source = document.body.dataset.markdownSource;
const content = document.querySelector("[data-markdown-content]");

const renderMarkdown = async () => {
    try {
        const response = await fetch(source);
        if (!response.ok) {
            throw new Error(`Unable to load ${source}`);
        }

        content.innerHTML = marked.parse(await response.text());
    } catch (error) {
        content.textContent = error.message;
    }
};

renderMarkdown();
