import type { Metadata } from 'next';
import ConfigurationPageClient from './ConfigurationPageClient';

export const metadata: Metadata = {
  title: '定制配置 | 管理端',
  description: '系统定制配置管理。'
};

export default function ConfigurationPage() {
  return <ConfigurationPageClient />;
}
