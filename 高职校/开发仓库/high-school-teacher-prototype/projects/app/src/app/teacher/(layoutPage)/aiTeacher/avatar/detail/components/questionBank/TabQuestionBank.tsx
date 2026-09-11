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
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  AddIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  SearchIcon
} from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type { ChapterNode, Question, QuestionType } from './types';
import { DIFFICULTY_META, QUESTION_TYPE_META, QUESTION_TYPE_ORDER } from './types';
import { collectChapterIds } from './mockData';
import { QuestionEditModal } from './QuestionEditModal';
import { AiGenerateModal } from './AiGenerateModal';
import { StemRichText } from './StemRichText';

type TabQuestionBankProps = {
  chapterTree: ChapterNode[];
  questions: Question[];
  onQuestionsChange: (updater: (prev: Question[]) => Question[]) => void;
};

const ALL = '__all__';
const PAGE_SIZE = 5;

export function TabQuestionBank({
  chapterTree,
  questions,
  onQuestionsChange
}: TabQuestionBankProps) {
  const toast = useToast();

  const [selectedChapterId, setSelectedChapterId] = useState<string>(ALL);
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const editModal = useDisclosure();
  const aiModal = useDisclosure();
  const deleteConfirm = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 各章节题目数（含后代）
  const countByChapter = useMemo(() => {
    const map = new Map<string, number>();
    const walk = (node: ChapterNode) => {
      const ids = collectChapterIds(node);
      map.set(node.id, questions.filter((q) => ids.has(q.chapterId)).length);
      node.children.forEach(walk);
    };
    chapterTree.forEach(walk);
    return map;
  }, [chapterTree, questions]);

  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (selectedChapterId !== ALL) {
      const node = chapterTree
        .flatMap((c) => [c, ...c.children])
        .find((c) => c.id === selectedChapterId);
      // 用收集器兼容更深层级
      const findNode = (nodes: ChapterNode[]): ChapterNode | null => {
        for (const n of nodes) {
          if (n.id === selectedChapterId) return n;
          const hit = findNode(n.children);
          if (hit) return hit;
        }
        return null;
      };
      const target = findNode(chapterTree) || node;
      if (target) {
        const ids = collectChapterIds(target);
        list = list.filter((q) => ids.has(q.chapterId));
      }
    }
    if (typeFilter !== 'all') {
      list = list.filter((q) => q.type === typeFilter);
    }
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (q) =>
          q.stem.toLowerCase().includes(kw) ||
          q.knowledgePoints.some((kp) => kp.toLowerCase().includes(kw)) ||
          q.chapterTitle.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [questions, selectedChapterId, typeFilter, keyword, chapterTree]);

  // 筛选变化时回到第一页
  useEffect(() => {
    setPage(1);
  }, [selectedChapterId, typeFilter, keyword]);

  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedQuestions = useMemo(
    () => filteredQuestions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredQuestions, safePage]
  );

  const stats = useMemo(() => {
    const ai = questions.filter((q) => q.source === 'ai').length;
    const chapterIds = new Set(questions.map((q) => q.chapterId));
    return {
      total: questions.length,
      ai,
      manual: questions.length - ai,
      chapters: chapterIds.size
    };
  }, [questions]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitQuestion = (q: Question) => {
    onQuestionsChange((prev) => {
      const idx = prev.findIndex((item) => item.id === q.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = q;
        return next;
      }
      return [q, ...prev];
    });
    toast({
      title: editingQuestion ? '题目已更新' : '题目已创建',
      status: 'success',
      duration: 2000,
      position: 'top'
    });
    setEditingQuestion(null);
  };

  const handleImportAi = (list: Question[]) => {
    onQuestionsChange((prev) => [...list, ...prev]);
    toast({
      title: `已将 ${list.length} 道 AI 题目加入题库`,
      status: 'success',
      duration: 2500,
      position: 'top'
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    onQuestionsChange((prev) => prev.filter((q) => q.id !== deletingId));
    setDeletingId(null);
    deleteConfirm.onClose();
    toast({ title: '题目已删除', status: 'success', duration: 2000, position: 'top' });
  };

  const renderChapterNode = (node: ChapterNode, depth: number) => {
    const active = selectedChapterId === node.id;
    const hasChildren = node.children.length > 0;
    const collapsed = collapsedIds.has(node.id);
    return (
      <Box key={node.id}>
        <Flex
          role="button"
          tabIndex={0}
          align="center"
          gap={1}
          pl={`${depth * 16 + 8}px`}
          pr={2}
          py={1.5}
          borderRadius="lg"
          cursor="pointer"
          bg={active ? 'rgba(200,0,11,0.06)' : 'transparent'}
          _hover={{ bg: active ? 'rgba(200,0,11,0.06)' : 'gray.50' }}
          _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.16)' }}
          onClick={() => setSelectedChapterId(node.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setSelectedChapterId(node.id);
            }
          }}
        >
          <Box
            w="16px"
            flexShrink={0}
            color="gray.400"
            onClick={(e) => {
              if (!hasChildren) return;
              e.stopPropagation();
              toggleCollapse(node.id);
            }}
          >
            {hasChildren && (collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />)}
          </Box>
          <Text
            fontSize="sm"
            flex={1}
            noOfLines={1}
            color={active ? 'red.600' : 'gray.700'}
            fontWeight={active ? 600 : 400}
          >
            {node.title}
          </Text>
          <Text fontSize="xs" color="gray.400" flexShrink={0}>
            {countByChapter.get(node.id) || 0}
          </Text>
        </Flex>
        {hasChildren &&
          !collapsed &&
          node.children.map((child) => renderChapterNode(child, depth + 1))}
      </Box>
    );
  };

  const renderAnswer = (q: Question) => {
    if (q.type === 'single' || q.type === 'multiple') {
      return (
        <VStack align="stretch" spacing={1} mt={2}>
          {q.options.map((opt) => {
            const isAnswer = q.answer.includes(opt.key);
            return (
              <Flex key={opt.key} align="center" gap={2} fontSize="sm">
                <Text
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  border="1px solid"
                  borderColor={isAnswer ? 'green.500' : 'gray.300'}
                  color={isAnswer ? 'green.600' : 'gray.500'}
                  bg={isAnswer ? 'green.50' : 'white'}
                  fontSize="xs"
                  fontWeight={600}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {opt.key}
                </Text>
                <Text color={isAnswer ? 'green.700' : 'gray.600'} noOfLines={1}>
                  {opt.text}
                </Text>
              </Flex>
            );
          })}
        </VStack>
      );
    }
    const answerText =
      q.type === 'blank' ? q.answer.map((a, i) => `空${i + 1}：${a}`).join('；') : q.answer[0];
    return (
      <>
        <Text fontSize="sm" color="gray.600" mt={2} noOfLines={2}>
          <Text as="span" color="green.600" fontWeight={600}>
            {q.type === 'essay' ? '参考答案：' : '答案：'}
          </Text>
          {answerText}
        </Text>
        {q.type === 'essay' && q.gradingCriteria && (
          <Box
            mt={2}
            p={2.5}
            borderRadius="lg"
            bg="rgba(124,58,237,0.05)"
            border="1px dashed"
            borderColor="rgba(124,58,237,0.25)"
          >
            <Text fontSize="xs" fontWeight={600} color="#7C3AED" mb={0.5}>
              评分标准（AI 评价参考）
            </Text>
            <Text fontSize="xs" color="gray.600" noOfLines={2}>
              {q.gradingCriteria}
            </Text>
          </Box>
        )}
      </>
    );
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
          题库管理
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
                题目总数
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#7C3AED" lineHeight="1.2">
                {stats.ai}
              </Text>
              <Text fontSize="xs" color="gray.400">
                AI 出题
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#2563EB" lineHeight="1.2">
                {stats.manual}
              </Text>
              <Text fontSize="xs" color="gray.400">
                手动出题
              </Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight={700} color="#059669" lineHeight="1.2">
                {stats.chapters}
              </Text>
              <Text fontSize="xs" color="gray.400">
                覆盖章节
              </Text>
            </Box>
          </Grid>
          <Flex gap={3} direction={{ base: 'column', sm: 'row' }} flexShrink={0}>
            <Button
              minH="44px"
              flex={{ base: 1, md: 'initial' }}
              variant="outline"
              bg="white"
              color="#7C3AED"
              borderColor="#7C3AED"
              onClick={aiModal.onOpen}
            >
              ✨ AI 出题
            </Button>
            <Button
              minH="44px"
              flex={{ base: 1, md: 'initial' }}
              leftIcon={<AddIcon w={3} h={3} />}
              onClick={() => {
                setEditingQuestion(null);
                editModal.onOpen();
              }}
            >
              手动出题
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Flex gap={4} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
        {/* 章节树 */}
        <Box
          w={{ base: '100%', lg: '240px' }}
          flexShrink={0}
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow="0 8px 28px rgba(31,35,41,0.07)"
          p={3}
          maxH={{ base: '260px', lg: '640px' }}
          overflowY="auto"
        >
          <Flex
            role="button"
            tabIndex={0}
            align="center"
            px={2}
            py={1.5}
            borderRadius="lg"
            cursor="pointer"
            bg={selectedChapterId === ALL ? 'rgba(200,0,11,0.06)' : 'transparent'}
            _hover={{ bg: selectedChapterId === ALL ? 'rgba(200,0,11,0.06)' : 'gray.50' }}
            _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.16)' }}
            onClick={() => setSelectedChapterId(ALL)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedChapterId(ALL);
              }
            }}
            mb={1}
          >
            <Text
              fontSize="sm"
              flex={1}
              fontWeight={selectedChapterId === ALL ? 600 : 400}
              color={selectedChapterId === ALL ? 'red.600' : 'gray.700'}
            >
              全部题目
            </Text>
            <Text fontSize="xs" color="gray.400">
              {questions.length}
            </Text>
          </Flex>
          {chapterTree.map((node) => renderChapterNode(node, 0))}
        </Box>

        {/* 题目列表 */}
        <Box flex={1} minW={0}>
          <Box
            bg="white"
            borderRadius="20px"
            border="1px solid"
            borderColor="#E5E6EB"
            boxShadow="0 8px 28px rgba(31,35,41,0.07)"
            p={{ base: 3, md: 4 }}
            mb={3}
          >
            <Flex
              align={{ base: 'stretch', md: 'center' }}
              gap={3}
              direction={{ base: 'column', md: 'row' }}
            >
              <HStack spacing={1.5} flex={1} flexWrap="wrap">
                <Box
                  as="button"
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight={typeFilter === 'all' ? 600 : 400}
                  color={typeFilter === 'all' ? 'white' : 'gray.600'}
                  bg={typeFilter === 'all' ? 'gray.700' : 'gray.50'}
                  border="1px solid"
                  borderColor={typeFilter === 'all' ? 'gray.700' : 'gray.200'}
                  minH="36px"
                  onClick={() => setTypeFilter('all')}
                >
                  全部
                </Box>
                {QUESTION_TYPE_ORDER.map((t) => {
                  const meta = QUESTION_TYPE_META[t];
                  const active = typeFilter === t;
                  return (
                    <Box
                      key={t}
                      as="button"
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight={active ? 600 : 400}
                      color={active ? meta.color : 'gray.600'}
                      bg={active ? meta.bg : 'gray.50'}
                      border="1px solid"
                      borderColor={active ? meta.color : 'gray.200'}
                      minH="36px"
                      onClick={() => setTypeFilter(active ? 'all' : t)}
                    >
                      {meta.label}
                    </Box>
                  );
                })}
              </HStack>
              <InputGroup size="sm" w={{ base: '100%', md: '240px' }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" boxSize={3.5} />
                </InputLeftElement>
                <Input
                  placeholder="搜索题干 / 知识点"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  borderRadius="full"
                  h="40px"
                  _focusVisible={{
                    borderColor: '#C8000B',
                    boxShadow: '0 0 0 3px rgba(200,0,11,0.12)'
                  }}
                />
              </InputGroup>
            </Flex>
          </Box>

          {filteredQuestions.length === 0 ? (
            <Box
              bg="white"
              borderRadius="20px"
              border="1px solid"
              borderColor="#E5E6EB"
              boxShadow="0 8px 28px rgba(31,35,41,0.07)"
              p={10}
              textAlign="center"
            >
              <Text fontSize="3xl" mb={2}>
                📝
              </Text>
              <Text color="gray.400" fontSize="sm" mb={4}>
                当前范围暂无题目
              </Text>
              <Flex justify="center" gap={3} direction={{ base: 'column', sm: 'row' }}>
                <Button
                  size="sm"
                  variant="outline"
                  bg="white"
                  color="#7C3AED"
                  borderColor="#7C3AED"
                  onClick={aiModal.onOpen}
                >
                  ✨ AI 出题
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingQuestion(null);
                    editModal.onOpen();
                  }}
                >
                  手动出题
                </Button>
              </Flex>
            </Box>
          ) : (
            <>
              <VStack align="stretch" spacing={3}>
                {pagedQuestions.map((q) => {
                  const meta = QUESTION_TYPE_META[q.type];
                  return (
                    <Box
                      key={q.id}
                      bg="white"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor="#E5E6EB"
                      boxShadow="0 6px 22px rgba(31,35,41,0.06)"
                      p={{ base: 3.5, md: 4 }}
                    >
                      <Flex align="center" gap={2} mb={2} flexWrap="wrap">
                        <Badge
                          bg={meta.bg}
                          color={meta.color}
                          borderRadius="md"
                          px={2}
                          fontWeight={600}
                        >
                          {meta.label}
                        </Badge>
                        <Badge colorScheme="gray" variant="outline" borderRadius="md">
                          {DIFFICULTY_META[q.difficulty].label}
                        </Badge>
                        <Badge
                          borderRadius="md"
                          bg={q.source === 'ai' ? 'rgba(124,58,237,0.08)' : 'gray.100'}
                          color={q.source === 'ai' ? '#7C3AED' : 'gray.500'}
                        >
                          {q.source === 'ai' ? '✨ AI 生成' : '手动'}
                        </Badge>
                        <Box flex={1} />
                        <IconButton
                          aria-label="编辑题目"
                          icon={<EditIcon w={3.5} h={3.5} />}
                          minW="40px"
                          h="40px"
                          variant="ghost"
                          color="gray.400"
                          _hover={{ color: 'gray.700', bg: 'gray.50' }}
                          onClick={() => {
                            setEditingQuestion(q);
                            editModal.onOpen();
                          }}
                        />
                        <IconButton
                          aria-label="删除题目"
                          icon={<DeleteIcon w={3.5} h={3.5} />}
                          minW="40px"
                          h="40px"
                          variant="ghost"
                          color="gray.400"
                          _hover={{ color: 'red.500', bg: 'red.50' }}
                          onClick={() => {
                            setDeletingId(q.id);
                            deleteConfirm.onOpen();
                          }}
                        />
                      </Flex>
                      <StemRichText
                        text={q.stem}
                        images={q.images}
                        fontWeight={600}
                        color="gray.800"
                      />
                      {renderAnswer(q)}
                      <Flex align="center" gap={2} mt={3} flexWrap="wrap">
                        <Text fontSize="xs" color="gray.400">
                          {q.chapterTitle}
                        </Text>
                        {q.knowledgePoints.map((kp) => (
                          <Badge
                            key={kp}
                            colorScheme="blue"
                            variant="subtle"
                            borderRadius="full"
                            fontSize="10px"
                          >
                            {kp}
                          </Badge>
                        ))}
                        <Box flex={1} />
                        <Text fontSize="xs" color="gray.300">
                          {q.createdAt}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>

              {/* 分页 */}
              {filteredQuestions.length > PAGE_SIZE && (
                <Flex
                  align="center"
                  justify="center"
                  gap={1.5}
                  mt={4}
                  py={2}
                  bg="white"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor="#E5E6EB"
                  boxShadow="0 6px 22px rgba(31,35,41,0.06)"
                  flexWrap="wrap"
                >
                  <Text fontSize="xs" color="gray.400" mr={2}>
                    共 {filteredQuestions.length} 题
                  </Text>
                  <IconButton
                    aria-label="上一页"
                    icon={<ChevronLeftIcon />}
                    minW="40px"
                    h="40px"
                    variant="ghost"
                    isDisabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  />
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <Box
                      key={p}
                      as="button"
                      minW="40px"
                      h="40px"
                      px={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight={p === safePage ? 600 : 400}
                      color={p === safePage ? 'white' : 'gray.600'}
                      bg={p === safePage ? '#C83E3E' : 'transparent'}
                      _hover={{ bg: p === safePage ? '#C83E3E' : 'gray.100' }}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Box>
                  ))}
                  <IconButton
                    aria-label="下一页"
                    icon={<ChevronRightIcon />}
                    minW="40px"
                    h="40px"
                    variant="ghost"
                    isDisabled={safePage >= pageCount}
                    onClick={() => setPage(safePage + 1)}
                  />
                </Flex>
              )}
            </>
          )}
        </Box>
      </Flex>

      {/* 手动出题 / 编辑 */}
      <QuestionEditModal
        isOpen={editModal.isOpen}
        onClose={() => {
          editModal.onClose();
          setEditingQuestion(null);
        }}
        chapterTree={chapterTree}
        defaultChapterId={selectedChapterId === ALL ? undefined : selectedChapterId}
        question={editingQuestion}
        onSubmit={handleSubmitQuestion}
      />

      {/* AI 出题 */}
      <AiGenerateModal
        isOpen={aiModal.isOpen}
        onClose={aiModal.onClose}
        chapterTree={chapterTree}
        defaultChapterId={selectedChapterId === ALL ? undefined : selectedChapterId}
        onImport={handleImportAi}
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
              删除题目
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text fontSize="sm" color="gray.600">
                确定删除这道题目吗？删除后不可恢复。
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
