import { defaultCache, NetworkFirst } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cache-expiration";

// Extend the self type for Serwist
declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST?: (string | PrecacheEntry)[];
  }
}

// Custom caching strategy for Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

const serwist = new Serwist({
  precacheEntries: (self as any).__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
