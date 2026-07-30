'use client';

import { useEffect } from 'react';
import { driver, DriveStep } from 'driver.js';

export function useWalkthrough(
  tourKey: string,
  steps: DriveStep[],
  options?: { enabled?: boolean; force?: boolean }
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (options?.enabled === false) return;

    const hasSeenTour = localStorage.getItem(`walkthrough_seen_${tourKey}`);
    
    if (!hasSeenTour || options?.force) {
      let driverInstance: any = null;
      let isDestroyed = false;

      const t = setTimeout(() => {
        if (isDestroyed) return;

        const driverObj = driver({
          showProgress: true,
          animate: true,
          overlayColor: 'rgba(0,0,0,0.7)',
          doneBtnText: 'Got it!',
          nextBtnText: 'Next →',
          prevBtnText: '← Back',
          steps,
          popoverClass: 'driver-theme-sojis',
          onDestroyStarted: () => {
             if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the tour?")) {
               driverObj.destroy();
             }
          },
          onDestroyed: () => {
             localStorage.setItem(`walkthrough_seen_${tourKey}`, 'true');
             isDestroyed = true;
          }
        });
        
        driverInstance = driverObj;
        driverObj.drive();
      }, 500);

      // Cleanup on unmount or re-render (fixes StrictMode duplicate popover issue)
      return () => {
        isDestroyed = true;
        clearTimeout(t);
        if (driverInstance) {
          driverInstance.destroy();
        }
      };
    }
  }, [tourKey, steps, options?.enabled, options?.force]);
}
