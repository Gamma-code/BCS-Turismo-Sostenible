import { Router } from "express";
import { getDB } from "../db.js";
import { enviarATodos } from "../services/pushService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const reportes = await db
      .collection("reportes")
      .find()
      .sort({ creado_en: -1 })
      .limit(20)
      .toArray();

    res.json(reportes);
  } catch (error) {
    console.error("Error leyendo los reportes:", error.message);
    res.status(500).json({ error: "No se pudieron leer los reportes" });
  }
});

router.post("/", async (req, res) => {
  const { destino, tipo, descripcion, usuarioId } = req.body ?? {};

  if (!destino || !tipo) {
    return res.status(400).json({ error: "Faltan datos del reporte" });
  }

  try {
    const db = getDB();

    const reporte = {
      destino,
      tipo,
      descripcion: descripcion ?? "",
      user_id: usuarioId ?? "anonimo",
      creado_en: new Date(),
    };

    const resultado = await db.collection("reportes").insertOne(reporte);

    // Se responde primero para que la app no espere al servicio de push
    res.status(201).json({ id: resultado.insertedId });

    // ---- AQUÍ SE DISPARA EL PUSH ----
    // El evento es que se guardó un reporte nuevo en la base
    enviarATodos({
      titulo: "Nuevo reporte en un destino",
      cuerpo: `${tipo} en ${destino}`,
      // Sin diagonal al inicio: el Service Worker la resuelve contra su scope
      // para que funcione bajo /BCS-Turismo-Sostenible/U2 ejercicio 3/
      url: "reportes",
    }).catch((error) => {
      console.warn("No se pudo mandar el push:", error.message);
    });
  } catch (error) {
    console.error("Error guardando el reporte:", error.message);
    res.status(500).json({ error: "No se pudo guardar el reporte" });
  }
});

export default router;
