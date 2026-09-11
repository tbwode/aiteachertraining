'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type { AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import type { ChapterNode, Question } from '../questionBank/types';
import type { Quiz } from './types';
import { QUIZ_STATUS_META, totalScoreOf } from './types';
import { MOCK_CLASSES, buildSeedQuizzes, formatDeadline, isExpired } from './mockQuiz';
import { QuizWizardModal } from './QuizWizardModal';
import { QuizViewModal } from './QuizViewModal';
import { QuizReportModal } from './QuizReportModal';

type TabQuizManageProps = {
  avatarDetail: AiAvatarDetailVO | null;
  chapterTree: ChapterNode[];
  bank: Question[];
};

// 测验管理：统计 + 测验卡片列表 + 创建 / 编辑 / 发布 / 删除
export function TabQuizManage({ avatarDetail, chapterTree, bank }: TabQuizManageProps) {
  const toast = useToast();
  const classNames = useMemo(() => {
    const list = (avatarDetail?.classList || []).map((c) => c.className).filter(Boolean);
    return list.length > 0 ? list : MOCK_CLASSES;
  }, [avatarDetail?.classList]);

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => buildSeedQuizzes(bank, classNames));
  // bank 可能在组件挂载后才完成播种（章节异步加载），此时补一次种子测验
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (bank.length === 0) return;
    seededRef.current = true;
    setQuizzes((prev) => (prev.length > 0 ? prev : buildSeedQuizzes(bank, classNames)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank]);
  const wizard = useDisclosure();
  const viewModal = useDisclosure();
  const reportModal = useDisclosure();
  const deleteConfirm = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [reportQuiz, setReportQuiz] = useState<Quiz | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const published = quizzes.filter((q) => q.status === 'published').length;
    return {
      total: quizzes.length,
      published,
      draft: quizzes.length - published,
      questions: quizzes.reduce((sum, q) => sum + q.questions.length, 0)
    };
  }, [quizzes]);

  const handleSave = (quiz: Quiz, status: 'draft' | 'published') => {
    setQuizzes((prev) => {
      const idx = prev.findIndex((item) => item.id === quiz.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = quiz;
        return next;
      }
      return [quiz, ...prev];
    });
    setEditingQuiz(null);
    toast({
      title: status === 'published' ? `测验「${quiz.title}」已发布` : '草稿已保存',
      status: 'success',
      duration: 2000,
      position: 'top'
    });
  };

  const handlePublish = (quiz: Quiz) => {
    setQuizzes((prev) =>
      prev.map((item) => (item.id === quiz.id ? { ...item, status: 'published' } : item))
    );
    toast({
      title: `测验「${quiz.title}」已发布`,
      status: 'success',
      duration: 2000,
      position: 'top'
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== deletingId));
    setDeletingId(null);
    deleteConfirm.onClose();
    toast({ title: '测验已删除', status: 'success', duration: 2000, position: 'top' });
  };

  if (chapterTree.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 8px 28px rgba(31,35,41,0.07)"
        p={{ base: 5, md: 6 }}
      >
        <Text fontSize="lg" fontWeight={600} color="gray.800" mb={4}>
          测验管理
        </Text>
        <Text color="gray.400" fontSize="sm" textAlign="center" py={8}>
          暂无章节数据，请先在编辑页维护课程章节
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* 头部：统计 + 操作 */}
      <Box
        bg="white"
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 8px 28px rgba(31,35,41,0.07)"
        p={{ base: 4, md: 5 }}
      >
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
          gap={4}
        >
          <Grid
            templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }}
            gap={{ base: 4, md: 7 }}
            flex={1}
          >
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="gray.800" lineHeight="1.2">
                {stats.total}
              </Text>
              <Text fontSize="xs" color="gray.400">
                测验总数
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#059669" lineHeight="1.2">
                {stats.published}
              </Text>
              <Text fontSize="xs" color="gray.400">
                已发布
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#86909C" lineHeight="1.2">
                {stats.draft}
              </Text>
              <Text fontSize="xs" color="gray.400">
                草稿
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#2563EB" lineHeight="1.2">
                {stats.questions}
              </Text>
              <Text fontSize="xs" color="gray.400">
                累计题目
              </Text>
            </Box>
          </Grid>
          <Button
            minH="44px"
            w={{ base: '100%', md: 'auto' }}
            leftIcon={<AddIcon w={3} h={3} />}
            onClick={() => {
              setEditingQuiz(null);
              wizard.onOpen();
            }}
          >
            创建测验
          </Button>
        </Flex>
      </Box>

      {/* 测验卡片列表 */}
      {quizzes.length === 0 ? (
        <Box
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={{ base: 5, md: 6 }}
        >
          <Text color="gray.400" fontSize="sm" textAlign="center" py={8}>
            暂无测验，点击右上角「创建测验」开始组卷
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" spacing={3}>
          {quizzes.map((quiz) => {
            const statusMeta = QUIZ_STATUS_META[quiz.status];
            const expired = quiz.status === 'published' && isExpired(quiz.deadline);
            return (
              <Box
                key={quiz.id}
                bg="white"
                borderRadius="20px"
                border="1px solid"
                borderColor="#E5E6EB"
                boxShadow="0 8px 28px rgba(31,35,41,0.07)"
                p={{ base: 4, md: 5 }}
              >
                <Flex
                  align={{ base: 'stretch', md: 'flex-start' }}
                  gap={4}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Box flex={1} minW={0}>
                    <Flex align="center" gap={2} mb={1} flexWrap="wrap">
                      <Badge
                        bg={statusMeta.bg}
                        color={statusMeta.color}
                        borderRadius="md"
                        px={2}
                        flexShrink={0}
                      >
                        {statusMeta.label}
                      </Badge>
                      <Text fontSize="md" fontWeight={700} color="gray.800" noOfLines={1}>
                        {quiz.title}
                      </Text>
                      {expired && (
                        <Badge colorScheme="red" variant="outline" borderRadius="md" px={1.5}>
                          已截止
                        </Badge>
                      )}
                    </Flex>
                    {quiz.description && (
                      <Text fontSize="sm" color="gray.500" noOfLines={1} mb={2}>
                        {quiz.description}
                      </Text>
                    )}
                    <Flex align="center" gap={3} flexWrap="wrap">
                      <HStack spacing={1}>
                        {quiz.classNames.map((name) => (
                          <Badge
                            key={name}
                            colorScheme="blue"
                            variant="subtle"
                            borderRadius="full"
                            fontSize="10px"
                          >
                            {name}
                          </Badge>
                        ))}
                      </HStack>
                      <Text fontSize="xs" color={expired ? 'red.500' : 'gray.400'}>
                        截止 {formatDeadline(quiz.deadline)}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {quiz.questions.length} 题 · 总分 {totalScoreOf(quiz)} 分
                      </Text>
                      <Text fontSize="xs" color="gray.300">
                        创建于 {quiz.createdAt}
                      </Text>
                    </Flex>
                  </Box>
                  <Flex
                    gap={2}
                    flexShrink={0}
                    flexWrap="wrap"
                    justify={{ base: 'flex-start', md: 'flex-end' }}
                  >
                    <Button
                      minH="40px"
                      variant="outline"
                      bg="white"
                      color="gray.700"
                      leftIcon={<ViewIcon w={3} h={3} />}
                      onClick={() => {
                        setViewingQuiz(quiz);
                        viewModal.onOpen();
                      }}
                    >
                      查看
                    </Button>
                    {quiz.status === 'published' && (
                      <Button
                        minH="40px"
                        variant="outline"
                        bg="white"
                        color="#2563EB"
                        borderColor="#2563EB"
                        onClick={() => {
                          setReportQuiz(quiz);
                          reportModal.onOpen();
                        }}
                      >
                        📊 数据报表
                      </Button>
                    )}
                    {quiz.status === 'draft' && (
                      <>
                        <Button
                          minH="40px"
                          variant="outline"
                          bg="white"
                          color="gray.700"
                          leftIcon={<EditIcon w={3} h={3} />}
                          onClick={() => {
                            setEditingQuiz(quiz);
                            wizard.onOpen();
                          }}
                        >
                          编辑
                        </Button>
                        <Button minH="40px" onClick={() => handlePublish(quiz)}>
                          发布
                        </Button>
                      </>
                    )}
                    <Button
                      minH="40px"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: 'red.500', bg: 'red.50' }}
                      leftIcon={<DeleteIcon w={3} h={3} />}
                      onClick={() => {
                        setDeletingId(quiz.id);
                        deleteConfirm.onOpen();
                      }}
                    >
                      删除
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </VStack>
      )}

      {/* 创建 / 编辑测验 */}
      <QuizWizardModal
        isOpen={wizard.isOpen}
        onClose={() => {
          wizard.onClose();
          setEditingQuiz(null);
        }}
        chapterTree={chapterTree}
        bank={bank}
        classNames={classNames}
        quiz={editingQuiz}
        onSave={handleSave}
      />

      {/* 查看测验 */}
      <QuizViewModal
        isOpen={viewModal.isOpen}
        onClose={() => {
          viewModal.onClose();
          setViewingQuiz(null);
        }}
        quiz={viewingQuiz}
      />

      {/* 数据报表 */}
      <QuizReportModal
        isOpen={reportModal.isOpen}
        onClose={() => {
          reportModal.onClose();
          setReportQuiz(null);
        }}
        quiz={reportQuiz}
      />

      {/* 删除确认 */}
      <AlertDialog
        isOpen={deleteConfirm.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteConfirm.onClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.600">
          <AlertDialogContent
            mx={4}
            borderRadius="20px"
            border="1px solid"
            borderColor="#E5E6EB"
            boxShadow="0 24px 70px rgba(31,35,41,0.24)"
          >
            <AlertDialogHeader fontSize="lg" fontWeight={700}>
              删除测验
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text fontSize="sm" color="gray.600">
                确定删除该测验吗？删除后不可恢复。
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                variant="outline"
                bg="white"
                color="gray.700"
                onClick={deleteConfirm.onClose}
              >
                取消
              </Button>
              <Button onClick={handleDelete}>确认删除</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
