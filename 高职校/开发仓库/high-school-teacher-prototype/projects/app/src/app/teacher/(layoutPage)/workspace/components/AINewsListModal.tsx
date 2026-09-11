'use client';

import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AiSuggestion } from '@/teacher/types/aiTeacher';

type AINewsListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  courseName?: string;
  newsList: AiSuggestion[];
  onItemClick: (suggestion: AiSuggestion) => void;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
};

export function AINewsListModal({
  isOpen,
  onClose,
  courseName,
  newsList,
  onItemClick,
  onMarkAllRead,
  isMarkingAll
}: AINewsListModalProps) {
  const { t } = useTranslation('teacher');

  const unreadCount = useMemo(
    () => newsList.filter((item) => item.isRead !== 1).length,
    [newsList]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="16px" mx={4} maxW="480px" overflow="hidden">
        <ModalHeader
          fontSize="16px"
          fontWeight={500}
          color="#1F2937"
          py={4}
          px={5}
          borderBottom="1px solid"
          borderColor="#F2F3F5"
        >
          <Flex justify="space-between" align="center">
            <Text>
              {t('workspace.ai_news_list.title')}
              {courseName ? ` - ${courseName}` : ''}
            </Text>
            <Box
              as="button"
              onClick={onClose}
              color="#9CA3AF"
              _hover={{ color: '#1F2937' }}
              fontSize="24px"
              lineHeight="1"
            >
              ×
            </Box>
          </Flex>
        </ModalHeader>

        <ModalBody py={4} px={5} maxH="520px" overflowY="auto">
          {newsList.length === 0 ? (
            <Flex h="180px" align="center" justify="center" direction="column" gap={1.5}>
              <Text fontSize="13px" color="#6B7280">
                {t('workspace.ai_news.empty_course')}
              </Text>
              <Text fontSize="11px" color="#9CA3AF">
                {t('workspace.ai_news_list.empty_hint')}
              </Text>
            </Flex>
          ) : (
            <>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="13px" color="#333">
                  {t('workspace.ai_news_list.unread_count', { count: unreadCount })}
                </Text>
                {unreadCount > 0 && (
                  <Box
                    as="button"
                    fontSize="13px"
                    color="#C8000B"
                    fontWeight={500}
                    border="1px solid"
                    borderColor="#F2F3F5"
                    borderRadius="999px"
                    px="12px"
                    py="4px"
                    onClick={!isMarkingAll ? onMarkAllRead : undefined}
                    opacity={isMarkingAll ? 0.5 : 1}
                    cursor={isMarkingAll ? 'default' : 'pointer'}
                    _hover={!isMarkingAll ? { bg: 'rgba(200, 0, 11, 0.06)' } : {}}
                  >
                    {isMarkingAll
                      ? t('workspace.ai_news_list.marking')
                      : t('workspace.ai_news_list.mark_all_read')}
                  </Box>
                )}
              </Flex>

              <VStack spacing="12px" align="stretch">
                {newsList.map((item) => {
                  const isRead = item.isRead === 1;
                  return (
                    <Box
                      key={item.id}
                      p="14px"
                      bg={isRead ? '#FFFFFF' : '#FAFBFC'}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor="#F2F3F5"
                      transition="background 0.2s ease"
                      cursor="pointer"
                      onClick={() => onItemClick(item)}
                      _hover={{ bg: isRead ? '#F9FAFB' : '#F0F1F3' }}
                    >
                      <Flex justify="space-between" align="flex-start" gap={2}>
                        <Text
                          fontSize="14px"
                          fontWeight={500}
                          color="#1F2937"
                          lineHeight="20px"
                          flex={1}
                          noOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text
                          as="span"
                          fontSize="12px"
                          color={isRead ? '#9CA3AF' : '#C8000B'}
                          fontWeight={500}
                          whiteSpace="nowrap"
                          flexShrink={0}
                          bg="#FFFFFF"
                          borderRadius="4px"
                          px="8px"
                          py="2px"
                        >
                          {item.publishTime ? item.publishTime.split(' ')[0] : ''}
                        </Text>
                      </Flex>
                      <Text
                        fontSize="12px"
                        color="#9CA3AF"
                        mt="6px"
                        lineHeight="18px"
                        noOfLines={2}
                      >
                        {item.content}
                      </Text>
                    </Box>
                  );
                })}
              </VStack>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
