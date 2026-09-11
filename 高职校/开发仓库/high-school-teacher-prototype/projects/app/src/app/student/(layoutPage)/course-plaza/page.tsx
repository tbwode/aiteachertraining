import type { Metadata } from 'next';
import { CoursePlazaPageClient } from './components/CoursePlazaPageClient';

export const metadata: Metadata = {
  title: '课程广场 - 学习平台',
  description: '浏览并加入学生端课程广场中的优质课程'
};

export default function CoursePlazaPage() {
  return <CoursePlazaPageClient />;
}
