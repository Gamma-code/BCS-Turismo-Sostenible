import { API_URL } from "../config.js";
import { DESTINOS } from "./destinosData.js";

const TIMEOUT_MS = 8000;

// Pide datos al backend, si tarda demasiado aborta la petición
async function pedirAlBackend(ruta) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${ruta}`, {
      signal: controlador.signal,
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(temporizador);
  }
}

export default class DestinosService {
  // Los destinos ya vienen dentro de la app, así que se pueden pintar al
  // instante sin esperar al backend
  obtenerLocales() {
    return DESTINOS;
  }

  // Y por detrás se comprueba si el backend trae algo distinto.
  // Es el mismo Stale-While-Revalidate que el Service Worker usa para el aviso.
  async revalidar() {
    try {
      return await pedirAlBackend("/destinos");
    } catch (error) {
      console.warn("Backend no disponible, se quedan los datos locales:", error.message);
      return null;
    }
  }

  async getAll() {
    try {
      return await pedirAlBackend("/destinos");
    } catch (error) {
      // El plan gratuito del servidor se petatea, usamos los datos locales
      // para que la app siga funcionando en lugar de quedarse vacía
      console.warn("Backend no disponible, usando datos locales:", error.message);
      return DESTINOS;
    }
  }

  async getById(id) {
    try {
      return await pedirAlBackend(`/destinos/${id}`);
    } catch (error) {
      console.warn("Backend no disponible, usando datos locales:", error.message);
      return DESTINOS.find((destino) => destino.id === id) ?? null;
    }
  }
}