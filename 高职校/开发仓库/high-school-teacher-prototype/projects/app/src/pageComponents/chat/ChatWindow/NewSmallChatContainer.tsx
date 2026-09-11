'use client';

import type { ReactNode } from 'react';
import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import {
  getConversationPage,
  saveConversation,
  getConversationDetail
} from '@/api/student/student';
import type {
  ConversationItemVO,
  ConversationMessageItem
} from '@/types/api/student/student';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useStudentAuthStore } from '@/student/store/auth';
import HistoryDialog from './HistoryDialog';

interface NewSmallChatContainerProps {
  children: ReactNode;
  showHeader?: boolean;
  embedded?: boolean;
  showCloseButton?: boolean;
  avatarId?: number;
  onSendMessage?: (text: string) => void;
  onAiMessageDone?: () => void;
}

// 创建 Context 用于跨层级传递 sendMessage 和 onAiMessageDone 方法
type ChatContextType = {
  onSendMessage?: ((text: string) => void) | undefined;
  onAiMessageDone?: ((responseText: string) => void) | undefined;
};

const SendMessageContext = createContext<ChatContextType>({});

// 导出 hook 供子组件使用
export const useSendMessage = () => useContext(SendMessageContext).onSendMessage;
export const useAiMessageDone = () => useContext(SendMessageContext).onAiMessageDone;

/* 用于通知父组件聊天框已加载完成 */
const ChatReadyContext = createContext<(() => void) | null>(null);
export const useChatReadyCallback = () => useContext(ChatReadyContext);

/* AI 教师头像 SVG */
const AIAvatarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: 'white' }}
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

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

/* localStorage 缓存 conversationId（key 含 userId 实现用户级隔离） */
const CONVERSATION_CACHE_PREFIX = 'ai_teacher_conversation_';

const getCacheKey = (avatarId: number): string | null => {
  if (typeof window === 'undefined') return null;
  const userId = useStudentAuthStore.getState().userInfo?.userId;
  if (!userId) return null;
  return `${CONVERSATION_CACHE_PREFIX}${userId}_${avatarId}`;
};

const getCachedConversationId = (avatarId: number): number | null => {
  const key = getCacheKey(avatarId);
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

const setCachedConversationId = (avatarId: number, conversationId: number | null) => {
  const key = getCacheKey(avatarId);
  if (!key) return;
  if (conversationId === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, String(conversationId));
  }
};

/* 从 DOM 提取聊天记录 */
const extractMessagesFromDOM = (container: HTMLElement): ConversationMessageItem[] => {
  const messages: ConversationMessageItem[] = [];
  const chatItems = container.querySelectorAll('[data-chat-id]');

  chatItems.forEach((item) => {
    const flexEl = item.querySelector(':scope > div');
    if (!flexEl) return;

    const style = window.getComputedStyle(flexEl);
    const flexDirection = style.flexDirection;
    const isHuman = flexDirection === 'row-reverse';

    // 提取文本内容：查找 markdown 文本或纯文本
    const cardBody = item.querySelector('.chakra-card__body');
    let content = '';
    if (cardBody) {
      // 优先获取纯文本，去掉多余空白
      content = (cardBody.textContent || '').trim();
    } else {
      const textEl = item.querySelector('p, span');
      if (textEl) {
        content = (textEl.textContent || '').trim();
      }
    }

    if (content) {
      messages.push({
        role: isHuman ? 'user' : 'ai',
        content
      });
    }
  });

  return messages;
};

export default function NewSmallChatContainer({
  children,
  showHeader = true,
  embedded = false,
  showCloseButton = true,
  avatarId,
  onSendMessage,
  onAiMessageDone
}: NewSmallChatContainerProps) {
  const { t, i18n } = useTranslation('student');
  const [isOpen, setIsOpen] = useState(embedded);
  const [lang, setLang] = useState(i18n.language);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<ConversationItemVO[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const floatButtonRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const isProcessingSaveRef = useRef(false);
  const pendingUserMessageRef = useRef<string>('');
  const pendingRestoreRef = useRef<number | null>(null);

  /* 加载历史对话列表 */
  const loadHistory = useCallback(async () => {
    if (!avatarId) return;
    try {
      setHistoryLoading(true);
      const res = await getConversationPage({
        current: 1,
        size: 50,
        avatarId
      });
      if (res?.records) {
        setHistoryList(res.records);
      }
    } catch (error) {
      console.error('加载历史对话失败:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [avatarId]);

  /* 打开历史记录时加载数据 */
  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, loadHistory]);

  /* embedded 模式下挂载时：如果有缓存的 conversationId，先暂存，等聊天框加载完成后再恢复 */
  useEffect(() => {
    if (!avatarId) return;
    const cachedId = getCachedConversationId(avatarId);
    if (cachedId) {
      pendingRestoreRef.current = cachedId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

  /* 保存对话 */
  const doSaveConversation = useCallback(
    async (messages: ConversationMessageItem[]) => {
      if (!avatarId || messages.length === 0 || isProcessingSaveRef.current) return;

      // 过滤掉空内容
      const validMessages = messages.filter((m) => m.content && m.content.trim().length > 0);
      if (validMessages.length === 0) return;

      isProcessingSaveRef.current = true;

      try {
        const res = await saveConversation({
          conversationId: conversationId ?? undefined,
          avatarId,
          messages: validMessages
        });

        // 如果之前没有 conversationId，使用返回的数据设置
        if (conversationId === null && typeof res === 'number') {
          setConversationId(res);
        }
      } catch (error) {
        console.error('保存对话失败:', error);
      } finally {
        isProcessingSaveRef.current = false;
      }
    },
    [avatarId, conversationId]
  );

  /* 用户发送消息回调 */
  const handleSendMessage = useCallback(
    (text: string) => {
      console.log('消息提交了');
      onSendMessage?.(text);

      // 暂存用户消息，等AI回复完成后一起保存
      if (avatarId && text) {
        pendingUserMessageRef.current = text;
      }
    },
    [onSendMessage, avatarId]
  );

  /* AI 消息完成回调 */
  const handleAiMessageDone = useCallback(
    (responseText: string) => {
      console.log('收到ai消息', responseText);
      onAiMessageDone?.();

      // 将用户消息和AI回复一起保存
      if (avatarId && responseText) {
        const messages: ConversationMessageItem[] = [];
        if (pendingUserMessageRef.current) {
          messages.push({
            role: 'user',
            content: pendingUserMessageRef.current
          });
        }
        messages.push({
          role: 'ai',
          content: responseText
        });
        doSaveConversation(messages);
        pendingUserMessageRef.current = '';
      }
    },
    [onAiMessageDone, avatarId, doSaveConversation]
  );

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLang(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // 点击外部关闭弹窗/历史记录
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;
      // 如果点击的不是聊天窗口内部，也不是浮动按钮，则关闭
      if (
        chatBoxRef.current &&
        !chatBoxRef.current.contains(target) &&
        floatButtonRef.current &&
        !floatButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
      // 点击历史记录弹窗外部关闭历史记录
      if (showHistory && historyRef.current && !historyRef.current.contains(target)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showHistory]);

  /* 新建对话 */
  const handleNewChat = useCallback(() => {
    setShowHistory(false);
    setConversationId(null);
    lastMessageCountRef.current = 0;

    // 清除缓存
    if (avatarId) {
      setCachedConversationId(avatarId, null);
    }

    // 重置 FastGPT 的 chatId，清空当前对话
    const { setChatId } = useChatStore.getState();
    setChatId();
  }, [avatarId]);

  /* conversationId 变化时写入缓存 */
  useEffect(() => {
    if (avatarId) {
      setCachedConversationId(avatarId, conversationId);
    }
  }, [avatarId, conversationId]);

  /* 加载历史对话 */
  const handleLoadHistory = useCallback(async (item: ConversationItemVO) => {
    setShowHistory(false);
    setConversationId(item.id);
    lastMessageCountRef.current = 0;

    // 先重置 FastGPT 的 chatId，清空当前对话
    const { setChatId } = useChatStore.getState();
    setChatId();

    // 查询历史对话详情
    try {
      const detail = await getConversationDetail({ conversationId: item.id });
      if (detail?.messages && detail.messages.length > 0) {
        const historyMessages = detail.messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        }));

        // 延迟发送历史消息，等待 ChatBox 完成初始化（chatId 变化后需要重新加载）
        setTimeout(() => {
          window.postMessage(
            {
              type: 'loadHistoryMessages',
              messages: historyMessages
            },
            '*'
          );
        }, 300);
      }
    } catch (error) {
      console.error('加载历史对话详情失败:', error);
    }
  }, []);

  /* 聊天框加载完成回调：执行待恢复的历史对话 */
  const handleChatReady = useCallback(() => {
    if (pendingRestoreRef.current !== null) {
      const cachedId = pendingRestoreRef.current;
      pendingRestoreRef.current = null;
      handleLoadHistory({ id: cachedId } as ConversationItemVO);
    }
  }, [handleLoadHistory]);

  const container = (
    <Box
      w={{ base: '300px', sm: '330px', md: '360px', lg: '380px', xl: '400px' }}
      h="530px"
      maxH="90vh"
      bg="#FFF"
      borderRadius="20px"
      border="1px solid #FFE8E8"
      boxShadow="0 4px 20px rgba(200, 0, 0, 0.08)"
      overflow="visible"
      position="relative"
      className="new-small-chat-container"
    >
      {/* 全局样式覆盖 - 仅影响本容器内的聊天记录 */}
      <Box
        as="style"
        dangerouslySetInnerHTML={{
          __html: `
            /* 历史弹窗内按钮恢复默认样式 */
            /* 历史弹窗内按钮恢复默认样式 */
            .new-small-chat-container .history-popup button,
            .new-small-chat-container .history-popup [role="button"] {
              border-radius: inherit !important;
              width: auto !important;
              height: auto !important;
              min-width: auto !important;
              min-height: auto !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              padding: inherit !important;
              margin: inherit !important;
              outline: inherit !important;
              flex-shrink: inherit !important;
            }
            /* 新建对话按钮强制占满整行 */
            .new-small-chat-container .history-popup .new-chat-btn {
              width: 100% !important;
              display: block !important;
              border-radius: 20px !important;
            }
            /* 历史列表项样式 */
            .new-small-chat-container .history-popup .history-item {
              width: 100% !important;
              border: 1px solid #F0F0F0 !important;
              border-radius: 12px !important;
              margin-bottom: 8px !important;
              background: #FFF !important;
              height: 82px !important;
              padding: 14px !important;
            }
            .new-small-chat-container .history-popup .history-item:hover {
              border-color: #c83e3e !important;
              background: #F8F8F8 !important;
            }
          `
        }}
      />

      {/* 内容区域 */}
      <Flex position="relative" zIndex="1" h="100%" flexDirection="column" overflow="visible">
        {/* Header */}
        {showHeader && (
          <Box h="73px" px="16px" position="relative" bg="#FFF5EE">
            <Flex alignItems="center" justifyContent="space-between" h="100%">
              <Flex alignItems="center" gap="10px">
                {/* AI 图标 */}
                <Box
                  w="36px"
                  h="36px"
                  borderRadius="10px"
                  bg="#c83e3e"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <AIAvatarIcon />
                </Box>
                <Flex flexDirection="column" gap="2px">
                  <Text fontSize="16px" fontWeight={600} color="#333" lineHeight="1.2">
                    {t('studentChat.aiTeacherTitle')}
                  </Text>
                  <Text fontSize="12px" fontWeight={400} color="#999" lineHeight="1.2">
                    {t('studentChat.aiTeacherSubtitle')}
                  </Text>
                </Flex>
              </Flex>
              {/* 时钟图标 */}
              <Box
                as="button"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                p="6px"
                borderRadius="50%"
                transition="background 0.2s"
                _hover={{ bg: '#F5F5F5' }}
                mr={!embedded && showCloseButton ? '36px' : '0px'}
                onClick={() => setShowHistory(!showHistory)}
              >
                <ClockIcon />
              </Box>
            </Flex>
          </Box>
        )}

        {/* 聊天区域 */}
        <Box flex="1" overflow="visible" position="relative" ref={chatContentRef}>
          {children}

          {/* 历史对话弹窗 */}
          {showHistory && (
            <Box ref={historyRef}>
              <HistoryDialog
                historyList={historyList}
                historyLoading={historyLoading}
                onClose={() => setShowHistory(false)}
                onNewChat={handleNewChat}
                onLoadHistory={handleLoadHistory}
                style={
                  !embedded
                    ? { top: 'auto', bottom: 0 }
                    : undefined
                }
              />
            </Box>
          )}
        </Box>
      </Flex>

      {/* 关闭按钮 */}
      {showCloseButton && (
        <Box
          position="absolute"
          top="22px"
          right="12px"
          zIndex={999}
          cursor="pointer"
          pointerEvents="auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          bg="rgba(255,255,255,0.8)"
          borderRadius="50%"
          p="4px"
        >
          <MyIcon name="close" w="20px" h="20px" color="#666" />
        </Box>
      )}
    </Box>
  );

  const contextValue = {
    onSendMessage: handleSendMessage,
    onAiMessageDone: handleAiMessageDone
  };

  const wrappedContainer = (
    <SendMessageContext.Provider value={contextValue}>
      <ChatReadyContext.Provider value={handleChatReady}>{container}</ChatReadyContext.Provider>
    </SendMessageContext.Provider>
  );

  // embedded 模式直接显示容器
  if (embedded) {
    return wrappedContainer;
  }

  // 浮动模式
  return (
    <>
      {/* 聊天窗口 - 使用 display 控制显隐，保持组件状态 */}
      <Box
        ref={chatBoxRef}
        position="fixed"
        bottom="100px"
        right="20px"
        zIndex={1000}
        display={isOpen ? 'block' : 'none'}
        maxH="90vh"
      >
        {wrappedContainer}
      </Box>

      {/* 浮动按钮 */}
      <Box
        ref={floatButtonRef}
        position="fixed"
        bottom="40px"
        right="40px"
        zIndex={1000}
        cursor="pointer"
        onClick={() => setIsOpen(true)}
        transition="transform 0.2s"
        _hover={{ transform: 'scale(1.05)' }}
        display={isOpen ? 'none' : 'block'}
      >
        <Box
          as="img"
          src={
            lang === 'zh-CN'
              ? '/imgs/app/student/float_chat.png'
              : '/imgs/app/student/float_chat-en.png'
          }
          w="80px"
          h="auto"
          display="block"
        />
      </Box>
    </>
  );
}
