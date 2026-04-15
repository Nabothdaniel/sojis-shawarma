'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminService, AdminUser } from '@/lib/api/admin.service';
import { useAppStore } from '@/store/appStore';
import { RiSearchLine, RiPhoneLine, RiWalletLine, RiTimeLine } from 'react-icons/ri';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatMoney } from '@/lib/utils';

export default function AdminUsersPage() {
  const { addToast, hasHydrated, user } = useAppStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hasHydrated || user?.role !== 'admin') return;

    const fetchUsers = async () => {
      try {
        const res = await adminService.getUsers();
        setUsers(res.data);
      } catch (err: any) {
        addToast('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [addToast, hasHydrated, user?.role]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="admin-content" style={{ padding: '32px' }}>
        <div className="admin-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text)' }}>User Management</h1>
            <p style={{ color: 'var(--color-text-faint)', margin: 0, fontWeight: 500 }}>Monitor and manage registered platform users.</p>
          </div>
          <div className="search-container" style={{ position: 'relative' }}>
             <RiSearchLine style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', fontSize: '1.2rem' }} />
             <input 
               type="text" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="input-field" 
               style={{ width: '320px', padding: '12px 16px 12px 44px' }}
             />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-faint)' }}>
            <div className="spinner" style={{ margin: '0 auto 24px', width: '40px', height: '40px', border: '3px solid var(--color-primary-glow)', borderTopColor: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Accessing User Database...</p>
          </div>
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>User Profile</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Contact Details</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Wallet Balance</th>
                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Access Level</th>
                    <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Registration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>No users found matching &quot;{search}&quot;</div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="user-row">
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <UserAvatar seed={u.username || u.name || 'user'} size={44} style={{ border: '1px solid var(--color-border)' }} />
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '0.95rem' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            <RiPhoneLine size={14} />
                            {u.phone || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 900, color: 'var(--color-text)', fontSize: '1.05rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <RiWalletLine size={14} color="#10B981" />
                            </div>
                            {formatMoney(u.balance)}
                          </div>
                        </td>
                        <td style={{ padding: '18px 24px' }}>
                          <span style={{ 
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: u.role === 'admin' ? '#111827' : 'var(--color-primary-dim)', 
                            color: u.role === 'admin' ? '#fff' : 'var(--color-primary)',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            boxShadow: u.role === 'admin' ? '0 4px 10px rgba(0,0,0,0.2)' : 'none'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
                             <RiTimeLine size={16} />
                             {new Date(u.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <style jsx>{`
          .user-row:hover { background: var(--color-bg-hover) !important; }
          .spinner { animation: spin 1s linear infinite; border-radius: 50%; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @media (max-width: 1024px) {
            .admin-content {
              padding: 20px 16px !important;
            }
            .admin-header {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 20px;
            }
            .search-container {
              width: 100%;
            }
            .search-container input {
              width: 100% !important;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
