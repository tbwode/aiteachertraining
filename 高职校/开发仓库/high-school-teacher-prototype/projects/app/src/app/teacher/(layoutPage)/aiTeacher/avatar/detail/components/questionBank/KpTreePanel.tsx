'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Text
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import type { ChapterNode, KpSelection } from './types';

export const kpKey = (chapterId: string, kp: string) => `${chapterId}::${kp}`;

// 子树内全部知识点选择项（章/节通用）
const subtreeSelections = (node: ChapterNode): KpSelection[] => [
  ...node.knowledgePoints.map((kp) => ({
    chapterId: node.id,
    chapterTitle: node.title,
    kp
  })),
  ...node.children.flatMap(subtreeSelections)
];

type KpTreePanelProps = {
  tree: ChapterNode[];
  selections: KpSelection[];
  onChange: (next: KpSelection[]) => void;
  maxH?: string | number;
  searchPlaceholder?: string;
};

// 章节-知识点树多选面板：搜索 + 层级缩进 + 竖向引导线 + 折叠箭头 + 父子勾选联动
export function KpTreePanel({
  tree,
  selections,
  onChange,
  maxH = '220px',
  searchPlaceholder = '搜索章节 / 知识点'
}: KpTreePanelProps) {
  const [kw, setKw] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const selKeySet = useMemo(
    () => new Set(selections.map((s) => kpKey(s.chapterId, s.kp))),
    [selections]
  );

  // 按章节名 / 知识点名过滤；章节名命中时保留整棵子树
  const filteredTree = useMemo(() => {
    const keyword = kw.trim().toLowerCase();
    if (!keyword) return tree;
    const walk = (nodes: ChapterNode[]): ChapterNode[] =>
      nodes
        .map((node) => {
          if (node.title.toLowerCase().includes(keyword)) return node;
          const kps = node.knowledgePoints.filter((kp) => kp.toLowerCase().includes(keyword));
          const children = walk(node.children);
          if (kps.length === 0 && children.length === 0) return null;
          return { ...node, knowledgePoints: kps, children };
        })
        .filter((node): node is ChapterNode => !!node);
    return walk(tree);
  }, [tree, kw]);

  const searching = kw.trim().length > 0;

  const toggleKp = (node: ChapterNode, kp: string) => {
    const key = kpKey(node.id, kp);
    onChange(
      selKeySet.has(key)
        ? selections.filter((s) => kpKey(s.chapterId, s.kp) !== key)
        : [...selections, { chapterId: node.id, chapterTitle: node.title, kp }]
    );
  };

  // 章/节勾选：全选或清空其子树知识点
  const toggleChapterSubtree = (node: ChapterNode) => {
    const subtree = subtreeSelections(node);
    const allSelected = subtree.every((s) => selKeySet.has(kpKey(s.chapterId, s.kp)));
    if (allSelected) {
      const removeKeys = new Set(subtree.map((s) => kpKey(s.chapterId, s.kp)));
      onChange(selections.filter((s) => !removeKeys.has(kpKey(s.chapterId, s.kp))));
    } else {
      const added = subtree.filter((s) => !selKeySet.has(kpKey(s.chapterId, s.kp)));
      onChange([...selections, ...added]);
    }
  };

  const toggleCollapse = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 渲染树节点：每级缩进 20px + 竖向引导线，章节行带折叠箭头
  const renderTreeNode = (node: ChapterNode) => {
    const subtree = subtreeSelections(node);
    const selectedCount = subtree.filter((s) => selKeySet.has(kpKey(s.chapterId, s.kp))).length;
    const allChecked = subtree.length > 0 && selectedCount === subtree.length;
    const indeterminate = selectedCount > 0 && !allChecked;
    const hasChildren = node.knowledgePoints.length > 0 || node.children.length > 0;
    const collapsed = !searching && collapsedIds.has(node.id);
    return (
      <Box key={node.id}>
        <Flex align="center" py={1} pr={1} borderRadius="md" _hover={{ bg: 'gray.50' }}>
          <Flex
            as="button"
            w="18px"
            h="18px"
            mr={0.5}
            flexShrink={0}
            align="center"
            justify="center"
            borderRadius="sm"
            color="gray.400"
            _hover={{ color: 'gray.600', bg: 'gray.100' }}
            visibility={hasChildren ? 'visible' : 'hidden'}
            aria-label={collapsed ? '展开' : '收起'}
            onClick={() => toggleCollapse(node.id)}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
          </Flex>
          <Checkbox
            colorScheme="red"
            size="sm"
            isChecked={allChecked}
            isIndeterminate={indeterminate}
            onChange={() => toggleChapterSubtree(node)}
          >
            <Text fontSize="sm" fontWeight={600} color="gray.700">
              {node.title}
              <Text as="span" fontSize="xs" fontWeight={400} color="gray.400" ml={1}>
                {subtree.length} 个知识点{selectedCount > 0 ? ` · 已选 ${selectedCount}` : ''}
              </Text>
            </Text>
          </Checkbox>
        </Flex>
        {!collapsed && hasChildren && (
          <Box ml="8px" pl="12px" borderLeft="1px solid" borderColor="gray.200">
            {node.knowledgePoints.map((kp) => {
              const checked = selKeySet.has(kpKey(node.id, kp));
              return (
                <Flex
                  key={kpKey(node.id, kp)}
                  align="center"
                  pl={1.5}
                  py={0.5}
                  borderRadius="md"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Checkbox
                    colorScheme="red"
                    size="sm"
                    isChecked={checked}
                    onChange={() => toggleKp(node, kp)}
                  >
                    <Text fontSize="sm" color={checked ? 'gray.800' : 'gray.600'}>
                      {kp}
                    </Text>
                  </Checkbox>
                </Flex>
              );
            })}
            {node.children.map((child) => renderTreeNode(child))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white">
      <Box p={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" w={3.5} h={3.5} />
          </InputLeftElement>
          <Input
            bg="white"
            placeholder={searchPlaceholder}
            value={kw}
            onChange={(e) => setKw(e.target.value)}
          />
        </InputGroup>
      </Box>
      <Box maxH={maxH} overflowY="auto" p={2}>
        {filteredTree.length > 0 ? (
          filteredTree.map((node) => renderTreeNode(node))
        ) : (
          <Text fontSize="xs" color="gray.400" py={4} textAlign="center">
            没有匹配「{kw}」的章节或知识点
          </Text>
        )}
      </Box>
    </Box>
  );
}
