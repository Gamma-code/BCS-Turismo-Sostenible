
// Preferencia de tema (claro/oscuro)

import { localStorageSafe } from "./storageService.js";

const THEME_KEY = "bcs_theme";
export const THEMES = { LIGHT: "claro", DARK: "oscuro" };

export function getTheme() {
  return localStorageSafe.get(THEME_KEY) ?? THEMES.LIGHT;
}

export function setTheme(theme) {
  localStorageSafe.set(THEME_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const next = getTheme() === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(next);
  return next;
}

// contenido de <main id="app">, nunca <html>, así que el tema no se pierde).
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  const boton = document.getElementById("theme-toggle");
  if (boton) {
    boton.textContent = theme === THEMES.DARK ? "☀️ Modo claro" : "🌙 Modo oscuro";
    boton.setAttribute("aria-pressed", theme === THEMES.DARK ? "true" : "false");
  }
}

// Debe llamarse una sola vez al iniciar la SPA (en main.js).
export function initTheme() {
  applyTheme(getTheme());

  
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY && event.newValue) {
      applyTheme(event.newValue);
    }
  });
}
