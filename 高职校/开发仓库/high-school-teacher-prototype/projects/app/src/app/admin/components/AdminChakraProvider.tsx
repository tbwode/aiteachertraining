'use client';

import type { ReactNode } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { appChakraTheme } from '@/theme/appChakraTheme';

export function AdminChakraProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider
      theme={appChakraTheme}
      resetCSS
      toastOptions={{
        defaultOptions: {
          position: 'top',
          duration: 2500,
          isClosable: true
        }
      }}
    >
      <ColorModeScript initialColorMode={appChakraTheme.config.initialColorMode} />
      {children}
    </ChakraProvider>
  );
}
