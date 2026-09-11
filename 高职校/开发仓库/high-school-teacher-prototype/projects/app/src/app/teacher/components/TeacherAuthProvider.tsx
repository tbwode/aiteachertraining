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
import { useUserStore } from '@/common/store/useUserStore';

export type TeacherUser = {
  id: string;
  name: string;
  token: string;
  subject?: string;
};

type TeacherAuthContextValue = {
  user: TeacherUser | null;
  isReady: boolean;
  login: (user: TeacherUser) => void;
  logout: () => void;
};

const STORAGE_KEY = 'course-auth-user';

const TeacherAuthContext = createContext<TeacherAuthContextValue | undefined>(undefined);

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TeacherUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { userInfo, clearUserInfo } = useUserStore();

  // 同步 store 中的用户信息到本地状态
  useEffect(() => {
    if (userInfo) {
      setUser({
        id: String(userInfo.userId || userInfo.id),
        name: userInfo.username,
        token: userInfo.accessToken,
        subject: userInfo.roleName
      });
    } else {
      // 尝试从 localStorage 恢复旧版本数据
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const oldUser = JSON.parse(raw) as TeacherUser;
            setUser(oldUser);
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    }
    setIsReady(true);
  }, [userInfo]);

  const login = useCallback((nextUser: TeacherUser) => {
    setUser(nextUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearUserInfo();
    window.localStorage.removeItem(STORAGE_KEY);
  }, [clearUserInfo]);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      logout
    }),
    [isReady, login, logout, user]
  );

  return <TeacherAuthContext.Provider value={value}>{children}</TeacherAuthContext.Provider>;
}

export function useTeacherAuth() {
  const context = useContext(TeacherAuthContext);

  if (!context) {
    throw new Error('useTeacherAuth must be used within TeacherAuthProvider');
  }

  return context;
}
