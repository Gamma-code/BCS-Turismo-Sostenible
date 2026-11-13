import { Router } from "express";
import { getDB } from "../db.js";

const router = Router();

// El navegador necesita la llave pública para poder suscribirse
router.get("/clave-publica", (req, res) => {
  const clave = process.env.VAPID_PUBLIC_KEY;

  if (!clave) {
    return res.status(503).json({ error: "El push no está configurado" });
  }

  res.json({ clave });
});

router.post("/suscripcion", async (req, res) => {
  const { suscripcion, usuarioId } = req.body ?? {};

  if (!suscripcion?.endpoint || !suscripcion?.keys?.p256dh || !suscripcion?.keys?.auth) {
    return res.status(400).json({ error: "La suscripción viene incompleta" });
  }

  if (!usuarioId) {
    return res.status(400).json({ error: "Falta el usuario" });
  }

  try {
    const db = getDB();

    // Si ese navegador ya estaba guardado se actualiza en lugar de duplicarse
    await db.collection("suscripciones").updateOne(
      { endpoint: suscripcion.endpoint },
      {
        $set: {
          user_id: usuarioId,
          endpoint: suscripcion.endpoint,
          p256dh: suscripcion.keys.p256dh,
          auth: suscripcion.keys.auth,
        },
        $setOnInsert: { creado_en: new Date() },
      },
      { upsert: true }
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Error guardando la suscripción:", error.message);
    res.status(500).json({ error: "No se pudo guardar la suscripción" });
  }
});

router.delete("/suscripcion", async (req, res) => {
  const { endpoint } = req.body ?? {};

  if (!endpoint) {
    return res.status(400).json({ error: "Falta el endpoint" });
  }

  try {
    const db = getDB();
    const resultado = await db
      .collection("suscripciones")
      .deleteOne({ endpoint });

    res.json({ borradas: resultado.deletedCount });
  } catch (error) {
    console.error("Error borrando la suscripción:", error.message);
    res.status(500).json({ error: "No se pudo borrar la suscripción" });
  }
});

export default router;
