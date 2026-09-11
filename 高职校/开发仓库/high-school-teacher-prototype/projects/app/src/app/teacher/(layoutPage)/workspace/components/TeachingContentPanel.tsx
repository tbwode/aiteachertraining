'use client';

import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { TeachingContentVO, TeachingContentCourseVO } from '@/teacher/types/aiTeacher';
import {
  BORDER_COLOR,
  PRIMARY_BG,
  PRIMARY_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../constants';

type TeachingContentPanelProps = {
  userName?: string;
  data: TeachingContentVO;
  selectedTeachingTaskId: number | null;
  onSelect: (teachingTaskId: number) => void;
  isLoading: boolean;
  onStartClass: () => void;
  compact?: boolean;
};

export function TeachingContentPanel({
  userName,
  data,
  selectedTeachingTaskId,
  onSelect,
  isLoading,
  onStartClass,
  compact
}: TeachingContentPanelProps) {
  const { t } = useTranslation('teacher');

  if (isLoading && data.courses.length === 0) {
    return (
      <Flex h="280px" align="center" justify="center">
        <Spinner color={PRIMARY_COLOR} />
      </Flex>
    );
  }

  if (data.courseCount === 0) {
    return (
      <Flex h="200px" align="center" justify="center" color={TEXT_SECONDARY}>
        <Text fontSize="14px">{t('workspace.teaching_content.empty')}</Text>
      </Flex>
    );
  }

  return (
    <VStack align="stretch" spacing={compact ? 2 : 4}>
      <Flex align="center" gap={2}>
        <Box w="3px" h="14px" bg={PRIMARY_COLOR} borderRadius="full" />
        <Text fontSize={compact ? '12px' : '13px'} fontWeight={600} color={TEXT_PRIMARY}>
          {t('workspace.teaching_content.title')}
        </Text>
      </Flex>

      <Box>
        <Text fontSize={compact ? '16px' : '20px'} fontWeight={700} color={TEXT_PRIMARY} mb={1}>
          {userName || ''}
        </Text>
        <Text fontSize="12px" color={TEXT_SECONDARY}>
          {t('workspace.teaching_content.subtitle_short', {
            count: data.courseCount
          })}
        </Text>
      </Box>

      <Box maxH={compact ? '140px' : '239px'} overflowY="auto" pr={1}>
        <VStack align="stretch" spacing={compact ? 1.5 : 2.5}>
          {data.courses.map((course) => (
            <CourseRow
              key={course.teachingTaskId}
              course={course}
              selected={course.teachingTaskId === selectedTeachingTaskId}
              onClick={() => onSelect(course.teachingTaskId)}
              compact={compact}
            />
          ))}
        </VStack>
      </Box>

      <Button
        onClick={onStartClass}
        bg={PRIMARY_COLOR}
        color="white"
        h={compact ? '32px' : '40px'}
        borderRadius="20px"
        fontSize="13px"
        fontWeight={500}
        _hover={{ bg: '#A60008' }}
        _active={{ bg: '#8C0007' }}
        isDisabled={selectedTeachingTaskId == null}
      >
        {t('workspace.teaching_content.start_class')}
      </Button>
    </VStack>
  );
}

type CourseRowProps = {
  course: TeachingContentCourseVO;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
};

function CourseRow({ course, selected, onClick, compact }: CourseRowProps) {
  const { t } = useTranslation('teacher');

  return (
    <Box
      as="button"
      onClick={onClick}
      textAlign="left"
      bg="white"
      borderRadius="16px"
      p={compact ? 2.5 : 4}
      outline={selected ? `2px solid ${PRIMARY_COLOR}` : `1px solid ${BORDER_COLOR}`}
      outlineOffset={selected ? '-2px' : '-1px'}
      transition="all 0.15s ease"
      _hover={{ outline: `1px solid ${PRIMARY_COLOR}` }}
    >
      <VStack align="stretch" spacing={compact ? 1 : 1.5}>
        <Text fontSize={compact ? '13px' : '15px'} fontWeight={500} color="#333333" noOfLines={1}>
          {course.courseName}
        </Text>
        <Flex align="center" gap={1} minW={0}>
          <Box as="span" flexShrink={0} display="inline-flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4.8001 7.6V6.8M8.0001 7.6V6M11.2001 7.6V4.4M6.4001 10.8L5.2001 14M11.0625 13.9556L9.64829 10.8443M3.2001 10.8C2.31644 10.8 1.6001 10.0837 1.6001 9.2V3.6C1.6001 2.71634 2.31644 2 3.2001 2H12.8001C13.6838 2 14.4001 2.71634 14.4001 3.6V9.2C14.4001 10.0837 13.6838 10.8 12.8001 10.8H3.2001Z"
                stroke="#86909C"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Text fontSize="12px" color="#86909C" noOfLines={1}>
            {course.categoryName ? `${course.categoryName} · ` : ''}
            {course.courseHours} {t('workspace.teaching_content.hours_suffix')}
          </Text>
        </Flex>
      </VStack>
    </Box>
  );
}
