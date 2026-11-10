// Service worker mínimo: solo hace instalable la app.
// En la V1 no hay modo offline, así que no intercepta requests ni cachea nada.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
