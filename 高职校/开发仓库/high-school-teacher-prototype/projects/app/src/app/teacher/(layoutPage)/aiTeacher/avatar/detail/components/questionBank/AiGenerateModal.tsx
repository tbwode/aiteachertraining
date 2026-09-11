'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import {
  AddIcon,
  AttachmentIcon,
  CloseIcon,
  EditIcon,
  MinusIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type {
  AiSourceFile,
  ChapterNode,
  KpSelection,
  Question,
  QuestionDifficulty,
  QuestionType
} from './types';
import {
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
  QUESTION_TYPE_META,
  QUESTION_TYPE_ORDER
} from './types';
import {
  findChapter,
  flattenChaptersWithDepth,
  mockGenerateByFiles,
  mockGenerateByKpSelections
} from './mockData';
import { StemRichText } from './StemRichText';
import { QuestionEditModal } from './QuestionEditModal';
import { KpTreePanel, kpKey } from './KpTreePanel';

type GenMode = 'kp' | 'file';

const formatFileSize = (size: number) =>
  size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;

const ACCEPT_FILE_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.md';

type AiGenerateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterTree: ChapterNode[];
  defaultChapterId?: string;
  onImport: (questions: Question[]) => void;
};

export function AiGenerateModal({
  isOpen,
  onClose,
  chapterTree,
  defaultChapterId,
  onImport
}: AiGenerateModalProps) {
  const toast = useToast();
  const flatChapters = useMemo(() => flattenChaptersWithDepth(chapterTree), [chapterTree]);

  const [mode, setMode] = useState<GenMode>('kp');
  const [selections, setSelections] = useState<KpSelection[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [files, setFiles] = useState<AiSourceFile[]>([]);
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    single: 2,
    multiple: 1,
    judge: 1,
    blank: 1,
    essay: 0
  });
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<Question[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<Question | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chapter = useMemo(() => findChapter(chapterTree, chapterId), [chapterTree, chapterId]);
  const totalCount = QUESTION_TYPE_ORDER.reduce((sum, t) => sum + (counts[t] || 0), 0);

  useEffect(() => {
    if (!isOpen) return;
    setMode('kp');
    setSelections([]);
    setChapterId(defaultChapterId || flatChapters[0]?.node.id || '');
    setFiles([]);
    setCounts({ single: 2, multiple: 1, judge: 1, blank: 1, essay: 0 });
    setDifficulty('medium');
    setGenerating(false);
    setPreview([]);
    setCheckedIds(new Set());
    setEditingItem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stepCount = (type: QuestionType, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(5, (prev[type] || 0) + delta))
    }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const items: AiSourceFile[] = Array.from(list).map((f) => ({
      id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size
    }));
    setFiles((prev) => [...prev, ...items]);
  };

  const handleGenerate = () => {
    if (totalCount === 0) {
      toast({
        title: '请至少选择一道题的题型数量',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (mode === 'kp' && selections.length === 0) {
      toast({ title: '请至少选择一个知识点', status: 'warning', duration: 2000, position: 'top' });
      return;
    }
    if (mode === 'file') {
      if (!chapter) {
        toast({ title: '请选择章节', status: 'warning', duration: 2000, position: 'top' });
        return;
      }
      if (files.length === 0) {
        toast({
          title: '请先上传用于出题的文件',
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }
    }
    setGenerating(true);
    setPreview([]);
    // 模拟 AI 生成耗时（文件模式多一段"解析"时间）
    const delay = mode === 'file' ? 2500 : 1500;
    setTimeout(() => {
      const questions =
        mode === 'kp'
          ? mockGenerateByKpSelections({ selections, tree: chapterTree, counts, difficulty })
          : mockGenerateByFiles({ files, chapter: chapter as ChapterNode, counts, difficulty });
      setPreview(questions);
      setCheckedIds(new Set(questions.map((q) => q.id)));
      setGenerating(false);
    }, delay);
  };

  const handleImport = () => {
    const picked = preview.filter((q) => checkedIds.has(q.id));
    if (picked.length === 0) {
      toast({ title: '请至少勾选一道题', status: 'warning', duration: 2000, position: 'top' });
      return;
    }
    onImport(picked);
    onClose();
  };

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
            <HStack spacing={2}>
              <Text fontSize="lg" fontWeight={700} color="gray.800">
                AI 出题
              </Text>
              <Badge colorScheme="purple" borderRadius="full" px={2}>
                模拟生成
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalBody px={{ base: 4, md: 6 }} py={5}>
            <VStack align="stretch" spacing={4}>
              {/* 出题方式 */}
              <HStack spacing={2} flexWrap="wrap">
                {(
                  [
                    { key: 'kp', label: '按知识点出题' },
                    { key: 'file', label: '上传文件出题' }
                  ] as { key: GenMode; label: string }[]
                ).map((m) => {
                  const active = mode === m.key;
                  return (
                    <Box
                      key={m.key}
                      as="button"
                      px={4}
                      minH="40px"
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight={active ? 600 : 400}
                      color={active ? '#C8000B' : 'gray.600'}
                      bg={active ? 'rgba(200,0,11,0.06)' : 'gray.50'}
                      border="1px solid"
                      borderColor={active ? '#C8000B' : 'gray.200'}
                      _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.14)' }}
                      onClick={() => {
                        setMode(m.key);
                        setPreview([]);
                      }}
                    >
                      {m.label}
                    </Box>
                  );
                })}
              </HStack>

              {/* 方式一：章节-知识点树多选 */}
              {mode === 'kp' && (
                <Box>
                  <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                    选择知识点{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <KpTreePanel
                    tree={chapterTree}
                    selections={selections}
                    onChange={setSelections}
                  />
                  {selections.length > 0 && (
                    <Box mt={2}>
                      <Text fontSize="xs" color="gray.500" mb={1.5}>
                        已选 {selections.length} 个知识点
                      </Text>
                      <Flex gap={1.5} flexWrap="wrap">
                        {selections.map((sel) => (
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
                                setSelections((prev) =>
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
                    </Box>
                  )}
                </Box>
              )}

              {/* 方式二：上传文件 */}
              {mode === 'file' && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                      出题章节{' '}
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
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                      上传文件{' '}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      gap={1.5}
                      py={6}
                      border="1.5px dashed"
                      borderColor="gray.300"
                      borderRadius="lg"
                      bg="gray.50"
                      cursor="pointer"
                      _hover={{ borderColor: '#C8000B', bg: 'rgba(200,0,11,0.02)' }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addFiles(e.dataTransfer?.files || null);
                      }}
                    >
                      <AttachmentIcon color="gray.400" w={5} h={5} />
                      <Text fontSize="sm" color="gray.600">
                        点击上传或拖拽文件到此处
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        支持 PDF / Word / PPT / TXT / MD，可上传多个文件
                      </Text>
                    </Flex>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ACCEPT_FILE_TYPES}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    {files.length > 0 && (
                      <VStack align="stretch" spacing={1.5} mt={2}>
                        {files.map((f) => (
                          <Flex
                            key={f.id}
                            align="center"
                            gap={2}
                            px={3}
                            py={1.5}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.100"
                            bg="white"
                          >
                            <AttachmentIcon color="gray.400" w={3.5} h={3.5} />
                            <Text fontSize="sm" color="gray.700" flex={1} noOfLines={1}>
                              {f.name}
                            </Text>
                            <Text fontSize="xs" color="gray.400" flexShrink={0}>
                              {formatFileSize(f.size)}
                            </Text>
                            <IconButton
                              aria-label="移除文件"
                              icon={<CloseIcon w={2.5} h={2.5} />}
                              size="xs"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: 'red.500' }}
                              onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                            />
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </>
              )}

              {/* 题型数量 */}
              <Box>
                <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                  题型与数量
                </Text>
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
                            isDisabled={(counts[t] || 0) >= 5}
                            onClick={() => stepCount(t, 1)}
                          />
                        </HStack>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>

              {/* 难度 */}
              <Box>
                <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
                  难度
                </Text>
                <HStack spacing={2}>
                  {DIFFICULTY_ORDER.map((d) => {
                    const active = d === difficulty;
                    return (
                      <Box
                        key={d}
                        as="button"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight={active ? 600 : 400}
                        color={active ? DIFFICULTY_META[d].color : 'gray.600'}
                        bg={active ? 'white' : 'gray.50'}
                        border="1px solid"
                        borderColor={active ? DIFFICULTY_META[d].color : 'gray.200'}
                        onClick={() => setDifficulty(d)}
                      >
                        {DIFFICULTY_META[d].label}
                      </Box>
                    );
                  })}
                </HStack>
              </Box>

              {/* 生成区 */}
              {generating && (
                <Flex align="center" justify="center" py={6} gap={3}>
                  <Spinner size="sm" color="red.500" />
                  <Text fontSize="sm" color="gray.500">
                    {mode === 'file' ? 'AI 正在解析文件并出题，请稍候…' : 'AI 正在出题，请稍候…'}
                  </Text>
                </Flex>
              )}

              {/* 预览列表 */}
              {preview.length > 0 && (
                <Box borderTop="1px solid" borderColor="gray.100" pt={3}>
                  <Flex align="center" justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight={600} color="gray.700">
                      生成预览（已选 {checkedIds.size}/{preview.length}）
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      bg="white"
                      color="gray.700"
                      leftIcon={<RepeatIcon w={3} h={3} />}
                      onClick={handleGenerate}
                    >
                      重新生成
                    </Button>
                  </Flex>
                  <VStack align="stretch" spacing={2}>
                    {preview.map((q) => {
                      const meta = QUESTION_TYPE_META[q.type];
                      const checked = checkedIds.has(q.id);
                      return (
                        <Flex
                          key={q.id}
                          gap={2}
                          p={2.5}
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={checked ? 'red.200' : 'gray.100'}
                          bg={checked ? 'rgba(200,0,11,0.02)' : 'white'}
                          align="flex-start"
                        >
                          <Checkbox
                            colorScheme="red"
                            isChecked={checked}
                            onChange={(e) =>
                              setCheckedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(q.id);
                                else next.delete(q.id);
                                return next;
                              })
                            }
                            mt={0.5}
                          />
                          <Box flex={1} minW={0}>
                            <HStack spacing={1.5} mb={1}>
                              <Badge bg={meta.bg} color={meta.color} borderRadius="md" px={1.5}>
                                {meta.label}
                              </Badge>
                              <Badge colorScheme="gray" borderRadius="md" px={1.5}>
                                {DIFFICULTY_META[q.difficulty].label}
                              </Badge>
                              <Badge
                                colorScheme="purple"
                                variant="subtle"
                                borderRadius="md"
                                px={1.5}
                              >
                                {q.chapterTitle}
                              </Badge>
                              <Box flex={1} />
                              <IconButton
                                aria-label="编辑该题"
                                icon={<EditIcon w={3} h={3} />}
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: 'gray.700', bg: 'gray.100' }}
                                onClick={() => setEditingItem(q)}
                              />
                            </HStack>
                            <StemRichText text={q.stem} images={q.images} color="gray.700" />
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                </Box>
              )}
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
            {preview.length === 0 ? (
              <Button onClick={handleGenerate} isLoading={generating} isDisabled={totalCount === 0}>
                开始生成（{totalCount} 题）
              </Button>
            ) : (
              <Button onClick={handleImport} isDisabled={checkedIds.size === 0}>
                加入题库（{checkedIds.size}）
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 预览题目编辑（嵌套） */}
      {editingItem && (
        <QuestionEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          chapterTree={chapterTree}
          defaultChapterId={editingItem.chapterId}
          question={editingItem}
          onSubmit={(updated) => {
            setPreview((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...updated, source: 'ai' } : p))
            );
            setEditingItem(null);
            toast({ title: '题目已更新', status: 'success', duration: 1500, position: 'top' });
          }}
        />
      )}
    </>
  );
}
