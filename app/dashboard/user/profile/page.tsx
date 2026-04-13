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
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    login({ ...user, name: form.name, email: form.email, phone: form.phone });
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

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Email
              </label>
              <input
                name="email" type="email" className="input-field"
                value={form.email} onChange={handleChange}
                placeholder="Enter your email"
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