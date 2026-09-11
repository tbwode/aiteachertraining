'use client';

import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

type TeachingModulePageMetaSyncProps = {
  titleKey?: string;
  descriptionKey?: string;
  children: ReactNode;
};

const DESCRIPTION_META_SELECTOR = 'meta[name="description"]';

function upsertDescriptionMeta(content: string) {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector<HTMLMetaElement>(DESCRIPTION_META_SELECTOR);

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }

  meta.content = content;
}

export default function TeachingModulePageMetaSync({
  titleKey,
  descriptionKey,
  children
}: TeachingModulePageMetaSyncProps) {
  const isI18nReady = useAdminPageI18n(['home', 'teaching']);
  const { t } = useTranslation('admin');

  useEffect(() => {
    if (!isI18nReady) return;

    const title = titleKey
      ? t('teaching.metadata.titleTemplate', {
          module: t(titleKey),
          portal: t('layout.adminPortal')
        })
      : t('teaching.metadata.defaultTitle', {
          portal: t('layout.adminPortal')
        });
    const description = descriptionKey
      ? t(descriptionKey)
      : t('teaching.metadata.defaultDescription');

    document.title = title;
    upsertDescriptionMeta(description);
  }, [descriptionKey, isI18nReady, t, titleKey]);

  return <>{children}</>;
}
