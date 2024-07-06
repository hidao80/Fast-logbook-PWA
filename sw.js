const APP_NAME = "Fast logbook lite";
const VERSION = "202407062017JST";

// Key string indicating that this is cache data for this service worker
// By including the version number, we aim to update cache files when the source is updated
const CACHE_NAME = APP_NAME + "_" + VERSION;

// Specify the relative paths of static files and list the files to be downloaded and cached at installation
// It's good to list js files, css files, image files, etc. if there are any
// Here, "/" refers to the directory where the JavaScript file that becomes the service worker is located
const assets = [
  "/fast-logbook-lite/",
  "/fast-logbook-lite/index.html",
  "/fast-logbook-lite/config.html",
  "/fast-logbook-lite/img/icon256x256.png",
  "/fast-logbook-lite/css/bootstrap.min.css",
  "/fast-logbook-lite/css/config.css",
  "/fast-logbook-lite/css/main.css",
  "/fast-logbook-lite/js/main.js",
  "/fast-logbook-lite/js/config.js",
  "/fast-logbook-lite/js/lib/bootstrap.bundle.min.js",
  "/fast-logbook-lite/js/lib/download.js",
  "/fast-logbook-lite/js/lib/indolence.min.js",
  "/fast-logbook-lite/js/lib/multilingualization.js",
  "/fast-logbook-lite/js/lib/utils.js",
];

/**
 * Processing when the service worker installation event occurs
 */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Download and cache the specified file group locally
      // This allows the app to start even when offline
      return cache.addAll(assets);
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
      return response ? response : fetch(e.request);
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