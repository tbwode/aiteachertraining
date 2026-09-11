'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Box,
  Text,
  Button,
  Flex
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import type { UserRole } from '@/app/components/auth/RoleSelectModal';

interface IdentitySelectModalProps {
  isOpen: boolean;
  availableRoles: UserRole[];
  onConfirm: (role: UserRole) => void;
  onBackToLogin: () => void;
}

const identityMap: Record<
  UserRole,
  {
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBg: string;
  }
> = {
  teacher: {
    title: '教师',
    description: '教学任务、课程管理',
    icon: 'book',
    iconColor: '#C8000B',
    iconBg: '#FFF1F0'
  },
  student: {
    title: '学员',
    description: '学习课程、查看成绩',
    icon: 'user',
    iconColor: '#C8000B',
    iconBg: '#FFF1F0'
  },
  admin: {
    title: '管理端',
    description: '系统管理、权限配置',
    icon: 'shield',
    iconColor: '#C8000B',
    iconBg: '#FFF1F0'
  }
};

export function IdentitySelectModal({
  isOpen,
  availableRoles,
  onConfirm,
  onBackToLogin
}: IdentitySelectModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(null);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (selectedRole) {
      onConfirm(selectedRole);
    }
  }, [selectedRole, onConfirm]);

  const handleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
      size="md"
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={6} mx={4}>
        <ModalBody p={0}>
          <VStack spacing={6} align="stretch">
            {/* 顶部标题区 */}
            <VStack spacing={3} align="center">
              <Box
                w="56px"
                h="56px"
                borderRadius="full"
                bg="#FFF1F0"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C8000B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 5 6v5c0 5 3.4 8.6 7 10 3.6-1.4 7-5 7-10V6l-7-3Z" />
                  <path d="m9.5 12 1.7 1.7L15 10" />
                </svg>
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="gray.900">
                选择身份
              </Text>
              <Text fontSize="sm" color="gray.500">
                检测到您的账号拥有多个身份，请选择要登录的身份
              </Text>
            </VStack>

            {/* 身份列表 */}
            <VStack spacing={3} align="stretch">
              {availableRoles.map((roleId) => {
                const item = identityMap[roleId];
                const isSelected = selectedRole === roleId;
                return (
                  <Flex
                    key={roleId}
                    as="button"
                    onClick={() => handleSelect(roleId)}
                    align="center"
                    p={4}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={isSelected ? item.iconColor : 'gray.200'}
                    bg={isSelected ? item.iconBg : 'white'}
                    transition="all 0.2s"
                    _hover={{
                      borderColor: item.iconColor
                    }}
                  >
                    <Box
                      w="48px"
                      h="48px"
                      borderRadius="xl"
                      bg={item.iconBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      mr={4}
                    >
                      {item.icon === 'shield' ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={item.iconColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3 5 6v5c0 5 3.4 8.6 7 10 3.6-1.4 7-5 7-10V6l-7-3Z" />
                          <path d="m9.5 12 1.7 1.7L15 10" />
                        </svg>
                      ) : (
                        <MyIcon name={item.icon as any} w="24px" h="24px" color={item.iconColor} />
                      )}
                    </Box>
                    <Box flex="1" textAlign="left">
                      <Text fontSize="lg" fontWeight="bold" color="gray.900">
                        {item.title}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {item.description}
                      </Text>
                    </Box>
                    <Box
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={isSelected ? item.iconColor : 'gray.300'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      {isSelected && (
                        <Box w="10px" h="10px" borderRadius="full" bg={item.iconColor} />
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </VStack>

            {/* 底部按钮 */}
            <VStack spacing={3}>
              <Button
                w="100%"
                h="48px"
                borderRadius="xl"
                bg="#C8000B"
                color="white"
                fontSize="md"
                fontWeight="bold"
                isDisabled={!selectedRole}
                _hover={{ bg: '#A8000B' }}
                _disabled={{ bg: 'gray.300', cursor: 'not-allowed' }}
                onClick={handleConfirm}
              >
                确认
              </Button>
              <Button
                variant="ghost"
                color="gray.500"
                fontSize="sm"
                leftIcon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                }
                onClick={onBackToLogin}
              >
                返回登录
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
