'use client';

import { Box, Flex, HStack, Progress, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { CourseOverviewVO, TeachingContentCourseVO } from '@/teacher/types/aiTeacher';
import {
  PRIMARY_BG,
  PRIMARY_COLOR,
  SUCCESS_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../constants';

type TeachingOverviewPanelProps = {
  courses: TeachingContentCourseVO[];
  selectedTeachingTaskId: number | null;
  onSelect: (teachingTaskId: number) => void;
  overview: CourseOverviewVO | null;
  isLoading: boolean;
  compact?: boolean;
};

export function TeachingOverviewPanel({
  courses,
  selectedTeachingTaskId,
  onSelect,
  overview,
  isLoading,
  compact
}: TeachingOverviewPanelProps) {
  const { t } = useTranslation('teacher');

  if (courses.length === 0) {
    return (
      <Flex h="200px" align="center" justify="center" color={TEXT_SECONDARY}>
        <Text fontSize="14px">{t('workspace.overview.empty')}</Text>
      </Flex>
    );
  }

  return (
    <VStack align="stretch" spacing={compact ? 2 : 4}>
      <Flex align="center" gap={2}>
        <Box w="3px" h="14px" bg="#1F1F1F" borderRadius="full" />
        <Text fontSize={compact ? '12px' : '14px'} fontWeight={600} color={TEXT_PRIMARY}>
          {t('workspace.overview.title')}
        </Text>
      </Flex>

      <Box
        overflowX="auto"
        overflowY="hidden"
        mx={-1}
        px={1}
        sx={{
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#E5E7EB', borderRadius: '2px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#D1D5DB' }
        }}
      >
        <HStack spacing={2} flexWrap="nowrap" minW="max-content">
          {courses.map((course) => {
            const active = course.teachingTaskId === selectedTeachingTaskId;
            return (
              <Box
                key={course.teachingTaskId}
                as="button"
                onClick={() => onSelect(course.teachingTaskId)}
                px={3}
                py={1}
                borderRadius="full"
                fontSize="12px"
                fontWeight={500}
                whiteSpace="nowrap"
                flexShrink={0}
                bg={active ? '#1F1F1F' : '#F3F4F6'}
                color={active ? 'white' : TEXT_SECONDARY}
                border="1px solid"
                borderColor={active ? '#1F1F1F' : 'transparent'}
                transition="all 0.15s ease"
                _hover={active ? {} : { bg: PRIMARY_BG, color: PRIMARY_COLOR }}
              >
                {course.courseName}
              </Box>
            );
          })}
        </HStack>
      </Box>

      {isLoading || !overview ? (
        <Flex h="220px" align="center" justify="center">
          <Spinner color={PRIMARY_COLOR} />
        </Flex>
      ) : (
        <>
          <Text fontSize="13px" fontWeight={600} color={TEXT_PRIMARY}>
            {t('workspace.overview.status_subtitle', { label: overview.statusLabel })}
          </Text>

          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={compact ? 2 : 3}>
            <MetricCell
              label={t('workspace.overview.metrics.total')}
              value={overview.totalStudentCount}
              compact={compact}
            />
            <MetricCell
              label={t('workspace.overview.metrics.studying')}
              value={overview.studyingCount}
              compact={compact}
            />
            <MetricCell
              label={t('workspace.overview.metrics.normal')}
              value={overview.normalProgressCount}
              color={SUCCESS_COLOR}
              compact={compact}
            />
            <MetricCell
              label={t('workspace.overview.metrics.lagging')}
              value={overview.laggingCount}
              color={PRIMARY_COLOR}
              compact={compact}
            />
          </Box>

          <Box>
            <Flex justify="space-between" align="center" mb={compact ? 1 : 2}>
              <Text fontSize="12px" color={TEXT_SECONDARY}>
                {t('workspace.overview.overall_progress')}
              </Text>
              <Text fontSize="12px" fontWeight={600} color={TEXT_PRIMARY}>
                {overview.averageProgress}%
              </Text>
            </Flex>
            <Progress
              value={overview.averageProgress}
              size="sm"
              borderRadius="full"
              bg="#F3F4F6"
              sx={{
                '& > div': {
                  background: 'linear-gradient(90deg, #1F1F1F 0%, #4B5563 100%)'
                }
              }}
            />
          </Box>
        </>
      )}
    </VStack>
  );
}

type MetricCellProps = {
  label: string;
  value: number;
  color?: string;
  compact?: boolean;
};

function MetricCell({ label, value, color = TEXT_PRIMARY, compact }: MetricCellProps) {
  return (
    <Box
      bg="#F5F6F8"
      borderRadius={compact ? '14px' : '20px'}
      px={compact ? 2.5 : 4}
      py={compact ? 3 : 5}
      textAlign="center"
    >
      <Text fontSize={compact ? '24px' : '40px'} fontWeight={700} color={color} lineHeight="1.1">
        {value}
      </Text>
      <Text fontSize={compact ? '11px' : '13px'} color={TEXT_SECONDARY} mt={compact ? 1 : 2}>
        {label}
      </Text>
    </Box>
  );
}
