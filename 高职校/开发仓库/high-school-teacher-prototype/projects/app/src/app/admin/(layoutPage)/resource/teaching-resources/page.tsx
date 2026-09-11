import type { Metadata } from 'next';
import TeachingResourcesPageClient from './TeachingResourcesPageClient';

export const metadata: Metadata = {
  title: '教学资源管理 | 管理端',
  description: '教学课件、视频、题库等资源的上传与管理。'
};

export default function TeachingResourcesPage() {
  return <TeachingResourcesPageClient />;
}
