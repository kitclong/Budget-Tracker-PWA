const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/index.js",
    "/index_db.js",
    "/manifest.webmanifest",

    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0"
]

const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

//=============================================================================================
// Install
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting();
});

//=============================================================================================
// Clean and remove old cache and activate 
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches
            .keys()
            .then(keyList => {
                return Promise.all(
                    keyList.map(key => {
                        if (key !== STATIC_CACHE && key !== DATA_CACHE) {
                            console.log("Removing old cache data", key);
                            return caches.delete(key);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

//=============================================================================================
self.addEventListener("fetch", function (event) {
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches
                .open(DATA_CACHE)
                .then(cache => {
                    return fetch(event.request)
                        // Store good response in cache.
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        })
                        // Try cache when network network request fails
                        .catch(err => {
                            return cache.match(event.request);
                        });
                }).catch(err => console.log(err))
        );
        return;
    }
    event.respondWith(
        caches
            .match(event.request)
            .then(function (response) {
                return response || fetch(event.request);
            })
    );
});