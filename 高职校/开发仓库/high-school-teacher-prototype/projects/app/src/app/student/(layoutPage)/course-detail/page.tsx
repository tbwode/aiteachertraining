import type { Metadata } from 'next';
import { CourseDetailPageWrapper } from './components/CourseDetailPageWrapper';

export const metadata: Metadata = {
  title: '课程详情 - 学习平台',
  description: '查看课程介绍、知识图谱与课程目录'
};

export default function CourseDetailPage() {
  return <CourseDetailPageWrapper />;
}
