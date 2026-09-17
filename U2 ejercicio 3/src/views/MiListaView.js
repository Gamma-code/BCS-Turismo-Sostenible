import { DESTINOS } from "../services/destinosData.js";
import { showToast } from "../services/storageService.js";
import {
  agregarGuardado,
  getGuardados,
  getGuardadosPorEstado,
  eliminarGuardado,
} from "../services/dbService.js";

const ESTADOS = ["pendiente", "planeado", "visitado"];

function escaparHTML(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderGuardados(guardados) {
  if (guardados.length === 0) {
    return `<p class="lista-vacia">Todavía no has guardado ningún destino.</p>`;
  }

  const ordenados = [...guardados].sort((a, b) =>
    a.creadoEn < b.creadoEn ? 1 : -1
  );

  return ordenados
    .map(
      (item) => `
    <div class="guardado-card">
      <span class="guardado-estado">${item.estado}</span>
      <h4>${escaparHTML(item.destino)}</h4>
      ${item.nota ? `<p>${escaparHTML(item.nota)}</p>` : ""}
      <p class="guardado-fecha">
        Guardado el ${new Date(item.creadoEn).toLocaleDateString("es-MX")}
      </p>
      <button
        type="button"
        class="btn-secundario"
        data-action="eliminar-guardado"
        data-id="${item.id}"
      >Eliminar</button>
    </div>
  `
    )
    .join("");
}

// Vuelve a pintar solo el listado
async function actualizarLista(filtroEstado) {
  const contenedor = document.getElementById("guardados-lista");
  if (!contenedor) return; 

  const guardados = filtroEstado
    ? await getGuardadosPorEstado(filtroEstado)
    : await getGuardados();

  contenedor.innerHTML = renderGuardados(guardados);
}

function getFiltroActual() {
  const select = document.getElementById("estado-filtro");
  return select && select.value ? select.value : null;
}

// Agregar un destino a la lista
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("#guardado-form");
  if (!form) return;

  event.preventDefault();

  const destinoSelect = document.getElementById("destino-select");
  const estadoSelect = document.getElementById("estado-select");
  const notaInput = document.getElementById("nota-input");

  try {
    await agregarGuardado({
      destino: destinoSelect.value,
      estado: estadoSelect.value,
      nota: notaInput.value.trim(),
      creadoEn: new Date().toISOString(),
    });
  } catch (error) {
    console.error("No se pudo guardar el destino:", error);
    showToast("No se pudo guardar el destino en la base de datos local.");
    return;
  }

  notaInput.value = "";
  await actualizarLista(getFiltroActual());
});

// Eliminar un destino de la lista
document.addEventListener("click", async (event) => {
  const boton = event.target.closest('[data-action="eliminar-guardado"]');
  if (!boton) return;

  const id = Number(boton.dataset.id);

  try {
    await eliminarGuardado(id);
    await actualizarLista(getFiltroActual());
  } catch (error) {
    console.error("No se pudo eliminar el destino:", error);
    showToast("No se pudo eliminar el destino guardado.");
  }
});

// Filtro por estado 
document.addEventListener("change", async (event) => {
  const select = event.target.closest("#estado-filtro");
  if (!select) return;

  await actualizarLista(getFiltroActual());
});

export default async function MiListaView() {
  const guardados = await getGuardados();

  const opcionesDestino = DESTINOS.map(
    (destino) => `<option value="${destino.title}">${destino.title}</option>`
  ).join("");

  const opcionesEstado = ESTADOS.map(
    (estado) => `<option value="${estado}">${estado}</option>`
  ).join("");

  return `
    <div class="card">
      <h2>Mi lista de viaje</h2>
      <p>
        Guarda los destinos que quieres visitar. Se almacenan con IndexedDB en
        un <strong>object store</strong> llamado "guardados", con un
        <strong>índice</strong> sobre el campo "estado". A diferencia del filtro
        de búsqueda (sessionStorage), esta lista sigue aquí aunque recargues
        con F5 o cierres la pestaña.
      </p>
    </div>

    <div class="card">
      <h3>Agregar destino a la lista</h3>
      <form id="guardado-form" class="guardado-form">
        <label for="destino-select">Destino</label>
        <select id="destino-select">
          ${opcionesDestino}
        </select>

        <label for="estado-select">Estado</label>
        <select id="estado-select">
          ${opcionesEstado}
        </select>

        <label for="nota-input">Nota (opcional)</label>
        <input
          type="text"
          id="nota-input"
          placeholder="Ej. ir en temporada de ballenas"
        />

        <div class="storage-actions">
          <button type="submit">Guardar en mi lista</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Destinos guardados</h3>

      <label for="estado-filtro">Filtrar por estado (usa el índice):</label>
      <select id="estado-filtro">
        <option value="">Todos</option>
        ${opcionesEstado}
      </select>

      <div id="guardados-lista" class="guardados-grid">
        ${renderGuardados(guardados)}
      </div>
    </div>
  `;
}