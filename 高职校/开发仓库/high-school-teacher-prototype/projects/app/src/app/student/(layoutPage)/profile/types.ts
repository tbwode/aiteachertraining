export interface UserInfo {
  id: string;
  realName: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  loginPhone: string;
  institution: string;
  department: string;
  major: string;
  className: string;
  studentId: string;
  wechatBound?: boolean;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfilePageData {
  user: UserInfo;
}
