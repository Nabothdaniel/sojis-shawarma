import { useEffect, useRef } from 'react';

/**
 * Hook to track component re-renders during development
 * Usage: useRenderCount('ComponentName')
 * Check browser console to see render counts
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[RENDER] ${componentName} - Renders: ${renderCount.current}`);
  });

  return renderCount.current;
}
