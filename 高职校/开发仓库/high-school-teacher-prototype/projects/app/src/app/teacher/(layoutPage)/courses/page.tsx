'use client';

import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';

export default function TeacherCoursesPage() {
  const isI18nReady = useTeacherPageI18n(['courses']);
  const { t } = useTranslation('teacher');

  if (!isI18nReady) {
    return null;
  }

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p={6}>
      <Heading size="md" color="gray.800">
        {t('courses.title')}
      </Heading>
      <Text mt={3} color="gray.600">
        {t('courses.description')}
      </Text>
    </Box>
  );
}
