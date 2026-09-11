'use client';

import { Box, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { AiSuggestion } from '@/teacher/types/aiTeacher';
import { BORDER_COLOR, PRIMARY_COLOR, TEXT_PRIMARY, TEXT_SECONDARY } from '../constants';

type AINewsPanelProps = {
  courseName?: string;
  newsList: AiSuggestion[];
  isLoading: boolean;
  onItemClick: (suggestion: AiSuggestion) => void;
  onViewMore: () => void;
  compact?: boolean;
};

export function AINewsPanel({
  courseName,
  newsList,
  isLoading,
  onItemClick,
  onViewMore,
  compact
}: AINewsPanelProps) {
  const { t } = useTranslation('teacher');

  return (
    <VStack align="stretch" spacing={3} h="100%">
      <Flex align="center" gap={2}>
        <Box w="3px" h="14px" bg="#1F1F1F" borderRadius="full" />
        <Text fontSize={compact ? '12px' : '14px'} fontWeight={600} color={TEXT_PRIMARY}>
          {t('workspace.ai_news.title')}
        </Text>
        {courseName && (
          <Box
            ml={2}
            px={2}
            py={0.5}
            borderRadius="6px"
            bg="rgba(22,119,255,0.08)"
            color="#1677FF"
            fontSize="11px"
            fontWeight={500}
          >
            {courseName}
          </Box>
        )}
      </Flex>

      {courseName && (
        <Text fontSize="12px" color={TEXT_SECONDARY} lineHeight="1.7">
          {t('workspace.ai_news.subtitle', { course: courseName })}
        </Text>
      )}

      {isLoading ? (
        <Flex flex={1} align="center" justify="center">
          <Spinner color={PRIMARY_COLOR} />
        </Flex>
      ) : newsList.length === 0 ? (
        <Flex flex={1} align="center" justify="center" color={TEXT_SECONDARY}>
          <Text fontSize="13px">{t('workspace.ai_news.empty')}</Text>
        </Flex>
      ) : (
        <VStack align="stretch" spacing={compact ? 1.5 : 2.5} flex={1} minH={0} overflowY="auto">
          {newsList.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              compact={compact}
            />
          ))}
        </VStack>
      )}

      <Flex justify="center" pt={2}>
        <Box
          as="button"
          onClick={onViewMore}
          fontSize="13px"
          color={PRIMARY_COLOR}
          fontWeight={500}
          _hover={{ textDecoration: 'underline' }}
        >
          {t('workspace.ai_news.view_more')}
        </Box>
      </Flex>
    </VStack>
  );
}

function NewsCard({
  item,
  onClick,
  compact
}: {
  item: AiSuggestion;
  onClick: () => void;
  compact?: boolean;
}) {
  const read = item.isRead === 1;
  return (
    <Box
      as="button"
      onClick={onClick}
      textAlign="left"
      border="1px solid"
      borderColor={BORDER_COLOR}
      borderRadius="10px"
      px={compact ? 2 : 3}
      py={compact ? 2 : 2.5}
      bg="#F8F9FB"
      opacity={read ? 0.6 : 1}
      transition="all 0.15s ease"
      _hover={{ borderColor: PRIMARY_COLOR, bg: 'white' }}
    >
      <Text
        fontSize={compact ? '12px' : '13px'}
        fontWeight={600}
        color={TEXT_PRIMARY}
        mb={compact ? 0.5 : 1}
        noOfLines={compact ? 1 : 2}
      >
        {item.title}
      </Text>
      <Text fontSize="11px" color={TEXT_SECONDARY} noOfLines={1} lineHeight="1.6">
        {item.content}
      </Text>
    </Box>
  );
}
