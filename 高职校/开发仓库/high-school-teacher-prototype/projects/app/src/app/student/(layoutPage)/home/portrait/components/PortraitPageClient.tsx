'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';
import type { PortraitData } from '../types';

const cardStyle = {
  bg: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  border: '1px solid #F0F0F0'
} as const;

const titleAccentStyle = {
  width: '3px',
  height: '16px',
  borderRadius: '2px',
  bg: '#C8000B'
} as const;

export function PortraitPageClient({ data }: { data: PortraitData }) {
  const router = useRouter();

  const radarData = useMemo(
    () =>
      data.abilityDimensions.map((item) => ({
        subject: item.label,
        A: item.value,
        fullMark: item.fullMark
      })),
    [data.abilityDimensions]
  );

  return (
    <>
      {/* Back Button */}
      <Flex
        align="center"
        gap="6px"
        cursor="pointer"
        color="#86909C"
        _hover={{ color: '#4E5969' }}
        onClick={() => router.push('/student/home')}
        w="fit-content"
        mb="16px"
      >
        <BackIcon />
        <Text fontSize="14px">返回</Text>
      </Flex>

      <Box
        bg="#FFFFFF"
        borderRadius="16px"
        boxShadow="0 2px 12px rgba(0, 0, 0, 0.04)"
        border="1px solid #F0F0F0"
        p="24px"
      >
        <VStack spacing={5} w="100%" align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
        <Flex align="center" gap="12px">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.avatar}
            alt={data.userName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <Box>
            <Text fontSize="18px" fontWeight={600} color="#1F2937">
              {data.userName}
            </Text>
            <Text fontSize="13px" color="#9CA3AF" mt="2px">
              学号：{data.studentId} · 专业：{data.major}
            </Text>
          </Box>
        </Flex>

        <Button
          h="36px"
          px="20px"
          borderRadius="18px"
          bg="#1F2937"
          color="#FFFFFF"
          fontSize="14px"
          fontWeight={500}
          _hover={{ bg: '#374151' }}
          leftIcon={<RefreshIcon />}
        >
          更新我的画像
        </Button>
      </Flex>

      {/* Stats */}
      <Grid templateColumns="repeat(3, 1fr)" gap="16px">
        <StatCard label="在修课程" value={`${data.learningCourses}门`} valueColor="#C8000B" />
        <StatCard label="已学完" value={`${data.completedCourses}门`} valueColor="#52C41A" />
        <StatCard label="累计学习时长" value={`${data.totalStudyHours}小时`} valueColor="#FAAD14" />
      </Grid>

      {/* Course Progress */}
      <Box {...cardStyle} p="20px">
        <SectionTitle>各课程学习进度</SectionTitle>
        <VStack spacing="16px" align="stretch" mt="16px">
          {data.courseProgressList.map((course) => (
            <Box key={course.courseName}>
              <Flex justify="space-between" align="center" mb="8px">
                <Text fontSize="14px" color="#4E5969">
                  {course.courseName}
                </Text>
                <HStack spacing="8px">
                  <Text fontSize="14px" fontWeight={500} color="#C8000B">
                    {course.progress}%
                  </Text>
                  <Box
                    px="8px"
                    py="2px"
                    borderRadius="4px"
                    bg={course.status === 'completed' ? '#FFF1F0' : '#F2F3F5'}
                    color={course.status === 'completed' ? '#C8000B' : '#86909C'}
                    fontSize="12px"
                  >
                    {course.status === 'completed' ? '复习' : '继续'}
                  </Box>
                </HStack>
              </Flex>
              <Box h="6px" bg="#F2F3F5" borderRadius="999px" overflow="hidden">
                <Box
                  h="100%"
                  w={`${course.progress}%`}
                  bg={course.status === 'completed' ? '#C8000B' : '#4E5969'}
                  borderRadius="999px"
                />
              </Box>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Radar Chart */}
      <Box {...cardStyle} p="20px">
        <SectionTitle>能力对比雷达图</SectionTitle>
        <Box h="320px" w="100%" mt="16px">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#4E5969', fontSize: 13 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="数值"
                dataKey="A"
                stroke="#2563EB"
                fill="#2563EB"
                fillOpacity={0.15}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
        <Box mt="16px" p="12px 16px" bg="#F7F8FA" borderRadius="8px">
          <Text fontSize="13px" color="#86909C" lineHeight="20px">
            {data.radarDescription}
          </Text>
        </Box>
      </Box>

      {/* Career Analysis */}
      <Box {...cardStyle} p="20px">
        <SectionTitle>专业就业方向解析</SectionTitle>
        <VStack spacing="12px" align="stretch" mt="16px">
          {data.careerAnalysis.map((item, index) => (
            <Box key={index} p="14px 16px" bg="#F7F8FA" borderRadius="8px">
              <Text fontSize="13px" color="#4E5969" lineHeight="22px">
                {item.content}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Suggestions */}
      <Box {...cardStyle} p="20px">
        <SectionTitle>专业分析与建议</SectionTitle>
        <VStack spacing="12px" align="stretch" mt="16px">
          {data.suggestions.map((item, index) => (
            <Box key={index} p="14px 16px" bg="#F7F8FA" borderRadius="8px">
              <Text fontSize="13px" color="#4E5969" lineHeight="22px">
                {item.content}
              </Text>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Improvement Plan */}
      <Box {...cardStyle} p="20px">
        <Flex justify="space-between" align="center" mb="16px">
          <SectionTitle mb="0">我的提升计划</SectionTitle>
          <Box
            px="10px"
            py="4px"
            borderRadius="12px"
            bg="#FFF7E6"
            color="#FA8C16"
            fontSize="12px"
            fontWeight={500}
          >
            目标：{data.improvementPlan.matchRate}% 匹配度
          </Box>
        </Flex>

        <Box
          p="16px"
          bg="#FFF8F8"
          borderRadius="12px"
          border="1px solid #FFE4E1"
        >
          <Flex justify="space-between" align="center" mb="8px">
            <HStack spacing="10px">
              <Box
                w="24px"
                h="24px"
                borderRadius="50%"
                bg="#C8000B"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="12px"
                fontWeight={600}
              >
                1
              </Box>
              <Text fontSize="15px" fontWeight={600} color="#1F2937">
                {data.improvementPlan.title}
              </Text>
            </HStack>
            <Text fontSize="13px" color="#C8000B" fontWeight={500}>
              优先级：{data.improvementPlan.priority}
            </Text>
          </Flex>

          <Text fontSize="13px" color="#86909C" mb="16px" lineHeight="20px">
            {data.improvementPlan.description}
          </Text>

          <Button
            w="100%"
            h="40px"
            borderRadius="8px"
            bg="#C8000B"
            color="#FFFFFF"
            fontSize="14px"
            fontWeight={500}
            _hover={{ bg: '#B0000A' }}
          >
            去学习《{data.improvementPlan.courseName}》课程
          </Button>
        </Box>
      </Box>
    </VStack>
    </Box>
  </>
  );
}

function SectionTitle({ children, mb = '0' }: { children: React.ReactNode; mb?: string }) {
  return (
    <Flex align="center" gap="8px" mb={mb}>
      <Box {...titleAccentStyle} />
      <Text fontSize="16px" fontWeight={600} color="#1F2937">
        {children}
      </Text>
    </Flex>
  );
}

function StatCard({
  label,
  value,
  valueColor
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <Box {...cardStyle} p="16px" textAlign="center">
      <Text fontSize="13px" color="#86909C" mb="8px">
        {label}
      </Text>
      <Text fontSize="22px" fontWeight={600} color={valueColor}>
        {value}
      </Text>
    </Box>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
