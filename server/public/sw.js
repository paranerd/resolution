self.addEventListener('install', function(e) {
    self.skipWaiting();
    console.log('[ServiceWorker] Install');
});

self.addEventListener('fetch', function(event) {
    console.log("fetch intercepted 5");
    event.respondWith(customHeaderRequestFetch(event));
});

function customHeaderRequestFetch(event) {
    const newRequest = new Request(event.request, {
        //mode: 'cors',
        //credentials: 'omit',
        headers: {
            Authorization: 'Bearer 1369',
        },
    });

    return fetch(newRequest)
}