import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const resumes = [
    { markdown: "Resume.md", pages: ["index.html", "resume.html"] },
    { markdown: "resume-zh.md", pages: ["resume-zh.html"] },
    { markdown: "resume-ja.md", pages: ["resume-ja.html"] },
];
const beginMarker = "<!-- BEGIN GENERATED RESUME -->";
const endMarker = "<!-- END GENERATED RESUME -->";

const resolveRelativeLink = (target) => {
    if (!target || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(target)) {
        return target;
    }

    const url = new URL(target, "https://resume.invalid/files/");
    return `${url.pathname.slice(1)}${url.search}${url.hash}`;
};

// Rewrite Pandoc's link/image nodes before HTML escaping, including reference links.
const resolveRelativeLinks = (node) => {
    if (Array.isArray(node)) {
        node.forEach(resolveRelativeLinks);
    } else if (node && typeof node === "object") {
        if (node.t === "Link" || node.t === "Image") {
            node.c[2][0] = resolveRelativeLink(node.c[2][0]);
        }
        Object.values(node).forEach(resolveRelativeLinks);
    }
};

for (const resume of resumes) {
    // Use the same GFM reader and HTML5 writer as generate-resume-pdf.mjs.
    const document = JSON.parse(execFileSync("pandoc", [
        join(repositoryRoot, "files", resume.markdown),
        "--from=gfm",
        "--to=json",
    ], { encoding: "utf8" }));
    resolveRelativeLinks(document);
    const html = execFileSync("pandoc", [
        "--from=json",
        "--to=html5",
        "--wrap=none",
    ], { input: JSON.stringify(document), encoding: "utf8" }).trim();

    for (const page of resume.pages) {
        const pagePath = join(repositoryRoot, page);
        const template = readFileSync(pagePath, "utf8");
        const newline = template.includes("\r\n") ? "\r\n" : "\n";
        const region = /(<main\b[^>]*\bdata-markdown-content\b[^>]*>\s*<!-- BEGIN GENERATED RESUME -->)[\s\S]*?(<!-- END GENERATED RESUME -->\s*<\/main>)/;
        if (!region.test(template)) {
            throw new Error(`Missing generated resume markers inside <main> in ${page}.`);
        }
        const indentedHtml = html.split(/\r?\n/).map((line) => `        ${line}`).join(newline);
        writeFileSync(pagePath, template.replace(region, (_, start, end) =>
            `${start}${newline}${indentedHtml}${newline}        ${end}`));
        console.log(`Generated ${page} from files/${resume.markdown}`);
    }
}
