'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type GlobalIframeState = {
  visible: boolean;
  src: string;
};

type GlobalIframeContextValue = {
  iframeState: GlobalIframeState;
  showIframe: (src: string) => void;
  hideIframe: () => void;
};

const GlobalIframeContext = createContext<GlobalIframeContextValue | undefined>(undefined);

export function GlobalIframeProvider({ children }: { children: ReactNode }) {
  const [iframeState, setIframeState] = useState<GlobalIframeState>({
    visible: false,
    src: '',
  });

  const showIframe = useCallback((src: string) => {
    setIframeState({ visible: true, src });
  }, []);

  const hideIframe = useCallback(() => {
    setIframeState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <GlobalIframeContext.Provider value={{ iframeState, showIframe, hideIframe }}>
      {children}
    </GlobalIframeContext.Provider>
  );
}

export function useGlobalIframe() {
  const context = useContext(GlobalIframeContext);
  if (!context) {
    throw new Error('useGlobalIframe must be used within GlobalIframeProvider');
  }
  return context;
}
