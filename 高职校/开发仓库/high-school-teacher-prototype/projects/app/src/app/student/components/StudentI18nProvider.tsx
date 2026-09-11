'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'i18nextLng';
const DEFAULT_LOCALE = 'zh-CN';
const studentI18n = createInstance();

export const studentLocales = ['zh-CN', 'en', 'zh-Hant'] as const;
export type StudentLocale = (typeof studentLocales)[number];

type StudentI18nContextValue = {
  locale: StudentLocale;
  changeLocale: (locale: StudentLocale) => Promise<void>;
};

const StudentI18nContext = createContext<StudentI18nContextValue | undefined>(undefined);

let initPromise: Promise<void> | null = null;

function normalizeLocale(locale?: string | null): StudentLocale {
  const normalized = locale?.toLowerCase() || '';
  if (normalized.startsWith('en')) {
    return 'en';
  }
  if (normalized === 'zh-hant' || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) {
    return 'zh-Hant';
  }
  return DEFAULT_LOCALE;
}

function getPreferredLocale(): StudentLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || window.navigator.language);
}

function syncDocumentLanguage(locale: StudentLocale) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = locale;
}

async function ensureI18n() {
  if (!initPromise) {
    initPromise = studentI18n
      .use(initReactI18next)
      .init({
        lng: DEFAULT_LOCALE,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...studentLocales],
        defaultNS: 'student',
        ns: NAMESPACES,
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

// 需要加载的命名空间列表
const NAMESPACES = ['student', 'common', 'app', 'chat', 'login', 'account_team'];

async function loadNamespace(locale: StudentLocale, namespace: string) {
  if (studentI18n.hasResourceBundle(locale, namespace)) {
    return;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
  const response = await fetch(`${basePath}/locales/${locale}/${namespace}.json`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    console.warn(`Failed to load namespace: ${namespace} for locale: ${locale}`);
    return;
  }

  const data = await response.json();
  studentI18n.addResourceBundle(locale, namespace, data, true, true);
}

async function loadStudentLocale(locale: StudentLocale) {
  await ensureI18n();

  // 并行加载所有命名空间
  await Promise.all(NAMESPACES.map((ns) => loadNamespace(locale, ns)));
}

export function StudentI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<StudentLocale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  const changeLocale = useCallback(async (nextLocale: StudentLocale) => {
    await loadStudentLocale(nextLocale);
    await studentI18n.changeLanguage(nextLocale);
    await studentI18n.loadNamespaces(NAMESPACES);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    }

    syncDocumentLanguage(nextLocale);
    setLocale(nextLocale);
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const preferredLocale = getPreferredLocale();

      try {
        await loadStudentLocale(DEFAULT_LOCALE);

        if (preferredLocale !== DEFAULT_LOCALE) {
          await loadStudentLocale(preferredLocale);
        }

        if (!active) return;

        await studentI18n.changeLanguage(preferredLocale);
        await studentI18n.loadNamespaces(NAMESPACES);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, preferredLocale);
        }

        syncDocumentLanguage(preferredLocale);
        setLocale(preferredLocale);
      } catch (error) {
        console.warn('Failed to initialize student i18n', error);

        if (!active) return;

        await studentI18n.changeLanguage(DEFAULT_LOCALE);
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
  }, []);

  const value = useMemo(
    () => ({
      locale,
      changeLocale
    }),
    [changeLocale, locale]
  );

  if (!isReady) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return (
    <StudentI18nContext.Provider value={value}>
      <I18nextProvider i18n={studentI18n}>{children}</I18nextProvider>
    </StudentI18nContext.Provider>
  );
}

export function useStudentI18n() {
  const context = useContext(StudentI18nContext);

  if (!context) {
    throw new Error('useStudentI18n must be used within StudentI18nProvider');
  }

  return context;
}
