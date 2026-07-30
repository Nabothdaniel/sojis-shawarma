'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import BottomNav from '@/components/ui/BottomNav';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, clearNotifications } = useAppStore();

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center justify-between bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-xl">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className="text-xs font-label font-bold uppercase tracking-widest text-outline hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </header>

      <main className="px-6 py-6 space-y-4 max-w-md mx-auto w-full">
        {notifications.length === 0 && (
          <div className="bg-surface-container-low rounded-[32px] p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-outline/20 text-4xl">notifications_off</span>
            </div>
            <p className="font-headline font-bold text-lg">All caught up!</p>
            <p className="font-body text-xs text-outline">You have no new messages or order updates.</p>
          </div>
        )}

        {notifications.map((notif) => (
          <button
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            className={`w-full text-left p-6 rounded-[28px] border transition-all ${
              notif.read 
                ? 'bg-transparent border-outline-variant/10 opacity-70' 
                : 'bg-primary-container/5 border-primary-container/20 shadow-sm'
            }`}
          >
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                notif.read ? 'bg-surface-container-high' : 'bg-primary-container/20'
              }`}>
                <span className={`material-symbols-outlined ${
                  notif.read ? 'text-outline/40' : 'text-primary-container'
                }`}>
                  {notif.type === 'order_status' ? 'box_edit' : 'info'}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-headline font-bold text-sm ${notif.read ? '' : 'text-primary-container'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-outline font-label uppercase font-bold">{formatDate(notif.timestamp)}</span>
                </div>
                <p className="font-body text-xs text-outline leading-relaxed">{notif.body}</p>
                {notif.link && !notif.read && (
                  <p className="font-label text-[10px] font-bold uppercase text-primary-container pt-2 flex items-center gap-1">
                    View Details <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
