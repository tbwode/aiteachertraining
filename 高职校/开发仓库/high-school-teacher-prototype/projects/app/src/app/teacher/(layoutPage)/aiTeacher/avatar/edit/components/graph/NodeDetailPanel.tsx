'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { ChevronDown, ChevronRight, ChevronUp, Pencil, X } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import FilePreviewModal from '@/components/FilePreview/FilePreviewModal';
import type { AiAvatarMaterialVO } from '@/teacher/types/aiTeacher';
import type { GraphData, GraphNode } from './utils';
import { EDGE_RELATION_STYLES, NODE_TYPE_COLORS, NODE_TYPE_LABELS } from './utils';

type NodeDetailPanelProps = {
  node: GraphNode;
  graphData: GraphData;
  isCollapsed: boolean;
  onToggleFold: (nodeId: string) => void;
  onClose: () => void;
};

function getFileTypeLabel(material: AiAvatarMaterialVO) {
  const source = [material.fileType, material.fileFormat, material.fileName]
    .join(' ')
    .toLowerCase();
  if (/ppt|presentation/.test(source)) return 'PPT';
  if (/video|mp4/.test(source)) return '视频';
  if (/openmaic|interactive|互动/.test(source)) return '互动课件';
  if (/digital|数字教材/.test(source)) return '数字教材';
  if (/audio|mp3/.test(source)) return '音频';
  if (/image|png|jpg|jpeg/.test(source)) return '图片';
  if (/pdf/.test(source)) return 'PDF';
  if (/doc|document/.test(source)) return '文档';
  return '资源';
}

function collectNodeMaterials(node: GraphNode, graphData: GraphData) {
  const nodeMap = new Map(graphData.nodes.map((item) => [item.id, item]));
  const result = new Map<number, AiAvatarMaterialVO>();
  const visited = new Set<string>();
  const queue = [node.id];

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    (nodeMap.get(currentId)?.materials || []).forEach((material) => {
      result.set(material.id, material);
    });
    graphData.edges
      .filter((edge) => edge.source === currentId && edge.relationType === 'contains')
      .forEach((edge) => queue.push(edge.target));
  }

  return Array.from(result.values());
}

export function NodeDetailPanel({
  node,
  graphData,
  isCollapsed,
  onToggleFold,
  onClose
}: NodeDetailPanelProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose: onClosePreview } = useDisclosure();
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    type: string;
    name: string;
    fileType?: string;
  } | null>(null);

  const colors = NODE_TYPE_COLORS[node.nodeType] || NODE_TYPE_COLORS.knowledge;
  const typeLabel = NODE_TYPE_LABELS[node.nodeType] || node.nodeType;
  const hasChildren = (node.childrenCount || 0) > 0;
  const materials = useMemo(() => collectNodeMaterials(node, graphData), [graphData, node]);
  const relations = useMemo(() => {
    const nodeMap = new Map(graphData.nodes.map((item) => [item.id, item]));
    return graphData.edges
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .map((edge) => {
        const isSource = edge.source === node.id;
        const relatedNode = nodeMap.get(isSource ? edge.target : edge.source);
        const relationStyle = EDGE_RELATION_STYLES[edge.relationType];
        const directionLabel =
          edge.relationType === 'contains' ? (isSource ? '包含' : '上级') : '相关';
        return {
          id: edge.id,
          label: directionLabel + '：' + (relatedNode?.name || '未知节点'),
          color: relationStyle.color,
          background: relationStyle.background
        };
      })
      .slice(0, 6);
  }, [graphData, node.id]);

  const handlePreview = (material: AiAvatarMaterialVO) => {
    if (!material.fileUrl) {
      toast({
        title: 'Mock 资源',
        description: '该课件已完成类型与关联关系展示，暂未绑定真实文件。',
        status: 'info',
        duration: 2200,
        isClosable: true,
        position: 'top'
      });
      return;
    }
    setPreviewFile({
      url: material.fileUrl,
      type: material.fileFormat,
      name: material.fileName,
      fileType: material.fileType
    });
    onOpen();
  };

  return (
    <>
      <Flex
        as="aside"
        aria-label="节点详情"
        position={{ base: 'absolute', xl: 'relative' }}
        top={0}
        right={0}
        zIndex={30}
        w={{ base: 'calc(100% - 24px)', xl: '340px' }}
        maxW="340px"
        minW={{ xl: '340px' }}
        h="100%"
        flexShrink={0}
        direction="column"
        bg="#FFFFFF"
        borderLeft="1px solid #EAECF0"
        borderRadius={{ base: '16px 0 0 16px', xl: 0 }}
        boxShadow={{ base: '-12px 0 36px rgba(16,24,40,.14)', xl: 'none' }}
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="space-between"
          gap={3}
          px={4}
          py={3}
          borderBottom="1px solid #EAECF0"
          flexShrink={0}
        >
          <Text fontSize="15px" fontWeight={750} color="#1D2939">
            节点详情
          </Text>
          <HStack spacing={1.5}>
            <Button
              variant="secondary"
              minH="34px"
              h="34px"
              px={3}
              leftIcon={<Pencil size={13} aria-hidden="true" />}
              onClick={() =>
                toast({
                  title: '节点编辑',
                  description: '已进入原型编辑交互，修改内容仅保存在当前页面。',
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                  position: 'top'
                })
              }
            >
              编辑
            </Button>
            <IconButton
              aria-label="关闭节点详情"
              icon={<X size={16} />}
              minW="34px"
              w="34px"
              h="34px"
              variant="ghost"
              color="#667085"
              borderRadius="9px"
              onClick={onClose}
              _hover={{ bg: '#F2F4F7', color: '#344054' }}
            />
          </HStack>
        </Flex>

        <Box
          flex="1"
          minH={0}
          overflowY="auto"
          px={4}
          py={4}
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#D0D5DD transparent',
            '&::-webkit-scrollbar': { width: '7px' },
            '&::-webkit-scrollbar-thumb': { background: '#D0D5DD', borderRadius: '999px' }
          }}
        >
          <HStack spacing={2} mb={3}>
            <Box w="10px" h="10px" borderRadius="full" bg={colors.fill} />
            <Text fontSize="16px" lineHeight="1.45" fontWeight={750} color="#1D2939">
              {node.name}
            </Text>
          </HStack>

          <SimpleGrid columns={2} spacingX={4} spacingY={3}>
            <Box>
              <Text fontSize="11px" color="#98A2B3">
                节点类型
              </Text>
              <Text fontSize="12px" color="#344054" mt={1}>
                {typeLabel}
              </Text>
            </Box>
            <Box>
              <Text fontSize="11px" color="#98A2B3">
                节点编码
              </Text>
              <Text fontSize="12px" color="#344054" mt={1}>
                {node.code || node.id}
              </Text>
            </Box>
            <Box>
              <Text fontSize="11px" color="#98A2B3">
                上级节点
              </Text>
              <Text fontSize="12px" color="#344054" mt={1} noOfLines={2}>
                {node.parentTitle || '—'}
              </Text>
            </Box>
            <Box>
              <Text fontSize="11px" color="#98A2B3">
                状态
              </Text>
              <Badge
                mt={1}
                px={2}
                py={0.5}
                borderRadius="full"
                bg={node.status === 'draft' ? '#FFFAEB' : '#ECFDF3'}
                color={node.status === 'draft' ? '#B54708' : '#067647'}
                fontSize="10px"
              >
                {node.status === 'draft' ? '草稿' : '已发布'}
              </Badge>
            </Box>
          </SimpleGrid>

          {hasChildren ? (
            <Flex
              align="center"
              justify="space-between"
              mt={4}
              p={3}
              borderRadius="11px"
              bg="#F9FAFB"
              border="1px solid #EAECF0"
            >
              <Box>
                <Text fontSize="11px" color="#667085">
                  下级节点
                </Text>
                <Text fontSize="12px" fontWeight={650} color="#344054" mt={0.5}>
                  {node.childrenCount} 个
                </Text>
              </Box>
              <Button
                variant="secondary"
                minH="34px"
                h="34px"
                px={3}
                leftIcon={
                  isCollapsed ? (
                    <ChevronDown size={14} aria-hidden="true" />
                  ) : (
                    <ChevronUp size={14} aria-hidden="true" />
                  )
                }
                onClick={() => onToggleFold(node.id)}
              >
                {isCollapsed ? '展开' : '收起'}
              </Button>
            </Flex>
          ) : null}

          <Box mt={5}>
            <Text fontSize="13px" fontWeight={700} color="#344054" mb={2}>
              节点说明
            </Text>
            <Text fontSize="12px" color="#475467" lineHeight="1.75">
              {node.description || '该节点用于组织课程知识、学习资源与教学活动之间的关联。'}
            </Text>
          </Box>

          <Box mt={5}>
            <Text fontSize="13px" fontWeight={700} color="#344054" mb={2.5}>
              关系
            </Text>
            {relations.length ? (
              <Flex gap={2} flexWrap="wrap">
                {relations.map((relation) => (
                  <Badge
                    key={relation.id}
                    px={2.5}
                    py={1.5}
                    borderRadius="9px"
                    bg={relation.background}
                    color={relation.color}
                    fontSize="10px"
                    fontWeight={600}
                    whiteSpace="normal"
                  >
                    {relation.label}
                  </Badge>
                ))}
              </Flex>
            ) : (
              <Text fontSize="12px" color="#98A2B3">
                暂无关联关系
              </Text>
            )}
          </Box>

          <Box mt={5}>
            <Text fontSize="13px" fontWeight={700} color="#344054" mb={2.5}>
              关联资源（{materials.length}）
            </Text>
            {materials.length ? (
              <VStack align="stretch" spacing={2}>
                {materials.map((material) => (
                  <Flex
                    key={material.id}
                    as="button"
                    type="button"
                    align="center"
                    gap={2.5}
                    w="100%"
                    minH="58px"
                    px={3}
                    py={2.5}
                    textAlign="left"
                    border="1px solid #EAECF0"
                    borderRadius="11px"
                    bg="#FFFFFF"
                    onClick={() => handlePreview(material)}
                    _hover={{ borderColor: '#D0D5DD', bg: '#F9FAFB' }}
                    _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.14)' }}
                  >
                    <Box flex="1" minW={0}>
                      <Text fontSize="12px" fontWeight={650} color="#344054" noOfLines={1}>
                        {material.fileName}
                      </Text>
                      <Text fontSize="10px" color="#98A2B3" mt={1} noOfLines={1}>
                        {getFileTypeLabel(material)} · 可追溯到原始课件/资源库
                      </Text>
                    </Box>
                    <ChevronRight size={14} color="#98A2B3" aria-hidden="true" />
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Box p={4} bg="#F9FAFB" borderRadius="11px" textAlign="center">
                <Text fontSize="12px" color="#98A2B3">
                  当前节点暂无关联资源
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Flex>

      {previewFile ? (
        <FilePreviewModal
          isOpen={isOpen}
          onClose={onClosePreview}
          fileUrl={previewFile.url}
          fileType={previewFile.type}
          fileName={previewFile.name}
          bizType={previewFile.fileType}
        />
      ) : null}
    </>
  );
}
