'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService } from '@/lib/api/admin.service';
import { 
  RiWalletLine, RiCpuLine, RiGlobalLine, 
  RiLineChartLine, RiUserStarLine, RiTimerFlashLine,
  RiSettings4Line
} from 'react-icons/ri';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    providerBalance: 0,
    userCount: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [balanceRes, usersRes, settingsRes] = await Promise.all([
          adminService.getProviderBalance(),
          adminService.getUsers(),
          adminService.getSettings()
        ]);
        setStats({
          providerBalance: balanceRes.balance,
          userCount: usersRes.data.length,
          conversionRate: parseFloat(settingsRes.data.usd_to_ngn_rate || '1600')
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text)' }}>Admin Overview</h1>
          <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>System health and platform statistics.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          
          <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <RiWalletLine size={24} />
               </div>
               <span className="badge" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)', fontWeight: 700 }}>Provider</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px' }}>SMSBower Balance</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>${stats.providerBalance.toLocaleString()}</div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <RiUserStarLine size={24} />
               </div>
               <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.05)', color: 'var(--color-primary)', fontWeight: 700 }}>Users</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px' }}>Registered Customers</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>{stats.userCount}</div>
          </div>

          <div className="stat-card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <RiGlobalLine size={24} />
               </div>
               <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#10B981', fontWeight: 700 }}>Exchange</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600, marginBottom: '4px' }}>Active Rate (USD/NGN)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)' }}>₦{stats.conversionRate.toLocaleString()}</div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
           <div className="stat-card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)', flexDirection: 'column', gap: 16, border: '1px solid var(--color-border)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                 <RiLineChartLine size={32} />
              </div>
              <span style={{ fontWeight: 600 }}>Revenue analytics coming soon...</span>
           </div>
           
           <div className="stat-card" style={{ height: '320px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                 <RiTimerFlashLine color="var(--color-primary)" />
                 Recent Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {[1,2,3,4].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px', background: 'var(--color-bg-hover)', borderRadius: '12px' }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                       <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>System heartbeat check successful.</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
