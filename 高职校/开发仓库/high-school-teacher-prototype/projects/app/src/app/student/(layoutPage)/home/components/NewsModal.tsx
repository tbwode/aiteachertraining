'use client';

import { useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { NewsItem, SuggestionItem } from '../types';
import { NewsDetailModal } from './NewsDetailModal';

type NewsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  newsList: NewsItem[];
  suggestionList?: SuggestionItem[];
  onMarkRead?: (id: string) => void | Promise<void>;
  onMarkAllRead?: () => void | Promise<void>;
};

export function NewsModal({
  isOpen,
  onClose,
  newsList,
  suggestionList,
  onMarkRead,
  onMarkAllRead
}: NewsModalProps) {
  const { t } = useTranslation('student');
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const displayList = suggestionList && suggestionList.length > 0 ? suggestionList : newsList;

  const unreadCount = useMemo(
    () => displayList.filter((n) => !n.isRead).length,
    [displayList]
  );

  const handleOpenDetail = (item: NewsItem | SuggestionItem) => {
    if ('summary' in item) {
      setDetailItem(item as NewsItem);
    } else {
      setDetailItem({
        id: String(item.id),
        title: item.title,
        summary: item.content,
        content: item.content,
        relatedCourse: item.relatedCourseName,
        publishTime: item.publishTime,
        isRead: item.isRead === 1
      });
    }
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const handleMarkReadFromDetail = async () => {
    if (detailItem) {
      await onMarkRead?.(detailItem.id);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius="16px"
          mx={4}
          maxW="480px"
          overflow="hidden"
        >
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
              <Text>{t('home.news.modalTitle')}</Text>
              <Box
                as="button"
                onClick={onClose}
                color="#9CA3AF"
                _hover={{ color: '#1F2937' }}
                fontSize="24px"
                lineHeight="1"
                aria-label={t('home.news.closeAria')}
              >
                ×
              </Box>
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5} maxH="520px" overflowY="auto">
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="13px" color="#9CA3AF">
                {t('home.news.totalCount', { count: displayList.length })}
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
                  onClick={async () => await onMarkAllRead?.()}
                  _hover={{ bg: 'rgba(200, 0, 11, 0.06)' }}
                >
                  {t('home.news.markAllRead')}
                </Box>
              )}
            </Flex>

            <VStack spacing="12px" align="stretch">
              {displayList.map((item) => (
                <Box
                  key={item.id}
                  p="14px"
                  bg={item.isRead ? '#FFFFFF' : '#FAFBFC'}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="#F2F3F5"
                  transition="background 0.2s ease"
                  cursor="pointer"
                  onClick={() => handleOpenDetail(item)}
                  _hover={{ bg: item.isRead ? '#F9FAFB' : '#F0F1F3' }}
                >
                  <Flex justify="space-between" align="flex-start" gap={2}>
                    <Text
                      fontSize="14px"
                      fontWeight={500}
                      color="#1F2937"
                      lineHeight="20px"
                      flex={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      as="span"
                      fontSize="12px"
                      color={item.isRead ? '#9CA3AF' : '#C8000B'}
                      fontWeight={500}
                      whiteSpace="nowrap"
                      flexShrink={0}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!item.isRead) {
                          await onMarkRead?.(String(item.id));
                        }
                      }}
                      cursor="pointer"
                      bg="#FFFFFF"
                      borderRadius="4px"
                      px="8px"
                      py="2px"
                    >
                      {t('home.news.markRead')}
                    </Text>
                  </Flex>
                  <Text fontSize="12px" color="#9CA3AF" mt="6px" lineHeight="18px" noOfLines={2}>
                    {'summary' in item ? item.summary : item.content}
                  </Text>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <NewsDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        item={detailItem}
        onMarkRead={handleMarkReadFromDetail}
      />
    </>
  );
}
