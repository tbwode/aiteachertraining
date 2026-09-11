'use client';

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Select,
  Text
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import type { AbilityGraph } from '../../_mock/types';
import { getPublishGate } from '../../_mock/store';

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF1F0';

const MAJOR_DIRECTIONS = [
  '新能源汽车技术',
  '智能网联汽车技术',
  '汽车技术服务与营销',
  '机电一体化技术'
];

type Props = {
  graph: AbilityGraph;
  createMode?: boolean;
  onPublishClick: () => void;
  onAiRegenerate: () => void;
  onMetaChange?: (patch: { jobName?: string; majorDirection?: string }) => void;
};

export default function WorkbenchHeader({
  graph,
  createMode,
  onPublishClick,
  onAiRegenerate,
  onMetaChange
}: Props) {
  const router = useRouter();
  const gate = getPublishGate(graph);

  return (
    <Flex
      direction={{ base: 'column', lg: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', lg: 'center' }}
      gap={4}
    >
      <HStack spacing={3} align="flex-start">
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/graph/ability')}
          mt={1}
        >
          返回
        </Button>
        <Flex
          w="44px"
          h="44px"
          rounded="14px"
          bg={ACCENT_SOFT}
          color={ACCENT}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <AdminIcon name="layers" style={{ width: 22, height: 22 }} />
        </Flex>
        <Box>
          {createMode ? (
            <HStack spacing={3}>
              <Input
                value={graph.jobName}
                onChange={(e) => onMetaChange?.({ jobName: e.target.value })}
                placeholder="请输入岗位名称，如：动力电池维修技师"
                fontWeight="bold"
                fontSize="xl"
                w="320px"
                rounded="10px"
              />
              <Select
                value={graph.majorDirection}
                onChange={(e) => onMetaChange?.({ majorDirection: e.target.value })}
                w="200px"
                rounded="10px"
                placeholder="选择专业方向"
              >
                {MAJOR_DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </HStack>
          ) : (
            <>
              <HStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {graph.jobName}
                </Text>
                <Badge colorScheme="gray" rounded="full" px={2.5}>
                  {graph.currentVersion || '未发布'}
                </Badge>
                <Badge
                  colorScheme={graph.status === 'published' ? 'green' : 'orange'}
                  rounded="full"
                  px={2.5}
                >
                  {graph.status === 'published' ? '已发布' : '草稿编辑中'}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.500" mt={0.5}>
                {graph.majorDirection} · 更新于 {graph.updatedAt}
              </Text>
            </>
          )}
        </Box>
      </HStack>

      {!createMode && (
        <HStack spacing={3}>
          <Text fontSize="xs" color={gate.ok ? 'green.600' : 'orange.500'}>
            {gate.ok ? '发布校验已通过' : `${gate.reasons.length} 项发布前待处理`}
          </Text>
          <Button
            variant="outline"
            colorScheme="gray"
            rounded="12px"
            leftIcon={<AdminIcon name="sparkles" style={{ width: 15, height: 15 }} />}
            onClick={onAiRegenerate}
          >
            AI 重新生成
          </Button>
          <Button
            bg={ACCENT}
            color="white"
            rounded="12px"
            _hover={{ bg: '#A80009' }}
            leftIcon={<AdminIcon name="check-circle" style={{ width: 15, height: 15 }} />}
            onClick={onPublishClick}
          >
            发布新版本
          </Button>
        </HStack>
      )}
    </Flex>
  );
}
