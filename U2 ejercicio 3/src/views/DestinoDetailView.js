// Muestra el detalle de un destino y, además su clima actual

export default async function DestinoDetailView(params) {
  const { default: DestinosService } = await import(
    "../services/destinosService.js"
  );
  const service = new DestinosService();
  const destino = await service.getById(params?.id);

  if (!destino) {
    return `
      <div class="card">
        <h2>Destino no encontrado</h2>
        <p>No existe información para el id "${params?.id ?? "sin definir"}".</p>
        <a href="/" data-link>← Volver al inicio</a>
      </div>
    `;
  }

  const { default: WeatherService } = await import(
    "../services/weatherService.js"
  );
  const weatherApi = new WeatherService();

  let climaHTML = "";
  try {
    const clima = await weatherApi.getCurrentWeather(destino.lat, destino.lon);
    climaHTML = `
      <div class="clima">
        <h3>Clima actual</h3>
        <p>${describirClima(clima.weathercode)} · ${clima.temperature}°C</p>
        <p><small>Viento: ${clima.windspeed} km/h</small></p>
      </div>
    `;
  } catch (e) {
    climaHTML = `<p class="clima-error">No se pudo cargar el clima: ${e.message}</p>`;
  }

  return `
    <article class="card">
      <h2>${destino.title}</h2>
      <p>${destino.description}</p>
      <p><strong>Categoría:</strong> ${destino.meta}</p>
      <p><strong>Ubicación:</strong> ${destino.ubicacion}</p>
      <p><strong>Horario recomendado:</strong> ${destino.horario}</p>
      <p><strong>Recomendación sostenible:</strong> ${destino.recomendacion}</p>
      ${climaHTML}
      <a href="/" data-link>← Volver al listado</a>
    </article>
  `;
}

// Traduce el código numérico de Open-Meteo a una descripción legible
function describirClima(code) {
  const condiciones = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos fuertes",
    95: "Tormenta eléctrica",
  };
  return condiciones[code] ?? "Condición no disponible";
}
