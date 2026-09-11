import type {
  OverviewMetric,
  OverviewTrendPoint,
  PasswordForm,
  ProgressDistributionItem,
  StudentLearningDetail,
  TeacherProfileInfo
} from './types';

export const PROFILE_PRIMARY_COLOR = '#C8000B';
export const PROFILE_PRIMARY_BG = '#FFF1F0';
export const PROFILE_CARD_SHADOW = '0 8px 24px rgba(15, 23, 42, 0.06)';

export const overviewMetrics: OverviewMetric[] = [
  { label: 'students', value: '86', suffix: 'count' },
  { label: 'averageProgress', value: '68', suffix: 'percent' },
  { label: 'activeStudents', value: '72', suffix: 'count' },
  { label: 'riskStudents', value: '14', suffix: 'count', color: '#F5222D' }
];

export const progressDistribution: ProgressDistributionItem[] = [
  { className: 'class-1', progress: 45, studentCount: 32 },
  { className: 'class-2', progress: 65, studentCount: 28 },
  { className: 'class-3', progress: 45, studentCount: 20 },
  { className: 'class-4', progress: 82, studentCount: 18 }
];

export const activityTrend: OverviewTrendPoint[] = [
  { label: 'day-1', value: 48 },
  { label: 'day-2', value: 52 },
  { label: 'day-3', value: 53 },
  { label: 'day-4', value: 54 },
  { label: 'day-5', value: 57 },
  { label: 'day-6', value: 54 },
  { label: 'day-7', value: 41 }
];

export const studentLearningDetails: StudentLearningDetail[] = [
  {
    id: 'student-1',
    name: '张三',
    className: 'class-1',
    course: 'course-1',
    progress: 85,
    activityLevel: 'high'
  },
  {
    id: 'student-2',
    name: '李四',
    className: 'class-1',
    course: 'course-1',
    progress: 15,
    activityLevel: 'low'
  },
  {
    id: 'student-3',
    name: '张三',
    className: 'class-2',
    course: 'course-1',
    progress: 82,
    activityLevel: 'high'
  },
  {
    id: 'student-4',
    name: '张三',
    className: 'class-1',
    course: 'course-1',
    progress: 0,
    activityLevel: 'medium'
  }
];

export const initialPasswordForm: PasswordForm = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export const emptyTeacherProfile: TeacherProfileInfo = {
  avatarUrl: '',
  teacherNo: '',
  name: '',
  deptNames: [],
  phone: '',
  loginPhone: '',
  email: '',
  wechatBound: false
};
