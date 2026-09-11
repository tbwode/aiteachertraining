import type { ReactNode } from 'react';
import { StudentLayout } from '@/app/student/components/StudentLayout';
import { GlobalIframeProvider } from '@/app/components/GlobalIframeContext';

export const metadata = {
  title: '高职校学习平台 - 学生端',
  description: '高职校SaaS学习平台学生端'
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <GlobalIframeProvider>
      <StudentLayout>{children}</StudentLayout>
    </GlobalIframeProvider>
  );
}
