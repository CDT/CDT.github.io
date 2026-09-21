import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteHost = readFileSync(join(repositoryRoot, "CNAME"), "utf8").trim();

const resumes = [
    { markdown: "Resume.md", pdf: "Chen-Dongtian-Resume.pdf", title: "Chen Dongtian | Resume" },
    { markdown: "resume-zh.md", pdf: "陈洞天-个人简历.pdf", title: "陈洞天 | 个人简历" },
    { markdown: "resume-ja.md", pdf: "Chen-Dongtian-履歴書.pdf", title: "Chen Dongtian | 履歴書" },
];

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

const chrome = findChrome();

for (const resume of resumes) {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "resume-pdf-"));
    const temporaryMarkdownPath = join(temporaryDirectory, resume.markdown);
    const temporaryHtmlPath = join(temporaryDirectory, "resume.html");
    const temporaryPdfPath = join(temporaryDirectory, resume.pdf);
    const headerPath = join(temporaryDirectory, "print-head.html");

    try {
        const markdownPath = join(repositoryRoot, "files", resume.markdown);
        const pdfPath = join(repositoryRoot, "files", resume.pdf);
        const markdown = readFileSync(markdownPath, "utf8")
            .replace(/^\[(?:Download PDF|下载 PDF|PDFをダウンロード)\].*$/m, "")
            .replaceAll("](certifications/", `](https://${siteHost}/files/certifications/`);

        writeFileSync(temporaryMarkdownPath, markdown);
        writeFileSync(headerPath, `
<style>
    @page { size: A4; margin: 12mm 15mm; }
    html { color: #1f2328; font: 9.25pt/1.28 "Noto Sans CJK SC", "Microsoft YaHei", Arial, sans-serif; }
    body { margin: 0; }
    h1 { font-size: 22pt; margin: 0 0 4pt; }
    h2 { border-bottom: 1px solid #d0d7de; font-size: 14pt; margin: 10pt 0 6pt; padding-bottom: 3pt; }
    h3 { font-size: 11pt; margin: 6pt 0 2pt; }
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
            `--metadata=pagetitle:${resume.title}`,
        ], { stdio: "inherit" });

        execFileSync(chrome, [
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            `--print-to-pdf=${temporaryPdfPath}`,
            `file:///${temporaryHtmlPath.replaceAll("\\", "/")}`,
        ], { stdio: "inherit" });

        if (!existsSync(temporaryPdfPath)) {
            throw new Error(`Chrome did not produce ${resume.pdf}.`);
        }

        copyFileSync(temporaryPdfPath, pdfPath);
    } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true });
    }
}
