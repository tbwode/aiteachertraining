import type { Metadata } from 'next';
import TeachersPageClient from './TeachersPageClient';

export const metadata: Metadata = {
  title: '教师管理 | 管理端',
  description: '教师信息管理，支持组织架构树和教师列表。'
};

export default function TeachersPage() {
  return <TeachersPageClient />;
}
