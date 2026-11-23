import Router from "./router/router.js";
import { registerServiceWorker } from "./pwa/registerSW.js";
import { initEstadoConexion } from "./pwa/estadoConexion.js";
import { initInstalacion } from "./pwa/instalacionApp.js";
import { initBotonInstalar } from "./pwa/botonInstalar.js";
import { initSincronizacion } from "./pwa/sincronizacion.js";
import { initNotificaciones } from "./pwa/notificaciones.js";
import { initPush } from "./pwa/suscripcionPush.js";
import { initTheme, toggleTheme } from "./services/themeService.js";
import { registrarVisita } from "./services/visitasService.js";
import {
  sessionStorageSafe,
  localStorageSafe,
  deleteCookie,
} from "./services/storageService.js";
import { VISITAS_KEY, ULTIMA_VISITA_KEY } from "./services/visitasService.js";

// Cada vista se carga hasta que alguien la visita. Antes se descargaban las
// nueve de golpe, aunque el usuario solo viera el inicio.
const routes = [
  { path: "/", view: () => import("./views/HomeView.js") },
  { path: "/acerca", view: () => import("./views/AboutView.js") },
  { path: "/destino/:id", view: () => import("./views/DestinoDetailView.js") },
  { path: "/diagnostico", view: () => import("./views/DiagnosticoView.js") },
  { path: "/mi-lista", view: () => import("./views/MiListaView.js") },
  { path: "/service-worker", view: () => import("./views/ServiceWorkerView.js") },
  { path: "/cache", view: () => import("./views/CacheLabView.js") },
  { path: "/reportes", view: () => import("./views/ReportesView.js") },
  { path: "/cerca", view: () => import("./views/CercaDeMiView.js") },
];


const app = document.getElementById("app");
const router = new Router(routes, app);


initTheme();

initEstadoConexion();

initInstalacion();

initBotonInstalar();

initSincronizacion();

initNotificaciones();

initPush();

registrarVisita();

router.init();

//Se registra el Sw al terminar la carga de lapagina
window.addEventListener("load", () => registerServiceWorker());


// Botón de tema en el header (fijo en index.html/404.html, no lo
// pinta el router, así que se conecta una sola vez aquí) 
const themeButton = document.getElementById("theme-toggle");
if (themeButton) {
  themeButton.addEventListener("click", () => toggleTheme());
}

//Filtro de destinos (sessionStorage) y el Diagnóstico 


const FILTRO_KEY = "bcs_filtro_destinos";

document.addEventListener("input", async (event) => {
  if (event.target.id !== "destino-filtro") return;

  const termino = event.target.value;
  sessionStorageSafe.set(FILTRO_KEY, termino);

  const grid = document.getElementById("destinos-grid");
  if (!grid) return;

  // Si la rejilla existe es porque el inicio ya se cargó, así que estos
  // dos import() salen de la caché del navegador
  const [{ filtrarDestinos }, { default: DestinoCard }] = await Promise.all([
    import("./views/HomeView.js"),
    import("./components/DestinoCard.js"),
  ]);

  const resultados = filtrarDestinos(termino);
  grid.innerHTML = resultados.length
    ? resultados.map((destino) => DestinoCard(destino)).join("")
    : `<p class="sin-resultados">No hay destinos que coincidan con "${termino}".</p>`;
});

document.addEventListener("click", (event) => {
  const boton = event.target.closest("[data-diag-clear]");
  if (!boton) return;

  const tipo = boton.dataset.diagClear; // "theme" | "filtro" | "visitas"

  if (tipo === "theme") {
    localStorageSafe.remove("bcs_theme");
    document.documentElement.setAttribute("data-theme", "claro");
    if (themeButton) {
      themeButton.textContent = "🌙 Modo oscuro";
      themeButton.setAttribute("aria-pressed", "false");
    }
  } else if (tipo === "filtro") {
    sessionStorageSafe.remove(FILTRO_KEY);
  } else if (tipo === "visitas") {
    deleteCookie(VISITAS_KEY);
    deleteCookie(ULTIMA_VISITA_KEY);
  }

  actualizarDiagnostico();
});

async function actualizarDiagnostico() {
  const themeValue = document.getElementById("diag-theme-value");
  if (!themeValue) return; // no estamos en la vista de diagnóstico

  const { leerEstadoStorage } = await import("./views/DiagnosticoView.js");
  const estado = leerEstadoStorage();
  themeValue.textContent = estado.tema;
  document.getElementById("diag-filtro-value").textContent = estado.filtro ?? "(vacío)";
  document.getElementById("diag-visitas-value").textContent = estado.visitas ?? "(vacío)";
  document.getElementById("diag-ultima-visita-value").textContent = estado.ultimaVisita ?? "(vacío)";
  
}
