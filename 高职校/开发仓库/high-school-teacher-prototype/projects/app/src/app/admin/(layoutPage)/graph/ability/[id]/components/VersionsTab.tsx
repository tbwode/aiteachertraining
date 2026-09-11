'use client';

import { useState } from 'react';
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
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  Text,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import type { AbilityGraph, GraphVersion, JobTask } from '../../_mock/types';

const ACCENT = '#C8000B';

const statusMeta: Record<GraphVersion['status'], { label: string; colorScheme: string; dot: string }> = {
  draft: { label: '草稿待审', colorScheme: 'orange', dot: '#DD6B20' },
  current: { label: '当前发布', colorScheme: 'green', dot: '#38A169' },
  archived: { label: '历史版本', colorScheme: 'gray', dot: '#CBD5E0' }
};

export default function VersionsTab({ graph }: { graph: AbilityGraph }) {
  const snapshotModal = useDisclosure();
  const [activeVersion, setActiveVersion] = useState<GraphVersion | null>(null);

  const openSnapshot = (version: GraphVersion) => {
    setActiveVersion(version);
    snapshotModal.onOpen();
  };

  if (graph.versions.length === 0) {
    return (
      <Flex direction="column" align="center" py={16} gap={2}>
        <Text fontSize="sm" color="gray.400">
          暂无版本记录，首次发布后将在此留痕
        </Text>
      </Flex>
    );
  }

  return (
    <>
      <Stack spacing={0} position="relative" pl={2}>
        {graph.versions.map((version, index) => {
          const meta = statusMeta[version.status];
          const pendingCount = version.deprecations.filter((d) => d.status === 'pending').length;
          return (
            <Flex key={version.version} gap={4} position="relative">
              {/* 时间线 */}
              <Flex direction="column" align="center" flexShrink={0} w="16px">
                <Box
                  w="12px"
                  h="12px"
                  rounded="full"
                  bg={meta.dot}
                  mt={6}
                  border="2px solid white"
                  boxShadow="0 0 0 2px rgba(0,0,0,0.06)"
                />
                {index < graph.versions.length - 1 && (
                  <Box flex={1} w="2px" bg="gray.200" />
                )}
              </Flex>
              <Box
                flex={1}
                mb={4}
                borderWidth="1px"
                borderColor={version.status === 'draft' ? 'orange.200' : 'blackAlpha.100'}
                bg={version.status === 'draft' ? 'orange.50' : 'white'}
                rounded="16px"
                p={5}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack spacing={2}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {version.version}
                    </Text>
                    <Badge colorScheme={meta.colorScheme} rounded="full" px={2.5} py={0.5}>
                      {meta.label}
                    </Badge>
                    {pendingCount > 0 && (
                      <HStack spacing={1}>
                        <WarningIcon color="orange.400" boxSize={3.5} />
                        <Text fontSize="xs" color="orange.600">
                          {pendingCount} 项废弃影响待处理
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {version.publishedAt || '未发布'}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  {version.changeSummary || '（草稿尚未填写变更摘要）'}
                </Text>
                <HStack spacing={2} mt={3} flexWrap="wrap">
                  <Tag size="sm" colorScheme="green" variant="subtle">
                    +{version.diff.added.length} 新增
                  </Tag>
                  <Tag size="sm" colorScheme="blue" variant="subtle">
                    ~{version.diff.modified.length} 修改
                  </Tag>
                  <Tag size="sm" colorScheme="red" variant="subtle">
                    −{version.diff.deprecated.length} 废弃
                  </Tag>
                  <Text fontSize="xs" color="gray.400">
                    {version.nodeCounts.tasks} 任务 · {version.nodeCounts.abilities} 能力 ·{' '}
                    {version.nodeCounts.knowledges} 知识点
                  </Text>
                  <Flex flex={1} justify="flex-end">
                    <Button
                      size="xs"
                      variant="ghost"
                      color={ACCENT}
                      onClick={() => openSnapshot(version)}
                    >
                      查看快照
                    </Button>
                  </Flex>
                </HStack>
              </Box>
            </Flex>
          );
        })}
      </Stack>

      <Modal isOpen={snapshotModal.isOpen} onClose={snapshotModal.onClose} size="3xl" isCentered>
        <ModalOverlay />
        <ModalContent rounded="20px" maxH="80vh">
          <ModalHeader borderBottomWidth="1px" borderColor="blackAlpha.100">
            <HStack spacing={3}>
              <Text fontSize="lg" fontWeight="bold">
                {activeVersion?.version} 快照
              </Text>
              {activeVersion && (
                <Badge colorScheme={statusMeta[activeVersion.status].colorScheme} rounded="full">
                  {statusMeta[activeVersion.status].label}
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
              {activeVersion?.status === 'draft'
                ? '草稿快照为当前编辑树（只读预览）'
                : `${activeVersion?.nodeCounts.tasks} 任务 · ${activeVersion?.nodeCounts.abilities} 能力 · ${activeVersion?.nodeCounts.knowledges} 知识点 · 只读`}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            {activeVersion && (
              <SnapshotTree
                tasks={
                  activeVersion.snapshot.length > 0 ? activeVersion.snapshot : graph.tasks
                }
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

function SnapshotTree({ tasks }: { tasks: JobTask[] }) {
  return (
    <VStack align="stretch" spacing={3}>
      {tasks.map((task) => (
        <Box
          key={task.code}
          borderWidth="1px"
          borderColor="blackAlpha.100"
          rounded="14px"
          overflow="hidden"
        >
          <Flex bg="gray.50" px={4} py={2.5} align="center" gap={2}>
            <Text fontSize="xs" color="gray.400" fontFamily="mono">
              {task.code}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              {task.name}
            </Text>
            {task.status === 'deprecated' && (
              <Tag size="sm" colorScheme="gray">
                废弃
              </Tag>
            )}
            {task.status === 'new' && (
              <Tag size="sm" colorScheme="green">
                新
              </Tag>
            )}
          </Flex>
          <Stack spacing={0} divider={<Box borderTop="1px solid" borderColor="gray.100" />}>
            {task.abilities.map((ability) => (
              <Box key={ability.code} px={4} py={3}>
                <HStack spacing={2} mb={1.5}>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    {ability.code}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={ability.status === 'deprecated' ? 'gray.400' : 'gray.700'}
                    textDecoration={ability.status === 'deprecated' ? 'line-through' : 'none'}
                  >
                    {ability.name}
                  </Text>
                  {ability.status === 'deprecated' && (
                    <Tag size="sm" colorScheme="gray">
                      废弃
                    </Tag>
                  )}
                  {ability.status === 'new' && (
                    <Tag size="sm" colorScheme="green">
                      新
                    </Tag>
                  )}
                </HStack>
                <Stack spacing={1} pl={6}>
                  {ability.knowledges.map((k) => (
                    <HStack key={k.code} spacing={2}>
                      <Text fontSize="xs" color="gray.400" fontFamily="mono" w="48px">
                        {k.code}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={k.status === 'deprecated' ? 'gray.400' : 'gray.600'}
                        textDecoration={k.status === 'deprecated' ? 'line-through' : 'none'}
                        flex={1}
                      >
                        {k.name}
                      </Text>
                      <Tag size="sm" variant="subtle" colorScheme="blue">
                        {k.mastery}
                      </Tag>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                        {k.weight}%
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </VStack>
  );
}
