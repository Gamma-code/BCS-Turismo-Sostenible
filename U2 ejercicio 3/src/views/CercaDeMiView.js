import { DESTINOS } from "../services/destinosData.js";
import { distanciaKm } from "../utils/distancia.js";
import {
  obtenerUbicacion,
  mensajeDeError,
  estadoDelPermiso,
  haySoporteDeUbicacion,
} from "../services/ubicacionService.js";

// Para cuando el usuario no quiere o no puede dar su ubicación
const LOCALIDADES = [
  { nombre: "La Paz", lat: 24.1426, lon: -110.3128 },
  { nombre: "Cabo San Lucas", lat: 22.8905, lon: -109.9167 },
  { nombre: "San José del Cabo", lat: 23.0614, lon: -109.6977 },
  { nombre: "Todos Santos", lat: 23.4483, lon: -110.2242 },
  { nombre: "Loreto", lat: 26.0115, lon: -111.3486 },
  { nombre: "Ciudad Constitución", lat: 25.0306, lon: -111.6661 },
  { nombre: "Santa Rosalía", lat: 27.3386, lon: -112.2661 },
  { nombre: "Guerrero Negro", lat: 27.9769, lon: -114.0611 },
];

const esc = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function avisar(mensaje, esError = false) {
  const salida = document.getElementById("cerca-aviso");
  if (!salida) return;
  salida.innerHTML = esError ? `<span class="sw-no">${mensaje}</span>` : mensaje;
}

function ordenarPorCercania(lat, lon) {
  return DESTINOS.map((destino) => ({
    ...destino,
    km: distanciaKm(lat, lon, destino.lat, destino.lon),
  })).sort((a, b) => a.km - b.km);
}

function pintarResultados(lista, desde) {
  const caja = document.getElementById("cerca-resultados");
  if (!caja) return;

  const filas = lista
    .map(
      (d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><a href="/BCS-Turismo-Sostenible/U2 ejercicio 3/destino/${d.id}" data-link>${esc(d.title)}</a></td>
        <td>${esc(d.meta)}</td>
        <td>${d.km.toFixed(1)} km</td>
      </tr>
    `
    )
    .join("");

  caja.innerHTML = `
    <p class="storage-meta">Distancia en línea recta desde ${esc(desde)}.</p>
    <table class="storage-table">
      <thead><tr><th>#</th><th>Destino</th><th>Categoría</th><th>Distancia</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// El estado del permiso se vuelve a leer cada vez, porque el usuario
// lo puede cambiar desde el candado de la barra de direcciones
async function pintarPermiso() {
  const caja = document.getElementById("cerca-permiso");
  if (!caja) return;

  const estado = await estadoDelPermiso();
  const textos = {
    granted: `<span class="sw-ok">Permiso concedido.</span> El navegador ya tiene autorización para darnos tu ubicación.`,
    denied: `<span class="sw-no">Permiso denegado.</span> Para volver a habilitarlo: clic en el candado de la barra de direcciones → Permisos → Ubicación → Permitir, y recarga la página.`,
    prompt: `Permiso sin decidir. El navegador te va a preguntar cuando le des al botón.`,
    desconocido: `Este navegador no permite consultar el estado del permiso (no tiene Permissions API). Se sabrá al intentar leer la ubicación.`,
  };

  caja.innerHTML = `<strong>Estado del permiso:</strong> ${textos[estado] ?? textos.desconocido}`;
}

document.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-cerca-accion]");
  if (!boton) return;

  const accion = boton.dataset.cercaAccion;

  if (accion === "ubicar") {
    avisar("Leyendo tu ubicación...");

    try {
      const { lat, lon, precision } = await obtenerUbicacion();
      pintarResultados(ordenarPorCercania(lat, lon), `tu ubicación (precisión ${Math.round(precision)} m)`);
      avisar("Listo, estos son los destinos ordenados del más cercano al más lejano.");
    } catch (error) {
      console.warn("[PWA] No se pudo leer la ubicación:", error);
      avisar(mensajeDeError(error), true);
      document.getElementById("cerca-manual")?.removeAttribute("hidden");
    }

    pintarPermiso();
  }

  if (accion === "manual") {
    const select = document.getElementById("cerca-localidad");
    const localidad = LOCALIDADES.find((l) => l.nombre === select.value);
    if (!localidad) return;

    pintarResultados(ordenarPorCercania(localidad.lat, localidad.lon), localidad.nombre);
    avisar(`Calculado desde ${localidad.nombre}, sin usar tu ubicación.`);
  }
});

export default async function CercaDeMiView() {
  const opciones = LOCALIDADES.map(
    (l) => `<option value="${esc(l.nombre)}">${esc(l.nombre)}</option>`
  ).join("");

  const sinSoporte = !haySoporteDeUbicacion();

  // El permiso se pinta después, cuando la vista ya está en el DOM
  setTimeout(pintarPermiso, 0);

  return `
    <div class="card">
      <h2>Destinos cerca de mí</h2>
      <p>
        Para ordenar los destinos del más cercano al más lejano necesitamos leer
        la ubicación de tu dispositivo <strong>una sola vez</strong>. No la guardamos
        ni la mandamos a ningún servidor: se usa aquí mismo para calcular las
        distancias y se olvida al salir de esta pantalla.
      </p>
      <p id="cerca-permiso"></p>
      <div class="storage-actions">
        <button type="button" data-cerca-accion="ubicar" ${sinSoporte ? "disabled" : ""}>
          Usar mi ubicación
        </button>
      </div>
      <p id="cerca-aviso" class="sw-result">${
        sinSoporte ? '<span class="sw-no">Este navegador no tiene API de ubicación. Usa la opción de abajo.</span>' : ""
      }</p>
    </div>

    <div class="card" id="cerca-manual" ${sinSoporte ? "" : "hidden"}>
      <h3>Elegir mi ciudad a mano</h3>
      <p>
        Si prefieres no compartir tu ubicación, o si la bloqueaste, elige desde
        dónde quieres medir y la app funciona igual.
      </p>
      <div class="guardado-form">
        <label for="cerca-localidad">Estoy en</label>
        <select id="cerca-localidad">${opciones}</select>
        <div class="storage-actions">
          <button type="button" data-cerca-accion="manual" class="btn-secundario">Calcular desde aquí</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Resultados</h3>
      <div id="cerca-resultados">
        <p class="lista-vacia">Todavía no se calcula nada. Usa tu ubicación o elige una ciudad.</p>
      </div>
    </div>
  `;
}