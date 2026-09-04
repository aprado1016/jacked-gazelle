const C='jg2-v21';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isPage=e.request.mode==='navigate'||e.request.url.endsWith('/index.html');
  if(isPage){
    // Network first: uploading a new index.html to GitHub shows up on next online launch.
    e.respondWith(
      fetch(e.request).then(res=>{
        const cl=res.clone();
        caches.open(C).then(c=>{c.put(e.request,cl);c.put('./index.html',res.clone())});
        return res;
      }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html')))
    );
  }else{
    // Assets (icons, fonts): cache first, then network + cache for next time.
    e.respondWith(
      caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{
        const cl=res.clone();
        caches.open(C).then(c=>c.put(e.request,cl));
        return res;
      }))
    );
  }
});
