import { useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { useHuayunChatStore } from '../store';
import {
  getInitChatInfo,
  delChatHistoryById,
  chatUpdate,
  updateChatItem
} from '../api';
import { streamFetch } from '@/web/common/api/fetch';
import type { StartChatFnProps } from '../types';
import type { ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import { ChatRoleEnum, ChatStatusEnum, ChatItemValueTypeEnum } from '@fastgpt/global/core/chat/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';

export const useChat = (appId: string, chatId: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    chatHistory,
    setChatHistory,
    chatData,
    setChatData,
    histories,
    setHistories,
    startGenerating,
    endGenerating,
    updateChatCache
  } = useHuayunChatStore();

  const forbidRefresh = useRef(false);
  const activeChatIdRef = useRef(chatId);
  activeChatIdRef.current = chatId;

  const newChatId = !chatId ? nanoid() : '';
  const newChatIdRef = useRef(newChatId);
  newChatIdRef.current = newChatId;

  const loadChatInfo = useCallback(
    async (params: { appId: string; chatId: string }) => {
      try {
        const res = await getInitChatInfo({
          tenantAppId: params.appId,
          chatId: params.chatId
        });

        const history = (res.history || []).map(
          (item) =>
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
      } catch (e: any) {
        console.error('加载聊天信息失败:', e);
      }
    },
    [setChatData, setChatHistory]
  );

  const onStartChat = useCallback(
    async (props: StartChatFnProps) => {
      const {
        messages,
        variables,
        controller,
        responseChatItemId,
        generatingMessage,
        history,
        appContextDetail,
        quotedRef,
        searchSelectedRef,
        fileKeys
      } = props;

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
        onMessage: (e) => {
          const isCurrentChat =
            activeChatIdRef.current === completionChatId ||
            (!activeChatIdRef.current && newChatIdRef.current === completionChatId);

          if (isCurrentChat) {
            generatingMessage(e);
          }
          const currentCache = useHuayunChatStore.getState().chatStoreCache[completionChatId] || history || [];
          const newHistory = processChatUpdate(currentCache, e);
          updateChatCache(completionChatId, newHistory);
        },
        abortCtrl: controller
      });

      endGenerating(completionChatId);

      return { responseText, isNewChat: forbidRefresh.current };
    },
    [appId, chatId, newChatId, startGenerating, endGenerating, updateChatCache]
  );

  const onDelMessage = useCallback(
    async (e: { contentId: string; appId: string }) => {
      // 可以在这里调用删除 API
      return true;
    },
    []
  );

  const onUpdateChatItem = useCallback(
    async (e: {
      responseChatItemId: string;
      value: string;
      responseData: string;
      variables?: string;
    }) => {
      return updateChatItem({
        dataId: e.responseChatItemId,
        value: e.value,
        content: e.value,
        responseData: e.responseData,
        variables: e.variables
      });
    },
    []
  );

  return {
    chatHistory,
    setChatHistory,
    chatData,
    loadChatInfo,
    onStartChat,
    onDelMessage,
    onUpdateChatItem,
    histories,
    setHistories,
    forbidRefresh,
    newChatId
  };
};

function processChatUpdate(
  currentCache: ChatSiteItemType[],
  e: { event: string; text?: string; reasoningText?: string; [key: string]: any }
): ChatSiteItemType[] {
  const lastItem = currentCache[currentCache.length - 1];
  if (!lastItem || lastItem.obj !== ChatRoleEnum.AI) return currentCache;

  const newCache = [...currentCache];
  const item = { ...lastItem };

  if (e.event === 'answer' && e.text) {
    const lastValue = item.value?.[item.value.length - 1];
    if (lastValue && lastValue.type === ChatItemValueTypeEnum.text && lastValue.text) {
      lastValue.text.content += e.text;
      item.value = [...(item.value || [])];
    } else {
      item.value = [
        ...(item.value || []),
        {
          type: ChatItemValueTypeEnum.text,
          text: { content: e.text }
        }
      ];
    }
  }

  newCache[newCache.length - 1] = item;
  return newCache;
}
