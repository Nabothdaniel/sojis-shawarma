'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const hasVisited = localStorage.getItem('soji_has_visited');
    if (hasVisited === 'true') {
      router.replace('/show/');
    } else {
      router.replace('/landing/');
    }
  }, []); // Empty dependency array - runs once on mount
  return null;
}
