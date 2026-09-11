'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/auth';

const LOGIN_PATH = '/login';
const HOME_PATH = '/teacher';

export function TeacherRouteGuard({ children }: { children: ReactNode }) {
  const { user, isReady, selectedRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !pathname) return;

    const currentSearch = typeof window === 'undefined' ? '' : window.location.search;

    // 未登录，重定向到统一登录页
    if (!user) {
      router.replace(`${LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 已登录但未选择角色，允许访问（让 layout 处理）
    if (user && !selectedRole) {
      return;
    }

    // 已登录且选择了角色，但不是教师端
    if (user && selectedRole && selectedRole !== 'teacher') {
      router.replace(`/${selectedRole}`);
      return;
    }
  }, [isReady, pathname, router, user, selectedRole]);

  if (!isReady) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return <>{children}</>;
}
