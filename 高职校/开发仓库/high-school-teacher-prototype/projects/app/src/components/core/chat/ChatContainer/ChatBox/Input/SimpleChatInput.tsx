import { Box, Flex, Input } from '@chakra-ui/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContextSelector } from 'use-context-selector';
import { ChatRecordContext } from '@/web/core/chat/context/chatRecordContext';

interface SimpleChatInputProps {
  onSendMessage: (text: string) => void;
}

const SendIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SimpleChatInput = ({ onSendMessage }: SimpleChatInputProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  // 读取聊天记录，自行判断 placeholder：
  // 有聊天数据（不包括欢迎语）→ "继续提问"，否则 → "输入你的问题"
  const chatRecords = useContextSelector(ChatRecordContext, (v) => v.chatRecords);

  const resolvedPlaceholder = useMemo(() => {
    if (chatRecords.length > 0) {
      return t('common:smallchat.continue_ask');
    }
    return t('common:smallchat.placeholder');
  }, [chatRecords.length, t]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage(text);
    setInputValue('');
  }, [inputValue, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = inputValue.trim().length > 0;

  return (
    <Flex px={4} py={3} gap={2} bg="white" borderTop="1px solid #F0F0F0" alignItems="center">
      <Input
        placeholder={resolvedPlaceholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        h="40px"
        fontSize="14px"
        borderRadius="20px"
        borderColor="#E5E6EB"
        _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
        _placeholder={{ color: '#C9CDD4' }}
        flex={1}
      />
      <Flex
        w="40px"
        h="40px"
        bg="#C8000B"
        borderRadius="10px"
        align="center"
        justify="center"
        cursor={canSend ? 'pointer' : 'not-allowed'}
        opacity={canSend ? 1 : 0.5}
        onClick={handleSend}
        flexShrink={0}
      >
        <SendIcon />
      </Flex>
    </Flex>
  );
};

export default React.memo(SimpleChatInput);
