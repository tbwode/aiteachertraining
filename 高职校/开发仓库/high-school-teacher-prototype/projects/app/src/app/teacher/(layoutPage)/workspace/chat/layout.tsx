import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '智能备课对话 - 教师端',
  description: '教师多技能智能备课对话与教学产物预览'
};

export default function WorkspaceChatLayout({ children }: { children: ReactNode }) {
  return children;
}
