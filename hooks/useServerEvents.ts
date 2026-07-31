'use client';

import { useEffect, useRef } from 'react';
import { getEventStreamUrl } from '@/lib/api/event-stream';

type EventHandler<T = unknown> = (payload: T) => void;

interface UseServerEventsOptions {
  enabled?: boolean;
  token?: string | null;
}

export function useServerEvents(
  handlers: Record<string, EventHandler<any>>,
  { enabled = true, token }: UseServerEventsOptions = {}
) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Legacy SSE to custom backend is deprecated in Firebase serverless migration.
    // Realtime updates are migrated to individual onSnapshot listeners inside the components
    // or rely on component-level polling fallbacks (e.g., OrderNotifications).
    // This hook is preserved as a no-op to prevent broken imports during the migration.
  }, [enabled, token]);
}
