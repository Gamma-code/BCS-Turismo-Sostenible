import { slugify } from "../utils/slugify.js";
import { BASE_PATH } from "../config.js";

// Recibe un objeto "item" y devuelve el HTML de su tarjeta en el listado.
// TODO: ajusta qué campos mostrar según tu tema, si lo deseas
// (por ejemplo, mostrar "meta" como "Duración:", "Precio:", etc.)
export default function DestinoCard(destino) {
  const slug = slugify(destino.title);

  return `
    <article class="card" data-slug="${slug}">
      <h3>${destino.title}</h3>
      <p>${destino.description}</p>
      <p><small>${destino.meta} · ${destino.ubicacion}</small></p>
      <a href="${BASE_PATH}/destino/${destino.id}" data-link>Ver detalle →</a>
    </article>
  `;
}