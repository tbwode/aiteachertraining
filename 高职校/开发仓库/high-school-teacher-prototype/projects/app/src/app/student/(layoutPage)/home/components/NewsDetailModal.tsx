'use client';

import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { NewsItem } from '../types';

type NewsDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: NewsItem | null;
  onMarkRead?: () => void | Promise<void>;
};

export function NewsDetailModal({ isOpen, onClose, item, onMarkRead }: NewsDetailModalProps) {
  const { t } = useTranslation('student');

  if (!item) return null;

  return (
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
            <Text>{t('home.news.title')}</Text>
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

        <ModalBody py={5} px={5} maxH="600px" overflowY="auto">
          <Text fontSize="16px" fontWeight={500} color="#1F2937" lineHeight="24px" mb={4}>
            {item.title}
          </Text>

          <Text fontSize="13px" fontWeight={500} color="#1F2937" mb={2}>
            {t('home.news.detailContentLabel')}
          </Text>
          <Text fontSize="13px" color="#6B7280" lineHeight="22px" mb={5} whiteSpace="pre-line">
            {item.content}
          </Text>

          <Flex gap={4} mb={6}>
            <Text fontSize="12px" color="#9CA3AF">
              {t('home.news.relatedCourse')}: {item.relatedCourse}
            </Text>
            <Text fontSize="12px" color="#9CA3AF">
              {t('home.news.publishTime')}: {item.publishTime}
            </Text>
          </Flex>

          <Flex justify="flex-end" gap={3}>
            {!item.isRead ? (
              <>
                <Button
                  variant="outline"
                  h="40px"
                  px={6}
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={400}
                  borderColor="#E5E7EB"
                  color="#4E5969"
                  _hover={{ bg: '#F9FAFB' }}
                  onClick={onClose}
                >
                  {t('home.news.cancel')}
                </Button>
                <Button
                  h="40px"
                  px={6}
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={400}
                  bg="#1F2937"
                  color="white"
                  _hover={{ bg: '#111827' }}
                  onClick={async () => {
                    await onMarkRead?.();
                    onClose();
                  }}
                >
                  {t('home.news.markRead')}
                </Button>
              </>
            ) : (
              <Button
                h="40px"
                px={6}
                borderRadius="8px"
                fontSize="14px"
                fontWeight={400}
                bg="#E5E7EB"
                color="#9CA3AF"
                cursor="default"
                _hover={{ bg: '#E5E7EB' }}
                isDisabled
              >
                {t('home.news.alreadyRead')}
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
