'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Box } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  ChatStatusEnum,
  ChatRoleEnum,
  ChatItemValueTypeEnum
} from '@fastgpt/global/core/chat/constants';
import type { ChatSiteItemType, AIChatItemValueItemType } from '@fastgpt/global/core/chat/type';
import { getNanoid } from '@fastgpt/global/common/string/tools';

import ChatBox from './ChatBox';
import ChatHeader from './ChatHeader';
// import ChatHistorySidebar from './ChatHistorySidebar';
import { useHuayunChatStore } from '../store';
import {
  getInitChatInfo,
  getChatHistories,
  delChatHistoryById,
  chatUpdate,
  updateChatItem
} from '../api';
import { streamFetch } from '@/web/common/api/fetch';
import { useUserStore } from '@/common/store/useUserStore';
import type { StartChatFnProps, ChatHistoryItemType } from '../types';
import { useAuth } from '@/app/components/auth';
/**
 * 获取系统登录 Token
 */
function getTeacherToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('system_access_token');
}
export default function PCChat() {
  const searchParams = useSearchParams();
  const { isPc } = useSystem();
  const { userInfo } = useUserStore();
  const { user } = useAuth();

  const appId = searchParams?.get('appId') || '';
  const urlChatId = searchParams?.get('chatId') || '';

  const [chatId, setChatId] = useState(urlChatId);
  const forbidRefresh = useRef(false);
  const activeChatIdRef = useRef(chatId);
  activeChatIdRef.current = chatId;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const newChatId = useMemo(() => nanoid(), []);
  const newChatIdRef = useRef(newChatId);
  newChatIdRef.current = newChatId;

  const freshChatIdRef = useRef('');

  const {
    chatHistory,
    setChatHistory,
    chatData,
    setChatData,
    customTitle,
    setCustomTitle,
    histories,
    setHistories,
    startGenerating,
    endGenerating,
    updateChatCache
  } = useHuayunChatStore();

  // Load histories
  const { runAsync: loadHistories } = useRequest2(
    async () => {
      if (!appId) return;
      const res = await getChatHistories({
        appId,
        size: 50,
        current: 1
      });
      setHistories(res.records || []);
    },
    { manual: true }
  );

  // Load chat info
  useEffect(() => {
    if (!appId) return;
    if (forbidRefresh.current) {
      forbidRefresh.current = false;
      return;
    }

    // If no chatId, generate a fresh one and update URL (matching huayunai-user behavior)
    if (!chatId) {
      const freshId = nanoid();
      freshChatIdRef.current = freshId;
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('chatId', freshId);
      window.history.replaceState(null, '', `?${params.toString()}`);
      setChatId(freshId);
      return;
    }

    const completionChatId = chatId || newChatId;

    let cancelled = false;
    getInitChatInfo({
      tenantAppId: appId,
      chatId: completionChatId
    })
      .then((res) => {
        if (cancelled) return;
        const history = (res.history || []).map(
          (item: any) =>
            ({
              ...item,
              dataId: item.dataId || getNanoid(),
              status: ChatStatusEnum.finish,
              value: item.value || [],
              responseData: (item.obj === ChatRoleEnum.AI && item.responseData) || []
            }) as ChatSiteItemType
        );

        setChatData(res);
        setChatHistory(history);
      })
      .catch((e: any) => {
        console.error('加载聊天信息失败:', e);
      });

    return () => {
      cancelled = true;
    };
  }, [appId, chatId, newChatId, setChatData, setChatHistory, searchParams]);

  useEffect(() => {
    if (appId) {
      loadHistories();
    }
  }, [appId, loadHistories]);

  const onStartChat = useCallback(
    async (props: StartChatFnProps) => {
      const { messages, controller, generatingMessage, history, inputVal } = props;

      const completionChatId = chatId || newChatId;
      startGenerating(completionChatId);

      if (history) {
        updateChatCache(completionChatId, history);
      }

      const data = {
        ...props,
        messages: messages.slice(-1),
        chatId: completionChatId,
        tenantAppId: appId
      };

      const { responseText } = await streamFetch({
        url: '/huayun-ai/client/chat/completions',
        data,
        /** 课程 token */
        headers: {
          Authorization: `${getTeacherToken()}`
        },
        onMessage: (e) => {
          const isCurrentChat =
            activeChatIdRef.current === completionChatId ||
            (!activeChatIdRef.current && newChatIdRef.current === completionChatId);

          if (isCurrentChat) {
            generatingMessage(e);
          }
          const currentCache =
            useHuayunChatStore.getState().chatStoreCache[completionChatId] || history || [];
          const newHistory = processChatUpdate(currentCache, e);
          updateChatCache(completionChatId, newHistory);
        },
        abortCtrl: controller
      });

      endGenerating(completionChatId);

      // Persist AI response
      const finalHistory =
        useHuayunChatStore.getState().chatStoreCache[completionChatId] || history || [];
      const lastItem = finalHistory[finalHistory.length - 1];
      if (lastItem?.obj === ChatRoleEnum.AI && lastItem.dataId === props.responseChatItemId) {
        updateChatItem({
          dataId: props.responseChatItemId,
          value: JSON.stringify(lastItem.value),
          content: responseText,
          responseData: JSON.stringify(lastItem.responseData || []),
          variables: JSON.stringify(props.variables)
        }).catch(() => {});
      }

      // New chat: update title and push to history
      const isFreshPrefilledChat =
        !!freshChatIdRef.current && completionChatId === freshChatIdRef.current;
      const isFirstMessageOfNewChat = completionChatId !== chatId || isFreshPrefilledChat;

      if (isFirstMessageOfNewChat && controller.signal.reason !== 'cancel') {
        // Consume the one-time fresh chat mark
        freshChatIdRef.current = '';
        const newHistoryItem: ChatHistoryItemType = {
          chatId: completionChatId,
          title: customTitle || inputVal.slice(0, 20) || '新对话',
          updateTime: new Date(),
          appId,
          top: false,
          tenantAppId: appId
        };
        setHistories((prev) => [newHistoryItem, ...prev]);

        if (customTitle) {
          chatUpdate({ chatId: completionChatId, title: customTitle, tenantAppId: appId }).catch(
            () => {}
          );
        }

        if (
          controller.signal.reason !== 'leave' &&
          activeChatIdRef.current === chatId &&
          isMounted.current
        ) {
          // Update URL
          forbidRefresh.current = true;
          const params = new URLSearchParams(searchParams?.toString() || '');
          params.set('chatId', completionChatId);
          window.history.replaceState(null, '', `?${params.toString()}`);
          setChatId(completionChatId);

          if (!customTitle) {
            const prompts = messages.slice(-1);
            const prompt = `
请根据以下对话内容，生成一个简短的标题（不超过10个字），直接返回标题，不要加任何解释。

用户问题：${inputVal}
AI回答：${responseText} 
`;
            streamFetch({
              url: '/huayun-ai/client/chat/once',
              headers: {
                Authorization: `${getTeacherToken()}`
              },
              data: {
                content: prompt,
                messages: [
                  {
                    role: prompts[0]?.role || 'user',
                    content: prompt
                  }
                ],
                variables: props.variables,
                tenantAppId: appId,
                chatId: completionChatId
              },
              onMessage: () => {},
              abortCtrl: new AbortController()
            })
              .then(({ responseText: title }) => {
                const cleanTitle = title?.trim() || inputVal.slice(0, 20) || '新对话';
                if (activeChatIdRef.current === chatId) {
                  setCustomTitle(cleanTitle);
                }
                setHistories((prev) =>
                  prev.map((item) =>
                    item.chatId === completionChatId ? { ...item, title: cleanTitle } : item
                  )
                );
                chatUpdate({ chatId: completionChatId, title: cleanTitle, tenantAppId: appId })
                  .then(() => {
                    loadHistories();
                  })
                  .catch(() => {});
              })
              .catch(() => {});
          }
        }
      }

      return { responseText, isNewChat: forbidRefresh.current };
    },
    [
      appId,
      chatId,
      newChatId,
      startGenerating,
      endGenerating,
      updateChatCache,
      setHistories,
      searchParams,
      chatUpdate,
      updateChatItem,
      customTitle,
      setCustomTitle,
      loadHistories
    ]
  );

  const handleSelectChat = useCallback(
    (selectedChatId: string) => {
      setChatId(selectedChatId);
      setCustomTitle('');
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('chatId', selectedChatId);
      window.history.replaceState(null, '', `?${params.toString()}`);
    },
    [searchParams, setCustomTitle]
  );

  const handleNewChat = useCallback(() => {
    setChatId('');
    setChatHistory([]);
    setChatData(null);
    setCustomTitle('');
    freshChatIdRef.current = '';
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('chatId');
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchParams, setChatHistory, setChatData, setCustomTitle]);

  const handleRenameChat = useCallback(
    async (renamedChatId: string, title: string) => {
      try {
        await chatUpdate({ chatId: renamedChatId, title, tenantAppId: appId });
        setHistories((prev) =>
          prev.map((item) => (item.chatId === renamedChatId ? { ...item, title } : item))
        );
      } catch (e) {
        console.error('重命名失败:', e);
      }
    },
    [appId, setHistories]
  );

  const handleDeleteChat = useCallback(
    async (deletedChatId: string, deletedId?: string) => {
      try {
        await delChatHistoryById({ chatId: deletedChatId, id: deletedId });
        setHistories((prev) => prev.filter((h) => h.chatId !== deletedChatId));
        if (chatId === deletedChatId) {
          handleNewChat();
        }
        // Refresh history list
        loadHistories();
      } catch (e) {
        console.error('删除对话失败:', e);
      }
    },
    [chatId, setHistories, handleNewChat, loadHistories]
  );

  return (
    <Flex h="100%" w="100%" overflow="hidden">
      {/* 历史对话功能暂时注释掉
      {isPc && (
        <ChatHistorySidebar
          histories={histories}
          activeChatId={chatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onNewChat={handleNewChat}
        />
      )}
      */}
      <Flex flexDir="column" flex={1} h="100%" w={0}>
        <ChatHeader appName={chatData?.app?.name} appAvatar={chatData?.app?.avatar} />
        <Box flex={1} overflow="hidden">
          <ChatBox
            appId={chatData?.appId}
            tenantAppId={appId}
            chatId={chatId || newChatId}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            userAvatar={
              user?.avatar || chatData?.userAvatar || userInfo?.avatarUrl || userInfo?.avatar
            }
            appAvatar={chatData?.app?.avatar}
            onStartChat={onStartChat}
          />
        </Box>
      </Flex>
    </Flex>
  );
}

function processChatUpdate(
  currentCache: ChatSiteItemType[],
  e: { event: string; text?: string; reasoningText?: string; [key: string]: any }
): ChatSiteItemType[] {
  const lastItem = currentCache[currentCache.length - 1];
  if (!lastItem || lastItem.obj !== ChatRoleEnum.AI) return currentCache;

  const newCache = [...currentCache];
  const item = { ...lastItem };

  if (e.event === 'answer' && e.text) {
    const prevValue = (item.value || []) as AIChatItemValueItemType[];
    const lastValue = prevValue[prevValue.length - 1];
    if (lastValue?.type === ChatItemValueTypeEnum.text && lastValue.text) {
      item.value = [
        ...prevValue.slice(0, -1),
        {
          ...lastValue,
          text: { ...lastValue.text, content: lastValue.text.content + e.text }
        }
      ] as AIChatItemValueItemType[];
    } else {
      item.value = [
        ...prevValue,
        {
          type: ChatItemValueTypeEnum.text,
          text: { content: e.text }
        }
      ] as AIChatItemValueItemType[];
    }
  }

  newCache[newCache.length - 1] = item;
  return newCache;
}
