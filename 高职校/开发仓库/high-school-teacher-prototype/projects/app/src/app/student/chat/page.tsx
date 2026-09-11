'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Flex } from '@chakra-ui/react';
import PageContainer from '@/components/PageContainer';

// 动态导入 PCChat 组件，避免 SSR 问题
const PCChat = dynamic(() => import('@/pageComponents/chat/ChatWindow/HuayunChat'), {
  ssr: false
});

export default function ChatPage() {
  return (
    <Flex h="100vh" w="100%" overflow="hidden" bg="white">
      <Box flex="1" h="100%">
        <PageContainer flex="1" h="100%" position="relative" p={0}>
          <PCChat />
        </PageContainer>
      </Box>
    </Flex>
  );
}
