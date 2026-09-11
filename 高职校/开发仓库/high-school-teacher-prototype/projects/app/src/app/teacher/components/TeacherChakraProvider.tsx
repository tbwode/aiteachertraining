'use client';

import type { ReactNode } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appChakraTheme } from '@/theme/appChakraTheme';

export function TeacherChakraProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={appChakraTheme} resetCSS>
      <ColorModeScript initialColorMode={appChakraTheme.config.initialColorMode} />
      {children}
    </ChakraProvider>
  );
}
