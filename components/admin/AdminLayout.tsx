'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen } from '@/components/ui/AdminSkeletons';
import { AdminGlobalSearch } from './AdminGlobalSearch';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { authLoading, isAdmin, user } = useAdminGuard();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (authLoading) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) {
    return null;
  }

  const navLinks = [
    { href: '/admin', label: 'Home Dashboard', icon: 'dashboard', id: 'tour-nav-home' },
    { href: '/admin/orders', label: 'Order Desk', icon: 'receipt_long', id: 'tour-nav-orders' },
    { href: '/admin/products', label: 'Menu Items', icon: 'fastfood', id: 'tour-nav-products' },
    { href: '/admin/categories', label: 'Categories', icon: 'category' },
    { href: '/admin/reviews', label: 'Reviews', icon: 'star' },
    { href: '/admin/analytics', label: 'Sales Performance', icon: 'analytics', id: 'tour-nav-sales' },
    { href: '/admin/config', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="flex h-screen bg-surface text-on-surface antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-surface-container-low z-50 flex flex-col gap-2 py-8 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <div className="px-8 mb-8 flex flex-col items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline font-bold text-2xl shadow-sm">
            S
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Store Admin</h2>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-outline mt-1">Soji&apos;s Shawarma</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto w-full no-scrollbar px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href}
                id={link.id}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-full font-label text-sm font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto">
          <div className="w-full bg-surface-container-highest rounded-3xl p-5 flex items-center gap-4">
            <span className="material-symbols-outlined text-outline">account_circle</span>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-bold text-on-surface truncate">{user?.name || user?.username || 'Admin'}</p>
              <p className="font-body text-xs text-outline capitalize">{user?.role || 'operator'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72 h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-20 w-full border-b border-outline-variant/15">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 text-on-surface hover:text-primary transition-colors lg:hidden rounded-full hover:bg-surface-container-high"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <AdminGlobalSearch />
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <Link href="/cart" className="p-2 text-outline hover:text-primary transition-colors relative rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined">shopping_bag</span>
            </Link>
            <Link href="/admin/orders" className="p-2 text-outline hover:text-primary transition-colors relative rounded-full hover:bg-surface-container-low hidden sm:block">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </Link>
            <Link href="/" className="ml-2 bg-on-surface text-surface font-label text-[10px] uppercase font-bold tracking-widest px-5 py-2.5 rounded-full hover:bg-primary hover:text-on-primary transition-colors shadow-sm hidden sm:block">
              View Store
            </Link>
          </div>
        </header>

        {/* Dashboard Canvas (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
