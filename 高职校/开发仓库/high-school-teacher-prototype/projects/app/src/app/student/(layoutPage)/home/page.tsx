import type { Metadata } from 'next';
import { HomePageClient } from './components/HomePageClient';
import { getHomePageData } from './data';

export const metadata: Metadata = {
  title: '首页 - 学习平台',
  description: '高职校SaaS学习平台学生端首页'
};

export default async function StudentHomePage() {
  const data = await getHomePageData();

  return <HomePageClient data={data} />;
}
