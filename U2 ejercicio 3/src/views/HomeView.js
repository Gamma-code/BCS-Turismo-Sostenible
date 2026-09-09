import { DESTINOS } from "../services/destinosData.js";
import DestinoCard from "../components/DestinoCard.js";
import { sessionStorageSafe } from "../services/storageService.js";

// Filtro de búsqueda: dato temporal de flujo de trabajo.

const FILTRO_KEY = "bcs_filtro_destinos";

export function filtrarDestinos(termino) {
  const texto = termino.trim().toLowerCase();
  if (!texto) return DESTINOS;

  return DESTINOS.filter((destino) =>
    `${destino.title} ${destino.meta} ${destino.ubicacion}`
      .toLowerCase()
      .includes(texto)
  );
}

export default async function HomeView() {
  const filtroGuardado = sessionStorageSafe.get(FILTRO_KEY) ?? "";
  const destinosFiltrados = filtrarDestinos(filtroGuardado);

  return `
    <h2>Destinos turísticos sostenibles de Baja California Sur</h2>
    <p class="subtitle">
      Información centralizada sobre los principales destinos naturales,
      históricos y recreativos del estado, pensada para promover un
      turismo responsable.
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
      <small>El filtro se recuerda si recargas (F5), pero se olvida si cierras la pestaña.</small>
    </div>

    <div class="grid" id="destinos-grid">
      ${destinosFiltrados.length
        ? destinosFiltrados.map((destino) => DestinoCard(destino)).join("")
        : `<p class="sin-resultados">No hay destinos que coincidan con "${filtroGuardado}".</p>`}
    </div>
  `;
}
