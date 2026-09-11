import type { Metadata } from 'next';
import { AgentPlazaPageClient } from './components/AgentPlazaPageClient';

export const metadata: Metadata = {
  title: '智能体广场 - 学习平台',
  description: '探索适用于学生学习与实践场景的智能体工具'
};

export default function AgentPlazaPage() {
  return <AgentPlazaPageClient />;
}
