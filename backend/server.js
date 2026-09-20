import express from "express";
import cors from "cors";
import destinosRouter from "./src/routes/destinos.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    nombre: "API BCS Turismo Sostenible",
    endpoints: ["/api/destinos", "/api/destinos/:id"],
  });
});

app.use("/api/destinos", destinosRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en el puerto ${PORT}`);
});