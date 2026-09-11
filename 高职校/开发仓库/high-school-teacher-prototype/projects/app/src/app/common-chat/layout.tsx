import type { ReactNode } from 'react';
import { TeacherChakraProvider } from '@/app/teacher/components/TeacherChakraProvider';
import { TeacherI18nProvider } from '@/app/teacher/components/TeacherI18nProvider';

export const metadata = {
  title: '通用对话 - AI教学助手',
  description: 'AI教学助手通用对话'
};

export default function CommonChatLayout({ children }: { children: ReactNode }) {
  return (
    <TeacherChakraProvider>
      <TeacherI18nProvider>{children}</TeacherI18nProvider>
    </TeacherChakraProvider>
  );
}
