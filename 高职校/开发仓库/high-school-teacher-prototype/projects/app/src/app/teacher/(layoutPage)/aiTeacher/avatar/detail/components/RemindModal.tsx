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
import type { StudentData } from '../constants';
import { WARNING_COLOR } from '../constants';

type RemindModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData | null;
  onConfirm: () => void;
};

export function RemindModal({ isOpen, onClose, student, onConfirm }: RemindModalProps) {
  const { t } = useTranslation('teacher');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(17,24,39,0.58)" backdropFilter="blur(3px)" />
      <ModalContent
        mx={3}
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 24px 70px rgba(31,35,41,0.24)"
        overflow="hidden"
      >
        <ModalBody px={{ base: 4, md: 6 }} pt={6} pb={6}>
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
              {t('aiTeacher.avatar.detail.remindModal.title')}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {t('aiTeacher.avatar.detail.remindModal.confirm', { name: student?.name })}
            </Text>
            <Box bg="gray.50" p={3} borderRadius="lg" w="full">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('aiTeacher.avatar.detail.remindModal.contentLabel')}
              </Text>
              <Text fontSize="sm" color="gray.700">
                {t('aiTeacher.avatar.detail.remindModal.content')}
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          gap={3}
          px={{ base: 4, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor="#F0F1F3"
          bg="#FAFAFB"
        >
          <Button flex="1" onClick={onConfirm}>
            {t('aiTeacher.avatar.detail.remindModal.confirmSend')}
          </Button>
          <Button flex="1" variant="outline" bg="white" color="gray.700" onClick={onClose}>
            {t('aiTeacher.avatar.common.actions.cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
