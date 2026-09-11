import type { ProfilePageData, UserInfo } from './types';

const mockUser: UserInfo = {
  id: 'student_001',
  realName: '张三',
  nickname: '张同学',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
  email: 'zhangsan@example.com',
  phone: '138****8888',
  loginPhone: '138****8888',
  institution: '某某职业技术学院',
  department: '电子信息学院',
  major: '计算机应用技术',
  className: '计应2401班',
  studentId: '2024001001'
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getProfileData(): Promise<ProfilePageData> {
  await delay(150);

  return {
    user: mockUser
  };
}
