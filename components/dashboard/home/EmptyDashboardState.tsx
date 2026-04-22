'use client';

import React from 'react';
import { RiInboxLine } from 'react-icons/ri';

export default function EmptyDashboardState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8 }}>
      <RiInboxLine size={32} color="var(--color-text-faint)" style={{ opacity: 0.4 }} />
      <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>{message}</p>
    </div>
  );
}
