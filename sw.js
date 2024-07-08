const APP_NAME = "Fast logbook lite";
const VERSION = "202407090448JST";

// Key string indicating that this is cache data for this service worker
// By including the version number, we aim to update cache files when the source is updated
const CACHE_NAME = APP_NAME + "_" + VERSION;

// Specify the relative paths of static files and list the files to be downloaded and cached at installation
// It's good to list js files, css files, image files, etc. if there are any
// Here, "/" refers to the directory where the JavaScript file that becomes the service worker is located
const assets = [
  "/",
  "/index.html",
  "/config.html",
  "/img/icon_256.png",
  "/css/bootstrap.min.css",
  "/css/config.css",
  "/css/main.css",
  "/js/main.js",
  "/js/config.js",
  "/js/lib/bootstrap.bundle.min.js",
  "/js/lib/download.js",
  "/js/lib/indolence.min.js",
  "/js/lib/multilingualization.js",
  "/js/lib/utils.js",
];

/**
 * Processing when the service worker installation event occurs
 */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Download and cache the specified file group locally
      // This allows the app to be launched offline
      return cache.addAll(assets).catch(error => {
        console.error('Failed to add to cache:', error);
      });
    })
  );
});

/** 
 * Processing when the service worker accesses the server
 */
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // If cached, refer to the local file without communicating
      return response || fetch(e.request);
    })
  );
});

/**
 * Processing when the service worker starts up
 */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // If not in the file name array defined at the beginning of this file,
          // and if cached, delete from cache (= local)
          // A measure to prevent garbage from remaining during version upgrades
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});