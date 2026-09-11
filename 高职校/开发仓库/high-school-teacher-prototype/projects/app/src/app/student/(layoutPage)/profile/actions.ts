import type { PasswordFormData, UserInfo } from './types';
import type { DashboardData } from '../dashboard/types';
import {
  getStudentDetail,
  updateStudentPhone,
  updateStudentAvatar,
  uploadStudentAvatarPublic,
  type FileMetaType,
  type StudentDetailResponse
} from '@/api/student/profile';
import { updateStudentPassword } from '@/student/api/auth';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockDashboardData: DashboardData = {
  user: {
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
  },
  metrics: [
    { key: 'learning', value: 5 },
    { key: 'completed', value: 2 },
    { key: 'weekly', value: 12 },
    { key: 'total', value: 168 }
  ],
  courseProgress: [
    {
      id: 'python-basic',
      progress: 80,
      actionKey: 'continue',
      actionHref: '/student/course-plaza',
      status: 'learning'
    },
    {
      id: 'web-frontend',
      progress: 45,
      actionKey: 'continue',
      actionHref: '/student/course-plaza',
      status: 'learning'
    },
    {
      id: 'network-basic',
      progress: 100,
      actionKey: 'review',
      actionHref: '/student/course-plaza',
      status: 'completed'
    },
    {
      id: 'database',
      progress: 25,
      actionKey: 'continue',
      actionHref: '/student/course-plaza',
      status: 'learning'
    }
  ],
  studyTrend: [
    { key: 'monday', hours: 1.8 },
    { key: 'tuesday', hours: 2.6 },
    { key: 'wednesday', hours: 1.8 },
    { key: 'thursday', hours: 3.3 },
    { key: 'friday', hours: 2.6 },
    { key: 'saturday', hours: 3.3 },
    { key: 'sunday', hours: 1.9 }
  ],
  timeDistribution: [
    { key: 'morning', value: 32 },
    { key: 'afternoon', value: 28 },
    { key: 'evening', value: 26 },
    { key: 'lateNight', value: 14 }
  ]
};

export async function updateUserInfo(data: Pick<UserInfo, 'nickname' | 'phone' | 'email'>) {
  await updateStudentPhone({
    phone: data.phone
  });

  return {
    success: true,
    data: {
      phone: data.phone
    }
  };
}

export async function updatePassword(data: PasswordFormData) {
  await updateStudentPassword({
    currentPassword: data.currentPassword,
    newPassword: data.newPassword
  });

  return {
    success: true,
    data: {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    }
  };
}

export async function getAccountDashboardData() {
  await delay(50);
  return mockDashboardData;
}

export function normalizeStudentDetail(detail: StudentDetailResponse): UserInfo {
  return {
    id: String(detail.id ?? detail.userId ?? detail.studentId ?? ''),
    realName: detail.realName || detail.studentName || detail.name || '',
    nickname:
      detail.nickName ||
      detail.nickname ||
      detail.realName ||
      detail.studentName ||
      detail.name ||
      '',
    avatar: detail.avatar || detail.avatarUrl || '',
    email: detail.email || '',
    phone: detail.loginPhone || detail.phone || '',
    loginPhone: detail.loginPhone || detail.phone || '',
    institution: detail.institution || detail.schoolName || '',
    department: detail.department || detail.departmentName || detail.collegeName || '',
    major: detail.major || detail.majorName || '',
    className: detail.className || detail.classsName || detail.clazzName || '',
    studentId: String(detail.studentId ?? detail.code ?? detail.id ?? ''),
    wechatBound: (detail as any).wechatBound ?? false
  };
}

export async function getStudentProfileDetail(id: string) {
  const detail = await getStudentDetail({ id });
  return normalizeStudentDetail(detail);
}

export async function updateStudentProfileAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const uploadResult = await uploadStudentAvatarPublic(formData);
  const avatarUrl = getUploadAvatarUrl(uploadResult);

  if (!avatarUrl) {
    throw new Error('头像上传失败，未获取到文件地址');
  }

  await updateStudentAvatar({ avatar: avatarUrl });

  return {
    success: true,
    data: {
      avatarUrl
    }
  };
}

function getUploadAvatarUrl(uploadResult: FileMetaType) {
  return uploadResult.url || uploadResult.fileUrl || uploadResult.previewUrl || '';
}
