import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Code,
  Divider,
  useToast,
  Heading,
  Spinner
} from '@chakra-ui/react';
import { useAvatarApi } from '../hooks/useAvatarApi';
import type { AiAvatarVO, AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import { useAuth } from '@/app/components/auth/AuthProvider';

/**
 * AI分身接口测试组件
 * 用于测试和验证AI分身相关接口
 */
export function AvatarApiTest() {
  const toast = useToast();
  const { user } = useAuth();
  const { isLoading, fetchAvatarList, fetchAvatarDetail, createAvatar, toggleAvatarStatus } =
    useAvatarApi();

  const [avatarList, setAvatarList] = useState<AiAvatarVO[]>([]);
  const [avatarDetail, setAvatarDetail] = useState<AiAvatarDetailVO | null>(null);
  const [createdAvatar, setCreatedAvatar] = useState<AiAvatarVO | null>(null);

  // 从 store 中获取 teacherId
  const teacherId = user?.teacherId;

  /**
   * 测试1: 获取AI分身列表（全部）
   */
  const testGetAllAvatars = async () => {
    if (!teacherId) {
      toast({
        title: '教师ID不存在',
        description: '请先登录',
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      const result = await fetchAvatarList({ teacherId });
      setAvatarList(result);
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  /**
   * 测试2: 获取AI分身列表（运行中）
   */
  const testGetRunningAvatars = async () => {
    if (!teacherId) {
      toast({
        title: '教师ID不存在',
        description: '请先登录',
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      const result = await fetchAvatarList({ teacherId, status: 1 });
      setAvatarList(result);
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  /**
   * 测试3: 获取AI分身详情
   */
  const testGetAvatarDetail = async () => {
    if (avatarList.length === 0) {
      toast({
        title: '请先获取分身列表',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      const result = await fetchAvatarDetail({ id: avatarList[0].id });
      setAvatarDetail(result);
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  /**
   * 测试4: 创建AI分身
   */
  const testCreateAvatar = async () => {
    if (!teacherId) {
      toast({
        title: '教师ID不存在',
        description: '请先登录',
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      const result = await createAvatar({
        teacherId,
        teachingTaskId: 1,
        coverUrl: 'https://huayun-ai-tos-public-pre.zhique.me/fbb9559eb984b28ec5f0e971089fc82f.png',
        description: '测试创建的AI分身',
        startTime: '2026-04-13 00:00:00',
        endTime: '2026-05-13 23:59:59',
        teachingConfig: {
          knowledgeLevel: 1,
          skillLevel: 1,
          innovationLevel: 1,
          enableAfterClassQuiz: true,
          enableChapterTest: true,
          enableRandomQuiz: false,
          enableAIEvaluation: true,
          enableProgressTracking: true,
          enableKnowledgeAnalysis: true,
          enableAbilityGrowth: false,
          enableBehaviorAnalysis: false,
          enablePeerComparison: true
        },
        classIds: [1],
        knowledgeGraph: {},
        chapterList: [
          {
            title: '第一章：测试章节',
            sortOrder: 1,
            knowledgePoints: ['知识点1', '知识点2'],
            materials: [],
            children: []
          }
        ]
      });
      setCreatedAvatar(result);
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  /**
   * 测试5: 发布AI分身
   */
  const testPublishAvatar = async () => {
    if (!teacherId) {
      toast({
        title: '教师ID不存在',
        description: '请先登录',
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    const targetAvatar = createdAvatar || avatarList[0];
    if (!targetAvatar) {
      toast({
        title: '请先创建或获取分身',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      await toggleAvatarStatus({
        id: targetAvatar.id,
        status: 1,
        teacherId
      });
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  /**
   * 测试6: 取消发布AI分身
   */
  const testUnpublishAvatar = async () => {
    if (!teacherId) {
      toast({
        title: '教师ID不存在',
        description: '请先登录',
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    const targetAvatar = createdAvatar || avatarList[0];
    if (!targetAvatar) {
      toast({
        title: '请先创建或获取分身',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      await toggleAvatarStatus({
        id: targetAvatar.id,
        status: 0,
        teacherId
      });
    } catch (error) {
      console.error('测试失败:', error);
    }
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Heading size="lg" mb={6}>
        AI分身接口测试
      </Heading>

      {isLoading && (
        <HStack mb={4}>
          <Spinner size="sm" />
          <Text>请求中...</Text>
        </HStack>
      )}

      <VStack spacing={6} align="stretch">
        {/* 测试按钮组 */}
        <Box>
          <Heading size="md" mb={3}>
            测试操作
          </Heading>
          <VStack spacing={3} align="stretch">
            <HStack>
              <Button onClick={testGetAllAvatars} colorScheme="blue" isDisabled={isLoading}>
                1. 获取全部分身列表
              </Button>
              <Button onClick={testGetRunningAvatars} colorScheme="blue" isDisabled={isLoading}>
                2. 获取运行中分身列表
              </Button>
            </HStack>
            <HStack>
              <Button onClick={testGetAvatarDetail} colorScheme="green" isDisabled={isLoading}>
                3. 获取分身详情（第一个）
              </Button>
              <Button onClick={testCreateAvatar} colorScheme="red" isDisabled={isLoading}>
                4. 创建AI分身
              </Button>
            </HStack>
            <HStack>
              <Button onClick={testPublishAvatar} colorScheme="teal" isDisabled={isLoading}>
                5. 发布分身
              </Button>
              <Button onClick={testUnpublishAvatar} colorScheme="orange" isDisabled={isLoading}>
                6. 取消发布分身
              </Button>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* 分身列表结果 */}
        {avatarList.length > 0 && (
          <Box>
            <Heading size="md" mb={3}>
              分身列表 ({avatarList.length}条)
            </Heading>
            <Code display="block" whiteSpace="pre" p={4} borderRadius="md" overflow="auto">
              {JSON.stringify(avatarList, null, 2)}
            </Code>
          </Box>
        )}

        {/* 分身详情结果 */}
        {avatarDetail && (
          <Box>
            <Heading size="md" mb={3}>
              分身详情
            </Heading>
            <Code display="block" whiteSpace="pre" p={4} borderRadius="md" overflow="auto">
              {JSON.stringify(avatarDetail, null, 2)}
            </Code>
          </Box>
        )}

        {/* 创建的分身结果 */}
        {createdAvatar && (
          <Box>
            <Heading size="md" mb={3}>
              创建的分身
            </Heading>
            <Code display="block" whiteSpace="pre" p={4} borderRadius="md" overflow="auto">
              {JSON.stringify(createdAvatar, null, 2)}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
