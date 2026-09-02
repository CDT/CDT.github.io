import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const markdownPath = join(repositoryRoot, "files", "Resume.md");
const pdfPath = join(repositoryRoot, "files", "Resume.pdf");
const siteHost = readFileSync(join(repositoryRoot, "CNAME"), "utf8").trim();
const temporaryDirectory = mkdtempSync(join(tmpdir(), "resume-pdf-"));
const temporaryMarkdownPath = join(temporaryDirectory, "Resume.md");
const temporaryHtmlPath = join(temporaryDirectory, "Resume.html");
const temporaryPdfPath = join(temporaryDirectory, "Resume.pdf");
const headerPath = join(temporaryDirectory, "print-head.html");

const findChrome = () => {
    const candidates = process.platform === "win32"
        ? [
            join(process.env.PROGRAMFILES ?? "", "Google", "Chrome", "Application", "chrome.exe"),
            join(process.env["PROGRAMFILES(X86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
            join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
        ]
        : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];

    for (const candidate of candidates) {
        try {
            if (process.platform === "win32" && !existsSync(candidate)) {
                continue;
            }
            execFileSync(candidate, ["--version"], { stdio: "ignore" });
            return candidate;
        } catch {
            // Try the next common executable name.
        }
    }

    throw new Error("Chrome or Chromium is required to generate the resume PDF.");
};

try {
    const markdown = readFileSync(markdownPath, "utf8")
        .replace(/^\[Download PDF\]\(Resume\.pdf\)\s*$/m, "")
        .replaceAll("](certifications/", `](https://${siteHost}/files/certifications/`);

    writeFileSync(temporaryMarkdownPath, markdown);
    writeFileSync(headerPath, `
<style>
    @page { size: A4; margin: 13mm 15mm; }
    html { color: #1f2328; font: 10pt/1.35 Arial, sans-serif; }
    body { margin: 0; }
    h1 { font-size: 22pt; margin: 0 0 4pt; }
    h2 { border-bottom: 1px solid #d0d7de; font-size: 14pt; margin: 13pt 0 7pt; padding-bottom: 3pt; }
    h3 { font-size: 11pt; margin: 8pt 0 2pt; }
    p { margin: 3pt 0; }
    ul { margin: 3pt 0 6pt; padding-left: 18pt; }
    li { margin: 1pt 0; }
    hr { border: 0; border-top: 1px solid #d0d7de; margin: 9pt 0; }
    a { color: inherit; text-decoration: none; }
    h2, h3 { break-after: avoid; }
    li, p { orphans: 2; widows: 2; }
</style>`);

    execFileSync("pandoc", [
        temporaryMarkdownPath,
        "--from=gfm",
        "--to=html5",
        "--standalone",
        `--include-in-header=${headerPath}`,
        `--output=${temporaryHtmlPath}`,
        "--metadata=title:Chen Dongtian | Resume",
    ], { stdio: "inherit" });

    execFileSync(findChrome(), [
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        `--print-to-pdf=${temporaryPdfPath}`,
        `file:///${temporaryHtmlPath.replaceAll("\\", "/")}`,
    ], { stdio: "inherit" });

    if (!existsSync(temporaryPdfPath)) {
        throw new Error("Chrome did not produce a resume PDF.");
    }

    copyFileSync(temporaryPdfPath, pdfPath);
} finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
}
