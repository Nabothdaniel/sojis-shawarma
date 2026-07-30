'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function SessionManager() {
  const pathname = usePathname();
  const isInitialized = useRef(false);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Debounce rapid pathname changes
    const timer = setTimeout(() => {
      const initSession = async () => {
        let sessionId = localStorage.getItem('fd_session_id');
        
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem('fd_session_id', sessionId);

          const deviceInfo = {
            session_id: sessionId,
            device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
            os: navigator.userAgent.includes('Win') ? 'Windows' : 
                navigator.userAgent.includes('Mac') ? 'MacOS' : 
                navigator.userAgent.includes('Linux') ? 'Linux' : 'Other',
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
            city: '',
            state: '',
            lat: 0,
            lng: 0,
            pages_viewed: [pathname],
            items_viewed: []
          };

          try {
            await axiosInstance.post('/sessions', deviceInfo);
            isInitialized.current = true;
          } catch (err) {
            console.error('Session init failed', err);
          }
        } else if (lastPathname.current !== pathname && isInitialized.current) {
          // Only update if initialized and pathname actually changed
          try {
            await axiosInstance.put(`/sessions/${sessionId}`, { page_view: pathname });
            lastPathname.current = pathname;
          } catch (err) {
            console.error('Session update failed', err);
          }
        }
      };

      initSession();
    }, 100); // Debounce by 100ms

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
