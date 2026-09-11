'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/app/components/auth/AuthProvider';
import { StudentChakraProvider } from './StudentChakraProvider';
import { StudentI18nProvider } from './StudentI18nProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StudentChakraProvider>
      <StudentI18nProvider>{children}</StudentI18nProvider>
    </StudentChakraProvider>
  );
}

export default Providers;
