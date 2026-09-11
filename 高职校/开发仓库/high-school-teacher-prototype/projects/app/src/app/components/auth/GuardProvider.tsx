'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// 公开路由，不需要权限检查
const publicRoutes = ['/login', '/teacher/login', '/student/login'];

export function GuardProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isStudent, isTeacher, isAdmin, selectedRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // 使用 useMemo 计算是否有权限访问当前页面
  const isAllowed = useMemo(() => {
    // 公开路由直接允许访问
    if (publicRoutes.some((route) => pathname?.startsWith(route))) {
      return true;
    }

    // 未登录时由 AuthProvider 处理重定向，这里先允许渲染
    if (!isLoggedIn) {
      return true;
    }

    // 所有已登录用户都可以访问 /chat 和 /common-chat
    if (pathname === '/chat' || pathname?.startsWith('/chat/')) {
      return true;
    }
    if (pathname === '/common-chat' || pathname?.startsWith('/common-chat/')) {
      return true;
    }

    if (pathname?.startsWith('/common-chat')) {
      return true;
    }

    if (selectedRole === 'admin') {
      return pathname?.startsWith('/admin') ?? false;
    }

    if (selectedRole === 'teacher') {
      return !pathname?.startsWith('/student');
    }

    if (selectedRole === 'student') {
      return pathname?.startsWith('/student') ?? false;
    }

    // 学生不能访问 /teacher 和 /admin
    if (isStudent && (pathname?.startsWith('/teacher') || pathname?.startsWith('/admin'))) {
      return false;
    }

    // 老师不能访问 /student
    if (isTeacher && pathname?.startsWith('/student')) {
      return false;
    }

    // 非管理员不能访问 /admin
    if (!isAdmin && pathname?.startsWith('/admin')) {
      return false;
    }

    return true;
  }, [isLoggedIn, isStudent, isTeacher, isAdmin, pathname, selectedRole]);

  useEffect(() => {
    // 公开路由直接结束检查
    if (publicRoutes.some((route) => pathname?.startsWith(route))) {
      setIsChecking(false);
      return;
    }

    // 未登录时直接结束检查（AuthProvider 会处理重定向）
    if (!isLoggedIn) {
      setIsChecking(false);
      return;
    }

    // 无权限时执行重定向
    if (!isAllowed) {
      if (selectedRole) {
        router.replace(selectedRole === 'student' ? '/student/home' : `/${selectedRole}`);
      } else if (isStudent) {
        router.replace('/student/home');
      } else {
        router.replace('/teacher');
      }
    }

    // 短暂延迟确保状态更新后再显示内容
    const timer = setTimeout(() => setIsChecking(false), 50);
    return () => clearTimeout(timer);
  }, [isLoggedIn, isStudent, isAllowed, pathname, router, selectedRole]);

  // 检查中或不允许访问时显示空白/loading，防止页面闪现
  if (isChecking || !isAllowed) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#f5f5f5',
          zIndex: 9999
        }}
      />
    );
  }

  return <>{children}</>;
}
