import {
  sePuedeInstalar,
  pedirInstalacion,
  estaInstalada,
  esIOS,
  mensajeDeAyuda,
  alCambiarModo,
} from "./instalacionApp.js";

const boton = () => document.getElementById("boton-instalar");
const aviso = () => document.getElementById("aviso-instalar");

// beforeinstallprompt llega un ratito después de cargar, así que
// no damos por perdido el evento hasta que pase ese margen
let yaEsperamos = false;

function pintar() {
  const btn = boton();
  const hayBoton = sePuedeInstalar() && !estaInstalada();
  if (btn) btn.hidden = !hayBoton;

  const texto = aviso();
  if (!texto) return;

  // El aviso es el plan B, solo sale si no hay botón que ofrecer
  const mostrar = !hayBoton && !estaInstalada() && (esIOS() || yaEsperamos);
  texto.textContent = mostrar ? mensajeDeAyuda() : "";
  texto.hidden = !mostrar;
}

export function initBotonInstalar() {
  pintar();
  window.addEventListener("cambio-instalacion", pintar);
  window.addEventListener("cambio-instalacion", pintar);
  alCambiarModo(pintar);

  boton()?.addEventListener("click", async () => {
    await pedirInstalacion();
    pintar();
  });

  setTimeout(() => {
    yaEsperamos = true;
    pintar();
  }, 3000);
}