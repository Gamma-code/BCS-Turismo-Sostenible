import { BASE_PATH } from "../config.js";


export const SW_URL = `${BASE_PATH}/sw.js`;
export const SW_SCOPE = `${BASE_PATH}/`;

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Este navegador no soporta Service Workers.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE,
    });

    console.log("[PWA] Service Worker registrado. Scope:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[PWA] No se pudo registrar el Service Worker:", error);
    return null;
  }
}
