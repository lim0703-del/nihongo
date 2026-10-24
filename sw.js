/* 오프라인용 서비스 워커
 * - 처음 열 때 앱 파일을 폰에 저장해 두고, 다음부터는 인터넷 없이도 열립니다.
 * - 새 버전을 올렸을 때: 아래 CACHE 이름의 숫자를 올리면(v1 → v2) 폰에서도 새 파일로 바뀝니다.
 */
const CACHE = 'nihongo-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // 저장된 파일을 바로 보여주고(빠름·오프라인 가능), 뒤에서 몰래 최신 파일로 갱신
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key);
      const fresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
