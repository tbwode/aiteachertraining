import type { Metadata } from 'next';
import SimpleChatDemo from './components/SimpleChatDemo';

export const metadata: Metadata = {
  title: 'SimpleChat Hook 演示 - 教师端',
  description: 'useSimpleChat Hook 使用示例'
};

export default function SimpleChatPage() {
  return <SimpleChatDemo />;
}
