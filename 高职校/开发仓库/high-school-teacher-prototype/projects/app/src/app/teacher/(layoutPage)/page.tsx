import type { Metadata } from 'next';
import WorkspacePage from './workspace/page';

export const metadata: Metadata = {
  title: '首页 - 教师端',
  description: '教师智能备课工作台：课纲解析、教案编写、课堂实训与专业图谱'
};

export default function TeacherIndexPage() {
  return <WorkspacePage />;
}
