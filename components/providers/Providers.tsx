'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import ToastContainer from '@/components/ui/ToastContainer';
import SessionManager from '@/components/ui/SessionManager';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <SessionManager />
        <ToastContainer />
        {children}
      </AuthProvider>
    </ReactQueryProvider>
  );
};

export default React.memo(Providers);
