'use client';

import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  Text,
  IconButton,
  Button
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

type ConfirmStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  action: 'onShelf' | 'offShelf';
};

export default function ConfirmStatusModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  action
}: ConfirmStatusModalProps) {
  const { t } = useTranslation('admin');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="12px" maxW="400px">
        <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
          <Flex justify="space-between" align="center">
            <Text fontSize="16px" fontWeight="500" color="#1D2129">
              {t('resource.confirmStatusModal.title', { action: t('resource.status.' + action) })}
            </Text>
            <IconButton
              aria-label={t('resource.actions.close')}
              icon={<CloseIcon w={3} h={3} />}
              variant="ghost"
              size="sm"
              onClick={onClose}
              color="#86909C"
              _hover={{ bg: 'transparent', color: '#4E5969' }}
            />
          </Flex>
        </ModalHeader>

        <ModalBody py={4} px={5}>
          <Text fontSize="14px" color="#4E5969">
            {t('resource.confirmStatusModal.confirmText', { action: t('resource.status.' + action), fileName })}
          </Text>
        </ModalBody>

        <ModalFooter py={4} px={5} justifyContent="flex-end" gap={2}>
          <Button
            h="36px"
            px={5}
            borderRadius="6px"
            borderColor="#D9D9D9"
            variant="outline"
            bg="white"
            color="#4E5969"
            fontSize="14px"
            fontWeight="400"
            onClick={onClose}
            _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
          >
            {t('resource.actions.cancel')}
          </Button>
          <Button
            h="36px"
            px={5}
            borderRadius="6px"
            bg="#2D2D2D"
            color="white"
            fontSize="14px"
            fontWeight="400"
            onClick={onConfirm}
            _hover={{ bg: '#1F1F1F' }}
          >
            {t('resource.actions.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
