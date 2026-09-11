'use client';

import { Box, Button, Flex, Text } from '@chakra-ui/react';

export type AICourseCreateCardProps = {
  title?: string;
  subtitle?: string;
  courseName?: string;
  courseType?: string;
  onGenerate?: () => void;
};

export default function AICourseCreateCard({
  title = 'AI 互动课创建就绪',
  subtitle = '已为您匹配课程主题，可一键创建',
  courseName,
  courseType = 'AI 互动课',
  onGenerate,
}: AICourseCreateCardProps) {
  return (
    <Box w="100%">
      {/* 头部区域 */}
      <Flex align="flex-start" gap="12px" mb="16px">
        <Flex
          w="36px"
          h="36px"
          borderRadius="50%"
          bg="#FFF0F0"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z"
              fill="#C8000B"
            />
          </svg>
        </Flex>
        <Box>
          <Text fontSize="15px" color="#333" fontWeight="600" lineHeight="1.4">
            {title}
          </Text>
          <Text fontSize="13px" color="#86909C" lineHeight="1.5" mt="2px">
            {subtitle}
          </Text>
        </Box>
      </Flex>

      {/* 分隔线 */}
      <Box w="100%" h="1px" bg="#F2F3F5" mb="16px" />

      {/* 信息行 */}
      <Box mb="20px">
        <Flex justify="space-between" align="center" mb="12px">
          <Text fontSize="14px" color="#86909C">
            课程主题
          </Text>
          <Text fontSize="14px" color="#333" fontWeight="500">
            {courseName || '—'}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text fontSize="14px" color="#86909C">
            课件类型
          </Text>
          <Text fontSize="14px" color="#C8000B" fontWeight="500">
            {courseType}
          </Text>
        </Flex>
      </Box>

      {/* 生成按钮 */}
      <Button
        w="100%"
        h="44px"
        bg="#C8000B"
        color="#fff"
        borderRadius="8px"
        fontSize="15px"
        fontWeight="500"
        leftIcon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
        _hover={{ bg: '#a00008' }}
        onClick={onGenerate}
      >
        一键生成 AI 课
      </Button>
    </Box>
  );
}
