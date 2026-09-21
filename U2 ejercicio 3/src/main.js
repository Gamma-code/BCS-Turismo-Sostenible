import Router from "./router/router.js";
import HomeView, { filtrarDestinos } from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import DestinoDetailView from "./views/DestinoDetailView.js";
import DiagnosticoView, { leerEstadoStorage } from "./views/DiagnosticoView.js";
import MiListaView from "./views/MiListaView.js";
import ServiceWorkerView from "./views/ServiceWorkerView.js";
import DestinoCard from "./components/DestinoCard.js";
import { registerServiceWorker } from "./pwa/registerSW.js";

import { initTheme, toggleTheme } from "./services/themeService.js";
import { registrarVisita } from "./services/visitasService.js";
import {
  sessionStorageSafe,
  localStorageSafe,
  deleteCookie,
} from "./services/storageService.js";
import { VISITAS_KEY, ULTIMA_VISITA_KEY } from "./services/visitasService.js";

const routes = [
  { path: "/", view: HomeView },
  { path: "/acerca", view: AboutView },
  { path: "/destino/:id", view: DestinoDetailView },
  { path: "/diagnostico", view: DiagnosticoView },
  { path: "/mi-lista", view: MiListaView },
  { path: "/service-worker", view: ServiceWorkerView },
];


const app = document.getElementById("app");
const router = new Router(routes, app);


initTheme();

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

document.addEventListener("input", (event) => {
  if (event.target.id !== "destino-filtro") return;

  const termino = event.target.value;
  sessionStorageSafe.set(FILTRO_KEY, termino);

  const grid = document.getElementById("destinos-grid");
  if (!grid) return;

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

function actualizarDiagnostico() {
  const themeValue = document.getElementById("diag-theme-value");
  if (!themeValue) return; // no estamos en la vista de diagnóstico

  const estado = leerEstadoStorage();
  themeValue.textContent = estado.tema;
  document.getElementById("diag-filtro-value").textContent = estado.filtro ?? "(vacío)";
  document.getElementById("diag-visitas-value").textContent = estado.visitas ?? "(vacío)";
  document.getElementById("diag-ultima-visita-value").textContent = estado.ultimaVisita ?? "(vacío)";
  
}
