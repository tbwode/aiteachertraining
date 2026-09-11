import type { ReactNode } from 'react';
import { TeacherLayout } from '@/app/teacher/components/TeacherLayout';
import { GlobalIframeProvider } from '@/app/components/GlobalIframeContext';

export const metadata = {
  title: '高职校教学平台 - 教师端',
  description: '高职校 SaaS 教学平台教师端'
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <GlobalIframeProvider>
      <TeacherLayout>{children}</TeacherLayout>
    </GlobalIframeProvider>
  );
}
