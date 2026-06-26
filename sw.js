// Service worker — network-first สำหรับหน้าเว็บ (ออนไลน์ได้ของใหม่เสมอ), cache-first สำหรับไอคอน
const CACHE = "expense-app-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/pwa-192.png",
  "./icons/pwa-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // network-first: ลองโหลดของใหม่ก่อน ถ้าออฟไลน์ค่อยใช้ cache
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((h) => h || caches.match("./index.html")))
    );
    return;
  }

  // อื่นๆ (ไอคอน/manifest): cache-first แล้วอัปเดตเบื้องหลัง
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
