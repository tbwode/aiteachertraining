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
const teacherI18n = createInstance();
const TEACHER_BASE_SECTIONS = ['layout', 'languageSwitcher', 'nav', 'subjects'] as const;
const TEACHER_PAGE_SECTIONS = [
  'auth',
  'dashboard',
  'courses',
  'students',
  'aiTeacher',
  'profile',
  'home',
  'agentPlaza',
  'workspace',
  'commonChat',
  'aiVideo'
] as const;
const TEACHER_SHARED_NAMESPACES = ['common', 'chat', 'student'] as const;

export const teacherLocales = ['zh-CN', 'zh-Hant', 'en'] as const;
export type TeacherLocale = (typeof teacherLocales)[number];
export type TeacherSection =
  | (typeof TEACHER_BASE_SECTIONS)[number]
  | (typeof TEACHER_PAGE_SECTIONS)[number];

type TeacherI18nContextValue = {
  locale: TeacherLocale;
  changeLocale: (locale: TeacherLocale) => Promise<void>;
  ensureSections: (sections: TeacherSection[]) => Promise<void>;
  hasLoadedSections: (sections: TeacherSection[], locale?: TeacherLocale) => boolean;
};

const TeacherI18nContext = createContext<TeacherI18nContextValue | undefined>(undefined);

let initPromise: Promise<void> | null = null;

function normalizeLocale(locale?: string | null): TeacherLocale {
  const normalized = locale?.toLowerCase() || '';
  if (normalized.startsWith('en')) {
    return 'en';
  }
  if (normalized === 'zh-hant' || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) {
    return 'zh-Hant';
  }

  return DEFAULT_LOCALE;
}

function getPreferredLocale(): TeacherLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || window.navigator.language);
}

function syncDocumentLanguage(locale: TeacherLocale) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = locale;
}

async function ensureI18n() {
  if (!initPromise) {
    initPromise = teacherI18n
      .use(initReactI18next)
      .init({
        lng: DEFAULT_LOCALE,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...teacherLocales],
        defaultNS: 'teacher',
        ns: ['teacher', ...TEACHER_SHARED_NAMESPACES],
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

function getSectionBundle(section: TeacherSection, data: unknown) {
  return {
    [section]: data
  };
}

async function fetchTeacherSection(locale: TeacherLocale, section: TeacherSection) {
  const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
  const response = await fetch(`${basePath}/locales/${locale}/teacher-${section}.json`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {};
    }
    throw new Error(`Failed to load teacher locale: ${locale}/teacher-${section}`);
  }

  return response.json();
}

async function fetchNamespace(
  locale: TeacherLocale,
  namespace: (typeof TEACHER_SHARED_NAMESPACES)[number]
) {
  const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
  const response = await fetch(`${basePath}/locales/${locale}/${namespace}.json`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {};
    }
    throw new Error(`Failed to load teacher namespace: ${locale}/${namespace}`);
  }

  return response.json();
}

export function TeacherI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<TeacherLocale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);
  const requestedSectionsRef = useRef<Set<TeacherSection>>(new Set(TEACHER_BASE_SECTIONS));
  const loadedSectionsRef = useRef<Record<TeacherLocale, Set<TeacherSection>>>({
    'zh-CN': new Set(),
    en: new Set(),
    'zh-Hant': new Set()
  });
  const loadedNamespacesRef = useRef<
    Record<TeacherLocale, Set<(typeof TEACHER_SHARED_NAMESPACES)[number]>>
  >({
    'zh-CN': new Set(),
    en: new Set(),
    'zh-Hant': new Set()
  });

  const loadSection = useCallback(async (targetLocale: TeacherLocale, section: TeacherSection) => {
    await ensureI18n();

    if (loadedSectionsRef.current[targetLocale].has(section)) {
      return;
    }

    const data = await fetchTeacherSection(targetLocale, section);
    teacherI18n.addResourceBundle(
      targetLocale,
      'teacher',
      getSectionBundle(section, data),
      true,
      true
    );
    loadedSectionsRef.current[targetLocale].add(section);
  }, []);

  const loadNamespace = useCallback(
    async (targetLocale: TeacherLocale, namespace: (typeof TEACHER_SHARED_NAMESPACES)[number]) => {
      await ensureI18n();

      if (loadedNamespacesRef.current[targetLocale].has(namespace)) {
        return;
      }

      const data = await fetchNamespace(targetLocale, namespace);
      teacherI18n.addResourceBundle(targetLocale, namespace, data, true, true);
      loadedNamespacesRef.current[targetLocale].add(namespace);
    },
    []
  );

  const ensureSections = useCallback(
    async (sections: TeacherSection[]) => {
      const uniqueSections = Array.from(new Set(sections));
      uniqueSections.forEach((section) => requestedSectionsRef.current.add(section));

      await Promise.all(uniqueSections.map((section) => loadSection(locale, section)));
    },
    [loadSection, locale]
  );

  const hasLoadedSections = useCallback(
    (sections: TeacherSection[], targetLocale = locale) => {
      return sections.every((section) => loadedSectionsRef.current[targetLocale].has(section));
    },
    [locale]
  );

  const changeLocale = useCallback(
    async (nextLocale: TeacherLocale) => {
      const requestedSections = Array.from(requestedSectionsRef.current);
      await Promise.all([
        ...requestedSections.map((section) => loadSection(nextLocale, section)),
        ...TEACHER_SHARED_NAMESPACES.map((namespace) => loadNamespace(nextLocale, namespace))
      ]);
      await teacherI18n.changeLanguage(nextLocale);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextLocale);
      }

      syncDocumentLanguage(nextLocale);
      setLocale(nextLocale);
    },
    [loadNamespace, loadSection]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const preferredLocale = getPreferredLocale();

      try {
        await Promise.all([
          ...TEACHER_BASE_SECTIONS.map((section) => loadSection(DEFAULT_LOCALE, section)),
          ...TEACHER_SHARED_NAMESPACES.map((namespace) => loadNamespace(DEFAULT_LOCALE, namespace))
        ]);

        if (preferredLocale !== DEFAULT_LOCALE) {
          await Promise.all([
            ...TEACHER_BASE_SECTIONS.map((section) => loadSection(preferredLocale, section)),
            ...TEACHER_SHARED_NAMESPACES.map((namespace) =>
              loadNamespace(preferredLocale, namespace)
            )
          ]);
        }

        if (!active) return;

        await teacherI18n.changeLanguage(preferredLocale);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, preferredLocale);
        }

        syncDocumentLanguage(preferredLocale);
        setLocale(preferredLocale);
      } catch (error) {
        console.warn('Failed to initialize teacher i18n', error);

        if (!active) return;

        await teacherI18n.changeLanguage(DEFAULT_LOCALE);
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
  }, [loadNamespace, loadSection]);

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
    <TeacherI18nContext.Provider value={value}>
      <I18nextProvider i18n={teacherI18n}>{children}</I18nextProvider>
    </TeacherI18nContext.Provider>
  );
}

export function useTeacherI18n() {
  const context = useContext(TeacherI18nContext);

  if (!context) {
    throw new Error('useTeacherI18n must be used within TeacherI18nProvider');
  }

  return context;
}

export function useTeacherPageI18n(sections: TeacherSection[]) {
  const { ensureSections, hasLoadedSections, locale } = useTeacherI18n();
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
        console.warn('Failed to load teacher page i18n sections', error);
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
