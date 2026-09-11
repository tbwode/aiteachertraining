import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudentAuthInfo } from '../types/auth';

/**
 * 学生认证状态类型
 */
type StudentAuthState = {
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 访问令牌 */
  token: string | null;
  /** 用户信息 */
  userInfo: StudentAuthInfo | null;
  /** 设置登录状态 */
  setAuth: (authInfo: StudentAuthInfo) => void;
  /** 清除登录状态 */
  clearAuth: () => void;
  /** 更新用户信息 */
  updateUserInfo: (userInfo: Partial<StudentAuthInfo>) => void;
};

/**
 * 学生认证状态管理
 * 使用 zustand + persist 中间件实现持久化存储
 */
export const useStudentAuthStore = create<StudentAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      userInfo: null,

      setAuth: (authInfo: StudentAuthInfo) =>
        set(() => ({
          isAuthenticated: true,
          token: authInfo.accessToken,
          userInfo: authInfo
        })),

      clearAuth: () =>
        set(() => ({
          isAuthenticated: false,
          token: null,
          userInfo: null
        })),

      updateUserInfo: (partialUserInfo: Partial<StudentAuthInfo>) =>
        set((state: StudentAuthState) => {
          const nextUserInfo = state.userInfo
            ? { ...state.userInfo, ...partialUserInfo }
            : (partialUserInfo as StudentAuthInfo);

          return {
            isAuthenticated: state.isAuthenticated || !!nextUserInfo?.accessToken,
            token: nextUserInfo?.accessToken || state.token,
            userInfo: nextUserInfo
          };
        })
    }),
    {
      name: 'student-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        userInfo: state.userInfo
      })
    }
  )
);

/**
 * 获取当前登录状态（非 hook 方式，用于非组件场景）
 */
export const getStudentAuthState = () => useStudentAuthStore.getState();
