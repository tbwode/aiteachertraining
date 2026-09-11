'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  VStack
} from '@chakra-ui/react';
import { ChevronRightIcon, CloseIcon, SearchIcon } from '@chakra-ui/icons';
import type { AiAvatarChapterVO } from '@/teacher/types/aiTeacher';
import type { GraphNodeType } from './utils';
import { buildTreeData, NODE_TYPE_COLORS } from './utils';

type OutlineNode = {
  id: string;
  title: string;
  nodeType: GraphNodeType;
  children?: OutlineNode[];
};

type CourseOutlinePanelProps = {
  courseName: string;
  chapters: AiAvatarChapterVO[];
  selectedNodeId?: string | null;
  onNodeSelect: (nodeId: string) => void;
  width?: string;
};

function filterTree(nodes: OutlineNode[], keyword: string): OutlineNode[] {
  if (!keyword) return nodes;
  const normalized = keyword.toLowerCase();

  return nodes.flatMap((node) => {
    const children = filterTree(node.children || [], normalized);
    const selfMatched = node.title.toLowerCase().includes(normalized);
    if (!selfMatched && children.length === 0) return [];
    return [{ ...node, children: selfMatched ? node.children : children }];
  });
}

function collectExpandableIds(nodes: OutlineNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.children?.length ? [node.id] : []),
    ...collectExpandableIds(node.children || [])
  ]);
}

function OutlineTreeNode({
  node,
  depth,
  expandedIds,
  selectedNodeId,
  onToggle,
  onSelect
}: {
  node: OutlineNode;
  depth: number;
  expandedIds: Set<string>;
  selectedNodeId?: string | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const color = NODE_TYPE_COLORS[node.nodeType]?.fill || NODE_TYPE_COLORS.knowledge.fill;

  return (
    <Box>
      <Flex
        align="center"
        minH="38px"
        pl={Math.min(depth * 14, 42) + 'px'}
        pr={2}
        borderRadius="9px"
        bg={isSelected ? '#FFF1F0' : 'transparent'}
        color={isSelected ? '#B42318' : '#344054'}
        _hover={{ bg: isSelected ? '#FFF1F0' : '#F9FAFB' }}
      >
        {hasChildren ? (
          <IconButton
            aria-label={isExpanded ? '收起 ' + node.title : '展开 ' + node.title}
            aria-expanded={isExpanded}
            icon={
              <ChevronRightIcon
                w={4}
                h={4}
                transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                transition="transform .16s ease"
              />
            }
            minW="32px"
            w="32px"
            h="32px"
            variant="ghost"
            color="#98A2B3"
            onClick={() => onToggle(node.id)}
          />
        ) : (
          <Box w="32px" h="32px" flexShrink={0} />
        )}
        <HStack
          as="button"
          type="button"
          flex="1"
          minW={0}
          h="36px"
          spacing={2}
          textAlign="left"
          onClick={() => onSelect(node.id)}
          _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.14)', borderRadius: '7px' }}
        >
          <Box w="8px" h="8px" borderRadius="full" bg={color} flexShrink={0} />
          <Text fontSize="12px" fontWeight={isSelected ? 700 : 500} noOfLines={1}>
            {node.title}
          </Text>
        </HStack>
      </Flex>

      {hasChildren && isExpanded ? (
        <VStack align="stretch" spacing={0}>
          {node.children?.map((child) => (
            <OutlineTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedNodeId={selectedNodeId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </VStack>
      ) : null}
    </Box>
  );
}

export function CourseOutlinePanel({
  courseName,
  chapters,
  selectedNodeId,
  onNodeSelect,
  width = '268px'
}: CourseOutlinePanelProps) {
  const [keyword, setKeyword] = useState('');
  const treeData = useMemo(() => buildTreeData(chapters) as OutlineNode[], [chapters]);
  const initialExpandedIds = useMemo(() => collectExpandableIds(treeData), [treeData]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(initialExpandedIds));
  const filteredTree = useMemo(
    () => filterTree(treeData, keyword.trim().toLowerCase()),
    [keyword, treeData]
  );

  useEffect(() => {
    setExpandedIds(new Set(initialExpandedIds));
  }, [initialExpandedIds]);

  useEffect(() => {
    if (!keyword.trim()) return;
    setExpandedIds(new Set(collectExpandableIds(filteredTree)));
  }, [filteredTree, keyword]);

  const toggleNode = (nodeId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  return (
    <Flex
      as="aside"
      aria-label="课程目录"
      w={width}
      minW={width}
      h="100%"
      direction="column"
      bg="#FFFFFF"
      borderRight="1px solid #EAECF0"
    >
      <Box p={4} borderBottom="1px solid #EAECF0">
        <Text fontSize="15px" fontWeight={750} color="#1D2939">
          课程目录
        </Text>
        <Text fontSize="11px" color="#98A2B3" mt={1}>
          搜索并定位图谱节点
        </Text>
        <InputGroup mt={3} size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="#98A2B3" boxSize="14px" />
          </InputLeftElement>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索章节或知识点"
            aria-label="搜索课程目录"
            bg="#F9FAFB"
            borderColor="#EAECF0"
            borderRadius="10px"
            pr={keyword ? 9 : 3}
            _hover={{ borderColor: '#D0D5DD' }}
            _focus={{ borderColor: '#C83E3E', boxShadow: '0 0 0 3px rgba(200,62,62,.12)' }}
          />
          {keyword ? (
            <InputRightElement>
              <IconButton
                aria-label="清除搜索"
                icon={<CloseIcon boxSize="9px" />}
                size="xs"
                variant="ghost"
                onClick={() => setKeyword('')}
              />
            </InputRightElement>
          ) : null}
        </InputGroup>
      </Box>

      <Box flex="1" minH={0} overflowY="auto" p={3}>
        <Flex
          as="button"
          type="button"
          w="100%"
          minH="42px"
          align="center"
          gap={2}
          px={3}
          mb={2}
          borderRadius="10px"
          textAlign="left"
          bg={selectedNodeId === 'course-root' ? '#FFF1F0' : '#F9FAFB'}
          color={selectedNodeId === 'course-root' ? '#B42318' : '#1D2939'}
          onClick={() => onNodeSelect('course-root')}
          _hover={{ bg: selectedNodeId === 'course-root' ? '#FFF1F0' : '#F2F4F7' }}
          _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.14)' }}
        >
          <Box w="10px" h="10px" borderRadius="full" bg={NODE_TYPE_COLORS.course.fill} />
          <Box minW={0}>
            <Text fontSize="12px" fontWeight={700} noOfLines={1}>
              {courseName}
            </Text>
            <Text fontSize="10px" color="#98A2B3" mt={0.5}>
              课程根节点
            </Text>
          </Box>
        </Flex>

        {filteredTree.length ? (
          <VStack align="stretch" spacing={0}>
            {filteredTree.map((node) => (
              <OutlineTreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                selectedNodeId={selectedNodeId}
                onToggle={toggleNode}
                onSelect={onNodeSelect}
              />
            ))}
          </VStack>
        ) : (
          <Box py={12} textAlign="center">
            <SearchIcon color="#D0D5DD" boxSize="18px" />
            <Text fontSize="12px" color="#98A2B3" mt={2}>
              未找到“{keyword}”相关节点
            </Text>
          </Box>
        )}
      </Box>

      <Box p={3.5} borderTop="1px solid #EAECF0" bg="#FCFCFD">
        <Text fontSize="10px" color="#98A2B3" lineHeight="1.6">
          单击目录定位节点；双击图谱节点可展开或收起下级内容
        </Text>
      </Box>
    </Flex>
  );
}
