import { agregarPendiente, getPendientes, eliminarPendiente } from "../services/dbService.js";

export const SYNC_TAG = "bcs-reportes-pendientes";
const ENDPOINT = "https://jsonplaceholder.typicode.com/posts";


const FORZAR_PLAN_B = new URLSearchParams(window.location.search).has("sin-sync");

const enviados = [];
let reintentando = false;

function avisar() {
  window.dispatchEvent(new CustomEvent("reportes-cambiaron"));
}

function anotarEnviado(destino, via, idServidor) {
  enviados.unshift({
    hora: new Date().toLocaleTimeString("es-MX"),
    destino,
    via,
    idServidor,
  });
  enviados.splice(10);
  avisar();
}

export function haySoporteDeSync() {
  return !FORZAR_PLAN_B && "serviceWorker" in navigator && "SyncManager" in window;
}

export function getEnviados() {
  return enviados;
}

// El reporte SIEMPRE se guarda en la cola antes de intentar mandarlo
export async function encolarReporte(reporte) {
  await agregarPendiente({ reporte, creadoEn: new Date().toISOString() });
  avisar();
  return pedirSync();
}

async function pedirSync() {
  if (haySoporteDeSync()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(SYNC_TAG);
      return "background-sync";
    } catch (error) {
      console.warn("[PWA] No se pudo registrar el sync, uso el plan B:", error);
    }
  }

  await reintentarAhora();
  return "plan-b";
}

export async function reintentarAhora() {
  if (reintentando) return { cuantos: 0, pendientes: (await getPendientes()).length };
  reintentando = true;

  let cuantos = 0;
  try {
    for (const item of await getPendientes()) {
      const respuesta = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.reporte),
      });

      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      // Solo se borra de la cola cuando el servidor ya confirmó
      const datos = await respuesta.json();
      await eliminarPendiente(item.id);
      anotarEnviado(item.reporte.destino, "Reintento desde la página", datos.id);
      cuantos++;
    }
  } catch (error) {
    console.warn("[PWA] Reintento fallido, la cola se conserva:", error);
  } finally {
    reintentando = false;
  }

  return { cuantos, pendientes: (await getPendientes()).length };
}

export function initSincronizacion() {
  navigator.serviceWorker?.addEventListener("message", (event) => {
    const { type, destino, idServidor } = event.data ?? {};
    if (type === "REPORTE_ENVIADO") {
      anotarEnviado(destino, "Background Sync (Service Worker)", idServidor);
    }
  });

  
  if (!haySoporteDeSync()) {
    window.addEventListener("online", reintentarAhora);
    reintentarAhora();
  }
}