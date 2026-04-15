'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/api/admin.service';
import {
  RiWalletLine, RiCpuLine,
  RiLineChartLine, RiUserStarLine, RiTimerFlashLine,
  RiQuestionLine
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import Tooltip from '@/components/ui/Tooltip';
import { formatMoney, formatNumber } from '@/lib/utils';

export default function AdminDashboard() {
  const { addToast, hasHydrated, user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [providerStatus, setProviderStatus] = useState<{ status: string, error?: string } | null>(null);
  const canLoadAdminData = hasHydrated && user?.role === 'admin';

  const fetchData = useCallback(async () => {
    if (!canLoadAdminData) return;

    try {
      setLoading(true);
      const results = await Promise.allSettled([
        adminService.getProviderBalance(),
        adminService.getSettings(),
        adminService.getAnalytics(),
        adminService.getProviderStatus()
      ]);

      const [balanceRes, settingsRes, analyticsRes, statusRes] = results;

      // Handle Settings
      if (settingsRes.status === 'fulfilled') {
        setGlobalSettings(settingsRes.value.data);
      }

      // Handle Analytics
      if (analyticsRes.status === 'fulfilled') {
        const data = analyticsRes.value.data;
        setStats((prev: any) => ({
          ...prev,
          revenue: data.totals.revenue,
          orders: data.totals.orders,
          successRate: data.totals.success_rate,
          users: data.totals.users,
          daily: data.daily
        }));
      }

      // Handle Provider Balance
      if (balanceRes.status === 'fulfilled') {
        setStats((prev: any) => ({
          ...prev,
          providerBalance: balanceRes.value.balance
        }));
      } else {
        addToast('Could not fetch SMSBower balance', 'error');
      }

      // Handle Provider Status
      if (statusRes.status === 'fulfilled') {
        setProviderStatus({
          status: statusRes.value.data.provider,
          error: statusRes.value.data.error
        });
      }

      // Handle conversion rate from settings if fulfilled
      if (settingsRes.status === 'fulfilled') {
        setStats((prev: any) => ({
          ...prev,
          conversionRate: parseFloat(settingsRes.value.data.usd_to_ngn_rate || '1600')
        }));
      }

    } catch (err) {
      console.error(err);
      addToast('Critical error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, canLoadAdminData]);

  useEffect(() => {
    if (!canLoadAdminData) return;
    fetchData();
  }, [fetchData, canLoadAdminData]);

  const maxDaily = stats?.daily?.length ? Math.max(...stats.daily.map((d: any) => parseFloat(d.daily_revenue))) : 0;

  return (
    <AdminLayout>
      <div className="admin-content" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text)' }}>Admin Overview</h1>
            <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>System health and platform statistics.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {providerStatus && (
              <div
                title={providerStatus.error}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '12px',
                  background: providerStatus.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: providerStatus.status === 'online' ? '#10B981' : '#EF4444',
                  fontSize: '0.8rem', fontWeight: 700, border: '1px solid currentColor'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', animation: providerStatus.status === 'online' ? 'pulse 2s infinite' : 'none' }} />
                Provider: {providerStatus.status === 'online' ? 'Online' : 'Timed Out'}
              </div>
            )}
            <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 12px' }}>
              <RiTimerFlashLine size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>

              {/* Provider Balance */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <RiWalletLine size={24} />
                  </div>
                  <span className="badge" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)', fontWeight: 700 }}>Provider</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  SMSBower Balance
                  <Tooltip content="The live USD balance available with your upstream provider for buying activations.">
                    <span style={{ display: 'inline-flex', color: 'var(--color-text-faint)', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                  </Tooltip>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {formatMoney(stats?.providerBalance, 'USD')}
                </div>
              </div>

              {/* Total Revenue */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <RiLineChartLine size={24} />
                  </div>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#10B981', fontWeight: 700 }}>Revenue</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Total Sales (NGN)
                  <Tooltip content="Gross revenue collected from completed purchases before you analyze per-service margins.">
                    <span style={{ display: 'inline-flex', color: 'var(--color-text-faint)', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                  </Tooltip>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>{formatMoney(stats?.revenue)}</div>
              </div>

              {/* Success Rate */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                    <RiCpuLine size={24} />
                  </div>
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.05)', color: '#F59E0B', fontWeight: 700 }}>Efficiency</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Activation Success Rate
                  <Tooltip content="The share of activation requests that ended successfully instead of failing, timing out, or being cancelled.">
                    <span style={{ display: 'inline-flex', color: 'var(--color-text-faint)', cursor: 'help' }}><RiQuestionLine size={14} /></span>
                  </Tooltip>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>{stats?.successRate || '0'}%</div>
              </div>

              {/* User Count */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <RiUserStarLine size={24} />
                  </div>
                  <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.05)', color: 'var(--color-primary)', fontWeight: 700 }}>Growth</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px' }}>Total Customers</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>{stats?.users || '0'}</div>
              </div>

            </div>

            <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              {/* Revenue Chart */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RiLineChartLine color="var(--color-primary)" />
                  Revenue Trend (Last 7 Days)
                </h3>

                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px 20px', minHeight: '200px', overflowX: 'auto' }}>
                  {!stats?.daily?.length ? (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)', fontSize: '0.9rem' }}>
                      No sales data found for the last 7 days.
                    </div>
                  ) : (
                    stats.daily.map((d: any, i: number) => {
                      const height = maxDaily > 0 ? (parseFloat(d.daily_revenue) / maxDaily) * 100 : 0;
                      return (
                        <div key={i} style={{ flex: 1, minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: '100%',
                            height: `${Math.max(height, 5)}%`,
                            minHeight: '4px',
                            background: 'linear-gradient(to top, var(--color-primary), var(--color-secondary))',
                            borderRadius: '6px 6px 2px 2px',
                            position: 'relative',
                            transition: 'height 1s ease-out'
                          }}>
                            <div className="chart-tooltip" style={{
                              position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                              background: '#000', color: '#fff', fontSize: '0.65rem', padding: '4px 6px',
                              borderRadius: '4px', whiteSpace: 'nowrap', opacity: 0, transition: 'opacity 0.2s',
                              pointerEvents: 'none', fontWeight: 700
                            }}>
                              {formatMoney(parseFloat(d.daily_revenue))}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', fontWeight: 700 }}>
                            {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Recent Activity Mini-log */}
              <div className="stat-card" style={{ border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RiTimerFlashLine color="var(--color-primary)" />
                  Sales Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>Activations</span>
                      <span>{stats?.orders || '0'} total</span>
                    </div>
                    <div style={{ height: 6, width: '100%', background: 'var(--color-bg-hover)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${stats?.successRate || 0}%`, background: '#10B981', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 500 }}>Global Default Rate: {formatNumber(stats?.conversionRate || 0)} NGN/USD</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 500 }}>Active Multiplier: {Number(globalSettings?.price_markup_multiplier || 1.5).toFixed(2)}x (Global)</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .stat-card:hover .chart-tooltip { opacity: 1 !important; }
        
        @media (max-width: 1024px) {
          .admin-content {
            padding: 20px 16px !important;
          }
          .charts-section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
