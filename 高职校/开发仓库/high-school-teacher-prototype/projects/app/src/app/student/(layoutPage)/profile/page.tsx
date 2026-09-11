import type { Metadata } from 'next';
import { getProfileData } from './data';
import { ProfileIndex } from './components';

export const metadata: Metadata = {
  title: '个人中心 - 学习平台',
  description: '查看并维护学生个人信息'
};

export default async function ProfilePage() {
  const data = await getProfileData();

  return <ProfileIndex user={data.user} />;
}
