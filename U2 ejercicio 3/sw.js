
console.log("[SW] Script en ejecución");
console.log("[SW] Contexto global =>", self.constructor.name);

// No existen dentro de un Service Worker
console.log("[SW] typeof window =>", typeof window);
console.log("[SW] typeof document =>", typeof document);
console.log("[SW] typeof localStorage =>", typeof localStorage);

// Sí existen dentro de un Service Worker
console.log("[SW] typeof indexedDB =>", typeof indexedDB);
console.log("[SW] typeof caches =>", typeof caches);

console.log("[SW] Scope =>", self.registration.scope);
