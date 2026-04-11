'use client';

import React, { useState } from 'react';
import { RiLockPasswordLine, RiCloseLine, RiInformationLine } from 'react-icons/ri';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export default function PinModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title, 
  description,
  isLoading 
}: PinModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: entry, 2: confirmation (only used in setup)
  const isSetup = title.toLowerCase().includes('set');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetup && step === 1) {
      if (pin.length === 4) setStep(2);
      return;
    }

    if (isSetup && step === 2) {
      if (pin === confirmPin) {
        onSuccess(pin);
      } else {
        // Soft reset
        setConfirmPin('');
        setStep(1);
        setPin('');
        alert("PINs do not match. Please try again.");
      }
      return;
    }

    if (pin.length === 4) {
      onSuccess(pin);
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setStep(1);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <button className="btn-ghost" onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, padding: 8, minWidth: 'auto', border: 'none' }}>
          <RiCloseLine size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 60, height: 60, borderRadius: '50%', background: 'var(--color-primary-dim)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
            margin: '0 auto 16px'
          }}>
            <RiLockPasswordLine size={30} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
            {isSetup && step === 2 ? 'Confirm Your PIN' : title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {isSetup && step === 2 ? 'Enter your 4-digit PIN again to confirm.' : description}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase' }}>
              {isSetup && step === 2 ? 'Confirm 4-Digit PIN' : 'Enter 4-Digit PIN'}
            </label>
            <input 
              type="password"
              className="input-field"
              placeholder="••••"
              maxLength={4}
              value={isSetup && step === 2 ? confirmPin : pin}
              autoFocus
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                if (isSetup && step === 2) setConfirmPin(val);
                else setPin(val);
              }}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 800 }}
            />
          </div>

          <div style={{ 
            display: 'flex', gap: 10, padding: '12px', background: 'var(--color-bg)', 
            borderRadius: 12, border: '1px solid var(--color-border)' 
          }}>
            <RiInformationLine size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
              <strong>Why am I seeing this?</strong><br />
              Your transaction PIN protects your account balance and sensitive purchase data from unauthorized access.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={pin.length !== 4 || isLoading}
            style={{ width: '100%', padding: '14px' }}
          >
            {isLoading ? 'Verifying...' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
}
