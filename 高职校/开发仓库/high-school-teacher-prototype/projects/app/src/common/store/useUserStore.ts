import { create, devtools, persist, immer } from '@fastgpt/web/common/zustand';

/**
 * 统一用户类型（教师/学生通用）
 */
export type UserInfo = {
  id: string;
  userId?: number;
  studentId?: number;
  teacherId?: number;
  username: string;
  account?: string;
  avatar?: string;
  avatarUrl?: string;
  roleId?: number;
  roleName?: string;
  roleIds?: number[];
  roleNames?: string[];
  tenantId?: number;
  tenantName?: string;
  tmbId?: number;
  domain?: string;
  phone?: string;
  gender?: number;
  status?: number;
  type?: string;
  subType?: string;
  parentTenantId?: number;
  isSso?: boolean;
  isShared?: boolean;
  isAiReview?: boolean;
  menuCodes?: string[];
  chatId?: string;
  accessToken: string;
  /** 官方介绍数据集ID（用于AI分析） */
  officialIntroDatasetId?: string;
  /** 介绍数据集ID（用于AI分析） */
  introDatasetId?: string;
};

type UserRole = 'teacher' | 'student' | null;

type State = {
  /** 用户信息 */
  userInfo: UserInfo | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 当前选择的角色 */
  selectedRole: UserRole;
  /** 最后登录时间 */
  lastLoginTime: number | null;
};

type Actions = {
  /** 设置用户信息 */
  setUserInfo: (userInfo: UserInfo) => void;
  /** 更新部分用户信息 */
  updateUserInfo: (partialUserInfo: Partial<UserInfo>) => void;
  /** 清除用户信息（退出登录） */
  clearUserInfo: () => void;
  /** 检查是否已登录 */
  checkLoginStatus: () => boolean;
  /** 设置当前角色 */
  setSelectedRole: (role: UserRole) => void;
  /** 清除角色选择 */
  clearSelectedRole: () => void;
};

const initialState: State = {
  userInfo: null,
  isLoggedIn: false,
  selectedRole: null,
  lastLoginTime: null
};

export const useUserStore = create<State & Actions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setUserInfo: (userInfo: UserInfo) => {
          set((state) => {
            state.userInfo = userInfo;
            state.isLoggedIn = true;
            state.lastLoginTime = Date.now();
          });
          // 同时保存 token 到 localStorage
          if (userInfo.accessToken) {
            localStorage.setItem('system_access_token', userInfo.accessToken);
          }
        },

        updateUserInfo: (partialUserInfo: Partial<UserInfo>) => {
          set((state) => {
            if (state.userInfo) {
              Object.assign(state.userInfo, partialUserInfo);
            }
          });
        },

        clearUserInfo: () => {
          set((state) => {
            state.userInfo = null;
            state.isLoggedIn = false;
            state.selectedRole = null;
            state.lastLoginTime = null;
          });
          // 清除 localStorage 中的 token
          localStorage.removeItem('system_access_token');
          localStorage.removeItem('course_fastgpt_token');
          localStorage.removeItem('teacher_access_token');
          localStorage.removeItem('student_access_token');
        },

        checkLoginStatus: () => {
          const { userInfo, isLoggedIn } = get();
          return isLoggedIn && !!userInfo?.accessToken;
        },

        setSelectedRole: (role: UserRole) => {
          set((state) => {
            state.selectedRole = role;
          });
          // 保存到 localStorage
          if (role) {
            localStorage.setItem('course_selected_role', role);
          }
        },

        clearSelectedRole: () => {
          set((state) => {
            state.selectedRole = null;
          });
          localStorage.removeItem('course_selected_role');
        }
      })),
      {
        name: 'userStore',
        partialize: (state) => ({
          userInfo: state.userInfo,
          isLoggedIn: state.isLoggedIn,
          selectedRole: state.selectedRole,
          lastLoginTime: state.lastLoginTime
        })
      }
    )
  )
);

/**
 * 获取 store 中的用户信息
 */
export const getUserInfo = () => useUserStore.getState().userInfo;

/**
 * 检查用户是否已登录
 */
export const isUserLoggedIn = () => useUserStore.getState().checkLoginStatus();

/**
 * 获取用户 token
 */
export const getUserToken = () => useUserStore.getState().userInfo?.accessToken;

/**
 * 获取当前选择的角色
 */
export const getSelectedRole = () => useUserStore.getState().selectedRole;
