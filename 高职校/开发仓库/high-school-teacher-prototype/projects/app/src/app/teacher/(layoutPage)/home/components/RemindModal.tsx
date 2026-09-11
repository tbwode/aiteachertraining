/**
 * 提醒确认弹窗组件
 */

import {
  Box,
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
import type { StudentTodo } from '../constants';

type RemindModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentTodo | null;
  onConfirm: () => void;
};

export function RemindModal({ isOpen, onClose, student, onConfirm }: RemindModalProps) {
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
              bg="rgba(250,173,20,0.1)"
              borderRadius="full"
              align="center"
              justify="center"
            >
              <Text fontSize="2xl">🔔</Text>
            </Flex>
            <Text fontSize="lg" fontWeight={600} color="gray.800">
              {t('home.remind_modal.title')}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('home.remind_modal.confirm_message', { name: student?.name })}
            </Text>
            <Box bg="gray.50" p={3} borderRadius="lg" w="full">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('home.remind_modal.content_label')}
              </Text>
              <Text fontSize="sm" color="gray.700">
                {t('home.remind_modal.content_text')}
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button flex="1" onClick={onConfirm}>
            {t('home.remind_modal.send_button')}
          </Button>
          <Button flex="1" variant="outline" bg="white" color="gray.700" onClick={onClose}>
            {t('home.remind_modal.cancel_button')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
