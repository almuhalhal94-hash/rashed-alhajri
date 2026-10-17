const CACHE = "rh-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "assets/style.css", "assets/fonts.css", "assets/app.js", "assets/data.js", "assets/icons/icon.svg", "assets/icons/icon-192.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // واجهة الموقع وصور المقاطع: من الذاكرة أولاً مع تحديث بالخلفية
  if (u.origin === location.origin || u.hostname === "i.ytimg.com") {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
