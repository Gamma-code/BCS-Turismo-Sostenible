import { slugify } from "../utils/slugify.js";

// Recibe un objeto "item" y devuelve el HTML de su tarjeta en el listado.
// TODO: ajusta qué campos mostrar según tu tema, si lo deseas
// (por ejemplo, mostrar "meta" como "Duración:", "Precio:", etc.)
export default function DestinoCard(destino) {
  // TODO (Ejercicio - Parte A, punto 3): usa slugify(item.title) para
  // llenar el atributo data-slug de abajo (actualmente queda sin procesar).
  const slug = slugify(destino.title);

  return `
    <article class="card" data-slug="${slug}">
      <h3>${destino.title}</h3>
      <p>${destino.description}</p>
      <p><small>${destino.meta} · ${destino.ubicacion}</small></p>
      <a href="/destino/${destino.id}" data-link>Ver detalle →</a>
    </article>
  `;
}
