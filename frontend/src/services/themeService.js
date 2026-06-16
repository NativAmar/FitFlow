const THEME_KEY = "fitflow_theme";
const VALID_THEMES = ["light", "dark", "system"];

function getCachedTheme() {
  const cached = localStorage.getItem(THEME_KEY);
  return VALID_THEMES.includes(cached) ? cached : null;
}

function applyTheme(theme) {
  const value = VALID_THEMES.includes(theme) ? theme : "light";
  document.documentElement.setAttribute("data-theme", value);
  localStorage.setItem(THEME_KEY, value);
}

export { applyTheme, getCachedTheme, VALID_THEMES };
