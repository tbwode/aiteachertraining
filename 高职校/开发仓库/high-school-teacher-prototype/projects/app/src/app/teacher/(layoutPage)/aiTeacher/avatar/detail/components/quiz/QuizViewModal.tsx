'use client';

import {
  Badge,
  Box,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import { QUESTION_TYPE_META } from '../questionBank/types';
import { StemRichText } from '../questionBank/StemRichText';
import type { Quiz } from './types';
import { QUIZ_STATUS_META, totalScoreOf } from './types';
import { formatDeadline, isExpired } from './mockQuiz';

type QuizViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
};

// 测验详情（只读）：基本信息 + 题目与分值
export function QuizViewModal({ isOpen, onClose, quiz }: QuizViewModalProps) {
  if (!quiz) return null;
  const statusMeta = QUIZ_STATUS_META[quiz.status];
  const expired = quiz.status === 'published' && isExpired(quiz.deadline);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl" scrollBehavior="inside">
      <ModalOverlay bg="rgba(17,24,39,0.58)" backdropFilter="blur(3px)" />
      <ModalContent
        mx={3}
        maxH="calc(100vh - 32px)"
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 24px 70px rgba(31,35,41,0.24)"
        overflow="hidden"
      >
        <ModalHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid" borderColor="#F0F1F3">
          <Flex align="center" gap={2}>
            <Text fontSize="md" fontWeight={700} color="gray.800" noOfLines={1}>
              {quiz.title}
            </Text>
            <Badge
              bg={statusMeta.bg}
              color={statusMeta.color}
              borderRadius="md"
              px={2}
              flexShrink={0}
            >
              {statusMeta.label}
            </Badge>
            {expired && (
              <Badge colorScheme="red" variant="outline" borderRadius="md" px={2} flexShrink={0}>
                已截止
              </Badge>
            )}
          </Flex>
        </ModalHeader>
        <ModalBody px={{ base: 4, md: 6 }} py={5}>
          <VStack align="stretch" spacing={4}>
            {/* 基本信息 */}
            <Box p={3} borderRadius="lg" bg="gray.50" border="1px solid" borderColor="gray.100">
              {quiz.description && (
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {quiz.description}
                </Text>
              )}
              <Flex gap={4} flexWrap="wrap" align="center">
                <HStack spacing={1} fontSize="xs" color="gray.500">
                  <Text color="gray.400">发布班级：</Text>
                  {quiz.classNames.map((name) => (
                    <Badge key={name} colorScheme="blue" variant="subtle" borderRadius="full">
                      {name}
                    </Badge>
                  ))}
                </HStack>
                <Text fontSize="xs" color={expired ? 'red.500' : 'gray.500'}>
                  截止时间：{formatDeadline(quiz.deadline)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  共 {quiz.questions.length} 题 · 总分 {totalScoreOf(quiz)} 分
                </Text>
              </Flex>
            </Box>

            {/* 题目列表 */}
            <VStack align="stretch" spacing={2}>
              {quiz.questions.map((item, idx) => {
                const q = item.question;
                const meta = QUESTION_TYPE_META[q.type];
                return (
                  <Flex
                    key={q.id}
                    gap={2.5}
                    p={3}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.100"
                    align="flex-start"
                  >
                    <Text
                      fontSize="sm"
                      color="gray.400"
                      fontWeight={600}
                      mt={0.5}
                      w="20px"
                      flexShrink={0}
                    >
                      {idx + 1}.
                    </Text>
                    <Box flex={1} minW={0}>
                      <HStack spacing={1.5} mb={1}>
                        <Badge bg={meta.bg} color={meta.color} borderRadius="md" px={1.5}>
                          {meta.label}
                        </Badge>
                        <Text fontSize="xs" color="gray.400" noOfLines={1}>
                          {q.chapterTitle}
                        </Text>
                      </HStack>
                      <StemRichText
                        text={q.stem}
                        images={q.images}
                        color="gray.700"
                        fontSize="sm"
                      />
                    </Box>
                    <Text fontSize="sm" fontWeight={600} color="#C8000B" flexShrink={0} mt={0.5}>
                      {item.score} 分
                    </Text>
                  </Flex>
                );
              })}
            </VStack>

            <Flex justify="flex-end">
              <Button variant="outline" bg="white" color="gray.700" onClick={onClose}>
                关闭
              </Button>
            </Flex>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
