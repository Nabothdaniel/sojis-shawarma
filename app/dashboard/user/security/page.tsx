'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api/user.service';
import { 
  RiShieldKeyholeLine, RiWhatsappLine, RiHistoryLine, 
  RiCheckLine, RiFileCopyLine, RiAlertLine,
  RiArrowRightLine
} from 'react-icons/ri';

export default function SecurityPage() {
  const { user, addToast, login } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityInfo, setSecurityInfo] = useState({
    recovery_key_saved: false,
    whatsapp_notifications: false,
    whatsapp_number: '',
    recent_verifications: [] as any[]
  });

  useEffect(() => {
    fetchSecurityInfo();
  }, []);

  const fetchSecurityInfo = async () => {
    try {
      const res = await userService.getSecurityInfo();
      if (res.data.status === 'success') {
        setSecurityInfo(res.data.data);
      }
    } catch (err) {
      addToast('Failed to load security settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateSecuritySettings({
        whatsapp_notifications: securityInfo.whatsapp_notifications,
        whatsapp_number: securityInfo.whatsapp_number
      });
      addToast('WhatsApp settings updated!', 'success');
      // Update local user store if nested
      if (user) {
        login({ 
          ...user, 
          whatsapp_notifications: securityInfo.whatsapp_notifications,
          whatsapp_number: securityInfo.whatsapp_number
        });
      }
    } catch (err) {
      addToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const markKeyAsSaved = async () => {
    try {
      await userService.confirmRecoveryKeySaved();
      setSecurityInfo(prev => ({ ...prev, recovery_key_saved: true }));
      if (user) login({ ...user, recovery_key_saved: true });
      addToast('Security status updated!', 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  return (
    <DashboardLayout>
      <Topbar title="Security & API" />
      <main style={{ padding: '28px', maxWidth: 800 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Security</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading security settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Recovery Key Card */}
            <div className="stat-card" style={{ borderLeft: securityInfo.recovery_key_saved ? '4px solid #10B981' : '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiShieldKeyholeLine size={20} /> Recovery Key Status
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Your emergency access key for when you lose your password.
                  </p>
                </div>
                {securityInfo.recovery_key_saved ? (
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: 700 }}>
                    SECURELY SAVED
                  </span>
                ) : (
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', fontWeight: 700 }}>
                    ACTION REQUIRED
                  </span>
                )}
              </div>

              {!securityInfo.recovery_key_saved && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <RiAlertLine /> You haven't confirmed saving your recovery key. If you lose your password, you might lose access to your account forever.
                  </p>
                  <button 
                    onClick={markKeyAsSaved}
                    className="btn-primary" 
                    style={{ marginTop: 12, padding: '8px 16px', fontSize: '0.8rem', background: '#F59E0B' }}
                  >
                    I have saved my key securely
                  </button>
                </div>
              )}

              <div style={{ padding: '12px', background: 'var(--color-bg-hover)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--color-text-faint)' }}>
                Your recovery key was shown to you during registration. If you've lost it, please contact support immediately while you still have access to your account.
              </div>
            </div>

            {/* WhatsApp Integration Card */}
            <div className="stat-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiWhatsappLine size={22} color="#25D366" /> WhatsApp OTP Notifications
              </h2>
              <form onSubmit={handleUpdateWhatsapp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-hover)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable WhatsApp Delivery</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Receive your login and reset codes via WhatsApp.</div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={securityInfo.whatsapp_notifications}
                      onChange={(e) => setSecurityInfo(prev => ({ ...prev, whatsapp_notifications: e.target.checked }))}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>WhatsApp Phone Number</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="+234..."
                    value={securityInfo.whatsapp_number || ''}
                    onChange={(e) => setSecurityInfo(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    disabled={!securityInfo.whatsapp_notifications}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: 8 }}>
                    Make sure the number is in international format (e.g. +2348000000000).
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={saving}
                  style={{ padding: '12px', width: 'fit-content', width: '100%' }}
                >
                  {saving ? 'Updating...' : 'Save WhatsApp Settings'}
                </button>
              </form>
            </div>

            {/* Verification History Card */}
            <div className="stat-card">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiHistoryLine size={20} /> Verification History
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                You can see your recently requested verification codes here if you're having trouble receiving them.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {securityInfo.recent_verifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-faint)', fontSize: '0.9rem' }}>
                    No recent verification attempts.
                  </div>
                ) : (
                  securityInfo.recent_verifications.map((v, i) => (
                    <div key={i} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '14px', background: 'var(--color-bg-hover)', borderRadius: 10,
                      border: '1px solid var(--color-border)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{v.type} Request</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{new Date(v.created_at).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '2px' }}>{v.otp}</code>
                        {new Date(v.expires_at) > new Date() ? (
                          <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>ACTIVE</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>EXPIRED</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>
      
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--color-primary);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </DashboardLayout>
  );
}
