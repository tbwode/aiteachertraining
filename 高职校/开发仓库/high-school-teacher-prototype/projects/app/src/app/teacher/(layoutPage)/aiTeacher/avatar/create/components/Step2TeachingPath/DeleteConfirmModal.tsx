'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Flex,
  Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';

export type DeleteType = 'chapter' | 'section';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleteType: DeleteType;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleteType
}: DeleteConfirmModalProps) {
  const { t } = useTranslation('teacher');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
      <ModalContent borderRadius="16px" maxW="480px" mx={4}>
        <ModalHeader
          display="flex"
          alignItems="center"
          gap={3}
          pt={6}
          pb={4}
          px={6}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <Flex
            w={10}
            h={10}
            bg="red.50"
            borderRadius="full"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize="xl" color="red.500">
              &#9432;
            </Text>
          </Flex>
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            {t('aiTeacher.avatar.edit.chapters.deleteConfirm')}
          </Text>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody px={6} py={6}>
          <Text fontSize="md" color="gray.700" lineHeight="1.6">
            {deleteType === 'chapter'
              ? t('aiTeacher.avatar.edit.chapters.deleteChapterMessage')
              : t('aiTeacher.avatar.edit.chapters.deleteSectionMessage')}
          </Text>
        </ModalBody>
        <ModalFooter px={6} pb={6} pt={4} gap={3} justifyContent="flex-end">
          <Button
            variant="outline"
            onClick={onClose}
            px={8}
            h={10}
            borderRadius="8px"
            bg="white"
            borderColor="gray.800"
            color="gray.800"
            _hover={{ bg: 'gray.50', borderColor: 'gray.900' }}
          >
            {t('aiTeacher.avatar.common.actions.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            px={8}
            h={10}
            borderRadius="8px"
            bg="gray.800"
            color="white"
            _hover={{ bg: 'gray.900' }}
          >
            {t('aiTeacher.avatar.edit.chapters.confirmDelete')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
