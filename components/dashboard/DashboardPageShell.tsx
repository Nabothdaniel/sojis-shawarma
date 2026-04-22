'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';

export interface DashboardBreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardPageShellProps {
  title: string;
  children: React.ReactNode;
  breadcrumbs?: DashboardBreadcrumbItem[];
  maxWidth?: number;
  contentStyle?: React.CSSProperties;
}

export default function DashboardPageShell({
  title,
  children,
  breadcrumbs,
  maxWidth = 1000,
  contentStyle,
}: DashboardPageShellProps) {
  return (
    <DashboardLayout>
      <Topbar title={title} />
      <main
        style={{
          padding: '28px',
          maxWidth,
          margin: '0 auto',
          ...contentStyle,
        }}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            className="breadcrumb"
            style={{
              marginBottom: 24,
              fontSize: '0.85rem',
              color: 'var(--color-text-faint)',
              display: 'flex',
              gap: 8,
              fontWeight: 600,
              flexWrap: 'wrap',
            }}
          >
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  {item.href && !isLast ? (
                    <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {item.label}
                    </Link>
                  ) : (
                    <span style={isLast ? { color: 'var(--color-primary)' } : undefined}>{item.label}</span>
                  )}
                  {!isLast && <span>/</span>}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {children}
      </main>
    </DashboardLayout>
  );
}
