import React from 'react';

/**
 * Standard content wrapper component for admin dashboard panels.
 * Provides consistent rounding, padding, background, and borders.
 */
export function AdminSection({ children, className = '', ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-[32px] bg-white p-6 md:p-8 shadow-sm border border-outline-variant/10 ${className}`} {...props}>
      {children}
    </section>
  );
}

/**
 * Page level header standardizing titles, subtitles, and global action layouts
 */
export function AdminPageHeader({
  label,
  title,
  subtitle,
  children
}: {
  label?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
      <div>
        {label && <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">{label}</p>}
        <h1 className="font-headline text-3xl font-bold mt-1">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-outline max-w-2xl">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          {children}
        </div>
      )}
    </header>
  );
}
