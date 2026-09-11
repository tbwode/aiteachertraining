import { type I18nNsType } from '@fastgpt/web/i18n/i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const serviceSideProps = async (content: any, ns: I18nNsType = []) => {
  // 静态导出模式下没有 req 对象
  const lang = content.req?.cookies?.NEXT_LOCALE || content.locale || 'zh-CN';
  const extraLng = content.req?.cookies?.NEXT_LOCALE
    ? undefined
    : content.locales || ['zh-CN', 'en'];

  // Device size (静态导出时无法获取)
  const deviceSize = content.req?.cookies?.NEXT_DEVICE_SIZE || null;

  return {
    ...(await serverSideTranslations(lang, ['common', ...ns], undefined, extraLng)),
    deviceSize
  };
};
