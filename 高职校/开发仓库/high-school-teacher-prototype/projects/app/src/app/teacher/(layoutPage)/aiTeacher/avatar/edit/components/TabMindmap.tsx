'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  ScaleFade,
  Text,
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import {
  RepeatIcon,
  AddIcon,
  MinusIcon,
  ViewIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@chakra-ui/icons';
import { ListTree } from 'lucide-react';
import type { AiAvatarChapterVO } from '@/teacher/types/aiTeacher';
import { convertChaptersToGraphData } from './graph/utils';
import type { GraphLayoutType, GraphNode } from './graph/utils';
import { EDGE_RELATION_STYLES, NODE_TYPE_COLORS, NODE_TYPE_LABELS } from './graph/utils';
import { GraphCanvas } from './graph/GraphCanvas';
import type { GraphCanvasRef } from './graph/GraphCanvas';
import { CourseOutlinePanel } from './graph/CourseOutlinePanel';
import { NodeDetailPanel } from './graph/NodeDetailPanel';

type TabMindmapProps = {
  courseName: string;
  chapters: AiAvatarChapterVO[];
};

export function TabMindmap({ courseName, chapters }: TabMindmapProps) {
  const { t } = useTranslation('teacher');
  const [layoutType, setLayoutType] = useState<GraphLayoutType>('radial');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<GraphCanvasRef | null>(null);
  const { isOpen: isOutlineOpen, onOpen: onOutlineOpen, onClose: onOutlineClose } = useDisclosure();

  // 原始图谱数据
  const rawGraphData = useMemo(() => {
    return convertChaptersToGraphData(courseName, chapters);
  }, [courseName, chapters]);

  // 根据折叠状态过滤图谱数据
  const graphData = useMemo(() => {
    if (collapsedNodes.size === 0) {
      return rawGraphData;
    }

    const hiddenNodeIds = new Set<string>();
    const queue = Array.from(collapsedNodes);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const children = rawGraphData.edges.filter((e) => e.source === nodeId).map((e) => e.target);

      for (const childId of children) {
        if (!hiddenNodeIds.has(childId)) {
          hiddenNodeIds.add(childId);
          if (!collapsedNodes.has(childId)) {
            queue.push(childId);
          }
        }
      }
    }

    const visibleNodes = rawGraphData.nodes.filter((n) => !hiddenNodeIds.has(n.id));
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = rawGraphData.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    return { nodes: visibleNodes, edges: visibleEdges };
  }, [rawGraphData, collapsedNodes]);

  const handleNodeToggle = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleOutlineNodeSelect = useCallback(
    (nodeId: string) => {
      const node = rawGraphData.nodes.find((item) => item.id === nodeId);
      if (!node) return;

      const ancestorIds = new Set<string>();
      let current: GraphNode | undefined = node;
      while (current?.parentId) {
        ancestorIds.add(current.parentId);
        current = rawGraphData.nodes.find((item) => item.id === current?.parentId);
      }

      setCollapsedNodes((previous) => {
        const next = new Set(previous);
        ancestorIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedNode(node);
      onOutlineClose();

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => graphRef.current?.selectNode(nodeId));
      });
    },
    [onOutlineClose, rawGraphData]
  );

  const handleCloseDetail = useCallback(() => {
    graphRef.current?.clearSelection();
    setSelectedNode(null);
  }, []);

  // 折叠祖先节点后被选中节点会隐藏，取当前可见数据中的节点，不存在则不展示明细
  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null;
    return graphData.nodes.find((n) => n.id === selectedNode.id) ?? null;
  }, [selectedNode, graphData]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    const all = new Set<string>();
    rawGraphData.nodes.forEach((n) => {
      if (n.nodeType !== 'knowledge') {
        all.add(n.id);
      }
    });
    setCollapsedNodes(all);
  }, [rawGraphData]);

  const handleSwitchLayout = useCallback(() => {
    setLayoutType((prev) => (prev === 'radial' ? 'circular' : 'radial'));
  }, []);

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    graphRef.current?.resetZoom();
  }, []);

  // 空状态
  if (!chapters || chapters.length === 0) {
    return (
      <Box
        bg="white"
        border="1px dashed #C9CDD4"
        borderRadius={{ base: '18px', md: '20px' }}
        minH={{ base: '460px', md: '650px' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box as="span" color="gray.400" fontSize="sm">
          {t('aiTeacher.avatar.edit.graph.noData')}
        </Box>
      </Box>
    );
  }

  return (
    <ScaleFade in initialScale={0.98}>
      <Box
        bg="white"
        border="1px solid #E5E6EB"
        borderRadius={{ base: '18px', md: '20px' }}
        boxShadow="0 8px 28px rgba(31,35,41,0.07)"
        overflow="hidden"
        position="relative"
        minH={{ base: '600px', md: '700px' }}
        h={{ base: '600px', md: '700px' }}
      >
        <Flex h="100%" minW={0} position="relative">
          <Box display={{ base: 'none', lg: 'block' }} w="268px" minW="268px" h="100%">
            <CourseOutlinePanel
              courseName={courseName}
              chapters={chapters}
              selectedNodeId={selectedNodeData?.id}
              onNodeSelect={handleOutlineNodeSelect}
              width="100%"
            />
          </Box>

          <Box flex="1" minW={0} h="100%" position="relative" overflow="hidden">
            {/* 悬浮工具栏 - 左上 */}
            <Flex
              position="absolute"
              top={{ base: 3, md: 4 }}
              left={{ base: 3, md: 4 }}
              zIndex={10}
              gap={1}
              bg="white"
              borderRadius="12px"
              boxShadow="0 2px 12px rgba(0,0,0,0.08)"
              p={1.5}
              border="1px solid"
              borderColor="gray.100"
            >
              <Tooltip label="打开课程目录" placement="bottom">
                <IconButton
                  aria-label="打开课程目录"
                  icon={<ListTree size={17} />}
                  display={{ base: 'inline-flex', lg: 'none' }}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={onOutlineOpen}
                />
              </Tooltip>
              <Tooltip
                label={layoutType === 'radial' ? '切换环形' : '切换放射式'}
                placement="bottom"
              >
                <IconButton
                  aria-label="切换布局"
                  icon={<ViewIcon w={4} h={4} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleSwitchLayout}
                />
              </Tooltip>
              <Tooltip label="重置视图" placement="bottom">
                <IconButton
                  aria-label="重置视图"
                  icon={<RepeatIcon w={4} h={4} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleResetZoom}
                />
              </Tooltip>
              <Tooltip label="全部展开" placement="bottom">
                <IconButton
                  aria-label="全部展开"
                  icon={<ChevronDownIcon w={4} h={4} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleExpandAll}
                />
              </Tooltip>
              <Tooltip label="全部折叠" placement="bottom">
                <IconButton
                  aria-label="全部折叠"
                  icon={<ChevronUpIcon w={4} h={4} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleCollapseAll}
                />
              </Tooltip>
            </Flex>

            {/* 缩放控制 - 右下 */}
            <Flex
              position="absolute"
              bottom={{ base: 3, md: 4 }}
              right={{ base: 3, md: 4 }}
              zIndex={10}
              direction="column"
              gap={1}
              bg="white"
              borderRadius="12px"
              boxShadow="0 2px 12px rgba(0,0,0,0.08)"
              p={1.5}
              border="1px solid"
              borderColor="gray.100"
            >
              <Tooltip label="放大" placement="left">
                <IconButton
                  aria-label="放大"
                  icon={<AddIcon w={3.5} h={3.5} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleZoomIn}
                />
              </Tooltip>
              <Tooltip label="缩小" placement="left">
                <IconButton
                  aria-label="缩小"
                  icon={<MinusIcon w={3.5} h={3.5} />}
                  minW="40px"
                  w="40px"
                  h="40px"
                  variant="ghost"
                  color="gray.600"
                  _hover={{ bg: 'gray.50', color: 'gray.800' }}
                  onClick={handleZoomOut}
                />
              </Tooltip>
            </Flex>

            {/* 节点与关系图例 */}
            <Box
              as="aside"
              aria-label="知识图谱图例"
              position="absolute"
              bottom={{ base: 3, md: 4 }}
              left={{ base: 3, md: 4 }}
              right={{ base: '68px', md: 'auto' }}
              zIndex={10}
              bg="white"
              borderRadius="14px"
              boxShadow="0 6px 24px rgba(31,35,41,0.10)"
              px={{ base: 3, md: 4 }}
              py={3}
              border="1px solid"
              borderColor="#E5E6EB"
              maxW={{ base: 'none', md: '720px' }}
              overflowX="auto"
            >
              <Text fontSize="11px" fontWeight={700} color="#4E5969" mb={2}>
                图谱图例
              </Text>
              <Flex align="center" gap={{ base: 3, md: 4 }} minW="max-content">
                <Flex align="center" gap={3}>
                  <Text fontSize="10px" color="#86909C" flexShrink={0}>
                    节点
                  </Text>
                  {(['course', 'chapter', 'section', 'knowledge'] as const).map((type) => (
                    <Flex key={type} align="center" gap={1.5} flexShrink={0}>
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={NODE_TYPE_COLORS[type].fill}
                        border="2px solid"
                        borderColor={NODE_TYPE_COLORS[type].stroke}
                      />
                      <Text fontSize="11px" color="#4E5969">
                        {NODE_TYPE_LABELS[type]}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
                <Box w="1px" h="24px" bg="#E5E6EB" flexShrink={0} />
                <Flex align="center" gap={3}>
                  <Text fontSize="10px" color="#86909C" flexShrink={0}>
                    关系
                  </Text>
                  {(
                    Object.keys(EDGE_RELATION_STYLES) as Array<keyof typeof EDGE_RELATION_STYLES>
                  ).map((type) => {
                    const relation = EDGE_RELATION_STYLES[type];

                    return (
                      <Flex
                        key={type}
                        align="center"
                        gap={1.5}
                        px={2}
                        py={1}
                        borderRadius="8px"
                        bg={relation.background}
                        flexShrink={0}
                      >
                        <Box
                          w="24px"
                          h="2px"
                          bg={relation.color}
                          sx={
                            relation.dash
                              ? {
                                  background: `repeating-linear-gradient(90deg, ${relation.color} 0 6px, transparent 6px 10px)`
                                }
                              : undefined
                          }
                        />
                        <Text fontSize="11px" fontWeight={600} color={relation.color}>
                          {relation.label}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
            </Box>

            <GraphCanvas
              ref={graphRef}
              nodes={graphData.nodes}
              edges={graphData.edges}
              layoutType={layoutType}
              onNodeToggle={handleNodeToggle}
              onNodeSelect={handleNodeSelect}
              collapsedNodes={collapsedNodes}
            />
          </Box>

          {selectedNodeData ? (
            <NodeDetailPanel
              node={selectedNodeData}
              graphData={rawGraphData}
              isCollapsed={collapsedNodes.has(selectedNodeData.id)}
              onToggleFold={handleNodeToggle}
              onClose={handleCloseDetail}
            />
          ) : null}
        </Flex>

        <Drawer isOpen={isOutlineOpen} placement="left" onClose={onOutlineClose} size="xs">
          <DrawerOverlay />
          <DrawerContent maxW="320px" overflow="hidden">
            <DrawerCloseButton zIndex={2} top={3} right={3} />
            <DrawerBody p={0} overflow="hidden">
              <CourseOutlinePanel
                courseName={courseName}
                chapters={chapters}
                selectedNodeId={selectedNodeData?.id}
                onNodeSelect={handleOutlineNodeSelect}
                width="100%"
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </ScaleFade>
  );
}
