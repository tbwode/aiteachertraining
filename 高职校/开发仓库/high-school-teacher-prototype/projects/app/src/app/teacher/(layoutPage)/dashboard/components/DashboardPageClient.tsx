'use client';

import {
  Box,
  Grid,
  GridItem,
  Heading,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import type { TeacherDashboardData } from '../data';

export function DashboardPageClient({ data }: { data: TeacherDashboardData }) {
  const isI18nReady = useTeacherPageI18n(['dashboard']);
  const { t } = useTranslation('teacher');

  if (!isI18nReady) {
    return null;
  }

  return (
    <Grid gap={6}>
      <GridItem>
        <Heading size="lg" color="gray.800">
          {t('dashboard.title')}
        </Heading>
        <Text mt={2} color="gray.500">
          {t('dashboard.description')}
        </Text>
      </GridItem>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {data.summary.map((item) => (
          <Box
            key={item.id}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="xl"
            p={5}
          >
            <Text fontSize="sm" color="gray.500">
              {t(`dashboard.summary.${item.id}.label`)}
            </Text>
            <Text mt={2} fontSize="2xl" fontWeight="bold" color="gray.800">
              {t(`dashboard.summary.${item.id}.value`, { value: item.value })}
            </Text>
            <Text mt={2} fontSize="sm" color="blue.500">
              {t(`dashboard.summary.${item.id}.helpText`)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p={5}>
        <Heading size="md" color="gray.800">
          {t('dashboard.todoTitle')}
        </Heading>
        <UnorderedList mt={4} spacing={3} color="gray.600">
          {data.todos.map((item) => (
            <ListItem key={item}>{t(`dashboard.todos.${item}`)}</ListItem>
          ))}
        </UnorderedList>
      </Box>
    </Grid>
  );
}
