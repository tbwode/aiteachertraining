'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type {
  ChapterNode,
  KpSelection,
  Question,
  QuestionDifficulty,
  QuestionImage,
  QuestionType
} from './types';
import {
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
  QUESTION_TYPE_META,
  QUESTION_TYPE_ORDER
} from './types';
import { flattenChapters, flattenChaptersWithDepth } from './mockData';
import { StemRichText } from './StemRichText';
import { KpTreePanel, kpKey } from './KpTreePanel';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

const countBlankMarkers = (text: string) => (text.match(/【\d+】/g) || []).length;

type QuestionEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterTree: ChapterNode[];
  defaultChapterId?: string;
  question?: Question | null;
  onSubmit: (q: Question) => void;
};

type OptionItem = { key: string; text: string };

export function QuestionEditModal({
  isOpen,
  onClose,
  chapterTree,
  defaultChapterId,
  question,
  onSubmit
}: QuestionEditModalProps) {
  const toast = useToast();
  const isEdit = !!question;

  const [type, setType] = useState<QuestionType>('single');
  const [stem, setStem] = useState('');
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [singleAnswer, setSingleAnswer] = useState('A');
  const [multiAnswer, setMultiAnswer] = useState<string[]>([]);
  const [judgeAnswer, setJudgeAnswer] = useState('正确');
  const [blankAnswers, setBlankAnswers] = useState<string[]>(['']);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [chapterId, setChapterId] = useState('');
  const [kpSelections, setKpSelections] = useState<KpSelection[]>([]);
  const [kpPanelOpen, setKpPanelOpen] = useState(false);
  const [images, setImages] = useState<QuestionImage[]>([]);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formulaText, setFormulaText] = useState('');
  const stemRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flatChapters = useMemo(() => flattenChaptersWithDepth(chapterTree), [chapterTree]);

  // 已选知识点名称（去重，提交用）
  const knowledgePointNames = useMemo(
    () => Array.from(new Set(kpSelections.map((s) => s.kp))),
    [kpSelections]
  );

  // 编辑回填：按知识点名称在章节树中定位（优先题目所属章节）
  const namesToSelections = (names: string[], preferChapterId?: string): KpSelection[] => {
    const flat = flattenChapters(chapterTree);
    return names
      .map((name) => {
        const hit =
          flat.find((n) => n.id === preferChapterId && n.knowledgePoints.includes(name)) ||
          flat.find((n) => n.knowledgePoints.includes(name));
        return hit ? { chapterId: hit.id, chapterTitle: hit.title, kp: name } : null;
      })
      .filter((s): s is KpSelection => !!s);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (question) {
      setType(question.type);
      setStem(question.stem);
      setOptions(question.options);
      setSingleAnswer(question.type === 'single' ? question.answer[0] || 'A' : 'A');
      setMultiAnswer(question.type === 'multiple' ? question.answer : []);
      setJudgeAnswer(question.type === 'judge' ? question.answer[0] || '正确' : '正确');
      setBlankAnswers(question.type === 'blank' ? question.answer : ['']);
      setEssayAnswer(question.type === 'essay' ? question.answer[0] || '' : '');
      setGradingCriteria(question.gradingCriteria || '');
      setAnalysis(question.analysis);
      setDifficulty(question.difficulty);
      setChapterId(question.chapterId);
      setKpSelections(namesToSelections(question.knowledgePoints, question.chapterId));
      setImages(question.images || []);
    } else {
      setType('single');
      setStem('');
      setOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]);
      setSingleAnswer('A');
      setMultiAnswer([]);
      setJudgeAnswer('正确');
      setBlankAnswers(['']);
      setEssayAnswer('');
      setGradingCriteria('');
      setAnalysis('');
      setDifficulty('medium');
      setChapterId(defaultChapterId || flatChapters[0]?.node.id || '');
      setKpSelections([]);
      setImages([]);
    }
    setKpPanelOpen(false);
    setFormulaOpen(false);
    setFormulaText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, question]);

  const changeType = (next: QuestionType) => {
    setType(next);
    if ((next === 'single' || next === 'multiple') && options.length === 0) {
      setOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ]);
    }
  };

  // 在题干光标处插入片段（公式 / 图片引用 / 填空标识）
  const insertAtCursor = (snippet: string) => {
    const el = stemRef.current;
    if (!el) {
      setStem((prev) => prev + snippet);
      return;
    }
    const start = el.selectionStart ?? stem.length;
    const end = el.selectionEnd ?? stem.length;
    setStem((prev) => prev.slice(0, start) + snippet + prev.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleInsertFormula = () => {
    const tex = formulaText.trim();
    if (!tex) return;
    insertAtCursor(`$${tex}$`);
    setFormulaText('');
    setFormulaOpen(false);
  };

  const handlePickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img: QuestionImage = {
        id: `img-${Date.now().toString(36)}`,
        name: file.name.replace(/\.[a-zA-Z0-9]+$/, '') || `图片${images.length + 1}`,
        url: String(reader.result || '')
      };
      setImages((prev) => [...prev, img]);
      insertAtCursor(`\n\n![${img.name}](${img.id})\n`);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (img: QuestionImage) => {
    setImages((prev) => prev.filter((item) => item.id !== img.id));
    setStem((prev) => prev.replace(`![${img.name}](${img.id})`, '').replace(/\n{3,}/g, '\n\n'));
  };

  // 填空：插入【n】标识，并同步补齐答案行
  const insertBlankMarker = () => {
    const nextNo = countBlankMarkers(stem) + 1;
    insertAtCursor(`【${nextNo}】`);
    setBlankAnswers((prev) => (prev.length < nextNo ? [...prev, ''] : prev));
  };

  const handleSubmit = () => {
    if (!stem.trim()) {
      toast({ title: '请填写题干', status: 'warning', duration: 2000, position: 'top' });
      return;
    }
    if (!chapterId) {
      toast({ title: '请选择所属章节', status: 'warning', duration: 2000, position: 'top' });
      return;
    }

    let answer: string[] = [];
    let finalOptions: OptionItem[] = [];

    if (type === 'single' || type === 'multiple') {
      finalOptions = options.filter((o) => o.text.trim());
      if (finalOptions.length < 2) {
        toast({
          title: '至少保留 2 个有效选项',
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }
      if (type === 'single') {
        if (!finalOptions.some((o) => o.key === singleAnswer)) {
          toast({ title: '请选择正确答案', status: 'warning', duration: 2000, position: 'top' });
          return;
        }
        answer = [singleAnswer];
      } else {
        const picked = multiAnswer.filter((k) => finalOptions.some((o) => o.key === k));
        if (picked.length === 0) {
          toast({
            title: '请至少勾选一个正确答案',
            status: 'warning',
            duration: 2000,
            position: 'top'
          });
          return;
        }
        answer = picked;
      }
    } else if (type === 'judge') {
      answer = [judgeAnswer];
    } else if (type === 'blank') {
      const markerCount = countBlankMarkers(stem);
      if (markerCount === 0) {
        toast({
          title: '请在题干中插入填空标识（点击「插入填空标识」生成【1】）',
          status: 'warning',
          duration: 2500,
          position: 'top'
        });
        return;
      }
      answer = blankAnswers.map((a) => a.trim()).filter(Boolean);
      if (answer.length === 0) {
        toast({ title: '请填写填空答案', status: 'warning', duration: 2000, position: 'top' });
        return;
      }
      if (markerCount !== answer.length) {
        toast({
          title: `题干中有 ${markerCount} 个填空标识，与答案条数（${answer.length}）不一致`,
          status: 'warning',
          duration: 2500,
          position: 'top'
        });
        return;
      }
    } else {
      if (!essayAnswer.trim()) {
        toast({ title: '请填写参考答案', status: 'warning', duration: 2000, position: 'top' });
        return;
      }
      answer = [essayAnswer.trim()];
    }

    const chapter = flatChapters.find(({ node }) => node.id === chapterId)?.node;
    onSubmit({
      id: question?.id || `q-${Date.now().toString(36)}`,
      type,
      stem: stem.trim(),
      options: finalOptions,
      answer,
      analysis: analysis.trim(),
      gradingCriteria: type === 'essay' ? gradingCriteria.trim() || undefined : undefined,
      images: images.length > 0 ? images : undefined,
      difficulty,
      chapterId,
      chapterTitle: chapter?.title || question?.chapterTitle || '',
      knowledgePoints: knowledgePointNames,
      source: question?.source || 'manual',
      createdAt: question?.createdAt || new Date().toISOString().slice(0, 10)
    });
    onClose();
  };

  const typeMeta = QUESTION_TYPE_META[type];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl" scrollBehavior="inside">
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
            <Text fontSize="lg" fontWeight={700} color="gray.800">
              {isEdit ? '编辑题目' : '手动出题'}
            </Text>
          </ModalHeader>
          <ModalBody px={{ base: 4, md: 6 }} py={5}>
            <VStack align="stretch" spacing={4}>
              {/* 题型 */}
              <Box>
                <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                  题型
                </Text>
                {isEdit ? (
                  <HStack spacing={2}>
                    <Badge
                      bg={typeMeta.bg}
                      color={typeMeta.color}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="sm"
                      fontWeight={600}
                    >
                      {typeMeta.label}
                    </Badge>
                    <Text fontSize="xs" color="gray.400">
                      已有题目不支持切换题型
                    </Text>
                  </HStack>
                ) : (
                  <HStack spacing={2} flexWrap="wrap">
                    {QUESTION_TYPE_ORDER.map((t) => {
                      const meta = QUESTION_TYPE_META[t];
                      const active = t === type;
                      return (
                        <Box
                          key={t}
                          as="button"
                          px={3}
                          minH="40px"
                          borderRadius="full"
                          fontSize="sm"
                          fontWeight={active ? 600 : 400}
                          color={active ? meta.color : 'gray.600'}
                          bg={active ? meta.bg : 'gray.50'}
                          border="1px solid"
                          borderColor={active ? meta.color : 'gray.200'}
                          _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.14)' }}
                          onClick={() => changeType(t)}
                        >
                          {meta.label}
                        </Box>
                      );
                    })}
                  </HStack>
                )}
              </Box>

              {/* 题干 */}
              <Box>
                <Flex align="center" justify="space-between" mb={2} flexWrap="wrap" gap={2}>
                  <Text fontSize="sm" fontWeight={600} color="gray.700">
                    题干{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Flex gap={1} flexWrap="wrap" justify="flex-end">
                    {type === 'blank' && (
                      <Box
                        as="button"
                        px={2}
                        minH="36px"
                        borderRadius="md"
                        fontSize="xs"
                        color="#D97706"
                        bg="rgba(217,119,6,0.08)"
                        _hover={{ bg: 'rgba(217,119,6,0.15)' }}
                        onClick={insertBlankMarker}
                      >
                        ＋ 插入填空标识
                      </Box>
                    )}
                    <Box
                      as="button"
                      px={2}
                      minH="36px"
                      borderRadius="md"
                      fontSize="xs"
                      color="gray.600"
                      bg="gray.50"
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => {
                        setFormulaText('');
                        setFormulaOpen(true);
                      }}
                    >
                      ∑ 插入公式
                    </Box>
                    <Box
                      as="button"
                      px={2}
                      minH="36px"
                      borderRadius="md"
                      fontSize="xs"
                      color="gray.600"
                      bg="gray.50"
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      🖼 插入图片
                    </Box>
                  </Flex>
                </Flex>
                <Textarea
                  ref={stemRef}
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  placeholder={
                    type === 'blank'
                      ? '请输入题干，用【1】【2】标记填空位置（可点击右上角「插入填空标识」）'
                      : '请输入题干，支持 $LaTeX$ 公式与图片'
                  }
                  rows={3}
                  fontSize="sm"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    handlePickImage(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {images.length > 0 && (
                  <HStack spacing={2} mt={2} flexWrap="wrap">
                    {images.map((img) => (
                      <Flex
                        key={img.id}
                        align="center"
                        gap={1.5}
                        pl={1.5}
                        pr={1}
                        py={1}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                      >
                        <Image
                          src={img.url}
                          alt={img.name}
                          boxSize="32px"
                          borderRadius="md"
                          objectFit="cover"
                        />
                        <Text fontSize="xs" color="gray.600" maxW="120px" noOfLines={1}>
                          {img.name}
                        </Text>
                        <IconButton
                          aria-label="删除图片"
                          icon={<CloseIcon w={2} h={2} />}
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          onClick={() => removeImage(img)}
                        />
                      </Flex>
                    ))}
                  </HStack>
                )}
                {(stem.includes('$') || images.length > 0) && (
                  <Box
                    mt={2}
                    p={2.5}
                    borderRadius="lg"
                    bg="gray.50"
                    border="1px dashed"
                    borderColor="gray.200"
                  >
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      效果预览
                    </Text>
                    <StemRichText text={stem} images={images} color="gray.700" />
                  </Box>
                )}
              </Box>

              {/* 选项（单选/多选） */}
              {(type === 'single' || type === 'multiple') && (
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    选项与正确答案{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {options.map((opt, idx) => (
                      <Flex key={opt.key} align="center" gap={2}>
                        {type === 'single' ? (
                          <Radio
                            isChecked={singleAnswer === opt.key}
                            onChange={() => setSingleAnswer(opt.key)}
                            colorScheme="red"
                          />
                        ) : (
                          <Checkbox
                            isChecked={multiAnswer.includes(opt.key)}
                            onChange={(e) =>
                              setMultiAnswer((prev) =>
                                e.target.checked
                                  ? [...prev, opt.key]
                                  : prev.filter((k) => k !== opt.key)
                              )
                            }
                            colorScheme="red"
                          />
                        )}
                        <Text fontSize="sm" fontWeight={600} color="gray.600" w="18px">
                          {opt.key}
                        </Text>
                        <Input
                          size="sm"
                          value={opt.text}
                          placeholder={`选项 ${opt.key}`}
                          onChange={(e) =>
                            setOptions((prev) =>
                              prev.map((o) =>
                                o.key === opt.key ? { ...o, text: e.target.value } : o
                              )
                            )
                          }
                        />
                        <IconButton
                          aria-label="删除选项"
                          icon={<CloseIcon w={2.5} h={2.5} />}
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          isDisabled={options.length <= 2}
                          onClick={() =>
                            setOptions((prev) => prev.filter((o) => o.key !== opt.key))
                          }
                        />
                      </Flex>
                    ))}
                    {options.length < OPTION_KEYS.length && (
                      <Button
                        size="sm"
                        variant="outline"
                        bg="white"
                        color="gray.700"
                        leftIcon={<AddIcon w={2.5} h={2.5} />}
                        alignSelf="flex-start"
                        onClick={() =>
                          setOptions((prev) => [
                            ...prev,
                            { key: OPTION_KEYS[prev.length], text: '' }
                          ])
                        }
                      >
                        添加选项
                      </Button>
                    )}
                  </VStack>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    {type === 'single'
                      ? '点击圆圈标记正确答案（单选）'
                      : '勾选一个或多个正确答案（多选）'}
                  </Text>
                </Box>
              )}

              {/* 判断 */}
              {type === 'judge' && (
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    正确答案{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <RadioGroup value={judgeAnswer} onChange={setJudgeAnswer}>
                    <HStack spacing={6}>
                      <Radio value="正确" colorScheme="red">
                        正确
                      </Radio>
                      <Radio value="错误" colorScheme="red">
                        错误
                      </Radio>
                    </HStack>
                  </RadioGroup>
                </Box>
              )}

              {/* 填空 */}
              {type === 'blank' && (
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    填空答案{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Text fontSize="xs" color="gray.400" mb={2}>
                    {countBlankMarkers(stem) > 0
                      ? `题干中已标记 ${countBlankMarkers(stem)} 个空（【1】~【${countBlankMarkers(stem)}】），答案按空号顺序对应`
                      : '题干中还没有填空标识，请先在题干中点击「插入填空标识」'}
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {blankAnswers.map((ans, idx) => (
                      <Flex key={idx} align="center" gap={2}>
                        <Text fontSize="sm" color="gray.500" w="52px" flexShrink={0}>
                          【{idx + 1}】
                        </Text>
                        <Input
                          size="sm"
                          value={ans}
                          placeholder="该空答案"
                          onChange={(e) =>
                            setBlankAnswers((prev) =>
                              prev.map((a, i) => (i === idx ? e.target.value : a))
                            )
                          }
                        />
                        <IconButton
                          aria-label="删除该空"
                          icon={<CloseIcon w={2.5} h={2.5} />}
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          isDisabled={blankAnswers.length <= 1}
                          onClick={() =>
                            setBlankAnswers((prev) => prev.filter((_, i) => i !== idx))
                          }
                        />
                      </Flex>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      bg="white"
                      color="gray.700"
                      leftIcon={<AddIcon w={2.5} h={2.5} />}
                      alignSelf="flex-start"
                      onClick={() => setBlankAnswers((prev) => [...prev, ''])}
                    >
                      添加空
                    </Button>
                  </VStack>
                </Box>
              )}

              {/* 简答 */}
              {type === 'essay' && (
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    参考答案{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Textarea
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    placeholder="请输入参考答案 / 评分要点"
                    rows={3}
                    fontSize="sm"
                  />
                  <Flex align="center" gap={2} mt={3} mb={2}>
                    <Text fontSize="sm" fontWeight={600} color="gray.700">
                      评分标准
                    </Text>
                    <Badge colorScheme="purple" borderRadius="full" px={2} fontSize="10px">
                      AI 评价参考
                    </Badge>
                  </Flex>
                  <Textarea
                    value={gradingCriteria}
                    onChange={(e) => setGradingCriteria(e.target.value)}
                    placeholder="为AI评价提供参考依据，建议包含评分维度、权重分配、具体要求等"
                    rows={3}
                    fontSize="sm"
                  />
                </Box>
              )}

              {/* 解析 */}
              <Box>
                <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                  解析
                </Text>
                <Textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  placeholder="选填，向学生展示的答案解析"
                  rows={2}
                  fontSize="sm"
                />
              </Box>

              {/* 难度 + 章节 */}
              <HStack spacing={4} align="flex-start">
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    难度
                  </Text>
                  <Select
                    size="sm"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  >
                    {DIFFICULTY_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_META[d].label}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box flex={2}>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    所属章节{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Select
                    size="sm"
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                  >
                    {flatChapters.map(({ node, depth }) => (
                      <option key={node.id} value={node.id}>
                        {'　'.repeat(depth)}
                        {node.title}
                      </option>
                    ))}
                  </Select>
                </Box>
              </HStack>

              {/* 知识点：下拉 + 章节-知识点树多选 */}
              <Box>
                <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                  关联知识点
                </Text>
                <Flex
                  as="button"
                  type="button"
                  w="100%"
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={kpPanelOpen ? '#C8000B' : 'gray.200'}
                  bg="white"
                  fontSize="sm"
                  color={knowledgePointNames.length > 0 ? 'gray.700' : 'gray.400'}
                  _hover={{ borderColor: 'gray.300' }}
                  onClick={() => setKpPanelOpen((v) => !v)}
                >
                  {knowledgePointNames.length > 0
                    ? `已选 ${knowledgePointNames.length} 个知识点`
                    : '请选择知识点（按章节-知识点树选择）'}
                  <ChevronDownIcon
                    w={4}
                    h={4}
                    color="gray.400"
                    transform={kpPanelOpen ? 'rotate(180deg)' : undefined}
                    transition="transform 0.15s"
                  />
                </Flex>
                {kpPanelOpen && (
                  <Box mt={2}>
                    <KpTreePanel
                      tree={chapterTree}
                      selections={kpSelections}
                      onChange={setKpSelections}
                      maxH="200px"
                    />
                  </Box>
                )}
                {kpSelections.length > 0 && (
                  <Flex gap={1.5} flexWrap="wrap" mt={2}>
                    {kpSelections.map((sel) => (
                      <Flex
                        key={kpKey(sel.chapterId, sel.kp)}
                        align="center"
                        gap={1}
                        pl={2.5}
                        pr={1.5}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                        color="#C8000B"
                        bg="rgba(200,0,11,0.06)"
                        border="1px solid"
                        borderColor="red.200"
                        title={sel.chapterTitle}
                      >
                        {sel.kp}
                        <Box
                          as="button"
                          aria-label="移除"
                          display="inline-flex"
                          onClick={() =>
                            setKpSelections((prev) =>
                              prev.filter(
                                (s) => kpKey(s.chapterId, s.kp) !== kpKey(sel.chapterId, sel.kp)
                              )
                            )
                          }
                        >
                          <CloseIcon w={2} h={2} />
                        </Box>
                      </Flex>
                    ))}
                  </Flex>
                )}
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
            flexWrap="wrap"
          >
            <Button variant="outline" bg="white" color="gray.700" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSubmit}>{isEdit ? '保存修改' : '创建题目'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 公式编辑器 */}
      <Modal
        isOpen={formulaOpen}
        onClose={() => setFormulaOpen(false)}
        isCentered
        size="lg"
        blockScrollOnMount={false}
      >
        <ModalOverlay bg="rgba(17,24,39,0.52)" backdropFilter="blur(3px)" />
        <ModalContent
          mx={3}
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
            <Text fontSize="md" fontWeight={700} color="gray.800">
              插入公式（LaTeX）
            </Text>
          </ModalHeader>
          <ModalBody px={{ base: 4, md: 6 }} py={5}>
            <VStack align="stretch" spacing={3}>
              <Textarea
                value={formulaText}
                onChange={(e) => setFormulaText(e.target.value)}
                placeholder={'输入 LaTeX 公式，如：E=mc^2 或 \\frac{a}{b}'}
                rows={2}
                fontSize="sm"
                fontFamily="mono"
                autoFocus
              />
              <HStack spacing={1.5} flexWrap="wrap">
                {[
                  'x^2',
                  '\\sqrt{x}',
                  '\\frac{a}{b}',
                  '\\sum_{i=1}^{n}',
                  '\\alpha+\\beta',
                  'x \\geq 0'
                ].map((tpl) => (
                  <Box
                    key={tpl}
                    as="button"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                    fontFamily="mono"
                    color="gray.600"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.100' }}
                    onClick={() => setFormulaText((prev) => (prev ? `${prev} ${tpl}` : tpl))}
                  >
                    {tpl}
                  </Box>
                ))}
              </HStack>
              <Box
                p={3}
                borderRadius="lg"
                bg="gray.50"
                border="1px dashed"
                borderColor="gray.200"
                minH="52px"
              >
                <Text fontSize="xs" color="gray.400" mb={1}>
                  实时预览
                </Text>
                {formulaText.trim() ? (
                  <StemRichText text={`$${formulaText.trim()}$`} color="gray.800" />
                ) : (
                  <Text fontSize="xs" color="gray.300">
                    输入公式后在此预览
                  </Text>
                )}
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
            <Button
              variant="outline"
              bg="white"
              color="gray.700"
              onClick={() => setFormulaOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleInsertFormula} isDisabled={!formulaText.trim()}>
              插入到题干
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
