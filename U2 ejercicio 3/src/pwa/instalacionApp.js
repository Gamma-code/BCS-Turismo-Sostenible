let eventoInstalacion = null;

function avisar(tipo, detalle) {
  console.log(`[PWA] ${tipo} => ${detalle}`);
  window.dispatchEvent(new CustomEvent("cambio-instalacion"));
}

export function initInstalacion() {
  window.addEventListener("beforeinstallprompt", (evento) => {
    // Cancelamos la barrita que Android muestra por su cuenta
    evento.preventDefault();
    eventoInstalacion = evento;
    avisar("beforeinstallprompt", "La app cumple los criterios y se puede instalar");
  });

  window.addEventListener("appinstalled", () => {
    eventoInstalacion = null;
    avisar("appinstalled", "El usuario terminó de instalar la app");
  });
}

export function sePuedeInstalar() {
  return eventoInstalacion !== null;
}

export async function pedirInstalacion() {
  if (!eventoInstalacion) return null;

  // El evento solo sirve una vez, por eso lo soltamos antes de usarlo
  const evento = eventoInstalacion;
  eventoInstalacion = null;

  evento.prompt();
  const { outcome } = await evento.userChoice;

  avisar("userChoice", outcome === "accepted" ? "Aceptó instalar" : "Descartó el diálogo");
  return outcome;
}

const MODOS_INSTALADA = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];

export function estaInstalada() {
  if (window.navigator.standalone === true) return true;
  return MODOS_INSTALADA.some((modo) => window.matchMedia(`(display-mode: ${modo})`).matches);
}

export function alCambiarModo(callback) {
  MODOS_INSTALADA.forEach((modo) =>
    window.matchMedia(`(display-mode: ${modo})`).addEventListener("change", callback)
  );
}

export function esIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

export function mensajeDeAyuda() {
  if (estaInstalada()) return "Ya estás usando la app instalada.";
  if (sePuedeInstalar()) return "Tu navegador puede instalarla: usa el botón «Instalar app».";
  if (esIOS()) return "En iPhone o iPad: botón Compartir → «Agregar a pantalla de inicio».";
  return "Este navegador no ofrece instalar la app, pero puedes seguir usándola normal desde aquí.";
}