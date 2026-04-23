'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';

export default function AdminLogin() {
  const router = useRouter();
  const { login, addToast } = useAppStore();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.status === 'success') {
        login(data.user, data.token);
        addToast('Welcome back, Admin', 'success');
        router.push('/admin');
      } else {
        addToast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      addToast('Backend not responding', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-background text-4xl">admin_panel_settings</span>
          </div>
          <h1 className="font-headline font-bold text-2xl">Admin Terminal</h1>
          <p className="text-outline font-body text-sm">Secure access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
             <input 
               required
               type="text" 
               placeholder="Username" 
               className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
               value={formData.username}
               onChange={(e) => setFormData({...formData, username: e.target.value})}
             />
          </div>
          <div className="relative group">
             <input 
               required
               type="password" 
               placeholder="Password" 
               className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
               value={formData.password}
               onChange={(e) => setFormData({...formData, password: e.target.value})}
             />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-on-surface text-surface font-headline font-bold py-4 rounded-full shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-3 disabled:opacity-50"
          >
            {isLoading ? 'Decrypting...' : 'Sign In'}
            {!isLoading && <span className="material-symbols-outlined">login</span>}
          </button>
        </form>
        
        <button 
          onClick={() => router.push('/')}
          className="w-full mt-6 text-outline font-label text-xs uppercase tracking-widest hover:text-primary transition-colors"
        >
          Back to Store
        </button>
      </div>
    </div>
  );
}
