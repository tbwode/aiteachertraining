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
  Text,
  VStack,
  Box,
  Divider
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { MaterialWithRecordVO } from '@/teacher/types/aiTeacher';

type SaveConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialWithRecordVO[];
  onConfirm: () => void;
};

export function SaveConfirmModal({ isOpen, onClose, materials, onConfirm }: SaveConfirmModalProps) {
  const { t } = useTranslation('teacher');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
      <ModalContent borderRadius="16px" maxW="520px" mx={4}>
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
            {t('aiTeacher.avatar.edit.saveConfirmModal.title')}
          </Text>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody px={6} py={5}>
          <VStack spacing={3} align="stretch">
            {materials.map((material) => (
              <Flex
                key={material.id}
                align="center"
                gap={2}
                py={2}
                px={3}
                bg="gray.50"
                borderRadius="md"
              >
                <Text fontSize="sm" color="gray.700" noOfLines={1} flex={1}>
                  {material.fileName}
                </Text>
                <Text fontSize="sm" color="gray.500" flexShrink={0}>
                  {t('aiTeacher.avatar.edit.saveConfirmModal.studentCount', {
                    count: material.studentCount
                  })}
                </Text>
              </Flex>
            ))}
          </VStack>
          <Box mt={4}>
            <Divider mb={3} />
            <Text fontSize="sm" color="gray.500" lineHeight="1.6">
              {t('aiTeacher.avatar.edit.saveConfirmModal.hint')}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter px={6} pb={6} pt={4} gap={3} justifyContent="flex-end">
          <Button
            variant="outline"
            onClick={onClose}
            px={8}
            h={10}
            borderRadius="8px"
            bg="white"
            borderColor="gray.300"
            color="gray.600"
            _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
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
            {t('aiTeacher.avatar.common.actions.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
