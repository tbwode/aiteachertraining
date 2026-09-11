'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Divider,
  Checkbox,
  Stack,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  SearchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ViewIcon,
  DownloadIcon,
  RepeatIcon,
  SmallCloseIcon
} from '@chakra-ui/icons';
import type { AiAvatarChapterVO } from '@/teacher/types/aiTeacher';
import type { GraphNodeType, GraphLayoutType } from './utils';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, buildTreeData } from './utils';
import { PRIMARY_COLOR } from '@/app/teacher/(layoutPage)/aiTeacher/avatar/edit/constants';

interface LeftSidebarProps {
  courseName: string;
  chapters: AiAvatarChapterVO[];
  layoutType: GraphLayoutType;
  hiddenNodeTypes: GraphNodeType[];
  onLayoutChange: (type: GraphLayoutType) => void;
  onNodeTypesFilterChange: (types: GraphNodeType[]) => void;
  onSearchChange: (keyword: string) => void;
  onResetZoom: () => void;
  onExportImage: () => void;
  onFitView: () => void;
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function LeftSidebar({
  courseName,
  chapters,
  layoutType,
  hiddenNodeTypes,
  onLayoutChange,
  onNodeTypesFilterChange,
  onSearchChange,
  onResetZoom,
  onExportImage,
  onFitView,
  onNodeSelect,
  selectedNodeId
}: LeftSidebarProps) {
  const { t } = useTranslation('teacher');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => `chapter-${c.id}`))
  );

  const treeData = useMemo(() => buildTreeData(chapters), [chapters]);

  const allNodeTypes: GraphNodeType[] = ['course', 'chapter', 'section', 'knowledge'];

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    onSearchChange(value);
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNodeTypeToggle = (type: GraphNodeType) => {
    const next = hiddenNodeTypes.includes(type)
      ? hiddenNodeTypes.filter((t) => t !== type)
      : [...hiddenNodeTypes, type];
    onNodeTypesFilterChange(next);
  };

  return (
    <Box
      w="280px"
      minW="280px"
      h="100%"
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* 头部搜索 */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.100">
        <Text fontSize="sm" fontWeight={600} color="gray.800" mb={3}>
          {t('aiTeacher.avatar.edit.graph.filters.entityType', '图谱筛选')}
        </Text>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" w={3.5} h={3.5} />
          </InputLeftElement>
          <Input
            placeholder={t('aiTeacher.avatar.edit.graph.searchPlaceholder', '搜索节点...')}
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            bg="white"
            borderColor="gray.200"
            borderRadius="8px"
            _focus={{
              borderColor: PRIMARY_COLOR,
              boxShadow: `0 0 0 1px ${PRIMARY_COLOR}`
            }}
          />
          {searchKeyword && (
            <InputLeftElement pointerEvents="auto" right={0} left="auto" pr={2}>
              <IconButton
                aria-label="清除搜索"
                icon={<SmallCloseIcon w={3} h={3} />}
                size="xs"
                variant="ghost"
                onClick={() => handleSearchChange('')}
              />
            </InputLeftElement>
          )}
        </InputGroup>
      </Box>

      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={5} align="stretch">
          {/* 树形目录 */}
          <Box>
            <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
              {t('aiTeacher.avatar.edit.graph.treeTitle', '课程目录')}
            </Text>
            <Box bg="white" borderRadius="8px" border="1px solid" borderColor="gray.200" p={2}>
              {treeData.map((chapter) => (
                <TreeNode
                  key={chapter.id}
                  node={chapter}
                  depth={0}
                  expandedIds={expandedChapters}
                  selectedId={selectedNodeId}
                  onToggle={toggleChapter}
                  onSelect={onNodeSelect}
                />
              ))}
            </Box>
          </Box>

          <Divider borderColor="gray.100" />

          {/* 实体类型筛选 */}
          <Box>
            <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
              {t('aiTeacher.avatar.edit.graph.filters.entityType', '实体类型')}
            </Text>
            <Stack spacing={2}>
              {allNodeTypes.map((type) => {
                const isHidden = hiddenNodeTypes.includes(type);
                return (
                  <Flex
                    key={type}
                    align="center"
                    justify="space-between"
                    p={2}
                    borderRadius="6px"
                    cursor="pointer"
                    bg={isHidden ? 'transparent' : 'white'}
                    border="1px solid"
                    borderColor={isHidden ? 'gray.200' : 'transparent'}
                    _hover={{ bg: 'white' }}
                    transition="all 0.15s"
                    onClick={() => handleNodeTypeToggle(type)}
                  >
                    <HStack spacing={2}>
                      <Box
                        w={3}
                        h={3}
                        borderRadius="full"
                        bg={NODE_TYPE_COLORS[type].fill}
                        border="1px solid"
                        borderColor={NODE_TYPE_COLORS[type].stroke}
                        opacity={isHidden ? 0.3 : 1}
                        transition="opacity 0.15s"
                      />
                      <Text
                        fontSize="sm"
                        color={isHidden ? 'gray.400' : 'gray.700'}
                        transition="color 0.15s"
                      >
                        {NODE_TYPE_LABELS[type]}
                      </Text>
                    </HStack>
                    <Checkbox
                      isChecked={!isHidden}
                      size="sm"
                      colorScheme="red"
                      pointerEvents="none"
                    />
                  </Flex>
                );
              })}
            </Stack>
          </Box>

          <Divider borderColor="gray.100" />

          {/* 布局切换 */}
          <Box>
            <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
              {t('aiTeacher.avatar.edit.graph.layoutsTitle', '布局方式')}
            </Text>
            <ButtonGroup size="sm" isAttached variant="outline" w="100%">
              {(
                [
                  { key: 'radial', label: t('aiTeacher.avatar.edit.graph.layouts.radial', '放射式') },
                  { key: 'force', label: t('aiTeacher.avatar.edit.graph.layouts.force', '力导向') },
                  { key: 'circular', label: t('aiTeacher.avatar.edit.graph.layouts.circular', '环形') },
                  { key: 'dagre', label: t('aiTeacher.avatar.edit.graph.layouts.dagre', '分层') }
                ] as { key: GraphLayoutType; label: string }[]
              ).map(({ key, label }) => (
                <Button
                  key={key}
                  flex={1}
                  onClick={() => onLayoutChange(key)}
                  bg={layoutType === key ? PRIMARY_COLOR : 'white'}
                  color={layoutType === key ? 'white' : 'gray.600'}
                  borderColor={layoutType === key ? PRIMARY_COLOR : 'gray.200'}
                  fontWeight={layoutType === key ? 600 : 500}
                  fontSize="12px"
                  _hover={{
                    bg: layoutType === key ? PRIMARY_COLOR : 'gray.50'
                  }}
                  transition="all 0.15s"
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>

          <Divider borderColor="gray.100" />

          {/* 操作按钮 */}
          <Box>
            <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
              {t('aiTeacher.avatar.edit.graph.actionsTitle', '操作')}
            </Text>
            <Stack spacing={2}>
              <Tooltip label={t('aiTeacher.avatar.edit.graph.actions.resetZoom', '缩放重置')} placement="right">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RepeatIcon w={3.5} h={3.5} />}
                  justifyContent="flex-start"
                  borderColor="gray.200"
                  color="gray.600"
                  fontWeight={500}
                  fontSize="13px"
                  _hover={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, bg: 'rgba(200,62,62,0.04)' }}
                  transition="all 0.15s"
                  onClick={onResetZoom}
                >
                  {t('aiTeacher.avatar.edit.graph.actions.resetZoom', '缩放重置')}
                </Button>
              </Tooltip>
              <Tooltip label={t('aiTeacher.avatar.edit.graph.actions.exportImage', '导出图片')} placement="right">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<DownloadIcon w={3.5} h={3.5} />}
                  justifyContent="flex-start"
                  borderColor="gray.200"
                  color="gray.600"
                  fontWeight={500}
                  fontSize="13px"
                  _hover={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, bg: 'rgba(200,62,62,0.04)' }}
                  transition="all 0.15s"
                  onClick={onExportImage}
                >
                  {t('aiTeacher.avatar.edit.graph.actions.exportImage', '导出图片')}
                </Button>
              </Tooltip>
              <Tooltip label={t('aiTeacher.avatar.edit.graph.actions.autoLayout', '自动整理')} placement="right">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ViewIcon w={3.5} h={3.5} />}
                  justifyContent="flex-start"
                  borderColor="gray.200"
                  color="gray.600"
                  fontWeight={500}
                  fontSize="13px"
                  _hover={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR, bg: 'rgba(200,62,62,0.04)' }}
                  transition="all 0.15s"
                  onClick={onFitView}
                >
                  {t('aiTeacher.avatar.edit.graph.actions.autoLayout', '自动整理')}
                </Button>
              </Tooltip>
            </Stack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}

// 树形节点递归组件
function TreeNode({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect
}: {
  node: any;
  depth: number;
  expandedIds: Set<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const colorInfo = NODE_TYPE_COLORS[node.nodeType] || NODE_TYPE_COLORS.knowledge;

  return (
    <Box>
      <Flex
        align="center"
        gap={1.5}
        py={1}
        px={1}
        borderRadius="6px"
        cursor="pointer"
        bg={isSelected ? '#FEF2F2' : 'transparent'}
        borderLeft={isSelected ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent'}
        _hover={{ bg: isSelected ? '#FEF2F2' : 'gray.50' }}
        transition="all 0.15s"
        onClick={() => onSelect(node.id)}
        role="group"
      >
        <Box
          w={4}
          h={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={hasChildren ? 'pointer' : 'default'}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggle(node.id);
            }
          }}
        >
          {hasChildren && (
            <Box
              transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
              transition="transform 0.2s"
            >
              <ChevronRightIcon w={3} h={3} color="gray.400" />
            </Box>
          )}
        </Box>

        <Box
          w={2.5}
          h={2.5}
          borderRadius="full"
          bg={colorInfo.fill}
          flexShrink={0}
        />

        <Text
          fontSize="sm"
          color={isSelected ? PRIMARY_COLOR : 'gray.700'}
          fontWeight={isSelected ? 600 : 400}
          noOfLines={1}
          flex={1}
        >
          {node.title}
        </Text>
      </Flex>

      {isExpanded && hasChildren && (
        <Box pl={4}>
          {node.children.map((child: any) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
