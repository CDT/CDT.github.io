(() => {
    const storageKey = "theme-preference";
    const root = document.documentElement;
    const toggles = document.querySelectorAll("[data-theme-toggle]");

    const getPreferredTheme = () => {
        const storedTheme = window.localStorage.getItem(storageKey);
        if (storedTheme === "light" || storedTheme === "dark") {
            return storedTheme;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const applyTheme = (theme) => {
        root.dataset.theme = theme;

        toggles.forEach((toggle) => {
            const isDark = theme === "dark";
            const label = isDark ? "Switch to light theme" : "Switch to dark theme";
            toggle.setAttribute("aria-pressed", String(isDark));
            toggle.setAttribute("aria-label", label);
            toggle.setAttribute("title", label);
        });
    };

    applyTheme(getPreferredTheme());

    toggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
            window.localStorage.setItem(storageKey, nextTheme);
            applyTheme(nextTheme);
        });
    });
})();
