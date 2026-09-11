import type { Metadata } from 'next';
import { NoticeListPageClient } from './components/NoticeListPageClient';

export const metadata: Metadata = {
  title: '消息中心 - 学习平台',
  description: '查看系统通知、课程消息等通知信息'
};

export default function NoticePage() {
  return <NoticeListPageClient />;
}
