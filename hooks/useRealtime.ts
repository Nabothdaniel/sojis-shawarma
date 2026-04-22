'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000';
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return envUrl.endsWith('/api') ? envUrl : (envUrl ? `${envUrl}/api` : '/api');
};

const API_URL = getApiUrl();

export function useRealtime() {
  const { user, isAuthenticated, updateUserBalance, addToast } = useAppStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Get token for auth (passed via query param because EventSource doesn't support headers)
    const token = sessionStorage.getItem('bamzysms-token') || localStorage.getItem('bamzysms-token');
    
    if (!token) return;

    // Initialize SSE connection
    const streamUrl = `${API_URL}/events/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    console.log('Real-time: Connecting to SSE stream...');

    // Live Balance Updates
    es.addEventListener('balance_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.new_balance !== undefined) {
          updateUserBalance(Number(data.new_balance));
        }
        if (data.message) {
          addToast(data.message, 'success');
          // Also add to notifications list
          const { addNotification } = useAppStore.getState();
          addNotification({
            id: Date.now(),
            event_type: 'balance_updated',
            payload: e.data,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Real-time: Error parsing balance_updated event', err);
      }
    });

    // Generic Notifications
    es.addEventListener('notification', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.message) {
          addToast(data.message, data.type || 'info');
          // Also add to notifications list
          const { addNotification } = useAppStore.getState();
          addNotification({
            id: Date.now(),
            event_type: data.type || 'info',
            payload: e.data,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Real-time: Error parsing notification event', err);
      }
    });

    // Error handling
    es.onerror = (err) => {
      console.error('Real-time: SSE connection error. Reconnecting...', err);
      es.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user, updateUserBalance, addToast]);
}
