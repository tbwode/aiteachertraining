'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import type { ChatHistoryItemType } from '../types';

interface ChatHistorySidebarProps {
  histories: ChatHistoryItemType[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string, id?: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onNewChat: () => void;
}

export default function ChatHistorySidebar({
  histories,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onNewChat
}: ChatHistorySidebarProps) {
  const [renameChatId, setRenameChatId] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteChatId, setDeleteChatId] = useState('');
  const [deleteRecordId, setDeleteRecordId] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);

  const activeItem = histories.find((item) => item.chatId === activeChatId);

  return (
    <Flex flexDir="column" h="100%" w="260px" borderRight="1px solid #E5E7EB" bg="gray.50">
      <Flex
        h="56px"
        px={3}
        borderBottom="1px solid #E5E7EB"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontWeight="bold" fontSize="16px">
          历史对话
        </Text>
        <IconButton
          aria-label="新建对话"
          icon={<Text fontSize="20px">+</Text>}
          size="sm"
          variant="ghost"
          onClick={onNewChat}
        />
      </Flex>

      <Box flex={1} overflowY="auto">
        {histories.map((item) => (
          <Flex
            key={item.chatId}
            p={3}
            cursor="pointer"
            bg={activeChatId === item.chatId ? 'primary.50' : 'transparent'}
            borderBottom="1px solid #F3F4F6"
            _hover={{ bg: activeChatId === item.chatId ? 'primary.50' : 'gray.100' }}
            justifyContent="space-between"
            alignItems="center"
            onClick={() => onSelectChat(item.chatId)}
          >
            <Box flex={1} overflow="hidden">
              <Text
                fontSize="14px"
                fontWeight={activeChatId === item.chatId ? '600' : '400'}
                color={activeChatId === item.chatId ? 'primary.600' : 'gray.800'}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {item.title || '新对话'}
              </Text>
              <Text fontSize="12px" color="gray.400" mt={0.5}>
                {new Date(item.updateTime).toLocaleDateString()}
              </Text>
            </Box>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="更多操作"
                icon={<Text fontSize="16px">⋯</Text>}
                size="xs"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameChatId(item.chatId);
                    setRenameTitle(item.title || '');
                  }}
                >
                  重命名
                </MenuItem>
                <MenuItem
                  color="red.500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteChatId(item.chatId);
                    setDeleteRecordId(item.id || '');
                  }}
                >
                  删除
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ))}

        {histories.length === 0 && (
          <Box p={4} textAlign="center" color="gray.400" fontSize="14px">
            暂无历史对话
          </Box>
        )}
      </Box>

      {/* Rename Modal */}
      <Modal isOpen={!!renameChatId} onClose={() => setRenameChatId('')}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>重命名对话</ModalHeader>
          <ModalBody>
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="请输入新标题"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setRenameChatId('')}>
              取消
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                if (renameChatId && renameTitle.trim()) {
                  onRenameChat(renameChatId, renameTitle.trim());
                }
                setRenameChatId('');
              }}
            >
              确认
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirm Dialog */}
      <AlertDialog
        isOpen={!!deleteChatId}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setDeleteChatId('');
          setDeleteRecordId('');
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              操作确认
            </AlertDialogHeader>
            <AlertDialogBody>确定删除该记录？</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteChatId('')}>
                取消
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  if (deleteChatId) {
                    onDeleteChat(deleteChatId, deleteRecordId);
                  }
                  setDeleteChatId('');
                  setDeleteRecordId('');
                }}
                ml={3}
              >
                删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}
