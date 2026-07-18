const CACHE_VERSION = 'v3';
const STATIC_CACHE = `streamaix-static-${CACHE_VERSION}`;
const API_CACHE = `streamaix-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `streamaix-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

const API_CACHE_DURATION = 5 * 60 * 1000;
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000;

self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Installing service worker v2...');
  console.log('[SW] Push notification support:', 'PushManager' in self);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS)
          .catch(err => console.log('[SW] Some assets failed to cache:', err));
      })
      .then(() => {
        console.log('[SW] ✅ Install complete, skipping waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('streamaix-') && 
                     name !== STATIC_CACHE && 
                     name !== API_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Activation complete, claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW] 📱 Service Worker ready for push notifications');
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  // Never intercept Vite dev-server module URLs — caching them serves stale
  // module graphs (duplicate React copies) and crashes the app in development.
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('.vite') ||
    url.searchParams.has('v') && url.pathname.endsWith('.js') && url.pathname.includes('chunk-')
  ) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  event.respondWith(networkFirstWithOffline(request));
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cache-time', Date.now().toString());
      
      const body = await responseToCache.blob();
      const cachedResponse = new Response(body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (!cacheTime || (Date.now() - parseInt(cacheTime)) < API_CACHE_DURATION) {
        return cachedResponse;
      }
    }
    
    return cachedResponse || new Response(
      JSON.stringify({ error: 'Offline', message: 'No network connection' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(cacheName);
          cache.put(request, networkResponse);
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.destination === 'document' || request.mode === 'navigate') {
      return new Response(getOfflineHTML(), {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('', { status: 404 });
  }
}

function getOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreamAiX - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }
    .bg-grid {
      position: fixed;
      inset: 0;
      background-image: 
        linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }
    .container {
      text-align: center;
      max-width: 420px;
      position: relative;
      z-index: 1;
    }
    .logo-container {
      width: 100px;
      height: 100px;
      margin: 0 auto 32px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(139, 92, 246, 0.3);
      box-shadow: 0 0 60px rgba(139, 92, 246, 0.2);
      animation: pulse 3s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 60px rgba(139, 92, 246, 0.2); }
      50% { box-shadow: 0 0 80px rgba(139, 92, 246, 0.4); }
    }
    .logo {
      font-size: 48px;
      filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient 3s linear infinite;
    }
    @keyframes gradient {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }
    .subtitle {
      font-size: 14px;
      color: #64748B;
      margin-bottom: 24px;
      font-weight: 500;
    }
    p {
      color: #94A3B8;
      line-height: 1.7;
      margin-bottom: 32px;
      font-size: 15px;
    }
    .status-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      backdrop-filter: blur(10px);
    }
    .status-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }
    .status-item:not(:last-child) {
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    }
    .status-label {
      color: #64748B;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-value {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      color: #F59E0B;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #F59E0B;
      animation: blink 1.5s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    button {
      background: linear-gradient(135deg, #8B5CF6, #06B6D4);
      color: white;
      border: none;
      padding: 14px 40px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="container">
    <div class="logo-container">
      <span class="logo">⚡</span>
    </div>
    <h1>StreamAiX</h1>
    <p class="subtitle">Stream the Noise. Capture the Signal.</p>
    
    <div class="status-card">
      <div class="status-item">
        <span class="status-label">
          <span class="status-dot"></span>
          Network Status
        </span>
        <span class="status-value">OFFLINE</span>
      </div>
      <div class="status-item">
        <span class="status-label">Cache Status</span>
        <span class="status-value" style="color: #10B981;">ACTIVE</span>
      </div>
      <div class="status-item">
        <span class="status-label">Last Sync</span>
        <span class="status-value" id="lastSync">--:--</span>
      </div>
    </div>
    
    <p>The AI prediction markets and crypto analytics need an internet connection. Your cached data is preserved.</p>
    
    <button onclick="location.reload()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>
      Reconnect
    </button>
    
    <div class="footer">
      StreamAiX PWA v2.0 • Autonomous AI Ecosystem
    </div>
  </div>
  <script>
    document.getElementById('lastSync').textContent = 
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>`;
}

self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push event received!');
  console.log('[SW] Push event data exists:', !!event.data);
  
  if (!event.data) {
    console.log('[SW] ❌ No push data, ignoring');
    return;
  }

  try {
    const rawData = event.data.text();
    console.log('[SW] Raw push data:', rawData.substring(0, 200));
    
    const data = JSON.parse(rawData);
    console.log('[SW] Parsed push data:', JSON.stringify(data, null, 2));
    
    const vibrationPatterns = {
      win: [200, 100, 200, 100, 300],
      trade: [100, 50, 100],
      alert: [300, 100, 300],
      default: [100, 50, 100]
    };

    const getVibrationPattern = (tag) => {
      if (tag?.includes('resolution') && data.data?.winnings > 0) return vibrationPatterns.win;
      if (tag?.includes('trade')) return vibrationPatterns.trade;
      if (tag?.includes('alert')) return vibrationPatterns.alert;
      return vibrationPatterns.default;
    };
    
    const options = {
      body: data.body || 'New update from StreamAiX',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      image: data.image,
      vibrate: getVibrationPattern(data.tag),
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
        ...data.data
      },
      actions: data.actions || [
        { action: 'open', title: '👀 View' },
        { action: 'dismiss', title: '✓ Dismiss' }
      ],
      tag: data.tag || 'streamaix-notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      timestamp: data.timestamp || Date.now(),
      silent: data.silent || false
    };

    console.log('[SW] 📱 Showing notification with options:', JSON.stringify({
      title: data.title || 'StreamAiX',
      body: options.body,
      tag: options.tag
    }));

    event.waitUntil(
      self.registration.showNotification(data.title || 'StreamAiX', options)
        .then(() => {
          console.log('[SW] ✅ Notification displayed successfully!');
        })
        .catch((err) => {
          console.error('[SW] ❌ Failed to show notification:', err);
        })
    );
  } catch (error) {
    console.error('[SW] ❌ Push notification error:', error);
    console.error('[SW] Error stack:', error.stack);
    
    // Attempt to show a fallback notification
    event.waitUntil(
      self.registration.showNotification('StreamAiX', {
        body: 'You have a new notification',
        icon: '/icon-192.png'
      }).catch(e => console.error('[SW] Fallback notification also failed:', e))
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'dismiss' || action === 'later' || action === 'remind_later') {
    return;
  }

  const actionRoutes = {
    'view_position': '/dashboard',
    'view_winnings': '/dashboard',
    'trade_more': '/markets',
    'trade_now': '/markets',
    'view': notificationData.url || '/',
    'explore': '/markets',
    'explore_markets': '/markets',
    'view_chart': '/discover',
    'start_work': notificationData.url || '/bounty-board',
    'view_details': notificationData.url || '/bounty-board',
    'claim_reward': '/dashboard',
    'find_more': '/bounty-board',
    'view_balance': '/dashboard',
    'review': notificationData.url || '/bounty-board',
    'view_dashboard': '/dashboard',
    'open': notificationData.url || '/',
    'watch_now': notificationData.url || '/streams',
    'remind_later': null
  };

  let urlToOpen = actionRoutes[action] || notificationData.url || '/';

  if (notificationData.marketId && (action === 'view_position' || action === 'trade_more')) {
    urlToOpen = `/markets/${notificationData.marketId}`;
  }
  if (notificationData.bountyId && (action === 'view_details' || action === 'start_work')) {
    urlToOpen = `/bounty-board/${notificationData.bountyId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-predictions') {
    event.waitUntil(syncPredictions());
  }
});

async function syncPredictions() {
  console.log('[SW] Syncing predictions in background...');
}
