// SW Version
const version = '1.1';



// Static Cache - App Shell
const appAssets = [
    './index.html',
    './main.js',
    './images/flame.png',
    './images/logo.png',
    './images/sync.png',
    './vendor/bootstrap.min.css',
    './vendor/jquery.min.js'
];




// SW Install
self.addEventListener( 'install', e => {
    e.waitUntil(
        caches.open( `static-${version}` )
        .then( cache => cache.addAll(appAssets))
    );
});




// SW Activate
self.addEventListener( 'activate', e => {
    //clean cache
    let cleaned = caches.keys().then( keys => {
        keys.forEach( key => {
            if ( key !== `static-${version}` && key.match('static-')) {
                return caches.delete(key);
            }
        });
    });
    e.waitUntil(cleaned);
});




// Static Cache with Cache then Network Fallback Strategy
const staticCache = (req, cacheName = `static-${version}`) => {
    return caches.match(req).then( cachedRes => {
        // return cached response if found
        if(cachedRes) return cachedRes;
        //fall back to network
        return fetch(req).then( networkRes => {
            // update cache with new response
            caches.open(cacheName)
            .then(cache => cache.put(req, networkRes));
            // return clone of network response
            return networkRes.clone();
        });
    });
};




// Network with Cache Fallback Strategy
const fallbackCache = (req) => {
    // try network first
    return fetch(req).then( networkRes => {
        //check res is ok, else go to cache 
        if( !networkRes.ok ) throw 'Fetch Error';
         // update cache 
         caches.open(`static-${version}`)
         .then(cache => cache.put(req, networkRes));
         // return clone of network response
         return networkRes.clone();
    })
    // try cache
    .catch(err => caches.match(req));
};




// Clear old Giphys from cache
const cleanGiphyCache = (giphys) => {
    caches.open('giphy').then( cache => {
        //get all cache entries
        cache.keys().then( keys => {
            // loop entries
            keys.forEach( key => {
                // if entry is not part of current giphys, delete
                if (!giphys.includes(key.url)) cache.delete( key );
            });
        });
    });
};



//SW Fetch
self.addEventListener('fetch', e => {
    //App Shell
    if (e.request.url.match(location.origin)) {
        e.respondWith(staticCache(e.request));
    // Giphy API
    } else if (e.request.url.match('api.giphy.com/v1/gifs/trending')) {
        e.respondWith(fallbackCache(e.request));
    } else if (e.request.url.match('giphy.com/media')) {
        e.respondWith(staticCache(e.request, 'giphy'));
    }
});



 
// Listen for message from client
self.addEventListener('message', e => {
    if (e.data.action === 'cleanGiphyCache' ) cleanGiphyCache(e.data.giphys); 
});