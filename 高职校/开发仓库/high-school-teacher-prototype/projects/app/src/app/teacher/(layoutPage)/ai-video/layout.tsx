import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AI视频课 - 教师端',
  description: 'AI 视频课：文本生成视频、PPT/文档转视频、模板视频与分镜精修'
};

export default function AiVideoLayout({ children }: { children: ReactNode }) {
  return children;
}
