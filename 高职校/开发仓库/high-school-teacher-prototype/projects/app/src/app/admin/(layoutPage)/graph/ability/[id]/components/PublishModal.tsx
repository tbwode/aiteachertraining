'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  Text,
  Textarea
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import {
  cleanTree,
  computeDiff,
  countNodes,
  getPublishGate,
  nextVersion,
  publishGraph
} from '../../_mock/store';
import type { AbilityGraph } from '../../_mock/types';

const ACCENT = '#C8000B';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  graph: AbilityGraph;
  onLocate: (abilityCode: string) => void;
  onGoImpact: () => void;
  onPublished: (next: AbilityGraph) => void;
};

export default function PublishModal({
  isOpen,
  onClose,
  graph,
  onLocate,
  onGoImpact,
  onPublished
}: Props) {
  const [summary, setSummary] = useState('');

  const gate = useMemo(() => getPublishGate(graph), [graph]);
  const draft = graph.versions.find((v) => v.status === 'draft');
  const targetVersion = draft?.version ?? nextVersion(graph.currentVersion);
  const diffPreview = useMemo(() => {
    const current = graph.versions.find((v) => v.status === 'current');
    return computeDiff(current?.snapshot ?? [], cleanTree(graph.tasks));
  }, [graph]);
  const counts = useMemo(() => countNodes(cleanTree(graph.tasks)), [graph]);

  useEffect(() => {
    if (isOpen) {
      setSummary(draft?.changeSummary || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const weightReasons = gate.reasons.filter((r) => r.kind === 'weight');
  const deprecationReasons = gate.reasons.filter((r) => r.kind === 'deprecation');
  const emptyReasons = gate.reasons.filter((r) => r.kind === 'empty');

  const handlePublish = () => {
    const next = publishGraph(graph, summary.trim());
    if (!next) return;
    onClose();
    onPublished(next);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent rounded="20px">
        <ModalHeader borderBottomWidth="1px" borderColor="blackAlpha.100">
          <HStack spacing={3}>
            <Text fontSize="lg" fontWeight="bold">
              发布新版本
            </Text>
            <Badge colorScheme="gray" rounded="full" px={2.5}>
              {targetVersion}
            </Badge>
          </HStack>
          <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
            发布后生成只读快照，供课程映射、测评诊断等业务调用
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={5}>
          <Stack spacing={5}>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                变更摘要 *
              </Text>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="例如：新增热失控应急处置能力域，废弃热失控预警处理"
                rounded="12px"
                rows={3}
              />
            </Box>

            <Box bg="gray.50" rounded="12px" px={4} py={3}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
                变更预览
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Tag size="sm" colorScheme="green" variant="subtle">
                  +{diffPreview.added.length} 新增
                </Tag>
                <Tag size="sm" colorScheme="blue" variant="subtle">
                  ~{diffPreview.modified.length} 修改
                </Tag>
                <Tag size="sm" colorScheme="red" variant="subtle">
                  −{diffPreview.deprecated.length} 废弃
                </Tag>
                <Text fontSize="xs" color="gray.500">
                  发布后：{counts.tasks} 任务 · {counts.abilities} 能力 · {counts.knowledges} 知识点
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
                发布前校验
              </Text>
              <Stack spacing={2}>
                <GateRow
                  ok={emptyReasons.length === 0}
                  okText="图谱结构非空"
                  failText={emptyReasons[0]?.message ?? ''}
                />
                <GateRow
                  ok={weightReasons.length === 0}
                  okText="全部能力的知识点权重之和 = 100%"
                  failText={`${weightReasons.length} 个能力权重未达标`}
                />
                {weightReasons.slice(0, 3).map((r) => (
                  <Flex key={r.message} justify="space-between" align="center" pl={8}>
                    <Text fontSize="xs" color="orange.600">
                      {r.message}
                    </Text>
                    <Button
                      size="xs"
                      variant="link"
                      color={ACCENT}
                      onClick={() => r.abilityCode && onLocate(r.abilityCode)}
                    >
                      定位
                    </Button>
                  </Flex>
                ))}
                <GateRow
                  ok={deprecationReasons.length === 0}
                  okText="废弃影响已全部处理"
                  failText={`${deprecationReasons.length} 项废弃影响待处理`}
                  action={
                    deprecationReasons.length > 0 ? (
                      <Button size="xs" variant="link" color={ACCENT} onClick={onGoImpact}>
                        前往处理
                      </Button>
                    ) : undefined
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="blackAlpha.100">
          <Button variant="ghost" onClick={onClose} rounded="10px">
            取消
          </Button>
          <Button
            ml={3}
            bg={ACCENT}
            color="white"
            rounded="10px"
            _hover={{ bg: '#A80009' }}
            isDisabled={!gate.ok || !summary.trim()}
            onClick={handlePublish}
          >
            确认发布 {targetVersion}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function GateRow({
  ok,
  okText,
  failText,
  action
}: {
  ok: boolean;
  okText: string;
  failText: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex justify="space-between" align="center">
      <HStack spacing={2}>
        {ok ? (
          <CheckCircleIcon color="green.500" boxSize={4} />
        ) : (
          <WarningIcon color="orange.400" boxSize={4} />
        )}
        <Text fontSize="sm" color={ok ? 'gray.700' : 'orange.600'}>
          {ok ? okText : failText}
        </Text>
      </HStack>
      {action}
    </Flex>
  );
}
