const CACHE_VERSION = "bcs-app-shell-v3";

const CDN_ORIGIN = "https://cdn.jsdelivr.net";
const API_ORIGIN = "https://bcs-turismo-api.onrender.com";
const CLIMA_ORIGIN = "https://api.open-meteo.com";
const ORIGENES_PERMITIDOS = [
  self.location.origin,
  CDN_ORIGIN,
  API_ORIGIN,
  CLIMA_ORIGIN,
];

const APP_SHELL = [
  "./",
  "index.html",
  "404.html",
  "styles/shell.css",
  "styles/main.css",
  "src/main.js",
  "src/config.js",
  "src/router/router.js",
  "src/components/DestinoCard.js",
  "src/pwa/registerSW.js",
  "src/pwa/estadoConexion.js",
  "src/views/HomeView.js",
  "src/views/AboutView.js",
  "src/views/DestinoDetailView.js",
  "src/views/DiagnosticoView.js",
  "src/views/MiListaView.js",
  "src/views/ServiceWorkerView.js",
  "src/views/CacheLabView.js",
  "src/views/NotFoundView.js",
  "src/services/destinosData.js",
  "src/services/destinosService.js",
  "src/services/weatherService.js",
  "src/services/storageService.js",
  "src/services/themeService.js",
  "src/services/visitasService.js",
  "src/services/dbService.js",
  "src/utils/slugify.js",
  "data/aviso.json",
  "data/estado-destinos.json",
];

const EXTERNOS = [`${CDN_ORIGIN}/npm/idb@8/+esm`];

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

      for (const url of EXTERNOS) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn("[SW] No se pudo precachear el externo:", url, error);
        }
      }

      console.log("[SW] App Shell precacheado:", (await cache.keys()).length, "recursos");
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

      // Toma el control de las pestañas abiertas sin esperar a una recarga
      await self.clients.claim();
    })()
  );
});

// Decide si el SW se hace cargo de una petición.
function debeAtender(request) {
  if (request.method !== "GET") return false;

  if (!ORIGENES_PERMITIDOS.includes(new URL(request.url).origin)) return false;

  if (request.cache === "only-if-cached" && request.mode !== "same-origin")
    return false;

  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!debeAtender(request)) {
    avisarALaApp(request, "ignorada", "ninguna");
    return;
  }

  event.respondWith(responder(event));
});

async function responder(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_VERSION);

  const clave = request.mode === "navigate" ? "index.html" : request;

  const estrategia = elegirEstrategia(request);
  return estrategia(event, cache, clave);
}

// Decide qué estrategia usar según el recurso
function elegirEstrategia(request) {
  const url = new URL(request.url);

  // Datos que viven en un servidor y cambian: primero la red
  if (url.origin === API_ORIGIN) return networkFirst;
  if (url.origin === CLIMA_ORIGIN) return networkFirst;

  // Aforo y acceso del día: si hay red queremos el dato de hoy, no el de ayer
  if (url.pathname.endsWith("/data/estado-destinos.json")) return networkFirst;

  // Aviso informativo: se muestra al instante y se actualiza por detrás
  if (url.pathname.endsWith("/data/aviso.json")) return staleWhileRevalidate;

  return cacheFirst;
}

// Busca primero en caché solo va a la red si no hay copia
async function cacheFirst(event, cache, clave) {
  const { request } = event;

  const enCache = await cache.match(clave);
  if (enCache) {
    console.log("[SW] Cache First · HIT =>", request.url);
    avisarALaApp(request, "cache", "cache-first");
    return enCache;
  }

  console.log("[SW] Cache First · MISS =>", request.url);

  try {
    const respuesta = await desdeLaRed(request);


    if (respuesta.ok) {
      event.waitUntil(cache.put(clave, respuesta.clone()));
    }

    avisarALaApp(request, "red", "cache-first");
    return respuesta;
  } catch (error) {
    avisarALaApp(request, "emergencia", "cache-first");
    return respuestaDeEmergencia(request);
  }
}

async function networkFirst(event, cache, clave) {
  const { request } = event;

  try {
    const respuesta = await desdeLaRed(request);

    if (respuesta.ok) {
      event.waitUntil(cache.put(clave, respuesta.clone()));
    }

    console.log("[SW] Network First · red =>", request.url);
    avisarALaApp(request, "red", "network-first");
    return respuesta;
  } catch (error) {
    const enCache = await cache.match(clave);

    if (enCache) {
      console.log("[SW] Network First · sin red, uso caché =>", request.url);
      avisarALaApp(request, "cache", "network-first");
      return enCache;
    }

    avisarALaApp(request, "emergencia", "network-first");
    return respuestaDeEmergencia(request);
  }
}

async function staleWhileRevalidate(event, cache, clave) {
  const { request } = event;

  const enCache = await cache.match(clave);

  const revalidacion = desdeLaRed(request)
    .then(async (respuesta) => {
      if (respuesta.ok) {
        await cache.put(clave, respuesta.clone());
        avisarALaApp(request, "actualizada", "stale-while-revalidate");
      }
      return respuesta;
    })
    .catch(() => null);

  if (enCache) {
    event.waitUntil(revalidacion);
    console.log("[SW] SWR · entrego caché y actualizo por detrás =>", request.url);
    avisarALaApp(request, "cache", "stale-while-revalidate");
    return enCache;
  }

  // Primera vez no hay copia, hay que esperar a la red
  const respuesta = await revalidacion;
  if (respuesta) {
    avisarALaApp(request, "red", "stale-while-revalidate");
    return respuesta;
  }

  avisarALaApp(request, "emergencia", "stale-while-revalidate");
  return respuestaDeEmergencia(request);
}

function desdeLaRed(request) {
  return fetch(request, { cache: "no-store" });
}

function respuestaDeEmergencia(request) {
  if (request.mode === "navigate") {
    return new Response(
      `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>Sin conexión</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">
  <h1>Sin conexión</h1>
  <p>No pudimos cargar esta página y no hay una copia guardada.</p>
  <p>Revisa tu conexión e inténtalo de nuevo.</p>
</body></html>`,
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      offline: true,
      mensaje: "Sin conexión y sin copia en caché",
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }
  );
}

function avisarALaApp(request, origen, estrategia) {
  self.clients.matchAll({ type: "window" }).then((clientes) => {
    const ruta = request.url.replace(self.location.origin, "");
    clientes.forEach((cliente) =>
      cliente.postMessage({
        type: "FETCH_LOG",
        method: request.method,
        ruta,
        estrategia,
        origen,
      })
    );
  });
}