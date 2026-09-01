import Router from "./router/router.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import DestinoDetailView from "./views/DestinoDetailView.js";

// La ruta "/item/:id" ya está registrada aquí, pero el Router todavía
// no sabe hacer match con rutas dinámicas (ver TODO en router.js).
//
// TODO: si renombraste tu entidad (ej. "receta"), puedes
// cambiar aquí el path a algo como "/receta/:id" — solo asegúrate de
// que coincida con los enlaces generados en ItemCard.js.
const routes = [
  { path: "/", view: HomeView },
  { path: "/acerca", view: AboutView },
  { path: "/destino/:id", view: DestinoDetailView },
];

// Prefijo real donde vive tu app en GitHub Pages.
// Ajusta esto según el nombre de tu repo y de tu carpeta.
const BASE_PATH = "/BCS-Turismo-Sostenible/U2 ejercicio 3";

const app = document.getElementById("app");
const router = new Router(routes, app, BASE_PATH);

router.init();