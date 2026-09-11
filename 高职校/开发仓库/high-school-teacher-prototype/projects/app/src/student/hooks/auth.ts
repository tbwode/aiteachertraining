import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { studentLogin, studentLogout } from '../api/auth';
import { getCourseFastgptToken } from '../api/courseFastgpt';
import type { StudentLoginParams, StudentAuthInfo } from '../types/auth';
import { useStudentAuthStore } from '../store/auth';

/**
 * 学生登录 Hook
 * 登录成功后自动更新 store 状态，并获取 courseFastgpt token
 */
export const useStudentLogin = () => {
  const setAuth = useStudentAuthStore((state: any) => state.setAuth);

  const { runAsync: login, loading: isLoggingIn } = useRequest2(
    (params: StudentLoginParams) => studentLogin(params),
    {
      manual: true
    }
  );

  const { runAsync: fetchCourseToken, loading: isFetchingToken } = useRequest2(
    () => getCourseFastgptToken(),
    {
      manual: true,
      onSuccess: (res) => {
        if (res?.token) {
          // 保存 courseFastgpt token 到 localStorage
          localStorage.setItem('course_fastgpt_token', res.token);
        }
      }
    }
  );

  // 包装登录方法，登录成功后自动获取 courseFastgpt token
  const handleLogin = async (params: StudentLoginParams) => {
    const loginRes = await login(params);
    if (loginRes?.accessToken) {
      // 先保存 token 到 localStorage（确保后续请求能带上 Authorization）
      localStorage.setItem('student_access_token', loginRes.accessToken);
      // 更新 store 状态
      setAuth(loginRes);
      // 获取 courseFastgpt token（此时 Authorization header 已可用）
      await fetchCourseToken();
    }
    return loginRes;
  };

  return {
    login: handleLogin,
    isLoggingIn: isLoggingIn || isFetchingToken
  };
};

/**
 * 学生登出 Hook
 * 登出后自动清除 store 状态和 courseFastgpt token
 */
export const useStudentLogout = () => {
  const { runAsync, loading } = useRequest2(() => studentLogout(), {
    manual: true,
    onSuccess: () => {
      clearStudentAuth();
    }
  });

  return {
    logout: runAsync,
    isLoggingOut: loading
  };
};

/**
 * 获取学生 Token（从 store）
 */
export const getStudentToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return useStudentAuthStore.getState().token;
};

/**
 * 获取学生用户信息（从 store）
 */
export const getStudentUserInfo = (): StudentAuthInfo | null => {
  if (typeof window === 'undefined') return null;
  return useStudentAuthStore.getState().userInfo;
};

/**
 * 清除学生登录状态（store 和本地存储）
 */
export const clearStudentAuth = () => {
  if (typeof window === 'undefined') return;
  useStudentAuthStore.getState().clearAuth();
  localStorage.removeItem('course_fastgpt_token');
  localStorage.removeItem('student_access_token');
  localStorage.removeItem('student-auth-storage');
  // 清除所有 AI 教师对话缓存，防止切换用户后残留
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('ai_teacher_conversation_')) {
      localStorage.removeItem(key);
    }
  });
};
