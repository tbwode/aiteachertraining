'use client';
import React, { useEffect } from 'react';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { useRouter } from 'next/navigation';

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    const currentSearch =
      typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '';
    router.push(currentSearch ? `/login?${currentSearch}` : '/login');
  }, [router]);
  return <Loading></Loading>;
};

export default Index;
