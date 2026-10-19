import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const DB_NAME = "bcs_turismo_db";
const DB_VERSION = 2;
const STORE_NAME = "guardados";
const STORE_PENDIENTES = "reportes_pendientes";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });

      store.createIndex("by_estado", "estado", { unique: false });
    }

    // Cola de reportes que todavía no se mandan al servidor
    if (!db.objectStoreNames.contains(STORE_PENDIENTES)) {
      db.createObjectStore(STORE_PENDIENTES, {
        keyPath: "id",
        autoIncrement: true,
      });
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

export async function agregarPendiente(registro) {
  const db = await dbPromise;
  return db.add(STORE_PENDIENTES, registro);
}

export async function getPendientes() {
  const db = await dbPromise;
  return db.getAll(STORE_PENDIENTES);
}

export async function eliminarPendiente(id) {
  const db = await dbPromise;
  return db.delete(STORE_PENDIENTES, id);
}