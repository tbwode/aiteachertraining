'use client';

import { useEffect, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { useGlobalIframe } from '@/app/components/GlobalIframeContext';
import { getOpenMaicBaseUrl } from '@/utils/openmaic';

export default function DigitalTextbookPage() {
  const searchParams = useSearchParams();
  const stageId = searchParams.get('stageId');
  const isI18nReady = useTeacherPageI18n(['students']);
  const { showIframe, hideIframe } = useGlobalIframe();

  const iframeSrc = useMemo(() => {
    const token = localStorage.getItem('system_access_token');
    if (!token) return 'about:blank';

    const openMaicBaseUrl = getOpenMaicBaseUrl();
    if (stageId) {
      return `${openMaicBaseUrl}/generation-new-preview?stageId=${encodeURIComponent(stageId)}`;
    }

    const baseUrl = `${openMaicBaseUrl}/home`;
    return `${baseUrl}?token=${encodeURIComponent(token)}&is_teacher=1`;
  }, [stageId]);

  useEffect(() => {
    showIframe(iframeSrc);
    return () => {
      hideIframe();
    };
  }, [iframeSrc, showIframe, hideIframe]);

  if (!isI18nReady) {
    return null;
  }

  return null;
}
