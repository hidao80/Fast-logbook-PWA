const APP_NAME = "Fast logbook PWA";

// Specify the relative paths of static files and list the files to be downloaded and cached at installation
// It's good to list js files, css files, image files, etc. if there are any
// Here, "/" refers to the directory where the JavaScript file that becomes the service worker is located
const assets = [
  "/",
  "/index.html",
  "/config.html",
  "/img/android-launchericon-48-48.png",
  "/img/android-launchericon-72-72.png",
  "/img/android-launchericon-96-96.png",
  "/img/android-launchericon-144-144.png",
  "/img/android-launchericon-192-192.png",
  "/img/android-launchericon-512-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "/css/config.css",
  "/css/main.css",
  "/js/main.js",
  "/js/config.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "/js/lib/download.js",
  "/js/lib/indolence.min.js",
  "/js/lib/multilingualization.js",
  "/js/lib/utils.js",
];

// Key string indicating that this is cache data for this service worker
// By including the version number, we aim to update cache files when the source is updated
let CACHE_NAME = "";

/**
 * Get the cache name
 */
(() => {
  // Get the version number from manifest.json.
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifestData => {
      CACHE_NAME = APP_NAME + "_" + manifestData.version;
    });
})();

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