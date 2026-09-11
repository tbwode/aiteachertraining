import type { Metadata } from 'next';
import TeacherHomePage from '../home/page';

export const metadata: Metadata = {
  title: 'AI教师 - 教师端',
  description: '查看 AI 教学建议、今日待办与课程 AI 分身'
};

export default function TeacherAiTeacherPage() {
  return <TeacherHomePage />;
}
