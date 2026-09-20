import { slugify } from "../utils/slugify.js";
import { BASE_PATH } from "../config.js";

export default function DestinoCard(destino) {
  const slug = slugify(destino.title);
  const categoria = slugify(destino.meta);

  return `
    <article class="card" data-slug="${slug}" data-categoria="${categoria}">
      <h3>${destino.title}</h3>
      <p>${destino.description}</p>
      <p><small>${destino.meta} · ${destino.ubicacion}</small></p>
      <a href="${BASE_PATH}/destino/${destino.id}" data-link>Ver detalle</a>
    </article>
  `;
}