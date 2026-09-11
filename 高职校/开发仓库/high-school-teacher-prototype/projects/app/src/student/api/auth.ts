import { POST } from '@/web/common/api/requestStudent';
import type { StudentLoginParams, StudentAuthInfo } from '../types/auth';

/**
 * SHA256 加密字符串（浏览器端使用 Web Crypto API）
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 学生登录
 * @param data 登录参数
 * @returns 登录响应（已解析 data 层）
 */
export const studentLogin = async (data: StudentLoginParams) => {
  const encryptedPassword = await sha256(data.password);
  return POST<StudentAuthInfo>('/client/auth/studentLogin', {
    ...data,
    password: encryptedPassword
  });
};

/**
 * 学生登出
 */
export const studentLogout = () => POST('/client/auth/logout', {});

/**
 * 获取学生用户信息
 */
export const getStudentUserInfo = () => POST<StudentAuthInfo>('/client/auth/getUserInfo', {});

/**
 * 学生修改密码
 */
export const updateStudentPassword = async ({
  currentPassword,
  newPassword
}: {
  currentPassword: string;
  newPassword: string;
}) => {
  const [originalPassword, encryptedNewPassword] = await Promise.all([
    sha256(currentPassword),
    sha256(newPassword)
  ]);

  return POST<boolean>('/client/auth/updatePassword', {
    originalPassword,
    newPassword: encryptedNewPassword
  });
};
