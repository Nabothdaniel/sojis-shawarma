import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

// Extend the self type for Serwist
declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST?: (string | PrecacheEntry)[];
  }
}

const serwist = new Serwist({
  precacheEntries: (self as any).__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
