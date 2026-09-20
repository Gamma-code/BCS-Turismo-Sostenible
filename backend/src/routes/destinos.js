import { Router } from "express";
import { DESTINOS } from "../data/destinos.js";

const router = Router();

router.get("/", (req, res) => {
  const { q } = req.query;

  if (!q) return res.json(DESTINOS);

  const texto = q.toLowerCase();
  const filtrados = DESTINOS.filter((destino) =>
    `${destino.title} ${destino.meta} ${destino.ubicacion}`
      .toLowerCase()
      .includes(texto)
  );

  res.json(filtrados);
});

router.get("/:id", (req, res) => {
  const destino = DESTINOS.find((d) => d.id === req.params.id);

  if (!destino) {
    return res.status(404).json({ error: "Destino no encontrado" });
  }

  res.json(destino);
});

export default router;