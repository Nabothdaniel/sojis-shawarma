'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService, AdminSettings } from '@/lib/api/admin.service';
import { useAppStore } from '@/store/appStore';
import { RiSettings4Line, RiSave3Line, RiInformationLine, RiPulseLine } from 'react-icons/ri';

export default function AdminSettingsPage() {
  const { addToast } = useAppStore();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getSettings()
      .then(res => setSettings(res.data))
      .catch(() => addToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await adminService.updateSettings(settings);
      addToast('Global settings updated successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) return <AdminLayout><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-content" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px' }}>Global Settings</h1>
          <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>Configure platform-wide financial rules and provider connectivity.</p>
        </div>

        <form onSubmit={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            
            {/* FINANCIAL CONFIGURATION */}
            <div className="stat-card" style={{ padding: '32px', background: 'var(--color-bg-2)', border: '1px solid #333', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <RiPulseLine size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Financial Parameters</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="label-style">Global Price Markup (e.g. 1.5)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" step="0.01" className="high-contrast-input"
                      value={settings?.price_markup_multiplier || ''}
                      onChange={(e) => handleChange('price_markup_multiplier', e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontWeight: 700 }}>x</span>
                  </div>
                  <p className="helper-text">Applied to base cost if no service override exists.</p>
                </div>

                <div>
                  <label className="label-style">USD to NGN Exchange Rate</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>₦</span>
                    <input 
                      type="number" className="high-contrast-input" style={{ paddingLeft: '34px' }}
                      value={settings?.usd_to_ngn_rate || ''}
                      onChange={(e) => handleChange('usd_to_ngn_rate', e.target.value)}
                    />
                  </div>
                  <p className="helper-text">Our system-wide conversion rate for all provider costs.</p>
                </div>
              </div>
            </div>

            {/* PLATFORM NOTIFICATIONS */}
            <div className="stat-card" style={{ padding: '32px', background: 'var(--color-bg-2)', border: '1px solid #333', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <RiInformationLine size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Notification System</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="label-style">Admin Alert Email</label>
                  <input 
                    type="email" className="high-contrast-input"
                    value={settings?.admin_email_notifications || ''}
                    onChange={(e) => handleChange('admin_email_notifications', e.target.value)}
                    placeholder="admin@example.com"
                  />
                  <p className="helper-text">Where to send platform alerts and critical logs.</p>
                </div>

                <div style={{ 
                  marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '12px', border: '1px dashed #333', fontSize: '0.8rem', color: 'var(--color-text-faint)' 
                }}>
                  <RiInformationLine style={{ marginBottom: -3, marginRight: 6 }} color="var(--color-primary)" />
                  API Keys and Provider Credentials are managed via secure environment variables.
                </div>
              </div>
            </div>

          </div>

          <div style={{ 
            marginTop: '32px', display: 'flex', justifyContent: 'flex-end', 
            paddingTop: '24px', borderTop: '1px solid #333', position: 'sticky', bottom: '24px' 
          }}>
            <button 
              type="submit" className="btn-primary" disabled={saving}
              style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: '12px', fontSize: '1rem', boxShadow: '0 10px 20px rgba(0, 229, 255, 0.2)' }}
            >
              {saving ? 'Processing...' : <><RiSave3Line size={20} /> Deploy All Settings</>}
            </button>
          </div>
        </form>

        <style jsx>{`
          .high-contrast-input {
            width: 100%;
            background: transparent !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 12px;
            padding: 14px 16px;
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            outline: none;
            transition: all 0.2s;
          }
          .high-contrast-input:focus {
            border-color: var(--color-primary) !important;
            box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
          }
          .label-style {
            display: block;
            font-size: 0.85rem;
            font-weight: 700;
            color: rgba(255,255,255,0.7);
            margin-bottom: 10px;
          }
          .helper-text {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            margin-top: 8px;
            font-weight: 500;
          }
          @media (max-width: 1024px) {
            .admin-content { padding: 20px 16px !important; }
            form > div { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
