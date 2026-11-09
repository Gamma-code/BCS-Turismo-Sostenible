const boton = () => document.getElementById("boton-avisos");
const aviso = () => document.getElementById("aviso-avisos");

export function haySoporteDeAvisos() {
  return "Notification" in window && "serviceWorker" in navigator;
}

export function estadoPermiso() {
  if (!haySoporteDeAvisos()) return "sin-soporte";
  return Notification.permission; 
}

function pintar() {
  const estado = estadoPermiso();
  const btn = boton();

  if (btn) {
    const etiquetas = {
      "sin-soporte": "Avisos no disponibles",
      default: "Activar avisos",
      granted: "Avisos activados",
      denied: "Avisos bloqueados",
    };
    btn.textContent = etiquetas[estado];
    
    btn.disabled = estado !== "default";
  }

  const texto = aviso();
  if (!texto) return;

  const mensajes = {
    "sin-soporte": "Este navegador no soporta notificaciones.",
    default: "",
    granted: "Te avisamos cuando tus reportes pendientes se terminen de enviar.",
    denied:
      "Bloqueaste los avisos. Para reactivarlos: candado de la barra de direcciones → Permisos → Notificaciones → Permitir, y recarga la página.",
  };

  texto.textContent = mensajes[estado];
  texto.hidden = mensajes[estado] === "";
}

export function initNotificaciones() {
  pintar();

  boton()?.addEventListener("click", async () => {
    if (estadoPermiso() !== "default") return;

    const resultado = await Notification.requestPermission();
    console.log("[PWA] Permiso de notificaciones =>", resultado);
    pintar();
  });
}