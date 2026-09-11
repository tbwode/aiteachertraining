import { useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useRouter } from 'next/router';

const namespaces = [
  'common',
  'login',
  'app',
  'chat',
  'dataset',
  'workflow',
  'user',
  'account',
  'account_team',
  'account_bill',
  'account_apikey',
  'account_inform',
  'account_info',
  'account_model',
  'account_promotion',
  'account_setting',
  'account_thirdParty',
  'account_usage',
  'dashboard_evaluation',
  'dashboard_mcp',
  'file',
  'publish'
];

// 简单的空资源作为初始值，确保 i18n 可以立即使用
const emptyResources: Record<string, any> = {
  'zh-CN': {},
  en: {},
  'zh-Hant': {}
};

// 从 public/locales 加载翻译文件
async function loadLocale(locale: string, ns: string) {
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_URL || '';
    const response = await fetch(`${basePath}/locales/${locale}/${ns}.json`);
    if (!response.ok) {
      console.warn(`Failed to load locale: ${locale}/${ns}`);
      return {};
    }
    return await response.json();
  } catch (error) {
    console.warn(`Error loading locale ${locale}/${ns}:`, error);
    return {};
  }
}

// 立即同步初始化 i18n（不等待加载翻译）
let i18nInitialized = false;
let i18nInitResolve: (() => void) | null = null;
const i18nInitPromise = new Promise<void>((resolve) => {
  i18nInitResolve = resolve;
});

// 同步获取语言
const getInitialLng = () => {
  if (typeof window === 'undefined') return 'zh-CN';
  const storedLng = localStorage.getItem('i18nextLng');
  const browserLng = navigator.language;
  return (
    storedLng ||
    (browserLng.startsWith('zh')
      ? browserLng.includes('Hant') || browserLng.includes('TW') || browserLng.includes('HK')
        ? 'zh-Hant'
        : 'zh-CN'
      : 'en')
  );
};

// 只在客户端初始化
if (typeof window !== 'undefined') {
  const initialLng = getInitialLng();

  // 立即初始化 i18n（不等待）
  i18n
    .use(initReactI18next)
    .init({
      lng: initialLng,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: namespaces,
      resources: emptyResources,
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false,
        bindI18n: 'loaded languageChanged',
        bindI18nStore: 'added removed'
      },
      partialBundledLanguages: true
    })
    .then(() => {
      i18nInitialized = true;
      i18nInitResolve?.();
    });
} else {
  // SSR 环境下标记为已初始化
  i18nInitialized = true;
  i18nInitResolve?.();
}

// 预加载翻译
async function loadTranslations(lng: string) {
  const lngResources: Record<string, any> = {};
  await Promise.all(
    namespaces.map(async (ns) => {
      const data = await loadLocale(lng, ns);
      lngResources[ns] = data;
      i18n.addResourceBundle(lng, ns, data, true, true);
    })
  );
  return lngResources;
}

export function useClientI18n() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [currentLng, setCurrentLng] = useState<string>('zh-CN');

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    const init = async () => {
      // 等待 i18n 初始化完成
      await i18nInitPromise;

      const lng = getInitialLng();

      // 加载翻译
      await loadTranslations(lng);

      // 如果是英文，还需要加载 fallback
      if (lng !== 'en') {
        await loadTranslations('en');
      }

      setCurrentLng(lng);
      setIsReady(true);
    };

    if (!isReady) {
      init();
    }
  }, [isReady]);

  // 当路由语言参数改变时切换语言
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (i18nInitialized && router.locale && i18n.language !== router.locale) {
      const loadNewLocale = async () => {
        await loadTranslations(router.locale!);
        await i18n.changeLanguage(router.locale);
        setCurrentLng(router.locale!);
      };
      loadNewLocale();
    }
  }, [router.locale]);

  return { isReady, currentLng, i18n };
}

export default i18n;
