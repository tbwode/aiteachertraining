import type { Metadata } from 'next';
import NewsPageClient from './NewsPageClient';

export const metadata: Metadata = {
  title: '资讯管理 | 管理端',
  description: '资讯信息管理，支持资讯发布、编辑、置顶等操作。'
};

export default function NewsPage() {
  return <NewsPageClient />;
}
