'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'i18nextLng';
const DEFAULT_LOCALE = 'zh-CN';
const adminI18n = createInstance();
const ADMIN_BASE_SECTIONS = ['layout', 'languageSwitcher', 'nav', 'common'] as const;
const ADMIN_PAGE_SECTIONS = [
  'auth',
  'home',
  'stats',
  'teaching',
  'grades',
  'base',
  'content',
  'resource'
] as const;

export const adminLocales = ['zh-CN', 'zh-Hant', 'en'] as const;
export type AdminLocale = (typeof adminLocales)[number];
export type AdminSection =
  | (typeof ADMIN_BASE_SECTIONS)[number]
  | (typeof ADMIN_PAGE_SECTIONS)[number];

type AdminI18nContextValue = {
  locale: AdminLocale;
  changeLocale: (locale: AdminLocale) => Promise<void>;
  ensureSections: (sections: AdminSection[]) => Promise<void>;
  hasLoadedSections: (sections: AdminSection[], locale?: AdminLocale) => boolean;
};

const AdminI18nContext = createContext<AdminI18nContextValue | undefined>(undefined);

let initPromise: Promise<void> | null = null;

function normalizeLocale(locale?: string | null): AdminLocale {
  const normalized = locale?.toLowerCase() || '';
  if (normalized.startsWith('en')) {
    return 'en';
  }
  if (normalized === 'zh-hant' || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) {
    return 'zh-Hant';
  }

  return DEFAULT_LOCALE;
}

function getPreferredLocale(): AdminLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || window.navigator.language);
}

function syncDocumentLanguage(locale: AdminLocale) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = locale;
}

async function ensureI18n() {
  if (!initPromise) {
    initPromise = adminI18n
      .use(initReactI18next)
      .init({
        lng: DEFAULT_LOCALE,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...adminLocales],
        defaultNS: 'admin',
        ns: ['admin'],
        resources: {},
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      })
      .then(() => undefined);
  }

  return initPromise;
}

function getSectionBundle(section: AdminSection, data: unknown) {
  return {
    [section]: data
  };
}

async function fetchAdminSection(locale: AdminLocale, section: AdminSection) {
  const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
  const response = await fetch(`${basePath}/locales/${locale}/admin-${section}.json`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {};
    }
    throw new Error(`Failed to load admin locale: ${locale}/admin-${section}`);
  }

  return response.json();
}

async function fetchCommonLocale(locale: AdminLocale) {
  const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
  const response = await fetch(`${basePath}/locales/${locale}/common.json`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {};
    }
    throw new Error(`Failed to load common locale: ${locale}/common`);
  }

  return response.json();
}

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AdminLocale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);
  const requestedSectionsRef = useRef<Set<AdminSection>>(new Set(ADMIN_BASE_SECTIONS));
  const loadedSectionsRef = useRef<Record<AdminLocale, Set<AdminSection>>>({
    'zh-CN': new Set(),
    en: new Set(),
    'zh-Hant': new Set()
  });

  const loadSection = useCallback(async (targetLocale: AdminLocale, section: AdminSection) => {
    await ensureI18n();

    if (loadedSectionsRef.current[targetLocale].has(section)) {
      return;
    }

    const data = await fetchAdminSection(targetLocale, section);
    adminI18n.addResourceBundle(targetLocale, 'admin', getSectionBundle(section, data), true, true);
    loadedSectionsRef.current[targetLocale].add(section);
  }, []);

  const loadCommonLocale = useCallback(async (targetLocale: AdminLocale) => {
    await ensureI18n();

    const data = await fetchCommonLocale(targetLocale);
    adminI18n.addResourceBundle(targetLocale, 'common', data, true, true);
  }, []);

  const ensureSections = useCallback(
    async (sections: AdminSection[]) => {
      const uniqueSections = Array.from(new Set(sections));
      uniqueSections.forEach((section) => requestedSectionsRef.current.add(section));

      await Promise.all(uniqueSections.map((section) => loadSection(locale, section)));
    },
    [loadSection, locale]
  );

  const hasLoadedSections = useCallback(
    (sections: AdminSection[], targetLocale = locale) => {
      return sections.every((section) => loadedSectionsRef.current[targetLocale].has(section));
    },
    [locale]
  );

  const changeLocale = useCallback(
    async (nextLocale: AdminLocale) => {
      const requestedSections = Array.from(requestedSectionsRef.current);
      await Promise.all(requestedSections.map((section) => loadSection(nextLocale, section)));
      await loadCommonLocale(nextLocale);
      await adminI18n.changeLanguage(nextLocale);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextLocale);
      }

      syncDocumentLanguage(nextLocale);
      setLocale(nextLocale);
    },
    [loadSection]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const preferredLocale = getPreferredLocale();

      try {
        // Load admin sections
        await Promise.all(
          ADMIN_BASE_SECTIONS.map((section) => loadSection(DEFAULT_LOCALE, section))
        );

        // Load common.json
        await loadCommonLocale(DEFAULT_LOCALE);

        if (preferredLocale !== DEFAULT_LOCALE) {
          await Promise.all(
            ADMIN_BASE_SECTIONS.map((section) => loadSection(preferredLocale, section))
          );
          await loadCommonLocale(preferredLocale);
        }

        if (!active) return;

        await adminI18n.changeLanguage(preferredLocale);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, preferredLocale);
        }

        syncDocumentLanguage(preferredLocale);
        setLocale(preferredLocale);
      } catch (error) {
        console.warn('Failed to initialize admin i18n', error);

        if (!active) return;

        await adminI18n.changeLanguage(DEFAULT_LOCALE);
        syncDocumentLanguage(DEFAULT_LOCALE);
        setLocale(DEFAULT_LOCALE);
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [loadSection]);

  const value = useMemo(
    () => ({
      locale,
      changeLocale,
      ensureSections,
      hasLoadedSections
    }),
    [changeLocale, ensureSections, hasLoadedSections, locale]
  );

  if (!isReady) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return (
    <AdminI18nContext.Provider value={value}>
      <I18nextProvider i18n={adminI18n}>{children}</I18nextProvider>
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const context = useContext(AdminI18nContext);

  if (!context) {
    throw new Error('useAdminI18n must be used within AdminI18nProvider');
  }

  return context;
}

export function useAdminPageI18n(sections: AdminSection[]) {
  const { ensureSections, hasLoadedSections, locale } = useAdminI18n();
  const sectionKey = sections.join(',');
  const [isReady, setIsReady] = useState(() => hasLoadedSections(sections, locale));

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (hasLoadedSections(sections, locale)) {
        setIsReady(true);
        return;
      }

      setIsReady(false);

      try {
        await ensureSections(sections);
      } catch (error) {
        console.warn('Failed to load admin page i18n sections', error);
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [ensureSections, hasLoadedSections, locale, sectionKey, sections]);

  return isReady;
}
