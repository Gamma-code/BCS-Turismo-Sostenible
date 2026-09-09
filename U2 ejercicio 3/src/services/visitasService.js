
// Registro de visitas con cookie
import { setCookie, getCookie } from "./storageService.js";

const VISITAS_KEY = "bcs_visitas";
const ULTIMA_VISITA_KEY = "bcs_ultima_visita";
const DIAS_EXPIRACION = 30;

// Debe llamarse una sola vez por carga de la SPA (en main.js).
export function registrarVisita() {
  const visitasPrevias = parseInt(getCookie(VISITAS_KEY) ?? "0", 10) || 0;
  const nuevasVisitas = visitasPrevias + 1;

  setCookie(VISITAS_KEY, String(nuevasVisitas), DIAS_EXPIRACION);
  setCookie(ULTIMA_VISITA_KEY, new Date().toISOString(), DIAS_EXPIRACION);

  return { visitas: nuevasVisitas, ultimaVisita: new Date().toISOString() };
}

export function getVisitas() {
  return getCookie(VISITAS_KEY);
}

export function getUltimaVisita() {
  return getCookie(ULTIMA_VISITA_KEY);
}

export { VISITAS_KEY, ULTIMA_VISITA_KEY };
