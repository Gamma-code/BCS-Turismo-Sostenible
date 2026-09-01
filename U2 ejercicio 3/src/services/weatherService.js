// Servicio que encapsula la llamada a la api pública de Open-Meteo
// Documentación de la api por si la ocupa profe: https://open-meteo.com/

export const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export default class WeatherService {
  async getCurrentWeather(lat, lon) {
    const response = await fetch(
      `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    if (!response.ok) throw new Error("No se pudo obtener el clima");

    const data = await response.json();
    return data.current_weather;
  }
}
