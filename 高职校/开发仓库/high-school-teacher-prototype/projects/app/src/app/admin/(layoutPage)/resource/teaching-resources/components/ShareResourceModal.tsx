'use client';

import { useState, useEffect } from 'react';
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
  Box,
  Switch,
  useToast
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { updateResource } from '@/api/admin/resource-center/teaching-resource';
import type { ResourceVO } from '@/types/api/admin/resource-center/teaching-resource';

type ShareResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceVO | null;
  onSuccess?: () => void;
};

export default function ShareResourceModal({
  isOpen,
  onClose,
  resource,
  onSuccess
}: ShareResourceModalProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const [isShared, setIsShared] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resource && isOpen) {
      // 回显 shareScope：1-个人(关)，2-全校(开)
      setIsShared(resource.shareScope === 2);
    }
  }, [resource, isOpen]);

  const handleConfirm = async () => {
    if (!resource) return;

    setIsLoading(true);
    try {
      // shareScope: 1-个人，2-全校
      await updateResource({
        id: resource.id,
        shareScope: isShared ? 2 : 1
      });
      toast({
        title: t('resource.shareModal.updateSuccess'),
        status: 'success',
        duration: 1500
      });
      onSuccess?.();
      onClose();
    } catch {
      toast({
        title: t('resource.shareModal.updateFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered closeOnOverlayClick={!isLoading}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="12px" maxW="400px">
        <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
          <Flex justify="space-between" align="center">
            <Text fontSize="16px" fontWeight="500" color="#1D2129">
              {t('resource.shareModal.title')}
            </Text>
            <IconButton
              aria-label={t('resource.actions.close')}
              icon={<CloseIcon w={3} h={3} />}
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              color="#86909C"
              _hover={{ bg: 'transparent', color: '#4E5969' }}
            />
          </Flex>
        </ModalHeader>

        <ModalBody py={4} px={5}>
          <Text fontSize="14px" color="#1D2129" fontWeight="500" mb={3}>
            {t('resource.shareModal.shareToLibrary')}
          </Text>
          <Flex align="center" gap={3}>
            <Switch
              isChecked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              disabled={isLoading}
              sx={{
                '& .chakra-switch__track': {
                  bg: isShared ? '#C8000B' : '#E5E6EB'
                },
                '& .chakra-switch__thumb': {
                  bg: 'white'
                }
              }}
            />
            <Text fontSize="13px" color="#4E5969">
              {t('resource.shareModal.shareDescription')}
            </Text>
          </Flex>
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
            disabled={isLoading}
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
            onClick={handleConfirm}
            isLoading={isLoading}
            _hover={{ bg: '#1F1F1F' }}
          >
            {t('resource.actions.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
