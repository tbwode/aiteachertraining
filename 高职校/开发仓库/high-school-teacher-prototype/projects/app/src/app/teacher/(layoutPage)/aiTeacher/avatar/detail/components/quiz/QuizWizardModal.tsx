'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, DeleteIcon, MinusIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type { ChapterNode, KpSelection, Question, QuestionType } from '../questionBank/types';
import { QUESTION_TYPE_META, QUESTION_TYPE_ORDER } from '../questionBank/types';
import { flattenChaptersWithDepth } from '../questionBank/mockData';
import { StemRichText } from '../questionBank/StemRichText';
import { KpTreePanel } from '../questionBank/KpTreePanel';
import type { Quiz, QuizPushConfig, QuizQuestionItem } from './types';
import { distributeScores, nextQuizId, pickQuestionsFromBank } from './mockQuiz';
import { QuestionPickerModal } from './QuestionPickerModal';

// datetime-local 默认值：7 天后 23:59
const defaultDeadline = () => {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
};

const normalizeConfig = (c: QuizPushConfig) =>
  JSON.stringify({
    mode: c.mode,
    chapterIds: [...c.chapterIds].sort(),
    kpNames: [...c.kpNames].sort(),
    counts: QUESTION_TYPE_ORDER.map((t) => [t, c.counts[t] || 0])
  });

type QuizWizardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterTree: ChapterNode[];
  bank: Question[];
  classNames: string[]; // 可选班级
  quiz?: Quiz | null; // 传入即编辑草稿模式
  onSave: (quiz: Quiz, status: 'draft' | 'published') => void;
};

// 创建 / 编辑测验：两步向导（基本信息+推题规则 → 预览与调分）
export function QuizWizardModal({
  isOpen,
  onClose,
  chapterTree,
  bank,
  classNames,
  quiz,
  onSave
}: QuizWizardModalProps) {
  const toast = useToast();
  const flatChapters = useMemo(() => flattenChaptersWithDepth(chapterTree), [chapterTree]);
  const picker = useDisclosure();

  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [targetTotalScore, setTargetTotalScore] = useState(100);
  const [mode, setMode] = useState<'chapter' | 'kp'>('chapter');
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [kpSelections, setKpSelections] = useState<KpSelection[]>([]);
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    single: 2,
    multiple: 1,
    judge: 1,
    blank: 0,
    essay: 0
  });
  const [items, setItems] = useState<QuizQuestionItem[]>([]);
  const [initialConfigJson, setInitialConfigJson] = useState('');

  const isEdit = !!quiz;
  const totalWanted = QUESTION_TYPE_ORDER.reduce((sum, t) => sum + (counts[t] || 0), 0);
  const currentTotal = items.reduce((sum, item) => sum + item.score, 0);

  // 打开时初始化：编辑模式回填，否则重置
  useEffect(() => {
    if (!isOpen) return;
    picker.onClose();
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description);
      setSelectedClasses(quiz.classNames);
      setDeadline(quiz.deadline || defaultDeadline());
      setTargetTotalScore(quiz.targetTotalScore);
      setItems(quiz.questions);
      if (quiz.pushConfig) {
        setMode(quiz.pushConfig.mode);
        setChapterIds(quiz.pushConfig.chapterIds);
        setKpSelections(
          quiz.pushConfig.kpNames.map((kp) => {
            const chapter = flatChapters.find(({ node }) => node.knowledgePoints.includes(kp));
            return {
              chapterId: chapter?.node.id || '',
              chapterTitle: chapter?.node.title || '',
              kp
            };
          })
        );
        setCounts({
          single: quiz.pushConfig.counts.single || 0,
          multiple: quiz.pushConfig.counts.multiple || 0,
          judge: quiz.pushConfig.counts.judge || 0,
          blank: quiz.pushConfig.counts.blank || 0,
          essay: quiz.pushConfig.counts.essay || 0
        });
        setInitialConfigJson(normalizeConfig(quiz.pushConfig));
      } else {
        setMode('chapter');
        setChapterIds([]);
        setKpSelections([]);
        setCounts({ single: 2, multiple: 1, judge: 1, blank: 0, essay: 0 });
        setInitialConfigJson('');
      }
    } else {
      setTitle('');
      setDescription('');
      setSelectedClasses([]);
      setDeadline(defaultDeadline());
      setTargetTotalScore(100);
      setMode('chapter');
      setChapterIds([]);
      setKpSelections([]);
      setCounts({ single: 2, multiple: 1, judge: 1, blank: 0, essay: 0 });
      setItems([]);
      setInitialConfigJson('');
    }
    setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stepCount = (type: QuestionType, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(20, (prev[type] || 0) + delta))
    }));
  };

  const toggleClass = (name: string) =>
    setSelectedClasses((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const toggleChapter = (id: string) =>
    setChapterIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const currentConfig = (): QuizPushConfig => ({
    mode,
    chapterIds,
    kpNames: kpSelections.map((s) => s.kp),
    counts
  });

  const validateStep1 = () => {
    if (!title.trim()) {
      toast({ title: '请填写测验标题', status: 'warning', duration: 2000, position: 'top' });
      return false;
    }
    if (selectedClasses.length === 0) {
      toast({ title: '请选择发布班级', status: 'warning', duration: 2000, position: 'top' });
      return false;
    }
    if (!deadline) {
      toast({ title: '请设置截止时间', status: 'warning', duration: 2000, position: 'top' });
      return false;
    }
    if (totalWanted > 0) {
      if (mode === 'chapter' && chapterIds.length === 0) {
        toast({ title: '请选择推题章节', status: 'warning', duration: 2000, position: 'top' });
        return false;
      }
      if (mode === 'kp' && kpSelections.length === 0) {
        toast({ title: '请选择推题知识点', status: 'warning', duration: 2000, position: 'top' });
        return false;
      }
    }
    return true;
  };

  // 下一步：按规则推题（编辑且配置未变时保留已调整题目）
  const handleNext = () => {
    if (!validateStep1()) return;
    const config = currentConfig();
    const configJson = normalizeConfig(config);
    if (isEdit && configJson === initialConfigJson && items.length > 0) {
      setStep(2);
      return;
    }
    if (totalWanted === 0) {
      setItems((prev) => (isEdit && configJson === initialConfigJson ? prev : []));
      setStep(2);
      toast({
        title: '未设置推题数量，可在下一步手动从题库选题',
        status: 'info',
        duration: 2500,
        position: 'top'
      });
      return;
    }
    const picked = pickQuestionsFromBank({ bank, tree: chapterTree, config });
    const scores = distributeScores(targetTotalScore, picked.length);
    setItems(picked.map((q, i) => ({ question: q, score: scores[i] })));
    setInitialConfigJson(configJson);
    setStep(2);
    if (picked.length === 0) {
      toast({
        title: '题库中没有符合条件的题目，请手动从题库选题',
        status: 'warning',
        duration: 2500,
        position: 'top'
      });
    }
  };

  const handleScoreChange = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.question.id === id ? { ...item, score: Math.max(0, Math.min(100, value)) } : item
      )
    );
  };

  const handleRemove = (id: string) =>
    setItems((prev) => prev.filter((item) => item.question.id !== id));

  const handlePickFromBank = (questions: Question[]) => {
    setItems((prev) => [
      ...prev,
      ...questions
        .filter((q) => !prev.some((item) => item.question.id === q.id))
        .map((q) => ({ question: q, score: 5 }))
    ]);
  };

  const handleSave = (status: 'draft' | 'published') => {
    if (status === 'published' && items.length === 0) {
      toast({
        title: '发布前请至少添加一道题目',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    onSave(
      {
        id: quiz?.id || nextQuizId(),
        title: title.trim(),
        description: description.trim(),
        classNames: selectedClasses,
        deadline,
        targetTotalScore,
        questions: items,
        status,
        pushConfig: currentConfig(),
        createdAt: quiz?.createdAt || new Date().toISOString().slice(0, 10)
      },
      status
    );
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size={step === 1 ? '2xl' : '3xl'}
        scrollBehavior="inside"
      >
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
          <ModalHeader
            px={{ base: 4, md: 6 }}
            py={4}
            borderBottom="1px solid"
            borderColor="#F0F1F3"
          >
            <Flex
              align={{ base: 'flex-start', md: 'center' }}
              gap={2}
              direction={{ base: 'column', md: 'row' }}
            >
              <Text fontSize="md" fontWeight={700} color="gray.800">
                {isEdit ? '编辑测验' : '创建测验'}
              </Text>
              <HStack spacing={1.5} fontSize="xs" color="gray.400" flexWrap="wrap">
                <Text
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontWeight={600}
                  color={step === 1 ? 'white' : 'gray.500'}
                  bg={step === 1 ? '#C8000B' : 'gray.100'}
                >
                  1 基本信息与推题
                </Text>
                <Text>→</Text>
                <Text
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontWeight={600}
                  color={step === 2 ? 'white' : 'gray.500'}
                  bg={step === 2 ? '#C8000B' : 'gray.100'}
                >
                  2 预览与调分
                </Text>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalBody px={{ base: 4, md: 6 }} py={5}>
            {step === 1 ? (
              <VStack align="stretch" spacing={4}>
                {/* 标题 */}
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    测验标题{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Input
                    h="44px"
                    placeholder="例如：第一章随堂测验"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Box>

                {/* 描述 */}
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    测验描述
                  </Text>
                  <Textarea
                    rows={2}
                    placeholder="补充测验说明，如考查范围、注意事项等（选填）"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Box>

                {/* 发布班级 */}
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    发布班级{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    {classNames.map((name) => {
                      const active = selectedClasses.includes(name);
                      return (
                        <Box
                          key={name}
                          as="button"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight={active ? 600 : 400}
                          color={active ? '#C8000B' : 'gray.600'}
                          bg={active ? 'rgba(200,0,11,0.06)' : 'gray.50'}
                          border="1px solid"
                          borderColor={active ? '#C8000B' : 'gray.200'}
                          onClick={() => toggleClass(name)}
                        >
                          {name}
                        </Box>
                      );
                    })}
                  </Flex>
                </Box>

                {/* 截止时间 + 总分 */}
                <Flex gap={4}>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                      截止时间{' '}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Input
                      size="sm"
                      type="datetime-local"
                      maxW="240px"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </Box>
                  <Box w="140px" flexShrink={0}>
                    <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                      总分
                    </Text>
                    <NumberInput
                      size="sm"
                      min={1}
                      max={1000}
                      value={targetTotalScore}
                      onChange={(_, v) =>
                        setTargetTotalScore(Number.isFinite(v) && v > 0 ? v : 100)
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </Box>
                </Flex>

                {/* 推题方式 */}
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    推题方式
                  </Text>
                  <HStack spacing={2} mb={3}>
                    {(
                      [
                        { key: 'chapter', label: '按章节推题' },
                        { key: 'kp', label: '按知识点推题' }
                      ] as const
                    ).map((m) => {
                      const active = mode === m.key;
                      return (
                        <Box
                          key={m.key}
                          as="button"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight={active ? 600 : 400}
                          color={active ? 'white' : 'gray.600'}
                          bg={active ? 'gray.700' : 'gray.50'}
                          border="1px solid"
                          borderColor={active ? 'gray.700' : 'gray.200'}
                          onClick={() => setMode(m.key)}
                        >
                          {m.label}
                        </Box>
                      );
                    })}
                  </HStack>
                  {mode === 'chapter' ? (
                    <Box
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="lg"
                      maxH="180px"
                      overflowY="auto"
                      p={2}
                    >
                      {flatChapters.map(({ node, depth }) => (
                        <Flex
                          key={node.id}
                          align="center"
                          py={1}
                          px={1}
                          borderRadius="md"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Checkbox
                            colorScheme="red"
                            size="sm"
                            isChecked={chapterIds.includes(node.id)}
                            onChange={() => toggleChapter(node.id)}
                          >
                            <Text fontSize="sm" color="gray.700" pl={`${depth * 8}px`}>
                              {node.title}
                            </Text>
                          </Checkbox>
                        </Flex>
                      ))}
                    </Box>
                  ) : (
                    <KpTreePanel
                      tree={chapterTree}
                      selections={kpSelections}
                      onChange={setKpSelections}
                      maxH="180px"
                      searchPlaceholder="搜索章节 / 知识点"
                    />
                  )}
                </Box>

                {/* 题型数量 */}
                <Box>
                  <Flex align="center" justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight={600} color="gray.700">
                      题型数量
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      共 {totalWanted} 题，题库不足时按实际数量推题
                    </Text>
                  </Flex>
                  <VStack align="stretch" spacing={2}>
                    {QUESTION_TYPE_ORDER.map((t) => {
                      const meta = QUESTION_TYPE_META[t];
                      return (
                        <Flex key={t} align="center" justify="space-between">
                          <Badge
                            bg={meta.bg}
                            color={meta.color}
                            borderRadius="md"
                            px={2}
                            py={0.5}
                            fontWeight={600}
                          >
                            {meta.label}
                          </Badge>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="减少"
                              icon={<MinusIcon w={2.5} h={2.5} />}
                              size="xs"
                              variant="ghost"
                              isDisabled={(counts[t] || 0) <= 0}
                              onClick={() => stepCount(t, -1)}
                            />
                            <Text w="24px" textAlign="center" fontSize="sm" fontWeight={600}>
                              {counts[t] || 0}
                            </Text>
                            <IconButton
                              aria-label="增加"
                              icon={<AddIcon w={2.5} h={2.5} />}
                              size="xs"
                              variant="ghost"
                              isDisabled={(counts[t] || 0) >= 20}
                              onClick={() => stepCount(t, 1)}
                            />
                          </HStack>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={3}>
                {/* 汇总行 */}
                <Flex
                  align="center"
                  gap={3}
                  p={3}
                  borderRadius="lg"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.100"
                  flexWrap="wrap"
                >
                  <Text fontSize="sm" fontWeight={600} color="gray.700">
                    共 {items.length} 题 · 合计 {currentTotal} 分
                  </Text>
                  <Text
                    fontSize="xs"
                    color={currentTotal === targetTotalScore ? 'gray.400' : '#D97706'}
                  >
                    目标总分 {targetTotalScore} 分
                    {currentTotal !== targetTotalScore && '（与当前合计不一致，可逐题调整分值）'}
                  </Text>
                  <Box flex={1} />
                  <Button
                    size="xs"
                    variant="outline"
                    bg="white"
                    color="gray.700"
                    onClick={picker.onOpen}
                  >
                    从题库选题
                  </Button>
                </Flex>

                {/* 题目列表 */}
                {items.length === 0 ? (
                  <Text fontSize="sm" color="gray.400" textAlign="center" py={8}>
                    暂无题目，点击右上角「从题库选题」手动添加
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {items.map((item, idx) => {
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
                          bg="white"
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
                          <HStack spacing={1} flexShrink={0} mt={0.5}>
                            <NumberInput
                              size="xs"
                              w="64px"
                              min={0}
                              max={100}
                              value={item.score}
                              onChange={(_, v) =>
                                handleScoreChange(q.id, Number.isFinite(v) ? v : 0)
                              }
                            >
                              <NumberInputField pr={1} textAlign="center" />
                            </NumberInput>
                            <Text fontSize="xs" color="gray.400">
                              分
                            </Text>
                            <IconButton
                              aria-label="移除该题"
                              icon={<DeleteIcon w={3} h={3} />}
                              size="xs"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: 'red.500', bg: 'red.50' }}
                              onClick={() => handleRemove(q.id)}
                            />
                          </HStack>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter
            gap={3}
            px={{ base: 4, md: 6 }}
            py={4}
            borderTop="1px solid"
            borderColor="#F0F1F3"
            bg="#FAFAFB"
            flexWrap="wrap"
          >
            {step === 1 ? (
              <>
                <Button variant="outline" bg="white" color="gray.700" onClick={onClose}>
                  取消
                </Button>
                <Button onClick={handleNext}>下一步：预览题目</Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  color="gray.600"
                  leftIcon={<ChevronLeftIcon />}
                  onClick={() => setStep(1)}
                >
                  上一步
                </Button>
                <Box flex={1} />
                <Button
                  variant="outline"
                  bg="white"
                  color="gray.700"
                  onClick={() => handleSave('draft')}
                >
                  保存草稿
                </Button>
                <Button onClick={() => handleSave('published')}>发布测验</Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 从题库选题（嵌套弹窗） */}
      <QuestionPickerModal
        isOpen={picker.isOpen}
        onClose={picker.onClose}
        chapterTree={chapterTree}
        bank={bank}
        existingIds={new Set(items.map((item) => item.question.id))}
        onAdd={handlePickFromBank}
      />
    </>
  );
}
