import type { Metadata } from 'next';
import { StudyPageClient } from './components/StudyPageClient';

export const metadata: Metadata = {
  title: '课件学习 - 学习平台',
  description: '在学习页中观看课件并与 AI 教师互动'
};

export default function StudyPage() {
  return <StudyPageClient />;
}
