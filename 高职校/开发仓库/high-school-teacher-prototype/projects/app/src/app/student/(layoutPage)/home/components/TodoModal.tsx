'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { TodoItem } from '../types';
import { TodoDetailModal } from './TodoDetailModal';

type TodoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  todoList: TodoItem[];
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function TodoModal({ isOpen, onClose, todoList, onMarkRead, onDelete }: TodoModalProps) {
  const { t } = useTranslation('student');
  const [expanded, setExpanded] = useState(false);
  const [list, setList] = useState(todoList);
  const [detailItem, setDetailItem] = useState<TodoItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useMemo(() => setList(todoList), [todoList]);

  const displayList = useMemo(
    () => (expanded ? list : list.slice(0, 5)),
    [expanded, list]
  );

  const hasMore = list.length > 5;

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
    onDelete?.(id);
  };

  const handleOpenDetail = (item: TodoItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const handleMarkReadFromDetail = () => {
    if (detailItem) {
      onMarkRead?.(detailItem.id);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius="16px"
          mx={4}
          maxW="480px"
          overflow="hidden"
        >
          <ModalHeader
            fontSize="16px"
            fontWeight={500}
            color="#1F2937"
            py={4}
            px={5}
            borderBottom="1px solid"
            borderColor="#F2F3F5"
          >
            <Flex justify="space-between" align="center">
              <Text>{t('home.todo.title')}</Text>
              <Box
                as="button"
                onClick={onClose}
                color="#9CA3AF"
                _hover={{ color: '#1F2937' }}
                fontSize="24px"
                lineHeight="1"
                aria-label={t('home.news.closeAria')}
              >
                ×
              </Box>
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5} maxH="520px" overflowY="auto">
            <VStack spacing="12px" align="stretch">
              {displayList.map((item) => (
                <TodoCard
                  key={item.id}
                  item={item}
                  onClick={() => handleOpenDetail(item)}
                  onDelete={handleDelete}
                />
              ))}
            </VStack>

            {hasMore && (
              <Flex justify="center" mt={4}>
                <Box
                  as="button"
                  fontSize="13px"
                  color="#C8000B"
                  fontWeight={500}
                  onClick={() => setExpanded((prev) => !prev)}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {expanded
                    ? t('home.todo.collapseAll', { count: todoList.length })
                    : t('home.todo.expandAll', { count: todoList.length })}
                </Box>
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <TodoDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        item={detailItem}
        onMarkRead={handleMarkReadFromDetail}
      />
    </>
  );
}

function TodoCard({
  item,
  onClick,
  onDelete
}: {
  item: TodoItem;
  onClick: () => void;
  onDelete?: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      p="14px"
      bg="#FAFBFC"
      borderRadius="12px"
      border="1px solid"
      borderColor="#F2F3F5"
      transition="background 0.2s ease"
      cursor="pointer"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      _hover={{ bg: '#fff6f7' }}
    >
      {isHovered && (
        <Box
          as="button"
          position="absolute"
          top="8px"
          right="8px"
          w="24px"
          h="24px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          color="#9CA3AF"
          fontSize="18px"
          lineHeight="1"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item.id);
          }}
          _hover={{ color: '#C8000B', bg: 'rgba(200, 0, 11, 0.08)' }}
        >
          ×
        </Box>
      )}
      <Text fontSize="14px" fontWeight={500} color="#1F2937" lineHeight="20px" pr="24px">
        【{item.teacherName}】{t('home.todoDetail.teacherRemind')}{item.courseName}{t('home.todoDetail.courseLabel')}{item.message}
      </Text>
      <Flex align="center" gap="8px" mt="8px">
        <Text
          fontSize="12px"
          color={item.isRead ? '#9CA3AF' : '#C8000B'}
          fontWeight={500}
          bg="#FFFFFF"
          borderRadius="4px"
          px="8px"
          py="2px"
        >
          {item.isRead ? t('home.todoCard.read') : t('home.todoCard.unread')}
        </Text>
        <Text fontSize="12px" color="#9CA3AF">
          {t('home.todoCard.remindTime')}：{item.remindTime}
        </Text>
      </Flex>
    </Box>
  );
}
