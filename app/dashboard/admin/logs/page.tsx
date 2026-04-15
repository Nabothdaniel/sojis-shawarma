'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/api/admin.service';
import { useAppStore } from '@/store/appStore';
import { RiHistoryLine, RiRefreshLine, RiUserLine, RiPulseLine } from 'react-icons/ri';

export default function AdminLogsPage() {
  const { addToast, hasHydrated, user } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canLoadAdminData = hasHydrated && user?.role === 'admin';

  const fetchLogs = useCallback(async () => {
    if (!canLoadAdminData) return;
    setLoading(true);
    try {
      const res = await adminService.getSystemLogs();
      setLogs(res.data);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, canLoadAdminData]);

  useEffect(() => {
    if (!canLoadAdminData) return;
    fetchLogs();
  }, [fetchLogs, canLoadAdminData]);

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return (
        <pre style={{ 
          fontSize: '0.72rem', 
          margin: '8px 0 0', 
          color: 'var(--color-text-muted)',
          background: 'var(--color-bg-hover)',
          padding: '12px',
          borderRadius: '10px',
          overflowX: 'auto',
          border: '1px solid var(--color-border)',
          fontFamily: 'monospace'
        }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{details}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="admin-content" style={{ padding: '32px' }}>
        <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiPulseLine size={24} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>System Audit Logs</h1>
            </div>
            <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>Real-time tracking of platform activities and security events.</p>
          </div>
          <button 
            className="btn-primary refresh-btn" 
            onClick={fetchLogs}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
          >
            <RiRefreshLine size={18} /> Refresh Activity
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-faint)' }}>
            <div className="spinner" style={{ margin: '0 auto 24px', width: '40px', height: '40px', border: '3px solid var(--color-primary-glow)', borderTopColor: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Sychronizing Audit Trail...</p>
          </div>
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg-hover)' }}>
                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Timestamp</th>
                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Initiator</th>
                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Operation</th>
                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Data payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '80px', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                        <RiHistoryLine size={56} style={{ opacity: 0.1, marginBottom: 20 }} />
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No activity records found.</div>
                        <p style={{ fontSize: '0.9rem', marginTop: 8 }}>The audit trail is currently empty.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="log-row">
                        <td style={{ padding: '20px 24px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 700 }}>
                               {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                             <span style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
                               {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                             </span>
                           </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                               width: 38, height: 38, borderRadius: 10, 
                               background: log.user_name ? 'var(--color-primary-dim)' : 'rgba(0,0,0,0.05)', 
                               display: 'flex', alignItems: 'center', justifyContent: 'center', 
                               color: log.user_name ? 'var(--color-primary)' : 'var(--color-text-faint)',
                               border: '1px solid currentColor', opacity: 0.7
                            }}>
                              <RiUserLine size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>{log.user_name || 'System Engine'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>{log.user_username ? `@${log.user_username}` : 'CORE_SERVICE'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ 
                            padding: '6px 14px', 
                            borderRadius: '8px', 
                            fontSize: '0.65rem', 
                            fontWeight: 900, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            background: log.action.includes('error') ? 'rgba(239,68,68,0.1)' : 'var(--color-primary-dim)',
                            color: log.action.includes('error') ? '#EF4444' : 'var(--color-primary)',
                            border: `1.5px solid currentColor`,
                            opacity: 0.9
                          }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {formatDetails(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <style jsx>{`
          .log-row:hover { background: var(--color-bg-hover); }
          @media (max-width: 1024px) {
            .admin-content {
              padding: 20px 16px !important;
            }
            .admin-header {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 20px;
            }
            .refresh-btn {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
