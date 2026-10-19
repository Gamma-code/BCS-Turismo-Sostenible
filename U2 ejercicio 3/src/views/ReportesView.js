import { DESTINOS } from "../services/destinosData.js";
import { getPendientes } from "../services/dbService.js";
import {
  encolarReporte,
  reintentarAhora,
  haySoporteDeSync,
  getEnviados,
} from "../pwa/sincronizacion.js";

const TIPOS = [
  "Basura acumulada",
  "Acceso cerrado o dañado",
  "Fauna en riesgo",
  "Construcción irregular",
  "Exceso de visitantes",
];

const esc = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function avisoEstado(mensaje) {
  const salida = document.getElementById("reporte-estado");
  if (salida) salida.textContent = mensaje;
}

function pintarPendientes(items) {
  if (items.length === 0) {
    return `<p class="lista-vacia">La cola está vacía, no hay reportes esperando.</p>`;
  }

  return `<div class="guardados-grid">${items
    .map(
      (item) => `
      <div class="guardado-card">
        <span class="guardado-estado">pendiente</span>
        <h4>${esc(item.reporte.destino)}</h4>
        <p><strong>${esc(item.reporte.tipo)}</strong></p>
        <p>${esc(item.reporte.descripcion)}</p>
        <p class="guardado-fecha">${new Date(item.creadoEn).toLocaleString("es-MX")}</p>
      </div>
    `
    )
    .join("")}</div>`;
}

function pintarModo() {
  return haySoporteDeSync()
    ? `<span class="sw-ok">✔ Background Sync disponible.</span> El Service Worker manda la cola en cuanto vuelva la conexión, aunque cierres la pestaña.`
    : `<span class="sw-no">✘ Background Sync no está disponible aquí</span> (Safari, iOS, Firefox o el modo <code>?sin-sync</code>). Plan B: la página reintenta al volver la conexión, al abrirla y con el botón.`;
}

function pintarEnviados() {
  const lista = getEnviados();
  if (lista.length === 0) {
    return `<p class="lista-vacia">Todavía no se confirma ningún envío.</p>`;
  }

  const filas = lista
    .map(
      ({ hora, destino, via, idServidor }) =>
        `<tr><td>${hora}</td><td>${esc(destino)}</td><td><small>${via}</small></td><td>${idServidor}</td></tr>`
    )
    .join("");

  return `
    <table class="storage-table">
      <thead><tr><th>Hora</th><th>Destino</th><th>Enviado por</th><th>Id</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

async function actualizarPaneles() {
  const cajaCola = document.getElementById("reporte-cola");
  const cajaEnviados = document.getElementById("reporte-enviados");
  if (!cajaCola || !cajaEnviados) return; // el usuario ya se fue a otra vista

  cajaCola.innerHTML = pintarPendientes(await getPendientes());
  cajaEnviados.innerHTML = pintarEnviados();
}

window.addEventListener("reportes-cambiaron", actualizarPaneles);

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("#reporte-form");
  if (!form) return;

  event.preventDefault();

  const destino = document.getElementById("reporte-destino").value;
  const tipo = document.getElementById("reporte-tipo").value;
  const descripcion = document.getElementById("reporte-descripcion").value.trim();

  if (!descripcion) {
    avisoEstado("Escribe una descripción antes de enviar.");
    return;
  }

  avisoEstado("Guardando...");

  try {
    const modo = await encolarReporte({ destino, tipo, descripcion });
    form.reset();
    avisoEstado(
      modo === "background-sync"
        ? "Guardado en la cola. El navegador lo manda en cuanto haya conexión."
        : "Guardado en la cola. Plan B activo: se reintenta ahora, al volver la conexión o con el botón."
    );
  } catch (error) {
    console.error("No se pudo guardar el reporte en la cola:", error);
    avisoEstado("No se pudo guardar el reporte en la cola.");
  }
});

document.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-reporte-accion]");
  if (!boton) return;

  if (boton.dataset.reporteAccion === "reintentar") {
    avisoEstado("Reintentando el envío...");
    const { cuantos, pendientes } = await reintentarAhora();
    avisoEstado(`Reintento terminado: ${cuantos} enviado(s), ${pendientes} pendiente(s).`);
  }
});

export default async function ReportesView() {
  const pendientes = await getPendientes();

  const opcionesDestino = DESTINOS.map(
    (d) => `<option value="${esc(d.title)}">${esc(d.title)}</option>`
  ).join("");

  const opcionesTipo = TIPOS.map((t) => `<option value="${t}">${t}</option>`).join("");

  return `
    <div class="card">
      <h2>Reportar una incidencia</h2>
      <p>
        Si ves basura, un acceso dañado o fauna en riesgo en alguno de los destinos,
        repórtalo aquí. El reporte se guarda primero en tu dispositivo y se manda al
        servidor cuando haya conexión, así que puedes reportar aunque estés en la playa
        sin señal.
      </p>
      <p id="reporte-modo">${pintarModo()}</p>
    </div>

    <div class="card">
      <h3>Nuevo reporte</h3>
      <form id="reporte-form" class="guardado-form">
        <label for="reporte-destino">Destino</label>
        <select id="reporte-destino">${opcionesDestino}</select>

        <label for="reporte-tipo">Tipo de incidencia</label>
        <select id="reporte-tipo">${opcionesTipo}</select>

        <label for="reporte-descripcion">Descripción</label>
        <textarea id="reporte-descripcion" rows="3" placeholder="Qué viste y dónde exactamente"></textarea>

        <div class="storage-actions">
          <button type="submit">Enviar reporte</button>
        </div>
      </form>
      <p id="reporte-estado" class="sw-result"></p>
    </div>

    <div class="card">
      <h3>Cola de reportes (IndexedDB)</h3>
      <div id="reporte-cola">${pintarPendientes(pendientes)}</div>
      <div class="storage-actions">
        <button type="button" data-reporte-accion="reintentar" class="btn-secundario">Reintentar ahora</button>
      </div>
    </div>

    <div class="card">
      <h3>Envíos confirmados</h3>
      <div id="reporte-enviados">${pintarEnviados()}</div>
    </div>
  `;
}