'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  SlideFade,
  IconButton,
  Icon
} from '@chakra-ui/react';
import {
  CloseIcon,
  ChevronRightIcon,
  InfoOutlineIcon
} from '@chakra-ui/icons';
import type { GraphNode, GraphData } from './utils';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, getRelatedNodes, getNodeStatistics } from './utils';
import { PRIMARY_COLOR } from '@/app/teacher/(layoutPage)/aiTeacher/avatar/edit/constants';

interface RightPanelProps {
  selectedNode: GraphNode | null;
  graphData: GraphData;
  onClose: () => void;
  onNodeSelect: (nodeId: string) => void;
}

export function RightPanel({ selectedNode, graphData, onClose, onNodeSelect }: RightPanelProps) {
  const { t } = useTranslation('teacher');

  const stats = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeStatistics(graphData, selectedNode.id);
  }, [selectedNode, graphData]);

  const related = useMemo(() => {
    if (!selectedNode) return { upstream: [], downstream: [] };
    return getRelatedNodes(graphData, selectedNode.id);
  }, [selectedNode, graphData]);

  if (!selectedNode) {
    return (
      <Box
        w="320px"
        minW="320px"
        h="100%"
        bg="white"
        borderLeft="1px solid"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={6}
      >
        <VStack spacing={3} textAlign="center">
          <Box
            w={12}
            h={12}
            bg="gray.50"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={InfoOutlineIcon} w={6} h={6} color="gray.300" />
          </Box>
          <Text fontSize="sm" color="gray.500" fontWeight={500}>
            {t('aiTeacher.avatar.edit.graph.nodeDetail.selectHint', '点击节点查看详情')}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {t('aiTeacher.avatar.edit.graph.nodeDetail.selectHintDesc', '在图谱中点击任意节点，右侧将展示该节点的详细信息')}
          </Text>
        </VStack>
      </Box>
    );
  }

  const nodeColor = NODE_TYPE_COLORS[selectedNode.nodeType] || NODE_TYPE_COLORS.knowledge;

  return (
    <SlideFade in offsetX="20px">
      <Box
        w="320px"
        minW="320px"
        h="100%"
        bg="white"
        borderLeft="1px solid"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* 头部 */}
        <Flex
          align="center"
          justify="space-between"
          p={4}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <HStack spacing={3}>
            <Box
              w={10}
              h={10}
              borderRadius="xl"
              bg={`${nodeColor.fill}15`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Box
                w={3}
                h={3}
                borderRadius="full"
                bg={nodeColor.fill}
                border="1px solid"
                borderColor={nodeColor.stroke}
              />
            </Box>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="md" fontWeight={600} color="gray.800" noOfLines={1}>
                {selectedNode.name}
              </Text>
              <Badge
                fontSize="xs"
                fontWeight={500}
                px={2}
                py={0.5}
                borderRadius="md"
                color={nodeColor.fill}
                bg={`${nodeColor.fill}10`}
              >
                {NODE_TYPE_LABELS[selectedNode.nodeType] || selectedNode.nodeType}
              </Badge>
            </VStack>
          </HStack>

          <IconButton
            aria-label="关闭详情"
            icon={<CloseIcon w={3} h={3} />}
            size="sm"
            variant="ghost"
            color="gray.400"
            borderRadius="full"
            w={8}
            h={8}
            _hover={{ bg: 'gray.100', color: 'gray.600' }}
            onClick={onClose}
          />
        </Flex>

        <Box flex="1" overflowY="auto" p={4}>
          <VStack spacing={5} align="stretch">
            {/* 基础属性 */}
            <Box>
              <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                {t('aiTeacher.avatar.edit.graph.nodeDetail.properties', '基础属性')}
              </Text>
              <TableContainer
                bg="gray.50"
                borderRadius="8px"
                border="1px solid"
                borderColor="gray.100"
                overflow="hidden"
              >
                <Table size="sm">
                  <Tbody>
                    <Tr>
                      <Td w="80px" fontWeight={500} color="gray.500" fontSize="xs" py={2.5}>
                        {t('aiTeacher.avatar.edit.graph.nodeDetail.nodeId', 'ID')}
                      </Td>
                      <Td fontSize="xs" color="gray.700" py={2.5}>{selectedNode.id}</Td>
                    </Tr>
                    <Tr borderTop="1px solid" borderColor="gray.100">
                      <Td fontWeight={500} color="gray.500" fontSize="xs" py={2.5}>
                        {t('aiTeacher.avatar.edit.graph.nodeDetail.nodeName', '名称')}
                      </Td>
                      <Td fontSize="xs" color="gray.700" py={2.5}>{selectedNode.name}</Td>
                    </Tr>
                    <Tr borderTop="1px solid" borderColor="gray.100">
                      <Td fontWeight={500} color="gray.500" fontSize="xs" py={2.5}>
                        {t('aiTeacher.avatar.edit.graph.nodeDetail.nodeType', '类型')}
                      </Td>
                      <Td fontSize="xs" color="gray.700" py={2.5}>
                        <Badge fontSize="xs" color={nodeColor.fill} bg={`${nodeColor.fill}10`} borderRadius="md">
                          {NODE_TYPE_LABELS[selectedNode.nodeType] || selectedNode.nodeType}
                        </Badge>
                      </Td>
                    </Tr>
                    <Tr borderTop="1px solid" borderColor="gray.100">
                      <Td fontWeight={500} color="gray.500" fontSize="xs" py={2.5}>
                        {t('aiTeacher.avatar.edit.graph.nodeDetail.nodeDepth', '层级')}
                      </Td>
                      <Td fontSize="xs" color="gray.700" py={2.5}>
                        {selectedNode.depth === 0
                          ? '根节点'
                          : selectedNode.depth === 1
                            ? '第 1 层'
                            : selectedNode.depth === 2
                              ? '第 2 层'
                              : `第 ${selectedNode.depth} 层`}
                      </Td>
                    </Tr>
                    {selectedNode.childrenCount !== undefined && (
                      <Tr borderTop="1px solid" borderColor="gray.100">
                        <Td fontWeight={500} color="gray.500" fontSize="xs" py={2.5}>
                          {t('aiTeacher.avatar.edit.graph.nodeDetail.childrenCount', '子节点')}
                        </Td>
                        <Td fontSize="xs" color="gray.700" py={2.5}>
                          {selectedNode.childrenCount}
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <Divider borderColor="gray.100" />

            {/* 关系统计 */}
            <Box>
              <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                {t('aiTeacher.avatar.edit.graph.nodeDetail.statistics', '关系统计')}
              </Text>
              <HStack spacing={3}>
                <Flex
                  flex={1}
                  direction="column"
                  align="center"
                  py={3}
                  bg="gray.50"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="xl" fontWeight={700} color={PRIMARY_COLOR}>
                    {stats?.inDegree || 0}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {t('aiTeacher.avatar.edit.graph.nodeDetail.inDegree', '入度')}
                  </Text>
                </Flex>
                <Flex
                  flex={1}
                  direction="column"
                  align="center"
                  py={3}
                  bg="gray.50"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="xl" fontWeight={700} color="#1677FF">
                    {stats?.outDegree || 0}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {t('aiTeacher.avatar.edit.graph.nodeDetail.outDegree', '出度')}
                  </Text>
                </Flex>
                <Flex
                  flex={1}
                  direction="column"
                  align="center"
                  py={3}
                  bg="gray.50"
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="xl" fontWeight={700} color="gray.800">
                    {stats?.total || 0}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {t('aiTeacher.avatar.edit.graph.nodeDetail.totalDegree', '总关联')}
                  </Text>
                </Flex>
              </HStack>
            </Box>

            <Divider borderColor="gray.100" />

            {/* 上下游关联节点 */}
            <Box>
              <Text fontSize="xs" fontWeight={600} color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                {t('aiTeacher.avatar.edit.graph.nodeDetail.relatedNodes', '关联节点')}
              </Text>
              <VStack spacing={2} align="stretch">
                {/* 上游节点 */}
                {related.upstream.length > 0 && (
                  <Box>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      {t('aiTeacher.avatar.edit.graph.nodeDetail.upstream', '上游节点')}
                    </Text>
                    <VStack spacing={1}>
                      {related.upstream.map((node) => (
                        <RelatedNodeItem
                          key={node.id}
                          node={node}
                          onSelect={onNodeSelect}
                        />
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* 下游节点 */}
                {related.downstream.length > 0 && (
                  <Box>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      {t('aiTeacher.avatar.edit.graph.nodeDetail.downstream', '下游节点')}
                    </Text>
                    <VStack spacing={1}>
                      {related.downstream.map((node) => (
                        <RelatedNodeItem
                          key={node.id}
                          node={node}
                          onSelect={onNodeSelect}
                        />
                      ))}
                    </VStack>
                  </Box>
                )}

                {related.upstream.length === 0 && related.downstream.length === 0 && (
                  <Text fontSize="xs" color="gray.400" textAlign="center" py={2}>
                    {t('aiTeacher.avatar.edit.graph.nodeDetail.noRelated', '暂无关联节点')}
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </SlideFade>
  );
}

function RelatedNodeItem({
  node,
  onSelect
}: {
  node: GraphNode;
  onSelect: (id: string) => void;
}) {
  const colorInfo = NODE_TYPE_COLORS[node.nodeType] || NODE_TYPE_COLORS.knowledge;

  return (
    <Flex
      align="center"
      gap={2}
      p={2}
      borderRadius="6px"
      cursor="pointer"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.100"
      _hover={{ bg: '#FEF2F2', borderColor: `${PRIMARY_COLOR}30` }}
      transition="all 0.15s"
      onClick={() => onSelect(node.id)}
    >
      <Box
        w={2.5}
        h={2.5}
        borderRadius="full"
        bg={colorInfo.fill}
        flexShrink={0}
      />
      <Text fontSize="xs" color="gray.700" noOfLines={1} flex={1}>
        {node.name}
      </Text>
      <ChevronRightIcon w={3} h={3} color="gray.400" />
    </Flex>
  );
}
