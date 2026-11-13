import express from "express";
import cors from "cors";
import destinosRouter from "./src/routes/destinos.js";
import pushRouter from "./src/routes/push.js";
import reportesRouter from "./src/routes/reportes.js";
import { conectarDB } from "./src/db.js";
import { configurarWebPush } from "./src/services/pushService.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Solo el origen exacto del sitio, sin la ruta del repo y sin comodín.
// El localhost es para poder probar en la compu mientras se desarrolla.
const ORIGENES_PERMITIDOS = [
  "https://gamma-code.github.io",
  "http://localhost:5501",
];

app.use(cors({ origin: ORIGENES_PERMITIDOS }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    nombre: "API BCS Turismo Sostenible",
    endpoints: [
      "/api/destinos",
      "/api/destinos/:id",
      "/api/reportes",
      "/api/push/clave-publica",
      "/api/push/suscripcion",
    ],
  });
});

app.use("/api/destinos", destinosRouter);
app.use("/api/reportes", reportesRouter);
app.use("/api/push", pushRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

const pushListo = configurarWebPush();

conectarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API escuchando en el puerto ${PORT}`);
      console.log("Push:", pushListo ? "configurado" : "apagado");
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a la base de datos:", error.message);
    process.exit(1);
  });
