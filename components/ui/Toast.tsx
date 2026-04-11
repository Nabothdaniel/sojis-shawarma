'use client';

import React from 'react';
import { RiCheckLine, RiErrorWarningLine, RiInformationLine, RiCloseLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import type { ToastMessage } from '@/types';

const icons = {
  success: <RiCheckLine size={18} color="#10B981" />, // Explicit Green
  error: <RiErrorWarningLine size={18} color="#EF4444" />, // Explicit Red
  info: <RiInformationLine size={18} color="#F59E0B" />, // Explicit Amber
};

function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useAppStore((s) => s.removeToast);
  return (
    <div className={`toast ${toast.type}`} role="alert">
      {icons[toast.type as keyof typeof icons]}
      <span style={{ flex: 1, lineHeight: 1.4, color: '#fff' }}>{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 2 }}
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
