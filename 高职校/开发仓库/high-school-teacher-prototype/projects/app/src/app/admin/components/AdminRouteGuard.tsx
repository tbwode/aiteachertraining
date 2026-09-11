'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/auth';

const LOGIN_PATH = '/login';
const HOME_PATH = '/admin';

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !pathname) return;

    const isLoginPage = pathname === LOGIN_PATH;
    const currentSearch = typeof window === 'undefined' ? '' : window.location.search;

    if (!user && !isLoginPage) {
      const redirectPath = `${pathname}${currentSearch}`;
      router.replace(`${LOGIN_PATH}?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (user && isLoginPage) {
      const redirect = new URLSearchParams(currentSearch).get('redirect');
      const nextPath =
        redirect && redirect.startsWith('/admin') && redirect !== LOGIN_PATH ? redirect : HOME_PATH;

      router.replace(nextPath);
    }
  }, [isReady, pathname, router, user]);

  const isLoginPage = pathname === LOGIN_PATH;

  if (!isReady || (!user && !isLoginPage) || (user && isLoginPage)) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return <>{children}</>;
}
