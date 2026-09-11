'use client';

import type { ReactNode } from 'react';
import { AdminChakraProvider } from './AdminChakraProvider';
import { AdminI18nProvider } from './AdminI18nProvider';
import { AdminRouteGuard } from './AdminRouteGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AdminChakraProvider>
      <AdminI18nProvider>
        <AdminRouteGuard>{children}</AdminRouteGuard>
      </AdminI18nProvider>
    </AdminChakraProvider>
  );
}

export default Providers;
