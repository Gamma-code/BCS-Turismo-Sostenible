import { setVapidDetails, sendNotification } from "web-push";
import { getDB } from "../db.js";

// Si el navegador no se conecta en 10 minutos el servicio de push tira el aviso
// en vez de entregarlo tarde, que es lo que pide la actividad
const TTL_AVISO = 600;

export function configurarWebPush() {
  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const contacto = process.env.VAPID_SUBJECT;

  if (!publica || !privada || !contacto) {
    console.warn("Faltan las variables VAPID, el push queda apagado");
    return false;
  }

  try {
    setVapidDetails(contacto, publica, privada);
    return true;
  } catch (error) {
    // Si las llaves están mal escritas se apaga el push pero la API sigue sirviendo
    console.warn("Llaves VAPID inválidas:", error.message);
    return false;
  }
}

export async function enviarATodos(datos) {
  const db = getDB();
  const suscripciones = await db.collection("suscripciones").find().toArray();

  const muertas = [];
  let enviados = 0;

  for (const s of suscripciones) {
    try {
      await sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        JSON.stringify(datos),
        { TTL: TTL_AVISO }
      );
      enviados++;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // El navegador ya borró esa suscripción, hay que sacarla de la base
        muertas.push(s.endpoint);
      } else {
        // 429 u otro error del servicio: se anota y se sigue, no se corta la app
        console.warn("Push fallido:", error.statusCode, error.message);
      }
    }
  }

  if (muertas.length > 0) {
    await db
      .collection("suscripciones")
      .deleteMany({ endpoint: { $in: muertas } });
    console.log("Suscripciones muertas borradas:", muertas.length);
  }

  return { enviados, borradas: muertas.length };
}
