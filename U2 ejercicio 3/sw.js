   const CACHE_VERSION = "bcs-app-shell-v2";

const APP_SHELL = [
  "./",
  "index.html",
  "styles/shell.css",
  "styles/main.css",
  "src/main.js",
];

console.log("[SW] Script en ejecución");
console.log("[SW] Contexto global =>", self.constructor.name);

// No existen dentro de un Service Worker
console.log("[SW] typeof window =>", typeof window);
console.log("[SW] typeof document =>", typeof document);
console.log("[SW] typeof localStorage =>", typeof localStorage);

// Sí existen dentro de un Service Worker
console.log("[SW] typeof indexedDB =>", typeof indexedDB);
console.log("[SW] typeof caches =>", typeof caches);

console.log("[SW] Scope =>", self.registration.scope);

self.addEventListener("install", (event) => {
  console.log("[SW] install =>", CACHE_VERSION);

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(APP_SHELL);
      console.log("[SW] App Shell precacheado:", APP_SHELL.length, "recursos");
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate =>", CACHE_VERSION);

  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      console.log("[SW] Cachés existentes:", nombres);

      const viejas = nombres.filter((nombre) => nombre !== CACHE_VERSION);

      await Promise.all(
        viejas.map((nombre) => {
          console.log("[SW] Eliminando caché vieja:", nombre);
          return caches.delete(nombre);
        })
      );

      console.log("[SW] Cachés después de limpiar:", await caches.keys());
    })()
  );
});