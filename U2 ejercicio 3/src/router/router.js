/**
 * Router — enrutador de cliente basado en la History API.
 *
 * Estado actual: SOLO soporta rutas EXACTAS (route.path === path).
 * TODO (Ejercicio - Parte A, punto 1): agrega soporte para rutas con
 * parámetros, como "/item/:id", dentro de matchRoute().
 */
import { BASE_PATH } from "../config.js";

export default class Router {
  constructor(routes, rootElement) {
    this.routes = routes;
    this.root = rootElement;

    window.addEventListener("popstate", () => this.render());

    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) return;
      event.preventDefault();
      this.navigate(link.getAttribute("href"));
    });
  }

  navigate(path) {
    window.history.pushState({}, "", path);
    this.render();
  }

  /**
   * Debe devolver { route, params } si alguna ruta coincide con "path",
   * o null si ninguna coincide.
   *
   * Ahora mismo SOLO compara de forma exacta, por lo que "/item/1" no
   * hace match con la ruta definida como "/item/:id".
   *
   * TODO: soporta segmentos dinámicos (":id") y regresa también los
   * parámetros capturados, ej:
   *   matchRoute("/item/2") -> { route: <ruta /item/:id>, params: { id: "2" } }
   */
   matchRoute(path) {
    for (const route of this.routes) {
      const paramNames = [];

      const pattern = route.path
        .split("/")
        .map((segment) => {
          if (segment.startsWith(":")) {
            paramNames.push(segment.slice(1));
            return "([^/]+)";
          }
          return segment;
        })
        .join("/");

      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);

      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { route, params };
      }
    }

    return null;
  }

  async render() {
    const fullPath = decodeURIComponent(window.location.pathname);
    let path = fullPath.replace(BASE_PATH, "") || "/";

    if (path.endsWith("/index.html")) {
      path = path.slice(0, -"index.html".length) || "/";
    }
    if (path === "") path = "/";

    const match = this.matchRoute(path);

    if (!match) {
      const { default: NotFoundView } = await import(
        "../views/NotFoundView.js"
      );
      this.root.innerHTML = NotFoundView();
      return;
    }

    // skeleton 
    this.root.innerHTML = `
      <div class="skeleton">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    `;

    await new Promise((r) => setTimeout(r, 200));
    const html = await match.route.view(match.params);
    this.root.innerHTML = html;
    document.title = `BCS Turismo Sostenible — ${path}`;
  }

  init() {
    this.render();
  }
}
