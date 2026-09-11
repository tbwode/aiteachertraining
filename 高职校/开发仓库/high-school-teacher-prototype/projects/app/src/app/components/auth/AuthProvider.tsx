'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from './RoleSelectModal';

/**
 * 用户类型：1-学生，2-老师
 */
export enum UserTypeEnum {
  STUDENT = 1,
  TEACHER = 2
}

/**
 * 角色类型：1-管理员，2-普通成员
 */
export enum RoleTypeEnum {
  ADMIN = 1,
  MEMBER = 2
}

export type AuthUser = {
  id: string;
  name: string;
  /** 账号名（登录用户名） */
  account?: string;
  token: string;
  role?: string;
  avatar?: string;
  teacherId?: number;
  studentId?: number;
  menuCodes?: string[];
  /** 用户类型：1-学生，2-老师 */
  type?: UserTypeEnum;
  /** 角色类型：1-管理员，2-普通成员 */
  roleType?: RoleTypeEnum;
  /** 角色 ID 列表 */
  roleIds?: number[];
  /** 官方介绍数据集ID（用于AI分析） */
  officialIntroDatasetId?: string;
  /** 介绍数据集ID（用于AI分析） */
  introDatasetId?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  isLoggedIn: boolean;
  selectedRole: UserRole | null;
  /** 是否是学生 */
  isStudent: boolean;
  /** 是否是老师 */
  isTeacher: boolean;
  /** 是否是管理员 */
  isAdmin: boolean;
  login: (user: AuthUser) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  logout: () => void;
  selectRole: (role: UserRole) => void;
  clearRole: () => void;
};

const AUTH_STORAGE_KEY = 'course-auth-user';
const ROLE_STORAGE_KEY = 'course-selected-role';
// 系统登录 token（用于访问业务 API）
const TOKEN_STORAGE_KEY = 'system_access_token';
// FastGPT token（用于 AI 功能）
const FASTGPT_TOKEN_KEY = 'course_fastgpt_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// 公开路由，不需要登录
const publicRoutes = ['/login', '/teacher/login', '/student/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const userRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;

    if (token && userRaw) {
      try {
        const userData = JSON.parse(userRaw) as AuthUser;
        setUser(userData);
        if (savedRole) {
          setSelectedRole(savedRole);
        }
      } catch {
        // 数据损坏，清除
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  // 路由守卫
  useEffect(() => {
    if (!isReady) return;

    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route));
    const currentSearch =
      typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    const searchParams = new URLSearchParams(currentSearch);
    const hasSsoToken = Boolean(searchParams.get('token') || searchParams.get('accessToken'));
    const loginHref = hasSsoToken && currentSearch ? `/login?${currentSearch}` : '/login';

    if (!user && !isPublicRoute) {
      // 未登录且访问需要登录的页面，重定向到登录页
      router.replace(loginHref);
    } else if (user && pathname === '/login') {
      // 已登录但访问登录页
      if (selectedRole) {
        router.replace(selectedRole === 'student' ? '/student/home' : `/${selectedRole}`);
      }
    }
  }, [user, selectedRole, pathname, router, isReady]);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_STORAGE_KEY, userData.token);
  }, []);

  const updateUser = useCallback((partialUser: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...partialUser };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSelectedRole(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    // 路由守卫会自动处理重定向，这里不需要手动跳转
  }, []);

  const selectRole = useCallback(
    (role: UserRole) => {
      setSelectedRole(role);
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      setUser((currentUser) => {
        if (!currentUser) return currentUser;

        const nextUser = {
          ...currentUser,
          type: role === 'student' ? UserTypeEnum.STUDENT : UserTypeEnum.TEACHER
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
        return nextUser;
      });
      router.replace(role === 'student' ? '/student/home' : `/${role}`);
    },
    [router]
  );

  const clearRole = useCallback(() => {
    setSelectedRole(null);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  }, []);

  const isStudent = useMemo(() => user?.type == UserTypeEnum.STUDENT, [user?.type]);
  const isTeacher = useMemo(() => user?.type == UserTypeEnum.TEACHER, [user?.type]);
  const isAdmin = useMemo(
    () => user?.type === UserTypeEnum.TEACHER && Boolean(user?.roleIds?.length),
    [user?.roleIds, user?.type]
  );

  const value = useMemo(
    () => ({
      user,
      isReady,
      isLoggedIn: !!user,
      selectedRole,
      isStudent,
      isTeacher,
      isAdmin,
      login,
      updateUser,
      logout,
      selectRole,
      clearRole
    }),
    [
      user,
      isReady,
      selectedRole,
      isStudent,
      isTeacher,
      isAdmin,
      login,
      updateUser,
      logout,
      selectRole,
      clearRole
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
