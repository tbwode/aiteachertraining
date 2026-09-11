export type ProfileTabKey = 'overview' | 'myResources' | 'basicInfo' | 'password';

export type ProfileTabItem = {
  key: ProfileTabKey;
  label: string;
  description: string;
};

export type OverviewMetric = {
  label: string;
  value: string;
  suffix: string;
  color?: string;
};

export type OverviewTrendPoint = {
  label: string;
  value: number;
};

export type ProgressDistributionItem = {
  className: string;
  progress: number;
  studentCount: number;
};

export type StudentActivityLevel = 'high' | 'medium' | 'low';

export type StudentLearningDetail = {
  id: string;
  name: string;
  className: string;
  course: string;
  progress: number;
  activityLevel: StudentActivityLevel;
};

export type TeacherProfileForm = {
  phone: string;
  email: string;
};

export type TeacherProfileReadonlyInfo = {
  teacherNo: string;
  name: string;
  deptNames: string[];
};

export type TeacherProfileInfo = TeacherProfileReadonlyInfo &
  TeacherProfileForm & {
    avatarUrl: string;
    wechatBound: boolean;
    loginPhone: string;
  };

export type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};
