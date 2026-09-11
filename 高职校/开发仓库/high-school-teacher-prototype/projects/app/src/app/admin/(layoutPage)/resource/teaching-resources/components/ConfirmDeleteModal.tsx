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
  Button,
  Box
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count?: number;
  fileName?: string;
};

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  fileName
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation('admin');
  const isBatch = count !== undefined && count > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="12px" maxW="400px">
        <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={2}>
              <Box
                w="20px"
                h="20px"
                borderRadius="full"
                bg="#F53F3F"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="12px" color="white" fontWeight="600">
                  !
                </Text>
              </Box>
              <Text fontSize="16px" fontWeight="500" color="#1D2129">
                {isBatch ? t('resource.confirmDeleteModal.batchTitle') : t('resource.confirmDeleteModal.singleTitle')}
              </Text>
            </Flex>
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
            {isBatch
              ? t('resource.confirmDeleteModal.batchText', { count })
              : t('resource.confirmDeleteModal.singleText', { fileName })}
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
