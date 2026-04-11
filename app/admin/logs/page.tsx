'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/api/admin.service';
import { useAppStore } from '@/store/appStore';
import { RiHistoryLine, RiRefreshLine, RiUserLine, RiInformationLine, RiPulseLine } from 'react-icons/ri';
import PageLoader from '@/components/ui/PageLoader';

export default function AdminLogsPage() {
  const { addToast } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSystemLogs();
      setLogs(res.data);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiPulseLine size={24} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>System Audit Logs</h1>
            </div>
            <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>Real-time tracking of all critical platform activities and security events.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={fetchLogs}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
          >
            <RiRefreshLine size={18} /> Refresh Activity
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-hover)' }}>
                    <th style={{ padding: '18px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Timestamp</th>
                    <th style={{ padding: '18px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Initiator</th>
                    <th style={{ padding: '18px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Operation</th>
                    <th style={{ padding: '18px 24px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-faint)' }}>Data payload</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                        <RiHistoryLine size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <div style={{ fontWeight: 600 }}>No system activity recorded yet.</div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="log-row">
                        <td style={{ padding: '24px', fontSize: '0.85rem', color: 'var(--color-text)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                              <RiUserLine size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{log.user_name || 'System Auto'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{log.user_email || 'Core Service'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '24px' }}>
                          <span style={{ 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontSize: '0.7rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            background: log.action.includes('error') ? 'rgba(239,68,68,0.1)' : 'var(--color-primary-dim)',
                            color: log.action.includes('error') ? '#EF4444' : 'var(--color-primary)',
                            border: `1px solid ${log.action.includes('error') ? 'rgba(239,68,68,0.1)' : 'var(--color-primary-glow)'}`
                          }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '24px' }}>
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
      </div>
      <style>{`
        .log-row:hover { background: var(--color-bg-hover); }
      `}</style>
    </AdminLayout>
  );
}
