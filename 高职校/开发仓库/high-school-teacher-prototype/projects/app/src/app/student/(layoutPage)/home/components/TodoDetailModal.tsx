'use client';

import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { TodoItem } from '../types';

type TodoDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: TodoItem | null;
  onMarkRead?: () => void;
};

export function TodoDetailModal({
  isOpen,
  onClose,
  item,
  onMarkRead
}: TodoDetailModalProps) {
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
            <Text>{t('home.todo.detailTitle')}</Text>
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

        <ModalBody py={5} px={5}>
          {/* Teacher info card */}
          <Flex
            align="center"
            gap="12px"
            bg="#FAFBFC"
            borderRadius="12px"
            p="16px"
            mb="20px"
          >
            <Box
              w="40px"
              h="40px"
              borderRadius="full"
              bg="#EBF0FE"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="8" r="4" stroke="#6B7280" strokeWidth="1.5" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight={500} color="#1F2937">
                {item.teacherName}
              </Text>
              <Text fontSize="13px" color="#9CA3AF">
                {item.className}
              </Text>
            </Box>
          </Flex>

          {/* Course info */}
          <Flex align="center" gap="6px" mb="20px">
            <Box w="4px" h="14px" borderRadius="999px" bg="#C8000B" />
            <Text fontSize="14px" fontWeight={500} color="#1F2937">
              {t('home.todoDetail.courseLabel')}：{item.courseName}
            </Text>
          </Flex>

          {/* Data rows */}
          <VStack spacing="16px" align="stretch" mb="20px">
            <DataRow label={t('home.todoDetail.currentProgress')} value={`${item.progress ?? 0}%`} valueColor="#C8000B" />
            <DataRow label={t('home.todoDetail.studyDuration')} value={item.studyDuration ?? t('home.todoDetail.durationFallback')} />
            <DataRow label={t('home.todoDetail.lastStudy')} value={item.lastStudyTime ?? t('home.todoDetail.lastStudyFallback')} />
          </VStack>

          {/* Lag analysis */}
          <Box
            bg="#FFF8F0"
            borderRadius="12px"
            p="16px"
            mb="24px"
            mt="20px"
          >
            <Text fontSize="14px" fontWeight={500} color="#D97706" mb="6px">
              {t('home.todoDetail.lagAnalysis')}
            </Text>
            <Text fontSize="13px" color="#D97706">
              {item.lagReason}
            </Text>
          </Box>

          {/* Footer buttons */}
          <Flex justify="flex-end" gap="12px">
            {!item.isRead ? (
              <>
                <Box
                  as="button"
                  fontSize="14px"
                  fontWeight={500}
                  color="#1F2937"
                  bg="#FFFFFF"
                  border="1px solid"
                  borderColor="#E5E7EB"
                  borderRadius="8px"
                  px="20px"
                  py="8px"
                  onClick={onClose}
                  _hover={{ bg: '#F9FAFB' }}
                >
                  {t('home.news.cancel')}
                </Box>
                <Box
                  as="button"
                  fontSize="14px"
                  fontWeight={500}
                  color="#FFFFFF"
                  bg="#1F2937"
                  borderRadius="8px"
                  px="20px"
                  py="8px"
                  onClick={() => {
                    onMarkRead?.();
                    onClose();
                  }}
                  _hover={{ bg: '#374151' }}
                >
                  {t('home.news.markRead')}
                </Box>
              </>
            ) : (
              <Box
                fontSize="14px"
                fontWeight={500}
                color="#FFFFFF"
                bg="#D1D5DB"
                borderRadius="8px"
                px="20px"
                py="8px"
              >
                {t('home.news.alreadyRead')}
              </Box>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function DataRow({
  label,
  value,
  valueColor = '#1F2937'
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="14px" color="#9CA3AF">{label}</Text>
      <Text fontSize="14px" fontWeight={500} color={valueColor}>{value}</Text>
    </Flex>
  );
}

function VStack({
  children,
  spacing,
  align = 'stretch'
}: {
  children: React.ReactNode;
  spacing?: string;
  align?: string;
}) {
  return (
    <Box display="flex" flexDirection="column" gap={spacing} alignItems={align}>
      {children}
    </Box>
  );
}
