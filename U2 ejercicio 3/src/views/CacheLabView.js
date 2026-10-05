import { BASE_PATH, API_URL } from "../config.js";

const ARCHIVO_PROPIO = `${BASE_PATH}/data/aviso.json`;
const API_CLIMA = "https://api.open-meteo.com/v1/forecast?latitude=24.14&longitude=-110.31&current_weather=true";
const MAX_LOG = 25;

const ETIQUETAS = {
  cache: `<span class="sw-ok">Caché (HIT)</span>`,
  red: "Red (MISS)",
  ignorada: `<small>Ignorada (el SW no responde)</small>`,
};

const registro = [];

function htmlRegistro() {
  if (registro.length === 0) {
    return `<p class="lista-vacia">Sin peticiones todavía. Usa los botones de arriba.</p>`;
  }

  const filas = registro
    .map(
      ({ hora, method, ruta, origen }) => `
        <tr>
          <td>${hora}</td>
          <td>${method}</td>
          <td><small><code>${ruta}</code></small></td>
          <td>${ETIQUETAS[origen] ?? origen}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="sw-tabla">
      <table class="storage-table">
        <thead>
          <tr><th>Hora</th><th>Método</th><th>Recurso</th><th>Resultado</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

function pintarRegistro() {
  const caja = document.getElementById("lab-log");
  if (caja) caja.innerHTML = htmlRegistro();
}

// El SW avisa por postMessage qué hizo con cada petición
navigator.serviceWorker?.addEventListener("message", (event) => {
  if (event.data?.type !== "FETCH_LOG") return;

  registro.unshift({
    ...event.data,
    hora: new Date().toLocaleTimeString("es-MX"),
  });
  registro.splice(MAX_LOG);
  pintarRegistro();
});

async function entradasEnCache() {
  if (!("caches" in window)) return [];

  const nombres = await caches.keys();
  const grupos = await Promise.all(
    nombres.map(async (nombre) => {
      const cache = await caches.open(nombre);
      const peticiones = await cache.keys();
      return peticiones.map((p) => ({ nombre, url: p.url }));
    })
  );
  return grupos.flat();
}

function htmlCache(entradas) {
  if (entradas.length === 0) {
    return `<p class="lista-vacia">No hay ninguna caché todavía.</p>`;
  }

  const filas = entradas
    .map(
      ({ nombre, url }) => `
        <tr>
          <td><small><code>${nombre}</code></small></td>
          <td><small>${url.replace(window.location.origin, "")}</small></td>
          <td>
            <button type="button" class="btn-secundario"
              data-lab-action="borrar"
              data-cache="${nombre}"
              data-url="${url}">Borrar</button>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="sw-tabla">
      <table class="storage-table">
        <thead>
          <tr><th>Caché</th><th>Recurso</th><th>Acción</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}

async function pintarCache() {
  const caja = document.getElementById("lab-cache");
  if (caja) caja.innerHTML = htmlCache(await entradasEnCache());
}

function mostrar(texto) {
  const salida = document.getElementById("lab-result");
  if (salida) salida.textContent = texto;
}

async function pedir(etiqueta, url, opciones) {
  mostrar(`${etiqueta}: pidiendo...`);
  const inicio = performance.now();

  try {
    const respuesta = await fetch(url, opciones);
    const texto = await respuesta.text();
    const ms = Math.round(performance.now() - inicio);
    mostrar(`${etiqueta} → ${respuesta.status} en ${ms} ms\n${texto.slice(0, 240)}`);
  } catch (error) {
    mostrar(`${etiqueta} → ${error.name}: ${error.message}`);
  }

  await pintarCache();
}

async function borrarEntrada(nombreCache, url) {
  const cache = await caches.open(nombreCache);
  const borrada = await cache.delete(url);

  mostrar(
    borrada
      ? `cache.delete() → true. Se eliminó ${url.replace(window.location.origin, "")} de ${nombreCache}.`
      : "cache.delete() → false. Esa entrada no estaba en la caché."
  );

  await pintarCache();
}

document.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-lab-action]");
  if (!boton) return;

  const accion = boton.dataset.labAction;

  if (accion === "archivo-propio") {
    await pedir("GET archivo propio", ARCHIVO_PROPIO);
  } else if (accion === "api-clima") {
    await pedir("GET API del clima", API_CLIMA);
  } else if (accion === "post-api") {
    await pedir("POST a nuestra API", `${API_URL}/destinos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "prueba" }),
    });
  } else if (accion === "refrescar") {
    await pintarCache();
  } else if (accion === "borrar") {
    await borrarEntrada(boton.dataset.cache, boton.dataset.url);
  } else if (accion === "limpiar-log") {
    registro.length = 0;
    pintarRegistro();
  }
});

export default async function CacheLabView() {
  const entradas = await entradasEnCache();

  return `
    <div class="card">
      <h2>Caché y peticiones</h2>
      <p>Cada botón hace una petición distinta. Fíjate cuáles atiende el
      Service Worker y cuáles deja pasar a la red.</p>
      <div class="storage-actions">
        <button type="button" data-lab-action="archivo-propio">GET archivo propio</button>
        <button type="button" data-lab-action="api-clima" class="btn-secundario">GET API del clima</button>
        <button type="button" data-lab-action="post-api" class="btn-secundario">POST a nuestra API</button>
      </div>
      <pre id="lab-result" class="sw-result"></pre>
    </div>

    <div class="card">
      <h3>Peticiones vistas por el Service Worker</h3>
      <div id="lab-log">${htmlRegistro()}</div>
      <div class="storage-actions">
        <button type="button" data-lab-action="limpiar-log" class="btn-secundario">Limpiar registro</button>
      </div>
    </div>

    <div class="card">
      <h3>Contenido de Cache Storage</h3>
      <p>Borrar una entrada obliga al SW a pedirla de nuevo a la red la
      próxima vez.</p>
      <div id="lab-cache">${htmlCache(entradas)}</div>
      <div class="storage-actions">
        <button type="button" data-lab-action="refrescar" class="btn-secundario">Actualizar lista</button>
      </div>
    </div>
  `;
}
