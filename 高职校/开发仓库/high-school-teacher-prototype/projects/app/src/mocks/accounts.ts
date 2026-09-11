import type { AuthInfo } from '@/teacher/types/auth';

export const TEST_PASSWORD_SHA256 =
  '9281769098e75b43bdf3af05acb5d34c19a0d2ead8383e840c8da89f0302f03a';

export const SHARED_MOCK_ACCOUNT = '15815501001';

const menuCodes = [
  'admin_base',
  'admin_base_configuration',
  'admin_base_organization',
  'admin_base_roles',
  'admin_resource',
  'admin_content_news',
  'admin_resource_teaching',
  'admin_teaching',
  'admin_teaching_majors',
  'admin_teaching_grades',
  'admin_teaching_classes',
  'admin_teaching_semesters',
  'admin_teaching_students',
  'admin_teaching_teachers',
  'admin_teaching_courses',
  'admin_teaching_tasks',
  'admin_training',
  'admin_training_programs',
  'admin_graph',
  'admin_graph_ability',
  'teacher_digital_textbook',
  'teacher_ai_teacher',
  'teacher_resource_plaza',
  'teacher_agent_plaza',
  'student_home',
  'student_course_plaza',
  'student_ai_creation_space',
  'student_digital_textbook',
  'student_agent_plaza'
];

const createAuth = (overrides: Partial<AuthInfo>): AuthInfo =>
  ({
    accessToken: `mock-token-${overrides.account ?? SHARED_MOCK_ACCOUNT}`,
    source: 'prototype',
    userId: 1001,
    username: '李明远',
    account: SHARED_MOCK_ACCOUNT,
    phone: SHARED_MOCK_ACCOUNT,
    avatar: '',
    gender: 1,
    roleId: 2,
    roleType: 2,
    roleName: '普通教师',
    roleIds: [],
    roleNames: ['普通教师'],
    tmbId: 1001,
    tenantId: 1,
    tenantName: '江苏省南通中等专业学校',
    domain: 'prototype.local',
    subType: 0,
    parentTenantId: 0,
    defaultApp: {} as AuthInfo['defaultApp'],
    status: 1,
    menuCodes: [],
    chatId: 'mock-chat',
    isSso: 0,
    isShared: 0,
    teacherId: 1001,
    studentId: 0,
    isAiReview: 1,
    type: 2,
    ...overrides
  }) as AuthInfo;

export const mockAccounts: Record<string, AuthInfo> = {
  [SHARED_MOCK_ACCOUNT]: createAuth({
    userId: 1001,
    roleId: 1,
    roleType: 1,
    roleName: '普通教师',
    roleIds: [1],
    roleNames: ['学校管理员', '普通教师', '学生'],
    teacherId: 1001,
    studentId: 3001,
    menuCodes
  })
};

export const getMockAuth = (account: string, passwordSha256?: string): AuthInfo => {
  const auth = mockAccounts[account];
  if (!auth || passwordSha256 !== TEST_PASSWORD_SHA256) {
    throw { message: '账号或密码错误（Mock 演示账号）', code: 400 };
  }
  return structuredClone(auth);
};
