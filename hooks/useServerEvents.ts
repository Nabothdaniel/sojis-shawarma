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
    if (!enabled) {
      return;
    }

    const source = new EventSource(getEventStreamUrl(token));
    const listeners = Object.keys(handlersRef.current).map((eventName) => {
      const listener = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data);
          handlersRef.current[eventName]?.(payload);
        } catch {
          // Ignore malformed stream payloads and keep the connection alive.
        }
      };

      source.addEventListener(eventName, listener as EventListener);
      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        source.removeEventListener(eventName, listener as EventListener);
      });
      source.close();
    };
  }, [enabled, token]);
}
