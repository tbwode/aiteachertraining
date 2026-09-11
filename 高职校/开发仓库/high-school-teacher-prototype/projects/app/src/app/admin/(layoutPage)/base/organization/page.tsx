import type { Metadata } from 'next';
import OrganizationPageClient from './OrganizationPageClient';

export const metadata: Metadata = {
  title: '组织管理 | 管理端',
  description: '组织架构管理，支持部门、班级的增删改查。'
};

export default function OrganizationPage() {
  return <OrganizationPageClient />;
}
