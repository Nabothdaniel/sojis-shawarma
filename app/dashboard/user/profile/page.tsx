'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { useAppStore } from '@/store/appStore';

export default function ProfilePage() {
  const { user, login } = useAppStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    login({ ...user, name: form.name, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      <Topbar title="Profile" />
      <main style={{ padding: '28px', maxWidth: 700 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Profile</span>
        </div>

        <div className="stat-card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 28 }}>
            User Information
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Username
              </label>
              <input
                type="text" className="input-field"
                value={user?.username || ''} disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Name
              </label>
              <input
                name="name" type="text" className="input-field"
                value={form.name} onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Phone Number
              </label>
              <input
                name="phone" type="tel" className="input-field"
                value={form.phone} onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '14px', width: '100%', fontSize: '0.95rem', marginTop: 8 }}
            >
              {saved ? '✓ Changes Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}
