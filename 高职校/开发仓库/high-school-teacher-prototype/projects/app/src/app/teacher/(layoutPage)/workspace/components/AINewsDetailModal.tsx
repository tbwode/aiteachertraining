'use client';

import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { AiSuggestion } from '@/teacher/types/aiTeacher';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '../constants';

type AINewsDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AiSuggestion | null;
  onMarkRead: (id: number) => void;
};

export function AINewsDetailModal({
  isOpen,
  onClose,
  suggestion,
  onMarkRead
}: AINewsDetailModalProps) {
  const { t } = useTranslation('teacher');

  if (!suggestion) return null;
  const isRead = suggestion.isRead === 1;

  const handleConfirm = () => {
    onMarkRead(suggestion.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent borderRadius="16px" maxW="480px" mx={4} bg="white">
        <ModalCloseButton
          top={5}
          right={5}
          color="gray.400"
          _hover={{ color: 'gray.500', bg: 'transparent' }}
          fontSize="20px"
          w="auto"
          h="auto"
        />

        <ModalBody px={6} py={5}>
          <HStack spacing={3} mb={5}>
            <Box
              px={3}
              py={1}
              borderRadius="6px"
              bg="rgba(22,119,255,0.08)"
              color="#1677FF"
              fontSize="14px"
              fontWeight={500}
            >
              {t('workspace.news_detail.tag')}
            </Box>
          </HStack>

          <Text fontSize="15px" fontWeight={600} color={TEXT_PRIMARY} mb={4} lineHeight="1.5">
            {suggestion.title}
          </Text>

          <Box mb={4}>
            <Text fontSize="13px" color={TEXT_SECONDARY} mb={2}>
              {t('workspace.news_detail.content_label')}
            </Text>
            <Box bg="#F5F6F8" borderRadius="8px" px={4} py={3}>
              <Text fontSize="13px" color="#374151" lineHeight="1.7">
                {suggestion.content}
              </Text>
            </Box>
          </Box>

          <Flex align="center" gap={3} mb={5} fontSize="13px" color={TEXT_SECONDARY}>
            {suggestion.relatedCourseName && (
              <Text>
                {t('workspace.news_detail.related_course')}
                <Text as="span" color="#374151" ml={1}>
                  {suggestion.relatedCourseName}
                </Text>
              </Text>
            )}
            {suggestion.relatedCourseName && suggestion.publishTime && (
              <Text as="span" color="#D1D5DB">
                |
              </Text>
            )}
            {suggestion.publishTime && (
              <Text>
                {t('workspace.news_detail.publish_time')}
                <Text as="span" color="#374151" ml={1}>
                  {suggestion.publishTime.split(' ')[0]}
                </Text>
              </Text>
            )}
          </Flex>

          <HStack spacing={3}>
            <Button
              flex={1}
              h="38px"
              bg="white"
              color="gray.600"
              fontSize="14px"
              fontWeight={400}
              borderRadius="6px"
              border="1px solid"
              borderColor="gray.300"
              _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
              onClick={onClose}
            >
              {t('workspace.news_detail.cancel')}
            </Button>
            <Button
              flex={1}
              h="38px"
              bg="#3D3D3D"
              color="white"
              fontSize="14px"
              fontWeight={400}
              borderRadius="6px"
              _hover={{ bg: '#2D2D2D' }}
              _disabled={{ bg: 'gray.300', color: 'gray.500', cursor: 'not-allowed', opacity: 1 }}
              isDisabled={isRead}
              onClick={handleConfirm}
            >
              {isRead ? t('workspace.news_detail.read') : t('workspace.news_detail.mark_read')}
            </Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
