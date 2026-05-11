'use client';

import { useEffect, useState } from 'react';
import { biometricService } from '@/lib/api';

export default function useBiometricSupport() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(biometricService.isSupported());
  }, []);

  return isSupported;
}
