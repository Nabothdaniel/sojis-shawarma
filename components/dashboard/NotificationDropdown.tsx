'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  RiNotificationLine, RiTimeLine, RiCheckDoubleLine, 
  RiCoinsLine, RiShieldUserLine, RiSettings3Line, RiInformationLine,
  RiInboxLine
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import apiClient from '@/lib/api/client';

function timeAgo(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 5) return 'Just now';

  const units = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `${value} ${unit.label}${value === 1 ? '' : 's'} ago`;
    }
  }

  return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markRead, setNotifications } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch initial notifications when opening
  const toggleDropdown = async () => {
    if (!isOpen) {
      try {
        const data: any = await apiClient.get('/notifications');
        if (data && data.status === 'success') {
          setNotifications(data.notifications || [], data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read', {});
      markRead();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleMarkOneRead = async (id: number) => {
    try {
      await apiClient.post('/notifications/mark-read', { id });
      markRead(id);
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'balance_updated': return <RiCoinsLine className="notif-icon balance" />;
      case 'otp_received':    return <RiShieldUserLine className="notif-icon security" />;
      case 'settings_change': return <RiSettings3Line className="notif-icon settings" />;
      default:                return <RiInformationLine className="notif-icon info" />;
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button 
        className={`notif-trigger ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
      >
        <RiNotificationLine size={19} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}>
                <RiCheckDoubleLine size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <RiInboxLine size={32} />
                <p>All caught up!</p>
                <span>No recent notifications</span>
              </div>
            ) : (
              notifications.map((notif) => {
                let payload: { message?: string } = {};

                try {
                  payload = JSON.parse(notif.payload);
                } catch {
                  payload = {};
                }

                return (
                  <div 
                    key={notif.id} 
                    className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => !notif.is_read && handleMarkOneRead(notif.id)}
                  >
                    <div className="notif-icon-box">
                      {getIcon(notif.event_type)}
                    </div>
                    <div className="notif-content">
                      <p className="notif-msg">{payload.message || 'New system event'}</p>
                      <div className="notif-meta">
                        <RiTimeLine size={11} />
                        <span>{timeAgo(new Date(notif.created_at))}</span>
                      </div>
                    </div>
                    {!notif.is_read && <div className="unread-dot" />}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <span>Showing last 20 events</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .notif-wrapper { position: relative; }
        .notif-trigger {
          width: 38, height: 38; border-radius: 10px; border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.03); cursor: pointer; color: var(--color-text-muted);
          display: flex; alignItems: center; justifyContent: center;
          transition: all 0.2s; position: relative; padding: 8px;
        }
        .notif-trigger:hover, .notif-trigger.active {
          background: rgba(255,255,255,0.06); color: var(--color-primary);
          border-color: var(--color-primary-glow);
          box-shadow: 0 0 15px var(--color-primary-dim);
        }
        .notif-badge {
          position: absolute; top: -5px; right: -5px;
          background: #EF4444; color: #fff; font-size: 0.65rem; font-weight: 800;
          min-width: 16px; height: 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--color-bg);
        }
        .notif-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 320px; z-index: 100;
          background: var(--color-bg-card); border: 1px solid var(--color-border);
          border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          overflow: hidden; animation: fadeUp 0.2s ease;
        }
        .notif-header {
          padding: 16px; border-bottom: 1px solid var(--color-border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .notif-header h3 { font-size: 0.95rem; font-weight: 700; color: var(--color-text); margin: 0; }
        .notif-header button {
          background: none; border: none; color: var(--color-primary); font-size: 0.75rem;
          font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;
        }
        .notif-list { max-height: 400px; overflow-y: auto; }
        .notif-item {
          padding: 14px 16px; display: flex; gap: 14px; cursor: pointer;
          transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03);
          position: relative;
        }
        .notif-item:hover { background: rgba(255,255,255,0.04); }
        .notif-item.unread { background: rgba(255,255,255,0.02); }
        .notif-icon-box { flex-shrink: 0; margin-top: 2px; }
        :global(.notif-icon) { font-size: 1.1rem; }
        :global(.notif-icon.balance) { color: #10B981; }
        :global(.notif-icon.security) { color: #F59E0B; }
        :global(.notif-icon.settings) { color: #3B82F6; }
        :global(.notif-icon.info) { color: var(--color-text-faint); }
        .notif-content { flex: 1; min-width: 0; }
        .notif-msg {
          font-size: 0.85rem; color: var(--color-text-muted); margin: 0 0 4px 0;
          line-height: 1.4; font-weight: 500;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .notif-item.unread .notif-msg { color: var(--color-text); font-weight: 600; }
        .notif-meta { display: flex; align-items: center; gap: 4px; color: var(--color-text-faint); font-size: 0.7rem; }
        .unread-dot {
          position: absolute; right: 12px; top: 12px;
          width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);
          box-shadow: 0 0 5px var(--color-primary);
        }
        .notif-empty { padding: 40px 20px; text-align: center; color: var(--color-text-faint); }
        .notif-empty p { font-size: 0.9rem; font-weight: 600; color: var(--color-text-muted); margin: 8px 0 2px 0; }
        .notif-empty span { font-size: 0.75rem; }
        .notif-footer {
          padding: 10px; background: rgba(0,0,0,0.1); text-align: center;
          font-size: 0.7rem; color: var(--color-text-faint); font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
