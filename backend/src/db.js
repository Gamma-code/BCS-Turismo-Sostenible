import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;

let db = null;

export async function conectarDB() {
  if (db) return db;

  if (!URI) {
    throw new Error("Falta la variable de entorno MONGODB_URI");
  }

  const cliente = new MongoClient(URI);
  await cliente.connect();
  db = cliente.db("bcs_turismo");

  // El endpoint identifica al navegador, así que no puede repetirse
  await db
    .collection("suscripciones")
    .createIndex({ endpoint: 1 }, { unique: true });

  console.log("Conectado a MongoDB");
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error("La base de datos todavía no está conectada");
  }
  return db;
}
