import type { ReactNode } from 'react';
import { AdminLayout } from '@/app/admin/components/AdminLayout';

export const metadata = {
  title: '高职校教学平台 - 管理端',
  description: '高职校 SaaS 教学平台管理端'
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
