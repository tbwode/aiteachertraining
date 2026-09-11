'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  VStack
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import type { ChapterNode, Question } from '../questionBank/types';
import { QUESTION_TYPE_META } from '../questionBank/types';
import { collectChapterIds, findChapter, flattenChaptersWithDepth } from '../questionBank/mockData';
import { StemRichText } from '../questionBank/StemRichText';

const ALL = '__all__';

type QuestionPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chapterTree: ChapterNode[];
  bank: Question[];
  existingIds: Set<string>; // 已在测验中的题目
  onAdd: (questions: Question[]) => void;
};

// 从题库选题：章节筛选 + 关键词搜索 + 多选
export function QuestionPickerModal({
  isOpen,
  onClose,
  chapterTree,
  bank,
  existingIds,
  onAdd
}: QuestionPickerModalProps) {
  const [chapterId, setChapterId] = useState(ALL);
  const [keyword, setKeyword] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const flatChapters = useMemo(() => flattenChaptersWithDepth(chapterTree), [chapterTree]);

  useEffect(() => {
    if (!isOpen) return;
    setChapterId(ALL);
    setKeyword('');
    setCheckedIds(new Set());
  }, [isOpen]);

  const filtered = useMemo(() => {
    let list = bank;
    if (chapterId !== ALL) {
      const node = findChapter(chapterTree, chapterId);
      if (node) {
        const ids = collectChapterIds(node);
        list = list.filter((q) => ids.has(q.chapterId));
      }
    }
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (q) =>
          q.stem.toLowerCase().includes(kw) ||
          q.knowledgePoints.some((kp) => kp.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [bank, chapterId, keyword, chapterTree]);

  const toggle = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAdd = () => {
    onAdd(bank.filter((q) => checkedIds.has(q.id)));
    onClose();
  };

  return (
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
        <ModalHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid" borderColor="#F0F1F3">
          <Text fontSize="md" fontWeight={700} color="gray.800">
            从题库选题
          </Text>
        </ModalHeader>
        <ModalBody px={{ base: 4, md: 6 }} py={5}>
          <Flex gap={2} mb={4} direction={{ base: 'column', md: 'row' }}>
            <Select
              w={{ base: '100%', md: '220px' }}
              h="44px"
              flexShrink={0}
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
            >
              <option value={ALL}>全部章节</option>
              {flatChapters.map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {'　'.repeat(depth)}
                  {node.title}
                </option>
              ))}
            </Select>
            <InputGroup flex={1}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" w={3.5} h={3.5} />
              </InputLeftElement>
              <Input
                h="44px"
                placeholder="搜索题干 / 知识点"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </InputGroup>
          </Flex>

          <VStack align="stretch" spacing={2}>
            {filtered.length === 0 && (
              <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>
                没有符合条件的题目
              </Text>
            )}
            {filtered.map((q) => {
              const meta = QUESTION_TYPE_META[q.type];
              const added = existingIds.has(q.id);
              const checked = checkedIds.has(q.id);
              return (
                <Flex
                  key={q.id}
                  gap={2}
                  p={3}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor={checked ? 'red.200' : '#E5E6EB'}
                  bg={added ? 'gray.50' : checked ? 'rgba(200,0,11,0.02)' : 'white'}
                  align="flex-start"
                >
                  <Checkbox
                    colorScheme="red"
                    isChecked={checked}
                    isDisabled={added}
                    onChange={() => toggle(q.id)}
                    mt={0.5}
                  />
                  <Box flex={1} minW={0}>
                    <HStack spacing={1.5} mb={1}>
                      <Badge bg={meta.bg} color={meta.color} borderRadius="md" px={1.5}>
                        {meta.label}
                      </Badge>
                      <Text fontSize="xs" color="gray.400" noOfLines={1}>
                        {q.chapterTitle}
                      </Text>
                      {added && (
                        <Badge colorScheme="gray" borderRadius="md" px={1.5}>
                          已添加
                        </Badge>
                      )}
                    </HStack>
                    <StemRichText text={q.stem} images={q.images} color="gray.700" fontSize="sm" />
                  </Box>
                </Flex>
              );
            })}
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
          <Button variant="outline" bg="white" color="gray.700" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleAdd} isDisabled={checkedIds.size === 0}>
            添加（{checkedIds.size}）
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
