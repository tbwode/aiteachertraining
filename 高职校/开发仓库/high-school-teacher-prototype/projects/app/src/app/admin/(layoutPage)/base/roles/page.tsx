import type { Metadata } from 'next';
import RolesPageClient from './RolesPageClient';

export const metadata: Metadata = {
  title: '角色管理 | 管理端',
  description: '角色信息管理，支持角色名称、权限等数据维护。'
};

export default function RolesPage() {
  return <RolesPageClient />;
}
