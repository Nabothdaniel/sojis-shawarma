'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function SessionManager() {
  const pathname = usePathname();

  useEffect(() => {
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
          city: '', // Populated by geolocation later if available
          state: '',
          lat: 0,
          lng: 0,
          pages_viewed: [pathname],
          items_viewed: []
        };

        try {
          await axiosInstance.post('/sessions', deviceInfo);
        } catch (err) {
          console.error('Session init failed', err);
        }
      } else {
        // Update session with new page view
        try {
          await axiosInstance.put(`/sessions/${sessionId}`, { page_view: pathname });
        } catch (err) {
          console.error('Session update failed', err);
        }
      }
    };

    initSession();
  }, [pathname]);

  return null;
}
