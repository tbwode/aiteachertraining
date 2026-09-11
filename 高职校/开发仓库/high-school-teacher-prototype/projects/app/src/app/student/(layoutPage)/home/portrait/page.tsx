import type { Metadata } from 'next';
import { PortraitPageClient } from './components/PortraitPageClient';
import { getPortraitData } from './data';

export const metadata: Metadata = {
  title: '用户画像 - 学习平台',
  description: '查看个人学习能力画像'
};

export default async function PortraitPage() {
  const data = await getPortraitData();

  return <PortraitPageClient data={data} />;
}
