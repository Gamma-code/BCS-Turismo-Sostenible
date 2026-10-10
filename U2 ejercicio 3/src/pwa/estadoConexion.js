// Aviso visible de conexión en el header del App Shell.
// El aviso vive en index.html y 404.html, no lo pinta el router.

const aviso = () => document.getElementById("estado-conexion");

function pintar() {
  const el = aviso();
  if (!el) return;

  const enLinea = navigator.onLine;
  el.textContent = enLinea ? "En línea" : "Sin conexión";
  el.classList.toggle("estado-conexion--sin-red", !enLinea);
  el.title = enLinea
    ? "Hay conexión a internet"
    : "Sin conexión: se está usando la copia guardada en caché";
}

export function initEstadoConexion() {
  pintar();
  window.addEventListener("online", pintar);
  window.addEventListener("offline", pintar);
}