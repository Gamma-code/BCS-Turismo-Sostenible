

const OPCIONES = {
  
  enableHighAccuracy: false,
  timeout: 10000,
  
  maximumAge: 300000,
};

export function haySoporteDeUbicacion() {
  return "geolocation" in navigator;
}

// Lectura puntual, en forma de Promise
export function obtenerUbicacion() {
  return new Promise((resolver, rechazar) => {
    if (!haySoporteDeUbicacion()) {
      rechazar(new Error("Este navegador no tiene API de ubicación."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolver({
          lat: posicion.coords.latitude,
          lon: posicion.coords.longitude,
          precision: posicion.coords.accuracy,
          momento: posicion.timestamp,
        }),
      (error) => rechazar(error),
      OPCIONES
    );
  });
}

// Un mensaje distinto para cada código de error de la API
export function mensajeDeError(error) {
  switch (error?.code) {
    case 1: // PERMISSION_DENIED
      return "Bloqueaste el acceso a tu ubicación. Puedes seguir usando la app eligiendo tu ciudad a mano.";
    case 2: // POSITION_UNAVAILABLE
      return "No se pudo determinar tu ubicación. Puede que el GPS esté apagado o que no haya señal.";
    case 3: // TIMEOUT
      return "La ubicación tardó demasiado en responder. Inténtalo otra vez o elige tu ciudad a mano.";
    default:
      return error?.message ?? "No se pudo leer la ubicación.";
  }
}

// Estado del permiso con la Permissions API. No todos los navegadores la
// traen, por eso devolvemos "desconocido" cuando no se puede consultar.
export async function estadoDelPermiso() {
  if (!navigator.permissions?.query) return "desconocido";

  try {
    const permiso = await navigator.permissions.query({ name: "geolocation" });
    return permiso.state; // granted | denied | prompt
  } catch (error) {
    return "desconocido";
  }
}