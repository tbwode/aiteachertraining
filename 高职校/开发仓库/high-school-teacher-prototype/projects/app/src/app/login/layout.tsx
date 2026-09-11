'use client';

import { TeacherChakraProvider } from '@/app/teacher/components/TeacherChakraProvider';
import { TeacherI18nProvider } from '@/app/teacher/components/TeacherI18nProvider';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherChakraProvider>
      <TeacherI18nProvider>{children}</TeacherI18nProvider>
    </TeacherChakraProvider>
  );
}
