'use client';

import React from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import type { ConversationItemVO } from '@/types/api/student/student';

/* 时钟图标 SVG */
const ClockIcon = ({ color = '#999' }: { color?: string } = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/* 判断两个日期是否是同一天 */
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/* 判断是否是昨天 */
const isYesterday = (date: Date, now: Date) => {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

/* 格式化历史对话列表时间 */
const formatHistoryTime = (
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  const date = new Date(dateStr);
  const now = new Date();
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  if (isSameDay(date, now)) {
    return t('studentChat.historyDialog.today', { time: timeStr });
  }
  if (isYesterday(date, now)) {
    return t('studentChat.historyDialog.yesterday', { time: timeStr });
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
};

interface HistoryDialogProps {
  historyList: ConversationItemVO[];
  historyLoading: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onLoadHistory: (item: ConversationItemVO) => void;
  style?: React.CSSProperties;
}

export default function HistoryDialog({
  historyList,
  historyLoading,
  onClose,
  onNewChat,
  onLoadHistory,
  style
}: HistoryDialogProps) {
  const { t } = useTranslation('student');

  return (
    <Box
      className="history-popup"
      position="absolute"
      top="33%"
      right="100%"
      mr="12px"
      w="420px"
      h="auto"
      maxH="60vh"
      bg="#FFF"
      borderRadius="16px"
      border="1px solid #FFE8E8"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.12)"
      zIndex={100}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      style={style}
    >
      {/* 弹窗Header */}
      <Box px="20px" py="16px" borderBottom="1px solid #F0F0F0">
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap="12px">
            <Box
              w="40px"
              h="40px"
              borderRadius="10px"
              bg="#FFF5F5"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <ClockIcon color="#E84D52" />
            </Box>
            <Flex flexDirection="column" gap="2px">
              <Text fontSize="16px" fontWeight={600} color="#333" lineHeight="1.3">
                {t('studentChat.historyDialog.title')}
              </Text>
              <Text fontSize="12px" color="#999" lineHeight="1.3">
                {t('studentChat.historyDialog.subtitle')}
              </Text>
            </Flex>
          </Flex>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            p="4px"
            borderRadius="50%"
            _hover={{ bg: '#F5F5F5' }}
            onClick={onClose}
          >
            <MyIcon name="close" w="20px" h="20px" color="#999" />
          </Box>
        </Flex>
      </Box>

      {/* 新建对话按钮 */}
      <Box px="16px" py="12px">
        <Box
          as="button"
          className="new-chat-btn"
          w="100%"
          display="block"
          py="10px"
          bg="#c83e3e"
          color="#FFF"
          borderRadius="20px"
          fontSize="14px"
          fontWeight={500}
          textAlign="center"
          cursor="pointer"
          _hover={{ bg: '#b03535' }}
          onClick={onNewChat}
        >
          + {t('studentChat.historyDialog.newChat')}
        </Box>
      </Box>

      {/* 分割线 */}
      <Box borderBottom="1px solid #F0F0F0" mx="16px" />

      {/* 历史记录列表 */}
      <Box maxH="500px" overflowY="auto" px="16px" pb="16px" pt="12px">
        {historyLoading ? (
          <Flex justifyContent="center" alignItems="center" py="40px">
            <Spinner color="#E84D52" size="sm" />
          </Flex>
        ) : historyList.length === 0 ? (
          <Flex justifyContent="center" alignItems="center" py="40px">
            <Text fontSize="14px" color="#999">
              {t('studentChat.historyDialog.empty')}
            </Text>
          </Flex>
        ) : (
          historyList.map((item) => (
            <Box
              key={item.id}
              as="button"
              className="history-item"
              w="100%"
              textAlign="left"
              p="14px"
              mb="8px"
              borderRadius="12px"
              bg="#FFF"
              border="1px solid #F0F0F0"
              cursor="pointer"
              _hover={{ bg: '#F8F8F8', borderColor: '#c83e3e' }}
              onClick={() => onLoadHistory(item)}
            >
              <Flex justifyContent="space-between" alignItems="center" gap="12px" h="54px">
                <Flex alignItems="center" gap="12px" flex="1" minW={0}>
                  <Box
                    w="36px"
                    h="36px"
                    borderRadius="50%"
                    bg="#F5F5F5"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: '#999' }}
                    >
                      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path>
                    </svg>
                  </Box>
                  <Flex flexDirection="column" gap="4px" flex="1" minW={0}>
                    <Text fontSize="14px" fontWeight={500} color="#333" whiteSpace="nowrap">
                      {formatHistoryTime(item.lastMessageTime, t)}
                    </Text>
                    <Text fontSize="13px" color="#666" noOfLines={1} textAlign="left">
                      {item.title}
                    </Text>
                  </Flex>
                </Flex>
                <Flex alignItems="center" gap="4px" flexShrink={0}>
                  <Text fontSize="12px" color="#999" whiteSpace="nowrap">
                    {t('studentChat.historyDialog.messageCount', { count: item.messageCount })}
                  </Text>
                  <Box display="flex" alignItems="center" justifyContent="center" w="20px" h="20px">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: '#CCC' }}
                    >
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </Box>
                </Flex>
              </Flex>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
