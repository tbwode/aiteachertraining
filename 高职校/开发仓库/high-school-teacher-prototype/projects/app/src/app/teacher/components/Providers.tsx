'use client';

import type { ReactNode } from 'react';
import { ClickToComponent } from 'click-to-react-component';
import { TeacherChakraProvider } from './TeacherChakraProvider';
import { TeacherI18nProvider } from './TeacherI18nProvider';
import { TeacherRouteGuard } from './TeacherRouteGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TeacherChakraProvider>
      {process.env.NODE_ENV === 'development' && <ClickToComponent editor="vscode" />}
      <TeacherI18nProvider>
        <TeacherRouteGuard>{children}</TeacherRouteGuard>
      </TeacherI18nProvider>
    </TeacherChakraProvider>
  );
}

export default Providers;
