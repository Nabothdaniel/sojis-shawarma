'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl animate-in slide-in-from-right-full duration-300 ${
            toast.type === 'success' ? 'bg-tertiary text-on-tertiary' :
            toast.type === 'error' ? 'bg-error text-on-error' :
            'bg-surface-container-highest text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' :
             toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="font-body font-bold text-sm">{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
