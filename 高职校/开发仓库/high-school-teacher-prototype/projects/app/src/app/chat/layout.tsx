'use client';

import type { ReactNode } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appChakraTheme } from '@/theme/appChakraTheme';
import { StudentI18nProvider } from '../student/components/StudentI18nProvider';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={appChakraTheme} resetCSS>
      <StudentI18nProvider>
        <ColorModeScript initialColorMode={appChakraTheme.config.initialColorMode} />
        {children}
      </StudentI18nProvider>
    </ChakraProvider>
  );
}
