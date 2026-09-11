'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Flex, Image, Text, SimpleGrid } from '@chakra-ui/react';
import { ChatRoleEnum, ChatStatusEnum, ChatItemValueTypeEnum } from '@fastgpt/global/core/chat/constants';
import type { ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import Markdown from '@/components/Markdown';

interface ChatMessageItemProps {
  item: ChatSiteItemType;
  index: number;
  isLast: boolean;
  isChatting: boolean;
  userAvatar?: string;
  appAvatar?: string;
  onResend?: (dataId: string) => void;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
}

function useTypingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return dots;
}

export default function ChatMessageItem({
  item,
  index,
  isLast,
  isChatting,
  userAvatar,
  appAvatar,
  onResend,
  onLike,
  onDislike,
  onRegenerate
}: ChatMessageItemProps) {
  const { isPc } = useSystem();
  const isHuman = item.obj === ChatRoleEnum.Human;
  const isLoading = isLast && item.obj === ChatRoleEnum.AI && item.status === ChatStatusEnum.loading;
  const typingDots = useTypingDots();

  const content = useMemo(() => {
    if (!item.value) return '';
    return item.value
      .map((v) => {
        if (v.type === ChatItemValueTypeEnum.text && v.text?.content) {
          return v.text.content;
        }
        return '';
      })
      .join('');
  }, [item.value]);

  const fileValues = useMemo(() => {
    if (!item.value) return [];
    return item.value.filter((v) => v.type === ChatItemValueTypeEnum.file && v.file);
  }, [item.value]);

  return (
    <Flex
      w="100%"
      justify={isHuman ? 'flex-end' : 'flex-start'}
      py={3}
      px={isPc ? 4 : 2}
    >
      {!isHuman && (
        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bg="primary.50"
          mr={3}
          flexShrink={0}
          bgImage={appAvatar || '/icon/logo.png'}
          bgSize="cover"
          bgPosition="center"
        />
      )}

      <Flex flexDir="column" maxW={isPc ? '70%' : '80%'} alignItems={isHuman ? 'flex-end' : 'flex-start'}>
        <Box
          px={4}
          py={2.5}
          borderRadius={isHuman ? '16px 16px 0 16px' : '0 16px 16px 16px'}
          bg={isHuman ? 'primary.600' : 'gray.50'}
          color={isHuman ? 'white' : 'gray.800'}
          fontSize="14px"
          lineHeight="1.6"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
          sx={isHuman ? { '& a': { color: 'white', textDecoration: 'underline' } } : undefined}
        >
          {fileValues.length > 0 && (
            <Flex flexDir="column" gap={2} mb={content ? 2 : 0}>
              {fileValues.map((v: any, idx: number) =>
                v.file?.type === 'image' ? (
                  <Box
                    key={idx}
                    bg="white"
                    borderRadius="12px"
                    overflow="hidden"
                    boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                    p={1}
                    display="inline-block"
                  >
                    <Image
                      src={v.file.url}
                      alt={v.file.name || ''}
                      maxW="200px"
                      maxH="200px"
                      borderRadius="10px"
                      objectFit="cover"
                    />
                  </Box>
                ) : (
                  <Flex
                    key={idx}
                    alignItems="center"
                    gap={3}
                    bg="white"
                    px={3}
                    py={2.5}
                    borderRadius="12px"
                    fontSize="13px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                    maxW="260px"
                    cursor="pointer"
                    as="a"
                    href={v.file?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    _hover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  >
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="8px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      fontSize="18px"
                    >
                      📄
                    </Box>
                    <Flex flexDir="column" minW={0} flex={1}>
                      <Text
                        fontSize="13px"
                        fontWeight="500"
                        color="gray.800"
                        isTruncated
                      >
                        {v.file?.name || '文件'}
                      </Text>
                      <Text fontSize="12px" color="gray.400" mt="2px">
                        {(v.file?.name || '').split('.').pop()?.toUpperCase() || 'FILE'}
                      </Text>
                    </Flex>
                  </Flex>
                )
              )}
            </Flex>
          )}
          {isHuman ? content : <Markdown source={content || ''} />}
        </Box>

        {isLast && isHuman && onResend && (
          <Flex mt={1} gap={2}>
            <Text
              fontSize="12px"
              color="gray.400"
              cursor="pointer"
              _hover={{ color: 'primary.500' }}
              onClick={() => onResend(item.dataId)}
            >
              重发
            </Text>
          </Flex>
        )}

        {!isHuman && (
          <Flex mt={1} gap={3} alignItems="center">
            {isLoading && (
              <Text fontSize="12px" color="gray.400">生成中{typingDots}</Text>
            )}
            {onRegenerate && (
              <Box
                as="button"
                title="重新生成"
                cursor="pointer"
                color="gray.400"
                _hover={{ color: 'primary.500' }}
                onClick={onRegenerate}
                lineHeight="1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </Box>
            )}
            {onLike && (
              <Box
                as="button"
                title="点赞"
                cursor="pointer"
                color={(item as any).feedbackType === '1' ? 'primary.500' : 'gray.400'}
                _hover={{ color: 'primary.500' }}
                onClick={onLike}
                lineHeight="1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </Box>
            )}
            {onDislike && (
              <Box
                as="button"
                title="踩"
                cursor="pointer"
                color={(item as any).feedbackType === '2' ? 'red.400' : 'gray.400'}
                _hover={{ color: 'red.400' }}
                onClick={onDislike}
                lineHeight="1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                </svg>
              </Box>
            )}
          </Flex>
        )}
      </Flex>

      {isHuman && (
        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bg="gray.200"
          ml={3}
          flexShrink={0}
          bgImage={userAvatar || '/icon/user.png'}
          bgSize="cover"
          bgPosition="center"
        />
      )}
    </Flex>
  );
}
