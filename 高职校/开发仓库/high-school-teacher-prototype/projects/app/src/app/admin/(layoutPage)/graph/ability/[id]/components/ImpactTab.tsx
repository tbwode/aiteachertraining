'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Tag,
  Text,
  useToast
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import { withDeprecationResolved } from '../../_mock/store';
import type { AbilityGraph, Deprecation } from '../../_mock/types';

const ACCENT = '#C8000B';

const statusMeta: Record<Deprecation['status'], { label: string; colorScheme: string }> = {
  pending: { label: '待处理', colorScheme: 'orange' },
  handled: { label: '已处理', colorScheme: 'green' },
  ignored: { label: '已忽略', colorScheme: 'gray' }
};

export default function ImpactTab({
  graph,
  mutate
}: {
  graph: AbilityGraph;
  mutate: (fn: (g: AbilityGraph) => AbilityGraph) => void;
}) {
  const toast = useToast();
  const [pendingIgnore, setPendingIgnore] = useState<Deprecation | null>(null);
  const ignoreCancelRef = useRef<HTMLButtonElement>(null);

  const draft = graph.versions.find((v) => v.status === 'draft');
  const deprecations = draft?.deprecations ?? [];
  const pendingCount = deprecations.filter((d) => d.status === 'pending').length;

  if (deprecations.length === 0) {
    return (
      <Flex direction="column" align="center" py={16} gap={3}>
        <CheckCircleIcon boxSize={8} color="green.400" />
        <Text fontSize="sm" color="gray.500">
          当前草稿无废弃影响
        </Text>
        <Text fontSize="xs" color="gray.400">
          删除已发布节点后，其课程影响将在此形成待办
        </Text>
      </Flex>
    );
  }

  const handleResolve = (code: string, resolution: 'handled' | 'ignored') => {
    mutate((g) => withDeprecationResolved(g, code, resolution));
    toast({
      title:
        resolution === 'handled'
          ? '已标记为已处理（视为已线下通知课程负责人）'
          : '已忽略该影响，映射将在后续版本自动清理',
      status: 'success',
      duration: 2500,
      position: 'top'
    });
  };

  return (
    <Stack spacing={4}>
      {pendingCount > 0 ? (
        <HStack
          bg="orange.50"
          borderWidth="1px"
          borderColor="orange.200"
          rounded="12px"
          px={4}
          py={3}
          spacing={2}
        >
          <WarningIcon color="orange.400" />
          <Text fontSize="sm" color="orange.700">
            还有 {pendingCount} 项废弃影响未处理，全部处理后才能发布新版本
          </Text>
        </HStack>
      ) : (
        <HStack
          bg="green.50"
          borderWidth="1px"
          borderColor="green.200"
          rounded="12px"
          px={4}
          py={3}
          spacing={2}
        >
          <CheckCircleIcon color="green.400" />
          <Text fontSize="sm" color="green.700">
            废弃影响已全部处理，可发布新版本
          </Text>
        </HStack>
      )}

      {deprecations.map((dep) => {
        const meta = statusMeta[dep.status];
        const totalMappings = dep.affectedCourses.reduce((sum, c) => sum + c.mappingCount, 0);
        return (
          <Box
            key={dep.code}
            borderWidth="1px"
            borderColor={dep.status === 'pending' ? 'orange.200' : 'blackAlpha.100'}
            rounded="16px"
            p={5}
            bg="white"
          >
            <Flex justify="space-between" align="center" mb={2}>
              <HStack spacing={2}>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                  {dep.code}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="gray.800">
                  {dep.name}
                </Text>
                <Badge colorScheme={meta.colorScheme} rounded="full" px={2.5}>
                  {meta.label}
                </Badge>
              </HStack>
              {dep.status === 'pending' && (
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    variant="outline"
                    rounded="8px"
                    onClick={() => handleResolve(dep.code, 'handled')}
                  >
                    标记已处理
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="gray"
                    rounded="8px"
                    onClick={() => setPendingIgnore(dep)}
                  >
                    忽略
                  </Button>
                </HStack>
              )}
            </Flex>

            <Box bg="gray.50" rounded="10px" px={3} py={2} borderLeft="3px solid" borderColor={ACCENT} mb={3}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={0.5}>
                AI 替代建议
              </Text>
              <Text fontSize="sm" color="gray.700">
                {dep.suggestion}
              </Text>
            </Box>

            <Text fontSize="xs" color="gray.500" mb={2}>
              受影响课程（{dep.affectedCourses.length} 门 · 共 {totalMappings} 条映射）
            </Text>
            <Stack spacing={1.5}>
              {dep.affectedCourses.map((c) => (
                <HStack key={c.courseId} spacing={2}>
                  <AdminIcon name="book-open" style={{ width: 14, height: 14, color: ACCENT }} />
                  <Text fontSize="sm" color="gray.700" flex={1}>
                    {c.courseName}
                  </Text>
                  <Tag size="sm" variant="subtle" colorScheme="gray">
                    {c.mappingCount} 条映射
                  </Tag>
                </HStack>
              ))}
            </Stack>
            <Text fontSize="xs" color="gray.400" mt={3}>
              发布后相关课程映射将标记失效，需课程负责人在教师端重新绑定。
            </Text>
          </Box>
        );
      })}

      <AlertDialog
        isOpen={!!pendingIgnore}
        leastDestructiveRef={ignoreCancelRef}
        onClose={() => setPendingIgnore(null)}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent rounded="20px">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            忽略该废弃影响
          </AlertDialogHeader>
          <AlertDialogBody>
            忽略「{pendingIgnore?.name}」表示接受影响：发布后相关课程映射将自动标记失效，不再单独通知课程负责人。确认忽略？
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={ignoreCancelRef} onClick={() => setPendingIgnore(null)} rounded="10px">
              取消
            </Button>
            <Button
              colorScheme="orange"
              ml={3}
              rounded="10px"
              onClick={() => {
                if (pendingIgnore) handleResolve(pendingIgnore.code, 'ignored');
                setPendingIgnore(null);
              }}
            >
              确认忽略
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Stack>
  );
}
