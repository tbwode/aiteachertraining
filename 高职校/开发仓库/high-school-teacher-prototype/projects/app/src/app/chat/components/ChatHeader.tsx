'use client';

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/auth';

interface ChatHeaderProps {
  appName?: string;
  appAvatar?: string;
}

export default function ChatHeader({ appName, appAvatar }: ChatHeaderProps) {
  const router = useRouter();
  const { isStudent, isTeacher } = useAuth();

  const handleBack = () => {
    if (isTeacher) {
      router.push('/teacher/agent-plaza');
    } else if (isStudent) {
      router.push('/student/agents');
    } else {
      router.back();
    }
  };

  return (
    <Flex
      h="56px"
      alignItems="center"
      justifyContent="center"
      px={4}
      borderBottom="1px solid #E5E7EB"
      bg="white"
      gap={2}
      position="relative"
    >
      <Flex
        as="button"
        type="button"
        alignItems="center"
        justifyContent="center"
        w="32px"
        h="32px"
        borderRadius="8px"
        cursor="pointer"
        transition="background-color 0.2s"
        bg="transparent"
        _hover={{ bg: 'rgba(0,0,0,0.06)' }}
        position="absolute"
        left={4}
        onClick={handleBack}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          color="#374151"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Flex>

      {appAvatar && (
        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bgImage={appAvatar}
          bgSize="cover"
          bgPosition="center"
        />
      )}
      <Text fontWeight="600" fontSize="16px" color="gray.800">
        {appName || 'AI 助手'}
      </Text>
    </Flex>
  );
}
