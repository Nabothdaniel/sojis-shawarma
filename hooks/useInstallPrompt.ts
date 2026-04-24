'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

type InstallPromptOptions = {
  onUnsupported?: () => void;
  onAccepted?: () => void;
  onDismissed?: () => void;
};

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async ({ onUnsupported, onAccepted, onDismissed }: InstallPromptOptions = {}) => {
    if (!deferredPrompt) {
      onUnsupported?.();
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (choiceResult.outcome === 'accepted') {
        onAccepted?.();
        return true;
      }

      onDismissed?.();
      return false;
    } catch (error) {
      console.error('Install prompt failed', error);
      onUnsupported?.();
      return false;
    }
  };

  return {
    install,
    installAvailable: Boolean(deferredPrompt),
  };
}
