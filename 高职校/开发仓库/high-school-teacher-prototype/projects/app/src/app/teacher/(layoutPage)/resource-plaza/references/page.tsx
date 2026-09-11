'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Select,
  Skeleton,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { AlertTriangle, Bot, BookOpen, ExternalLink, GitBranch, RefreshCw } from 'lucide-react';
import {
  getResourceReferences,
  upgradeResourceReference,
  type ResourceReferenceStatus,
  type ResourceReferenceTarget,
  type ResourceReferenceVO
} from '@/api/teacher/resource/resource-plaza';
import PlazaScaffold from '../components/PlazaScaffold';
import { getCategoryStyle } from '../components/resourceVisuals';

const statusMeta: Record<ResourceReferenceStatus, { label: string; color: string; bg: string }> = {
  ready: { label: '已生效', color: '#067647', bg: '#ECFDF3' },
  parsing: { label: '解析中', color: '#175CD3', bg: '#EFF8FF' },
  unavailable: { label: '源资源已下架', color: '#B54708', bg: '#FFFAEB' }
};

export default function ResourceReferencesPage() {
  const toast = useToast();
  const [records, setRecords] = useState<ResourceReferenceVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState<'' | ResourceReferenceTarget>('');
  const [upgradingId, setUpgradingId] = useState<number | null>(null);

  const loadReferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getResourceReferences({
        current: 1,
        size: 50,
        targetType: targetType || undefined
      });
      setRecords(response.records);
    } catch {
      toast({ title: '引用记录加载失败', status: 'error', position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [targetType, toast]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  const metrics = useMemo(
    () => ({
      total: records.length,
      course: records.filter((item) => item.targetType === 'course').length,
      avatar: records.filter((item) => item.targetType === 'avatar').length,
      attention: records.filter((item) => item.hasUpgrade || item.status === 'unavailable').length
    }),
    [records]
  );

  const handleUpgrade = async (id: number) => {
    setUpgradingId(id);
    try {
      const result = await upgradeResourceReference(id);
      if (!result.success) throw new Error(result.reason);
      toast({ title: '已升级到最新版本', status: 'success', duration: 1600, position: 'top' });
      await loadReferences();
    } catch (error) {
      toast({
        title: '版本升级失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        status: 'error',
        position: 'top'
      });
    } finally {
      setUpgradingId(null);
    }
  };

  return (
    <PlazaScaffold
      title="我的引用"
      description="查看已应用到课程和 AI 教师分身的资源，管理版本与可用状态"
      actions={
        <Select
          aria-label="按引用目标筛选"
          value={targetType}
          onChange={(event) => setTargetType(event.target.value as '' | ResourceReferenceTarget)}
          w={{ base: '100%', md: '190px' }}
          h="42px"
          bg="white"
          borderRadius="10px"
          focusBorderColor="#B4232D"
        >
          <option value="">全部引用目标</option>
          <option value="course">课程章节</option>
          <option value="avatar">AI 教师分身</option>
        </Select>
      }
    >
      <Grid templateColumns={{ base: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }} gap={3} mb={6}>
        {[
          {
            label: '全部引用',
            value: metrics.total,
            icon: GitBranch,
            color: '#344054',
            bg: '#F2F4F7'
          },
          {
            label: '课程引用',
            value: metrics.course,
            icon: BookOpen,
            color: '#087A68',
            bg: '#ECFDF3'
          },
          { label: '分身引用', value: metrics.avatar, icon: Bot, color: '#175CD3', bg: '#EFF8FF' },
          {
            label: '需要处理',
            value: metrics.attention,
            icon: AlertTriangle,
            color: '#B54708',
            bg: '#FFFAEB'
          }
        ].map((metric) => (
          <Flex
            key={metric.label}
            bg="white"
            p={4}
            border="1px solid"
            borderColor="#E4E7EC"
            borderRadius="14px"
            align="center"
            gap={3}
          >
            <Flex
              w="40px"
              h="40px"
              borderRadius="11px"
              align="center"
              justify="center"
              color={metric.color}
              bg={metric.bg}
            >
              <metric.icon size={19} aria-hidden="true" />
            </Flex>
            <Box>
              <Text color="#667085" fontSize="11px">
                {metric.label}
              </Text>
              <Text mt={0.5} color="#182230" fontSize="20px" fontWeight={800}>
                {loading ? '--' : metric.value}
              </Text>
            </Box>
          </Flex>
        ))}
      </Grid>

      {loading ? (
        <Stack spacing={4}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} h="210px" borderRadius="16px" />
          ))}
        </Stack>
      ) : records.length ? (
        <Stack spacing={4}>
          {records.map((reference) => {
            const resource = reference.resource;
            const meta = statusMeta[reference.status];
            const style = getCategoryStyle(resource?.categoryId ?? 1);
            const TargetIcon = reference.targetType === 'course' ? BookOpen : Bot;
            return (
              <Box
                key={reference.id}
                bg="white"
                p={{ base: 4, md: 5 }}
                border="1px solid"
                borderColor={reference.status === 'unavailable' ? '#FEDF89' : '#E4E7EC'}
                borderRadius="16px"
              >
                <Flex direction={{ base: 'column', lg: 'row' }} gap={5} justify="space-between">
                  <Flex gap={4} minW={0}>
                    <Flex
                      flexShrink={0}
                      w="52px"
                      h="52px"
                      borderRadius="14px"
                      bg={style.bg}
                      color={style.color}
                      align="center"
                      justify="center"
                    >
                      <TargetIcon size={23} aria-hidden="true" />
                    </Flex>
                    <Box minW={0}>
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge
                          px={2.5}
                          py={1}
                          borderRadius="999px"
                          bg={meta.bg}
                          color={meta.color}
                          fontSize="10px"
                          textTransform="none"
                        >
                          {meta.label}
                        </Badge>
                        <Badge
                          px={2.5}
                          py={1}
                          borderRadius="999px"
                          bg="#F2F4F7"
                          color="#475467"
                          fontSize="10px"
                          textTransform="none"
                        >
                          {reference.targetType === 'course' ? '课程章节' : 'AI 教师分身'}
                        </Badge>
                        {reference.hasUpgrade && (
                          <Badge
                            px={2.5}
                            py={1}
                            borderRadius="999px"
                            bg="#FFF1F0"
                            color="#B4232D"
                            fontSize="10px"
                            textTransform="none"
                          >
                            可升级至 v{resource?.version}
                          </Badge>
                        )}
                      </HStack>
                      <Text mt={2.5} color="#182230" fontSize="16px" fontWeight={750} noOfLines={1}>
                        {resource?.title ?? '资源已删除'}
                      </Text>
                      <Text mt={1} color="#667085" fontSize="12px">
                        已引用到：
                        <Text as="span" color="#344054" fontWeight={600}>
                          {reference.targetName}
                        </Text>
                      </Text>
                      <Text mt={1} color="#667085" fontSize="12px">
                        位置：{reference.locationName}
                      </Text>
                      <HStack mt={3} spacing={4} color="#98A2B3" fontSize="11px" flexWrap="wrap">
                        <Text>当前引用 v{reference.resourceVersion}</Text>
                        <Text>更新于 {reference.updateTime.slice(0, 16).replace('T', ' ')}</Text>
                        {reference.status === 'parsing' && (
                          <Text color="#175CD3">AI 知识解析预计 2 分钟完成</Text>
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                  <HStack alignSelf={{ base: 'stretch', lg: 'center' }} spacing={2} flexWrap="wrap">
                    {reference.status === 'unavailable' ? (
                      <Button
                        as={NextLink}
                        href="/teacher/resource-plaza/all"
                        leftIcon={<RefreshCw size={15} aria-hidden="true" />}
                        variant="outline"
                        borderColor="#D0D5DD"
                        borderRadius="10px"
                      >
                        查找替代资源
                      </Button>
                    ) : (
                      <Button
                        as={NextLink}
                        href={`/teacher/resource-plaza/detail?id=${resource?.id}`}
                        leftIcon={<ExternalLink size={15} aria-hidden="true" />}
                        variant="outline"
                        borderColor="#D0D5DD"
                        borderRadius="10px"
                      >
                        查看资源
                      </Button>
                    )}
                    {reference.hasUpgrade && reference.status !== 'unavailable' && (
                      <Button
                        leftIcon={<RefreshCw size={15} aria-hidden="true" />}
                        bg="#B4232D"
                        color="white"
                        borderRadius="10px"
                        isLoading={upgradingId === reference.id}
                        onClick={() => void handleUpgrade(reference.id)}
                        _hover={{ bg: '#8F1D26' }}
                      >
                        升级版本
                      </Button>
                    )}
                  </HStack>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Flex
          minH="320px"
          bg="white"
          border="1px dashed"
          borderColor="#D0D5DD"
          borderRadius="16px"
          align="center"
          justify="center"
          direction="column"
          textAlign="center"
          px={6}
        >
          <GitBranch size={32} color="#98A2B3" aria-hidden="true" />
          <Text mt={4} color="#182230" fontSize="16px" fontWeight={700}>
            暂无资源引用
          </Text>
          <Text mt={1} color="#667085" fontSize="13px">
            在资源详情页可将资源引用到课程或 AI 教师分身
          </Text>
          <Button
            as={NextLink}
            href="/teacher/resource-plaza"
            mt={4}
            bg="#B4232D"
            color="white"
            borderRadius="10px"
          >
            去资源广场
          </Button>
        </Flex>
      )}
    </PlazaScaffold>
  );
}
