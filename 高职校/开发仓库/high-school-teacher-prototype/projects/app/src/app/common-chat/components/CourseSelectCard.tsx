'use client';

import { Box, Text, VStack, Flex } from '@chakra-ui/react';

export type CourseOption = {
  id: string | number;
  name: string;
  category: string;
  hours: number;
  teachingTaskId?: number;
};

export type CourseSelectCardProps = {
  title?: string;
  description?: string;
  footer?: string;
  courses: CourseOption[];
  onSelect: (course: CourseOption) => void;
};

export default function CourseSelectCard({
  title = '好的，我来帮您创建AI教师。根据您的任课信息，您目前教授以下课程：',
  courses,
  footer = '请点击选择要创建AI教师的课程',
  onSelect,
}: CourseSelectCardProps) {
  return (
    <VStack spacing="16px" align="stretch" w="100%">
      <Text fontSize="14px" color="#333" lineHeight="1.6">
        {title}
      </Text>

      <VStack spacing="8px" align="stretch">
        {courses.map((course) => (
          <Box
            key={course.id}
            bg="#F7F8FA"
            borderRadius="8px"
            p="12px 16px"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: '#FFF0F0', borderColor: '#C8000B' }}
            onClick={() => onSelect(course)}
          >
            <Text fontSize="15px" color="#333" fontWeight="500" lineHeight="1.5">
              {course.name}
            </Text>
            <Text fontSize="13px" color="#86909C" lineHeight="1.5" mt="2px">
              {course.category ? `${course.category} · ${course.hours}课时` : `${course.hours}课时`}
            </Text>
          </Box>
        ))}
      </VStack>

      <Text fontSize="14px" color="#333" lineHeight="1.6">
        {footer}
      </Text>
    </VStack>
  );
}
