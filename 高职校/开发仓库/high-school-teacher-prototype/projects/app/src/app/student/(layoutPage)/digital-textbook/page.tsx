'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useGlobalIframe } from '@/app/components/GlobalIframeContext';
import { getOpenMaicBaseUrl } from '@/utils/openmaic';

export default function DigitalTextbookPage() {
  const searchParams = useSearchParams();
  const stageId = searchParams.get('stageId');
  const { ready } = useTranslation('student');
  const { showIframe, hideIframe } = useGlobalIframe();

  const iframeSrc = useMemo(() => {
    const token = localStorage.getItem('system_access_token');
    if (!token) return 'about:blank';

    const openMaicBaseUrl = getOpenMaicBaseUrl();
    if (stageId) {
      return `${openMaicBaseUrl}/generation-new-preview?stageId=${encodeURIComponent(stageId)}`;
    }

    const baseUrl = `${openMaicBaseUrl}/home`;
    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }, [stageId]);

  useEffect(() => {
    showIframe(iframeSrc);
    return () => {
      hideIframe();
    };
  }, [iframeSrc, showIframe, hideIframe]);

  if (!ready) {
    return null;
  }

  return null;
}
