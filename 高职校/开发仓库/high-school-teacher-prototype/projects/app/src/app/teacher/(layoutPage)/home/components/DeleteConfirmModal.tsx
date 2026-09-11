/**
 * AI分身删除确认弹窗
 */

import {
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalContent,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  avatarTitle: string;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  isOpen,
  onClose,
  avatarTitle,
  onConfirm
}: DeleteConfirmModalProps) {
  const { t } = useTranslation('teacher');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent borderRadius="xl">
        <ModalBody pt={6} pb={6}>
          <VStack spacing={4}>
            <Flex
              w="48px"
              h="48px"
              bg="rgba(200,62,62,0.1)"
              borderRadius="full"
              align="center"
              justify="center"
            >
              <Text fontSize="2xl">🗑️</Text>
            </Flex>
            <Text fontSize="lg" fontWeight={600} color="gray.800">
              {t('home.delete_modal.title')}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('home.delete_modal.message', { title: avatarTitle })}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button flex="1" variant="outline" bg="white" color="gray.700" onClick={onClose}>
            {t('home.delete_modal.cancel')}
          </Button>
          <Button
            flex="1"
            bg="#C83E3E"
            color="white"
            borderColor="#C83E3E"
            _hover={{ bg: '#A83232', borderColor: '#A83232' }}
            onClick={onConfirm}
          >
            {t('home.delete_modal.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
