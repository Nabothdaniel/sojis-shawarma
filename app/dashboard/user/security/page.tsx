'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api/user.service';
import { 
  RiShieldKeyholeLine, RiWhatsappLine, RiHistoryLine, RiAlertLine, 
  RiCheckLine, RiFileCopyLine, RiArrowRightLine 
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
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);

  useEffect(() => {
    fetchSecurityInfo();
  }, []);

  const fetchSecurityInfo = async () => {
    try {
      const res = await userService.getSecurityInfo();
      if (res.data.status === 'success') {
        setSecurityInfo(res.data.data);
        if (!res.data.data.recovery_key_saved) {
          setWarningModalOpen(true);
        }
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

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure? This will invalidate your old recovery key. Make sure to save the new one!")) return;
    
    setRegenerating(true);
    try {
      const res = await userService.regenerateRecoveryKey();
      if (res.data.status === 'success') {
        setNewRecoveryKey(res.data.data.recovery_key);
        setShowKeyModal(true);
        // Also update local state so the warning goes away once they save it
        setSecurityInfo(prev => ({ ...prev, recovery_key_saved: false }));
        if (user) login({ ...user, recovery_key_saved: false });
      }
    } catch (err) {
      addToast('Failed to regenerate key', 'error');
    } finally {
      setRegenerating(false);
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
            <div 
              className="stat-card" 
              style={{ 
                borderLeft: securityInfo.recovery_key_saved ? '4px solid #10B981' : '4px solid #F59E0B',
                cursor: !securityInfo.recovery_key_saved ? 'pointer' : 'default',
                transition: 'transform 0.2s'
              }}
              onClick={() => {
                if (!securityInfo.recovery_key_saved) setWarningModalOpen(true);
              }}
              onMouseEnter={(e) => {
                if (!securityInfo.recovery_key_saved) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
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
                  <span 
                    style={{ 
                      padding: '4px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', 
                      fontWeight: 700, animation: 'pulse 2s infinite', cursor: 'pointer' 
                    }}
                  >
                    ACTION REQUIRED
                  </span>
                )}
              </div>

              {/* The old banner is gone to be replaced by a modern modal */}

              <div style={{ padding: '12px', background: 'var(--color-bg-hover)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--color-text-faint)' }}>
                Your recovery key was shown to you during registration. If you've lost it, you can regenerate a new one below.
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate New Key'}
                </button>
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
                  style={{ padding: '12px', width: 'fit-content' }}
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

      {/* Recovery Key Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'var(--color-bg-1)', borderRadius: 24, padding: 40,
            maxWidth: 500, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border)', textAlign: 'center'
          }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: 24, background: 'rgba(245,158,11,0.1)', 
              color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <RiShieldKeyholeLine size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>New Recovery Key</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: 32 }}>
              This is your ONLY chance to save this key. If you lose it, we cannot recover it for you.
            </p>
            
            <div style={{ 
              background: 'var(--color-bg-hover)', padding: '24px', borderRadius: 16,
              border: '2px dashed var(--color-border)', marginBottom: 32,
              position: 'relative'
            }}>
              <code style={{ 
                fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', 
                color: 'var(--color-primary)', display: 'block' 
              }}>
                {newRecoveryKey}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(newRecoveryKey || '');
                  addToast('Key copied to clipboard!', 'success');
                }}
                style={{
                  marginTop: 16, background: 'none', border: 'none', 
                  color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, margin: '16px auto 0'
                }}
              >
                <RiFileCopyLine /> Copy Key
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '14px' }}
                onClick={() => {
                  markKeyAsSaved();
                  setShowKeyModal(false);
                }}
              >
                I have saved it securely
              </button>
              <button 
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close (I'll do it later)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Recovery Key Warning Modal */}
      {warningModalOpen && !securityInfo.recovery_key_saved && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9000, padding: 20
        }}>
          <div style={{
            background: 'var(--color-bg-1)', borderRadius: 32, padding: '48px 40px',
            maxWidth: 550, width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Visual background element */}
            <div style={{
              position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px',
              background: 'radial-gradient(circle, var(--color-primary-dim) 0%, transparent 70%)',
              opacity: 0.5, pointerEvents: 'none'
            }} />

            <div style={{ 
              width: 90, height: 90, borderRadius: 28, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px', boxShadow: '0 12px 24px rgba(245,158,11,0.3)'
            }}>
              <RiShieldKeyholeLine size={44} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 16, color: 'var(--color-text)' }}>Account Security Risk</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: 36 }}>
              You haven't confirmed saving your <strong style={{ color: '#F59E0B' }}>Recovery Key</strong>. 
              If you ever lose access to your account or forget your password, this key is the 
              <strong> only way</strong> to regain access.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%', padding: '18px', fontSize: '1rem', fontWeight: 800,
                  background: 'linear-gradient(to right, #F59E0B, #D97706)',
                  border: 'none', borderRadius: 16, cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(217, 119, 6, 0.2)'
                }}
                onClick={() => {
                  markKeyAsSaved();
                  setWarningModalOpen(false);
                }}
              >
                I have saved it securely
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleRegenerateKey}
                  style={{ 
                    flex: 1, padding: '14px', background: 'var(--color-bg-hover)', 
                    border: '1px solid var(--color-border)', borderRadius: 16,
                    color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Regenerate New Key
                </button>
                <button 
                  onClick={() => setWarningModalOpen(false)}
                  style={{ 
                    flex: 1, padding: '14px', background: 'transparent', 
                    border: 'none', color: 'var(--color-text-faint)', 
                    fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </DashboardLayout>
  );
}
