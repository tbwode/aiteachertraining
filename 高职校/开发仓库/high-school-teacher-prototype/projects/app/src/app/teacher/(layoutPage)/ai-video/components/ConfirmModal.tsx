'use client';

/**
 * AI视频课 通用二次确认弹窗
 */
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_HOVER } from '../constants';

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  danger = false
}: ConfirmModalProps) {
  const { t } = useTranslation('teacher');
  const confirmBg = danger ? '#C83E3E' : AI_VIDEO_PRIMARY;
  const confirmHoverBg = danger ? '#A83232' : AI_VIDEO_PRIMARY_HOVER;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent borderRadius="xl">
        <ModalBody pt={6} pb={2}>
          <VStack spacing={3}>
            <Text fontSize="lg" fontWeight={600} color="gray.800">
              {title}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center" whiteSpace="pre-line">
              {message}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3} pt={4}>
          <Button flex="1" variant="outline" bg="white" color="gray.700" onClick={onClose}>
            {cancelText ?? t('aiVideo.common.cancel')}
          </Button>
          <Button
            flex="1"
            bg={confirmBg}
            color="white"
            borderColor={confirmBg}
            _hover={{ bg: confirmHoverBg, borderColor: confirmHoverBg }}
            onClick={onConfirm}
          >
            {confirmText ?? t('aiVideo.common.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
