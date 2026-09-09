
import { getTheme, THEMES } from "../services/themeService.js";
import { getVisitas, getUltimaVisita } from "../services/visitasService.js";
import { sessionStorageSafe } from "../services/storageService.js";

const FILTRO_KEY = "bcs_filtro_destinos";

export function leerEstadoStorage() {
  const ultimaVisita = getUltimaVisita();

  return {
    tema: getTheme() === THEMES.DARK ? "oscuro" : "claro",
    filtro: sessionStorageSafe.get(FILTRO_KEY),
    visitas: getVisitas(),
    ultimaVisita: ultimaVisita ? new Date(ultimaVisita).toLocaleString("es-MX") : null,
  };
}

export default async function DiagnosticoView() {
  const estado = leerEstadoStorage();

  return `
    <div class="card">
      <h2>Diagnóstico de almacenamiento</h2>
      <p>
        Esta sección muestra, en tiempo real, qué está guardando la app en
        cada mecanismo de persistencia del navegador. Abre esta misma URL
        en una pestaña nueva para ver qué sobrevive y qué no.
      </p>
    </div>

    <div class="storage-grid">

      <div class="card storage-card">
        <h3>localStorage — Tema</h3>
        <p class="storage-meta">No expira · se comparte entre todas las pestañas del origen</p>
        <p>Valor actual: <strong id="diag-theme-value">${estado.tema}</strong></p>
        <div class="storage-actions">
          <button data-diag-clear="theme" class="btn-secundario">Limpiar (volver a claro)</button>
        </div>
      </div>

      <div class="card storage-card">
        <h3>sessionStorage — Filtro de búsqueda</h3>
        <p class="storage-meta">Se borra al cerrar la pestaña · alcance: solo esta pestaña</p>
        <p>Valor actual: <strong id="diag-filtro-value">${estado.filtro ?? "(vacío)"}</strong></p>
        <div class="storage-actions">
          <button data-diag-clear="filtro" class="btn-secundario">Limpiar filtro</button>
        </div>
      </div>

      <div class="card storage-card">
        <h3>Cookie — Registro de visitas</h3>
        <p class="storage-meta">Expira en 30 días · viajaría al servidor en cada request</p>
        <p>Visitas registradas: <strong id="diag-visitas-value">${estado.visitas ?? "(vacío)"}</strong></p>
        <p>Última visita: <strong id="diag-ultima-visita-value">${estado.ultimaVisita ?? "(vacío)"}</strong></p>
        <div class="storage-actions">
          <button data-diag-clear="visitas" class="btn-secundario">Limpiar cookie</button>
        </div>
      </div>

    </div>

    <div class="card">
      <h3>Comparación rápida</h3>
      <table class="storage-table">
        <thead>
          <tr>
            <th>Criterio</th>
            <th>Cookie (visitas)</th>
            <th>sessionStorage (filtro)</th>
            <th>localStorage (tema)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Persistencia</td>
            <td>30 días</td>
            <td>Hasta cerrar la pestaña</td>
            <td>Indefinida</td>
          </tr>
          <tr>
            <td>Alcance</td>
            <td>Dominio + path</td>
            <td>Solo esta pestaña</td>
            <td>Todas las pestañas del origen</td>
          </tr>
          <tr>
            <td>¿Viaja al servidor?</td>
            <td>Sí (si hubiera backend)</td>
            <td>No</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
