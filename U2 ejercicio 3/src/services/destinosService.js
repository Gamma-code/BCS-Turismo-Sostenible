// Servicio "mock": simula una fuente de datos (podría ser un fetch real
// a una API). Exportación por defecto a propósito: la importarás de
// forma DINÁMICA en ItemDetailView.js.
//
// ── TODO ─────────────────────────────────────────────
// Reemplaza el arreglo ITEMS por los datos de tu propio tema (mínimo 4
// elementos, mínimo 3 campos cada uno). Puedes renombrar "ItemsService"
// y "Item" si quieres (ej. RecetasService / Receta), pero no es
// obligatorio: lo que se califica son los datos y los campos, no el
// nombre de la clase.
//
// Ejemplo si tu tema fuera "recetas":
//   { id: "1", title: "Tacos al pastor", description: "...", meta: "30 min" }

import { DESTINOS } from "./destinosData.js";

export default class DestinosService {
  async getAll() {
    return DESTINOS;
  }

  async getById(id) {
    return DESTINOS.find((destino) => destino.id === id) ?? null;
  }
}
