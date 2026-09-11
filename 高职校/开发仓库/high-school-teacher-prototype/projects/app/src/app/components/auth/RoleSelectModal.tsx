'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';

export type UserRole = 'teacher' | 'student' | 'admin';

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (role: UserRole) => void;
}

const roles = [
  {
    id: 'teacher' as UserRole,
    title: '教师端',
    description: '教学管理、课程设计',
    icon: 'user',
    color: 'blue.500',
    bgColor: 'blue.50'
  },
  {
    id: 'student' as UserRole,
    title: '学生端',
    description: '课程学习、AI 答疑',
    icon: 'book',
    color: 'green.500',
    bgColor: 'green.50'
  }
];

export function RoleSelectModal({ isOpen, onClose, onSelect }: RoleSelectModalProps) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={4}>
        <ModalHeader textAlign="center" fontSize="xl" pb={2}>
          选择进入身份
        </ModalHeader>
        <ModalBody>
          <Text textAlign="center" color="gray.500" fontSize="sm" mb={6}>
            登录成功，请选择您要进入的系统
          </Text>
          <HStack spacing={4} justify="center">
            {roles.map((role) => (
              <Box
                key={role.id}
                as="button"
                onClick={() => onSelect(role.id)}
                flex="1"
                maxW="200px"
                p={6}
                bg={cardBg}
                border="2px solid"
                borderColor={borderColor}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: role.color,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                }}
              >
                <VStack spacing={3}>
                  <Box
                    w="56px"
                    h="56px"
                    borderRadius="full"
                    bg={role.bgColor}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MyIcon name={role.icon as any} w="28px" h="28px" color={role.color} />
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="bold" mb={1}>
                      {role.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {role.description}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            ))}
          </HStack>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
