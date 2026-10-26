// Distancia en línea recta entre dos coordenadas
const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados) => (grados * Math.PI) / 180;

export function distanciaKm(lat1, lon1, lat2, lon2) {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;

  return RADIO_TIERRA_KM * 2 * Math.asin(Math.sqrt(a));
}