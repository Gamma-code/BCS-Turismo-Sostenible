// Compartir con la Web Share API y, si no hay menú nativo, al portapapeles

export function haySoporteDeCompartir() {
  return typeof navigator.share === "function";
}

export async function compartir(datos) {
  if (haySoporteDeCompartir()) {
    // canShare confirma que el navegador acepta justo estos campos
    if (!navigator.canShare || navigator.canShare(datos)) {
      try {
        await navigator.share(datos);
        return "nativo";
      } catch (error) {
        // Si el usuario cerró el menú no es un fallo, solo canceló
        if (error.name === "AbortError") return "cancelado";
        console.warn("[PWA] Falló el menú nativo, uso el portapapeles:", error);
      }
    }
  }

  return copiarAlPortapapeles(`${datos.title}\n${datos.text}\n${datos.url}`);
}

async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return "portapapeles";
  } catch (error) {
    console.warn("[PWA] Tampoco se pudo copiar al portapapeles:", error);
    return "manual";
  }
}