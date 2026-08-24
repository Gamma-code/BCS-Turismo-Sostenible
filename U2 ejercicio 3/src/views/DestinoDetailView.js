// TODO (Ejercicio - Parte A, punto 2): completa esta vista.
//
// Esta función recibirá el objeto "params" que tu Router extraiga de la
// URL, por ejemplo params = { id: "2" } para la ruta "/item/2".
//
// Pasos sugeridos:
//   1. Dentro de esta función (NO como import estático arriba del
//      archivo), haz: const { default: ItemsService } = await
//      import("../services/itemsService.js");
//   2. Crea una instancia: const service = new ItemsService();
//   3. Usa service.getById(params.id) para obtener el elemento.
//   4. Si no existe, devuelve un HTML simple indicando "no encontrado".
//   5. Si existe, devuelve un <div class="card"> con sus campos
//      (título, descripción, meta...).
//
// TODO: una vez que funcione, ajusta qué campos mostrar y cómo
// se llaman en pantalla, según tu tema.

export default async function DestinoDetailView(params) {
  const { default: DestinosService } = await import(
    "../services/destinosService.js"
  );
  const service = new DestinosService();
  const destino = await service.getById(params?.id);

  if (!destino) {
    return `
      <div class="card">
        <h2>Destino no encontrado</h2>
        <p>No existe información para el id "${params?.id ?? "sin definir"}".</p>
        <a href="/" data-link>← Volver al inicio</a>
      </div>
    `;
  }

  return `
    <article class="card">
      <h2>${destino.title}</h2>
      <p>${destino.description}</p>
      <p><strong>Categoría:</strong> ${destino.meta}</p>
      <p><strong>Ubicación:</strong> ${destino.ubicacion}</p>
      <p><strong>Horario recomendado:</strong> ${destino.horario}</p>
      <p><strong>Recomendación sostenible:</strong> ${destino.recomendacion}</p>
      <a href="/" data-link>← Volver al listado</a>
    </article>
  `;
}
