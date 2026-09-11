'use client';

import { useState } from 'react';
import { Box, HStack, VStack, Text, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '@/types/common-chat';
import { LoadingClockIcon } from '@/app/teacher/components/Icons';

const ToggleIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
      transition: 'transform 0.3s ease'
    }}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function HistoryBar({
  conversations,
  selectedId,
  onSelect,
  onCreateNew
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const { t } = useTranslation('teacher');
  const [isExpanded, setIsExpanded] = useState(true);

  const activeId = selectedId ?? (conversations[0]?.id || '');

  return (
    <Box
      w={isExpanded ? '340px' : '60px'}
      h="fit-content"
      maxH="calc(100% - 54px)"
      mt="30px"
      mb="24px"
      ml="24px"
      bg="#fff"
      borderRadius="16px"
      display="flex"
      flexDirection="column"
      boxShadow="0 4px 20px rgba(0,0,0,0.08)"
      zIndex={1}
      overflow="hidden"
      transition="width 0.3s ease"
      flexShrink={0}
    >
      {isExpanded ? (
        <>
          {/* 新建对话按钮 - 固定在上方 */}
          <Box p="20px" pb="16px" flexShrink={0}>
            <Button
              w="100%"
              h="50px"
              px="16px"
              py="5px"
              gap="8px"
              style={{ background: 'linear-gradient(to right, #F35100, #C8000B)' }}
              color="#fff"
              borderRadius="50px"
              fontSize="18px"
              fontWeight="500"
              lineHeight="22px"
              _hover={{ opacity: 0.9 }}
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10.0001 4.16699V15.8337M4.16675 10.0003H15.8334"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              onClick={onCreateNew}
            >
              {t('commonChat.history.new_chat')}
            </Button>
          </Box>

          {/* 历史对话标题 - 固定在上方，不随滚动 */}
          <Box px="20px" pb="12px" flexShrink={0}>
            <HStack
              spacing="6px"
              justify="space-between"
              cursor="pointer"
              onClick={() => setIsExpanded(false)}
            >
              <HStack spacing="6px">
                <LoadingClockIcon />
                <Text fontSize="16px" color="#1D2129" fontWeight="500">
                  {t('commonChat.history.title')}
                </Text>
              </HStack>
              <Box color="#86909C" _hover={{ color: '#333' }} transition="color 0.2s">
                <ToggleIcon isExpanded={isExpanded} />
              </Box>
            </HStack>
          </Box>

          {/* 历史对话列表 - 可滚动区域 */}
          <Box flex={1} overflowY="auto" px="20px" pb="20px">
            <VStack spacing="10px" align="stretch">
              {conversations.map((conv) => {
                const dateMatch = conv.updated_at.match(/^(\d{4})-(\d{2})-(\d{2})/);
                const timeMatch = conv.updated_at.match(/[T ](\d{2}):(\d{2})/);
                const year = dateMatch ? parseInt(dateMatch[1], 10) : 0;
                const month = dateMatch ? parseInt(dateMatch[2], 10) : 0;
                const day = dateMatch ? parseInt(dateMatch[3], 10) : 0;
                const hours = timeMatch ? timeMatch[1] : '';
                const minutes = timeMatch ? timeMatch[2] : '';
                const date = new Date(year, month - 1, day);

                const now = new Date();
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const dayBeforeYesterday = new Date(now);
                dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

                const isToday = date.toDateString() === now.toDateString();
                const isYesterday = date.toDateString() === yesterday.toDateString();
                const isDayBeforeYesterday =
                  date.toDateString() === dayBeforeYesterday.toDateString();

                let dateLabel: string;
                if (isToday) {
                  dateLabel = t('commonChat.history.today');
                } else if (isYesterday) {
                  dateLabel = t('commonChat.history.yesterday');
                } else if (isDayBeforeYesterday) {
                  dateLabel = t('commonChat.history.day_before_yesterday');
                } else if (dateMatch) {
                  dateLabel =
                    year === now.getFullYear()
                      ? `${month}月${day}日`
                      : `${year}年${month}月${day}日`;
                } else {
                  dateLabel = conv.updated_at || '';
                }

                const timeLabel = hours && minutes ? `${hours}:${minutes}` : '';

                return (
                  <Box
                    key={conv.id}
                    p="14px"
                    h="104px"
                    borderRadius="8px"
                    cursor="pointer"
                    bg={activeId === conv.id ? '#FFF6F7' : '#F7F8FA'}
                    transition="background 0.2s"
                    position="relative"
                    onClick={() => onSelect?.(conv.id)}
                  >
                    <Box
                      display="inline-block"
                      bg="#fff"
                      borderRadius="6px"
                      px="8px"
                      py="4px"
                      mb="8px"
                    >
                      <Text fontSize="12px" color="#666">
                        {dateLabel}
                      </Text>
                    </Box>
                    <Text fontSize="16px" color="#333" fontWeight="500" noOfLines={1}>
                      {conv.title}
                    </Text>
                    <Text fontSize="12px" color="#999" pt="10px">
                      {timeLabel}
                    </Text>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </>
      ) : (
        /* 收缩状态：只显示展开按钮 */
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" py="20px">
          <Box
            as="button"
            w="36px"
            h="36px"
            borderRadius="50%"
            bg="#F2F3F5"
            color="#86909C"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            _hover={{ bg: '#E5E6EB', color: '#333' }}
            transition="all 0.2s"
            onClick={() => setIsExpanded(true)}
            aria-label={t('commonChat.history.title')}
          >
            <ToggleIcon isExpanded={isExpanded} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
