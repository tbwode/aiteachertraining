import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Spinner
} from '@chakra-ui/react';
import { useAvatarApi } from '../hooks/useAvatarApi';
import type { AiAvatarVO } from '@/teacher/types/aiTeacher';
import { useAuth } from '@/app/components/auth/AuthProvider';

/**
 * AI分身列表使用示例
 * 展示如何使用 useAvatarApi Hook 获取和展示分身列表
 */
export function AvatarListExample() {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<AiAvatarVO[]>([]);
  const [filter, setFilter] = useState<number | undefined>(undefined);
  const { isLoading, fetchAvatarList, toggleAvatarStatus } = useAvatarApi();

  // 加载分身列表
  const loadAvatars = async () => {
    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('AvatarListExample - teacherId 不存在');
      return;
    }

    const data = await fetchAvatarList({
      teacherId,
      status: filter
    });
    setAvatars(data);
  };

  // 初始加载
  useEffect(() => {
    loadAvatars();
  }, [filter, user?.teacherId]);

  // 获取状态标签
  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { label: '未开始', colorScheme: 'gray' },
      1: { label: '运行中', colorScheme: 'green' },
      2: { label: '已截止', colorScheme: 'red' }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap[0];
    return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
  };

  // 切换发布状态
  const handleToggleStatus = async (avatar: AiAvatarVO) => {
    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('handleToggleStatus - teacherId 不存在');
      return;
    }

    const newStatus = avatar.status === 1 ? 0 : 1;
    await toggleAvatarStatus({
      avatarId: avatar.id,
      status: newStatus,
      teacherId
    });
    // 重新加载列表
    await loadAvatars();
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* 标题和筛选 */}
        <HStack justify="space-between">
          <Heading size="lg">AI分身列表</Heading>
          <HStack>
            <Button
              size="sm"
              variant={filter === undefined ? 'solid' : 'outline'}
              onClick={() => setFilter(undefined)}
            >
              全部
            </Button>
            <Button
              size="sm"
              variant={filter === 0 ? 'solid' : 'outline'}
              onClick={() => setFilter(0)}
            >
              未开始
            </Button>
            <Button
              size="sm"
              variant={filter === 1 ? 'solid' : 'outline'}
              onClick={() => setFilter(1)}
            >
              运行中
            </Button>
            <Button
              size="sm"
              variant={filter === 2 ? 'solid' : 'outline'}
              onClick={() => setFilter(2)}
            >
              已截止
            </Button>
          </HStack>
        </HStack>

        {/* 加载状态 */}
        {isLoading && (
          <HStack justify="center" py={8}>
            <Spinner />
            <Text>加载中...</Text>
          </HStack>
        )}

        {/* 分身列表 */}
        {!isLoading && avatars.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">暂无数据</Text>
          </Box>
        )}

        {!isLoading && avatars.length > 0 && (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
            {avatars.map((avatar) => (
              <Card key={avatar.id}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">{avatar.courseName}</Heading>
                    {getStatusBadge(avatar.status)}
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color="gray.600">
                      学期：{avatar.semesterName}
                    </Text>
                    <HStack>
                      <Text fontSize="sm">学生数：{avatar.studentCount}</Text>
                      <Text fontSize="sm">今日互动：{avatar.todayInteractionCount}</Text>
                    </HStack>
                    {avatar.classNameList.length > 0 && (
                      <Text fontSize="sm" color="gray.600">
                        班级：{avatar.classNameList.join('、')}
                      </Text>
                    )}
                    {avatar.majorNameList.length > 0 && (
                      <Text fontSize="sm" color="gray.600">
                        专业：{avatar.majorNameList.join('、')}
                      </Text>
                    )}
                    <Button
                      size="sm"
                      colorScheme={avatar.status === 1 ? 'red' : 'green'}
                      onClick={() => handleToggleStatus(avatar)}
                      isDisabled={isLoading}
                    >
                      {avatar.status === 1 ? '取消发布' : '发布'}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        )}
      </VStack>
    </Box>
  );
}
