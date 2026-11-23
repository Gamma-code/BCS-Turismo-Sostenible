import DestinosService from "../services/destinosService.js";
import DestinoCard from "../components/DestinoCard.js";
import { sessionStorageSafe } from "../services/storageService.js";

// Filtro de búsqueda: dato temporal de flujo de trabajo.

const FILTRO_KEY = "bcs_filtro_destinos";
let destinosCargados = [];

export function filtrarDestinos(termino) {
  const texto = termino.trim().toLowerCase();
  if (!texto) return destinosCargados;

  return destinosCargados.filter((destino) =>
    `${destino.title} ${destino.meta} ${destino.ubicacion}`
      .toLowerCase()
      .includes(texto)
  );
}

// Vuelve a pintar solo las tarjetas, sin tocar el resto de la página
function repintarGrid(filtro) {
  const grid = document.getElementById("destinos-grid");
  if (!grid) return;

  const lista = filtrarDestinos(filtro);
  grid.innerHTML = lista.length
    ? lista.map((destino) => DestinoCard(destino)).join("")
    : `<p class="sin-resultados">No hay destinos que coincidan con "${filtro}".</p>`;
}

export default function HomeView() {
  const filtroGuardado = sessionStorageSafe.get(FILTRO_KEY) ?? "";

  const service = new DestinosService();

  // Se pinta de inmediato con los datos que ya trae la app, sin esperar al
  // backend. Antes esto aguardaba hasta 8 segundos a que Render despertara.
  destinosCargados = service.obtenerLocales();

  // El backend se consulta por detrás y solo se repinta si trae algo distinto
  service.revalidar().then((frescos) => {
    if (!frescos || frescos.length === 0) return;
    destinosCargados = frescos;
    repintarGrid(filtroGuardado);
  });

  const destinosFiltrados = filtrarDestinos(filtroGuardado);

  return `
      <section class="hero">
      <h2>Destinos sostenibles de Baja California Sur</h2>
      <p class="subtitle">
        Ubicación, horarios y recomendaciones de visita para los principales
        destinos naturales, históricos y recreativos del estado.
      </p>

      <div class="filtro-bar">
        <label for="destino-filtro">Buscar destino</label>
        <input
          type="text"
          id="destino-filtro"
          placeholder="Ej. playa, arrecife, pueblo..."
          value="${filtroGuardado.replace(/"/g, "&quot;")}"
          autocomplete="off"
        />
        <small>El filtro se recuerda si recargas, pero se olvida al cerrar la pestaña.</small>
      </div>

      <svg class="hero-ola" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,40 L0,20 C150,4 300,4 450,14 C600,24 750,34 900,28 C1020,23 1110,12 1200,4 L1200,40 Z" />
      </svg>
    </section>

    <div class="grid" id="destinos-grid">
      ${destinosFiltrados.length
        ? destinosFiltrados.map((destino) => DestinoCard(destino)).join("")
        : `<p class="sin-resultados">No hay destinos que coincidan con "${filtroGuardado}".</p>`}
    </div>
  `;
}
