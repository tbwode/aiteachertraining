'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Flex } from '@chakra-ui/react';
import PageContainer from '@/components/PageContainer';

const PCChat = dynamic(() => import('./components/PCChat'), {
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
