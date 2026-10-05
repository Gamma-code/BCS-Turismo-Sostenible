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
      await self.clients.claim();
    })()
  );
});

// Decide si el SW se hace cargo de una petición.
function debeAtender(request) {
  
  if (request.method !== "GET") return false;

  // Solo nuestro origen: las respuestas de la API del clima
  
  if (new URL(request.url).origin !== self.location.origin) return false;

  // respuesta solo-de-caché y no es same-origin
  if (request.cache === "only-if-cached" && request.mode !== "same-origin")
    return false;

  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!debeAtender(request)) {
    
    avisarALaApp(request, "ignorada");
    return;
  }

  event.respondWith(responder(event));
});

async function responder(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_VERSION);

  // Cualquier ruta del router se responde con el
  // mismo index.html del App Shell, para no duplicar entradas en la cache
  const buscar = request.mode === "navigate" ? "index.html" : request;

  const enCache = await cache.match(buscar);
  if (enCache) {
    console.log("[SW] HIT =>", request.url);
    avisarALaApp(request, "cache");
    return enCache;
  }

  console.log("[SW] MISS =>", request.url);
  const respuesta = await fetch(request);

  // Solo guardamos respuestas correctas: cachear un 404 o un 500 dejarria
  // el error pegado hasta que cambie la version de cache
  if (respuesta.ok) {
    event.waitUntil(cache.put(request, respuesta.clone()));
  }

  avisarALaApp(request, "red");
  return respuesta;
}

// para poder mostrarlo en la vista de diagnóstico.
function avisarALaApp(request, origen) {
  self.clients.matchAll({ type: "window" }).then((clientes) => {
    const ruta = request.url.replace(self.location.origin, "");
    clientes.forEach((cliente) =>
      cliente.postMessage({
        type: "FETCH_LOG",
        method: request.method,
        ruta,
        origen,
      })
    );
  });
}
