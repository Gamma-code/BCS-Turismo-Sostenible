import { API_URL } from "../config.js";
import { getUsuarioId } from "../services/usuarioService.js";

export function haySoporteDePush() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

// La llave pública viaja en base64url pero subscribe() la pide como bytes
function base64ABytes(base64) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(normal);

  return Uint8Array.from(crudo, (letra) => letra.charCodeAt(0));
}

async function pedirClavePublica() {
  const respuesta = await fetch(`${API_URL}/push/clave-publica`);

  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

  const { clave } = await respuesta.json();
  return clave;
}

export async function getSuscripcion() {
  if (!haySoporteDePush()) return null;

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function mandarAlBackend(suscripcion) {
  const respuesta = await fetch(`${API_URL}/push/suscripcion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      suscripcion: suscripcion.toJSON(),
      usuarioId: getUsuarioId(),
    }),
  });

  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
}

export async function suscribir() {
  if (!haySoporteDePush()) {
    throw new Error("Este navegador no soporta Push");
  }

  const permiso = await Notification.requestPermission();

  if (permiso !== "granted") {
    throw new Error("No diste permiso para las notificaciones");
  }

  const registration = await navigator.serviceWorker.ready;
  let suscripcion = await registration.pushManager.getSubscription();

  if (!suscripcion) {
    const clave = await pedirClavePublica();

    suscripcion = await registration.pushManager.subscribe({
      // Obligatorio en Chrome: cada push tiene que mostrarle algo al usuario
      userVisibleOnly: true,
      applicationServerKey: base64ABytes(clave),
    });
  }

  await mandarAlBackend(suscripcion);
  return suscripcion;
}

export async function darDeBaja() {
  const suscripcion = await getSuscripcion();
  if (!suscripcion) return false;

  // Primero se avisa al backend y luego se cancela en el navegador, para no
  // dejar un registro huérfano en la base
  try {
    await fetch(`${API_URL}/push/suscripcion`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: suscripcion.endpoint }),
    });
  } catch (error) {
    console.warn("[PUSH] No se pudo avisar la baja al backend:", error);
  }

  await suscripcion.unsubscribe();
  return true;
}

// Al abrir la app se reenvía la suscripción, por si el navegador la renovó
// por su cuenta o el backend la perdió
export async function initPush() {
  if (!haySoporteDePush()) return;

  try {
    const suscripcion = await getSuscripcion();
    if (!suscripcion) return;

    await mandarAlBackend(suscripcion);
    console.log("[PUSH] Suscripción reenviada al backend");
  } catch (error) {
    console.warn("[PUSH] No se pudo reenviar la suscripción:", error);
  }
}
