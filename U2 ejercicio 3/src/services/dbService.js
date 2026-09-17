import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const DB_NAME = "bcs_turismo_db";
const DB_VERSION = 1;
const STORE_NAME = "guardados";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("by_estado", "estado", { unique: false });
    }
  },
});

export async function agregarGuardado(registro) {
  const db = await dbPromise;
  return db.put(STORE_NAME, registro);
}

export async function getGuardados() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function getGuardadosPorEstado(estado) {
  const db = await dbPromise;
  return db.getAllFromIndex(STORE_NAME, "by_estado", estado);
}

export async function eliminarGuardado(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}