/* Service worker mínimo do UniSync: permite instalar o app na tela inicial.
   Não guarda nada em cache, então o app sempre abre a versão mais nova. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => new Response(
      "<meta charset=utf-8><meta name=viewport content='width=device-width'><body style='font-family:sans-serif;padding:2rem'><h2>UniSync</h2><p>Sem conexão com a internet. Tente de novo quando estiver online.</p>",
      {headers: {"Content-Type": "text/html; charset=utf-8"}})));
  }
});
