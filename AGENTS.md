# Repository Guidelines

## Project Structure & Module Organization

This repository is a small, dependency-free GitHub Pages site. `index.html` is the projects landing page, while `resume.html` contains the web resume. Shared presentation rules live in `style.css`, and `theme.js` manages light/dark theme selection and persistence. Root-level assets include `favicon.ico` and `CNAME`. The `files/` directory contains downloadable resume versions (`Resume.pdf`, `Resume.docx`, `Resume.md`, and `Resume.txt`).

Keep page-specific markup in its HTML file and reusable visual rules in `style.css`. If adding assets, use descriptive lowercase names and group related files in a clearly named directory rather than crowding the repository root.

## Build, Test, and Development Commands

There is no package manager, compilation step, or generated site output. Serve the repository locally to avoid browser restrictions associated with opening files directly:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/`. Use `git diff --check` before committing to catch whitespace errors, and `git status --short` to confirm only intended files changed.

## Coding Style & Naming Conventions

Follow the existing four-space indentation in HTML, CSS, and JavaScript. Prefer semantic HTML elements, accessible labels, and BEM-like CSS class names such as `.theme-toggle__icon`. Use `const`, arrow functions, and double-quoted strings in JavaScript, matching `theme.js`. Keep CSS custom properties centralized and reuse existing responsive and theme patterns. Use lowercase kebab-case for new web assets and page names.

## Testing Guidelines

No automated test framework or coverage requirement is configured. Manually verify both pages at desktop and narrow mobile widths. Check navigation, external links, downloadable resume files, keyboard focus, and light/dark theme behavior. Inspect the browser console for errors and confirm the selected theme persists after reload.

## Commit & Pull Request Guidelines

Recent history contains very terse commits (`.`) alongside imperative messages such as `Update CNAME`. Improve on this by using short, specific, imperative subjects, for example `Add project card for Newsbot`. Keep each commit focused.

Pull requests should summarize the user-visible change, list manual checks performed, and link any relevant issue. Include before/after screenshots for layout, styling, or responsive changes. Call out changes to `CNAME` or downloadable resume files explicitly because they affect deployment or published personal information.
