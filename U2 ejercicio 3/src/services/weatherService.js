// Servicio que encapsula la llamada a la api pública de Open-Meteo
// Documentación de la api por si la ocupa profe: https://open-meteo.com/

export const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const TIMEOUT_MS = 5000; // tiempo máximo de espera 
const MAX_RETRIES = 1; 
const RETRY_DELAY_MS = 600;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default class WeatherService {
  async getCurrentWeather(lat, lon, retries = MAX_RETRIES) {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
      const response = await fetchWithTimeout(url);

      // Error de servidor: la petición SÍ llegó y regresó, pero con un
      // status distinto de 2xx (ej. 404, 500). Esto NO se reintenta.
      if (!response.ok) {
        throw new Error(
          `El servidor respondió con error (status ${response.status})`
        );
      }

      const data = await response.json();
      return data.current_weather;
    } catch (error) {
      // Error de red / CORS
      
      
      const esErrorDeRed = error instanceof TypeError;

      if (esErrorDeRed && retries > 0) {
        console.log(
          `[WeatherService] Error de red detectado. Reintentando... (quedan ${retries} intento(s))`
        );
        await delay(RETRY_DELAY_MS);
        return this.getCurrentWeather(lat, lon, retries - 1);
      }

      // Se agotaron los reintentos o el error no es de red. Resamos para saber cual fue el problema
      throw error;
    }
  }
}