'use client';

import React from 'react';
import { RiCheckLine, RiErrorWarningLine, RiInformationLine, RiCloseLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import type { ToastMessage } from '@/types';

const icons = {
  success: <RiCheckLine size={16} color="var(--color-primary)" />,
  error: <RiErrorWarningLine size={16} color="#EF4444" />,
  info: <RiInformationLine size={16} color="#F59E0B" />,
};

function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useAppStore((s) => s.removeToast);
  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      {icons[toast.type]}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
        aria-label="Dismiss"
      >
        <RiCloseLine size={15} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  return (
    <div
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
