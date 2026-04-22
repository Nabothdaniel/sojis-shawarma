'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RiArrowRightLine, RiArrowLeftLine, RiCheckLine, RiShieldKeyholeLine, RiFileCopyLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const QUESTIONS = [
  {
    id: 'services',
    question: 'Which services are you most interested in?',
    options: ['WhatsApp', 'Telegram', 'Instagram', 'Google/Gmail', 'Payment Platforms', 'Other'],
    multiple: true
  },
  {
    id: 'volume',
    question: 'What is your expected monthly OTP volume?',
    options: ['1-10', '10-50', '50-200', '200+', 'Just testing'],
    multiple: false
  },
  {
    id: 'discovery',
    question: 'How did you hear about BamzySMS?',
    options: ['Google Search', 'Social Media', 'Friend/Referral', 'Advertisement', 'Other'],
    multiple: false
  }
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const key = searchParams.get('key');
    if (key) {
      setRecoveryKey(key);
      setCurrentStep(-1); // Special step for recovery key
    }
  }, [searchParams]);

  const handleSelect = (option: string) => {
    const q = QUESTIONS[currentStep];
    if (q.multiple) {
      const current = answers[q.id] || [];
      const updated = current.includes(option) 
        ? current.filter((o: string) => o !== option)
        : [...current, option];
      setAnswers({ ...answers, [q.id]: updated });
    } else {
      setAnswers({ ...answers, [q.id]: option });
    }
  };

  const next = () => {
    if (currentStep === -1) {
      if (!keySaved) {
        addToast('Please confirm you have saved your recovery key.', 'error');
        return;
      }
      setCurrentStep(0);
      return;
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finish();
    }
  };

  const skip = () => finish();
  const finish = () => router.push('/dashboard');

  const copyKey = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
      addToast('Recovery key copied to clipboard!', 'success');
      setKeySaved(true);
    }
  };

  if (currentStep === -1 && recoveryKey) {
    return (
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 'var(--radius-xl)', padding: '40px', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--color-primary-dim)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <RiShieldKeyholeLine size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Your Recovery Key</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Since we don&apos;t use email, this key is the <strong>only way</strong> to recover your account if you forget your password.
          </p>
        </div>

        <div style={{ background: 'var(--color-bg-hover)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24, textAlign: 'center', position: 'relative' }}>
          <code style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.1em' }}>{recoveryKey}</code>
          <button onClick={copyKey} style={{ position: 'absolute', right: 12, bottom: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', color: 'var(--color-text)' }}>
            <RiFileCopyLine size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 40 }}>
          <input 
            type="checkbox" 
            id="saved" 
            checked={keySaved} 
            onChange={(e) => setKeySaved(e.target.checked)}
            style={{ marginTop: 4, width: 18, height: 18, cursor: 'pointer' }} 
          />
          <label htmlFor="saved" style={{ fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600, lineHeight: 1.4 }}>
            I have saved this key in a safe place and understand that without it, my account cannot be recovered.
          </label>
        </div>

        <button onClick={next} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1rem' }}>
          Continue <RiArrowRightLine size={18} />
        </button>
      </div>
    );
  }

  const q = QUESTIONS[currentStep] || QUESTIONS[0];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 'var(--radius-xl)', padding: '40px', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          <span>Step {currentStep + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'var(--color-border)', borderRadius: 10 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{q.question}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: '0.95rem' }}>
        {q.multiple ? 'Select all that apply' : 'Select one option'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {q.options.map((option) => {
          const isSelected = q.multiple 
            ? (answers[q.id] || []).includes(option)
            : answers[q.id] === option;
          
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              style={{
                padding: '16px 20px', textAlign: 'left', borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-dim)' : 'transparent',
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              {option}
              {isSelected && <RiCheckLine size={20} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button onClick={skip} style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
          Skip for now
        </button>
        <button disabled={!answers[q.id] || answers[q.id].length === 0} onClick={next} className="btn-primary" style={{ flex: 1, padding: '16px', fontSize: '1rem' }}>
          {currentStep === QUESTIONS.length - 1 ? 'Get Started' : 'Continue'} <RiArrowRightLine size={18} />
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Link href="/" className="go-back-btn">
        <RiArrowLeftLine size={18} /> Exit Onboarding
      </Link>
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardingContent />
      </Suspense>
    </main>
  );
}
