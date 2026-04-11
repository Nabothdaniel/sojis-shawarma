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
      <div style={{ padding: '32px', maxWidth: '800px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px' }}>Global Settings</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Configure platform-wide pricing rules and exchange rates.</p>
        </div>

        <form onSubmit={handleUpdate} className="stat-card" style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                Price Markup Multiplier
                <RiInformationLine size={14} color="var(--color-primary)" />
              </label>
              <input 
                type="number" 
                step="0.01"
                className="input-field"
                value={settings?.price_markup_multiplier || ''}
                onChange={(e) => handleChange('price_markup_multiplier', e.target.value)}
                style={{ padding: '14px' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                Default: 1.5. This will multiply the raw USD cost before converting to NGN.
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                USD to NGN Exchange Rate
              </label>
              <div style={{ position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>₦</span>
                 <input 
                   type="number" 
                   className="input-field"
                   value={settings?.usd_to_ngn_rate || ''}
                   onChange={(e) => handleChange('usd_to_ngn_rate', e.target.value)}
                   style={{ padding: '14px 14px 14px 34px' }}
                 />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                Current system conversion rate. Example: 1600.
              </p>
            </div>

            <div style={{ height: '1px', background: '#1a1a1c', margin: '8px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                Admin Notification Email
              </label>
              <input 
                type="email" 
                className="input-field"
                value={settings?.admin_email_notifications || ''}
                onChange={(e) => handleChange('admin_email_notifications', e.target.value)}
                style={{ padding: '14px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
              style={{ padding: '16px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {saving ? 'Saving...' : <><RiSave3Line size={20} /> Save Platform Settings</>}
            </button>

          </div>
        </form>

        <div className="stat-card" style={{ marginTop: '24px', background: 'rgba(0, 229, 255, 0.03)', border: '1px dashed rgba(0, 229, 255, 0.2)' }}>
           <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                 <RiPulseLine size={24} />
              </div>
              <div>
                 <h4 style={{ margin: '0 0 4px' }}>System Health</h4>
                 <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>All price calculation engines are active and respecting the global multipliers.</p>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
