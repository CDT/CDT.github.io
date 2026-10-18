# Repository Guidelines

## Project Structure & Module Organization

This repository is a small GitHub Pages site without npm dependencies. `index.html` and `resume.html` contain the English resume; `resume-zh.html` and `resume-ja.html` contain the Chinese and Japanese resumes. Their static resume content is generated from Markdown sources in `files/`. Shared presentation rules live in `style.css`, with light/dark styling supplied by github-markdown-css. Root-level assets include `favicon.ico` and `CNAME`. The `files/` directory contains Markdown sources, downloadable PDF and plain-text resumes, and certification images.

Keep page-specific markup in its HTML file and reusable visual rules in `style.css`. If adding assets, use descriptive lowercase names and group related files in a clearly named directory rather than crowding the repository root.

## Build, Test, and Development Commands

There is no package manager or compilation step. After editing a resume Markdown source, regenerate the HTML pages and downloadable PDFs with Node.js and Pandoc (PDF generation also requires Chrome or Chromium):

```powershell
node scripts/generate-resume-html.mjs
node scripts/generate-resume-pdf.mjs
```

Serve the repository locally:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/`. Use `git diff --check` before committing to catch whitespace errors, and `git status --short` to confirm only intended files changed.

## Coding Style & Naming Conventions

Follow the existing four-space indentation in HTML, CSS, and JavaScript. Prefer semantic HTML elements, accessible labels, and BEM-like CSS class names such as `.theme-toggle__icon`. Use `const`, arrow functions, and double-quoted strings in JavaScript. Keep CSS custom properties centralized and reuse existing responsive and theme patterns. Use lowercase kebab-case for new web assets and page names.

## Testing Guidelines

No automated test framework or coverage requirement is configured. Manually verify all four pages at desktop and narrow mobile widths. Check navigation, external links, downloadable resume files, keyboard focus, and light/dark styling based on the system preference. Inspect the browser console for errors.

## Commit & Pull Request Guidelines

Recent history contains very terse commits (`.`) alongside imperative messages such as `Update CNAME`. Improve on this by using short, specific, imperative subjects, for example `Add project card for Newsbot`. Keep each commit focused.

Pull requests should summarize the user-visible change, list manual checks performed, and link any relevant issue. Include before/after screenshots for layout, styling, or responsive changes. Call out changes to `CNAME` or downloadable resume files explicitly because they affect deployment or published personal information.
