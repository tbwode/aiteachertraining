'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { customAlphabet } from 'nanoid';
import {
  ChatRoleEnum,
  ChatItemValueTypeEnum,
  ChatFileTypeEnum
} from '@fastgpt/global/core/chat/constants';
import type { ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import ChatMessageItem from './ChatMessageItem';
import MessageInput from './MessageInput';
import type { StartChatFnProps, ChatBoxRef, MessageFileType, FeedbackTypeEnum } from '../types';
import { updateChatItem, delChatRecordById } from '../api';
import { useToast } from '@fastgpt/web/hooks/useToast';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 24);

interface ChatBoxProps {
  appId?: string;
  tenantAppId?: string;
  chatId?: string;
  chatHistory: ChatSiteItemType[];
  setChatHistory: (
    history: ChatSiteItemType[] | ((prev: ChatSiteItemType[]) => ChatSiteItemType[])
  ) => void;
  userAvatar?: string;
  appAvatar?: string;
  onStartChat?: (props: StartChatFnProps) => Promise<any>;
}

const ChatBox = React.forwardRef<ChatBoxRef, ChatBoxProps>(
  ({ appId, tenantAppId, chatId, chatHistory, setChatHistory, userAvatar, appAvatar, onStartChat }, ref) => {
    const { isPc } = useSystem();
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const chatController = useRef<AbortController | null>(null);
    const isSending = useRef(false);

    useEffect(() => {
      return () => {
        chatController.current?.abort('leave');
        chatController.current = null;
      };
    }, []);

    const isChatting = useMemo(() => {
      const lastItem = chatHistory[chatHistory.length - 1];
      return lastItem?.obj === ChatRoleEnum.AI && lastItem.status !== 'finish';
    }, [chatHistory]);

    const scrollToBottom = useCallback(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, []);

    useEffect(() => {
      if (isAutoScroll) {
        scrollToBottom();
      }
    }, [chatHistory, isAutoScroll, scrollToBottom]);

    useEffect(() => {
      setIsAutoScroll(true);
      scrollToBottom();
    }, [chatId, scrollToBottom]);

    const handleScroll = useCallback(() => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAutoScroll(isAtBottom);
    }, []);

    const generatingMessage = useCallback(
      (e: { event: string; text?: string; reasoningText?: string }) => {
        setChatHistory((state) => {
          const newState = [...state];
          const lastItem = newState[newState.length - 1];
          if (!lastItem || lastItem.obj !== ChatRoleEnum.AI) return state;

          const updatedItem = { ...lastItem };

          if (e.event === 'answer' && e.text) {
            const prevValue = updatedItem.value || [];
            const lastValue = prevValue[prevValue.length - 1];
            if (lastValue?.type === 'text' && lastValue.text) {
              updatedItem.value = [
                ...prevValue.slice(0, -1),
                {
                  ...lastValue,
                  text: { ...lastValue.text, content: lastValue.text.content + e.text }
                }
              ];
            } else {
              updatedItem.value = [...prevValue, { type: ChatItemValueTypeEnum.text, text: { content: e.text } }];
            }
          }

          newState[newState.length - 1] = updatedItem;
          return newState;
        });
      },
      [setChatHistory]
    );

    const sendMessage = useCallback(
      async (
        inputVal: string,
        files: MessageFileType[],
        images: MessageFileType[],
        baseHistory?: ChatSiteItemType[]
      ) => {
        if (isSending.current || !onStartChat || isChatting) return;
        isSending.current = true;

        const humanDataId = nanoid();
        const aiDataId = nanoid();

        const humanMessage = {
          id: humanDataId,
          dataId: humanDataId,
          obj: ChatRoleEnum.Human,
          value: [
            ...(images.length > 0
              ? images.map((img) => ({
                  type: ChatItemValueTypeEnum.file as const,
                  file: {
                    type: ChatFileTypeEnum.image,
                    name: img.name,
                    url: img.fileUrl || ''
                  }
                }))
              : []),
            ...(files.length > 0
              ? files.map((file) => ({
                  type: ChatItemValueTypeEnum.file as const,
                  file: {
                    type: ChatFileTypeEnum.file,
                    name: file.name,
                    url: file.fileUrl || ''
                  }
                }))
              : []),
            ...(inputVal
              ? [
                  {
                    type: ChatItemValueTypeEnum.text as const,
                    text: { content: inputVal }
                  }
                ]
              : [])
          ],
          status: 'finish' as const
        } as ChatSiteItemType;

        const aiMessage = {
          id: aiDataId,
          dataId: aiDataId,
          obj: ChatRoleEnum.AI,
          value: [{ type: ChatItemValueTypeEnum.text as const, text: { content: '' } }],
          status: 'loading' as const
        } as ChatSiteItemType;

        const currentHistory = baseHistory || chatHistory;
        const newHistory = [...currentHistory, humanMessage, aiMessage];
        setChatHistory(newHistory);

        try {
          const abortCtrl = new AbortController();
          chatController.current = abortCtrl;

          const messages = chats2GPTMessages({
            messages: newHistory,
            reserveId: true
          });

          const fileKeys = [
            ...images.map((f) => f.fileKey).filter(Boolean),
            ...files.map((f) => f.fileKey).filter(Boolean)
          ] as string[];

          await onStartChat({
            value: JSON.stringify(humanMessage.value),
            content: inputVal,
            messages: messages.slice(0, -1),
            responseChatItemId: aiDataId,
            controller: abortCtrl,
            variables: {},
            inputVal,
            fileKeys,
            generatingMessage: (e) => {
              generatingMessage(e);
            },
            history: newHistory,
            getHistory: () => newHistory
          });

          setChatHistory((state) => {
            const newState = [...state];
            const lastItem = newState[newState.length - 1];
            if (lastItem?.obj === ChatRoleEnum.AI) {
              newState[newState.length - 1] = { ...lastItem, status: 'finish' };
            }
            return newState;
          });
        } catch (err: any) {
          toast({
            status: 'error',
            title: err?.message || '发送失败'
          });
          setChatHistory((state) => {
            const newState = [...state];
            const lastItem = newState[newState.length - 1];
            if (lastItem?.obj === ChatRoleEnum.AI) {
              newState[newState.length - 1] = { ...lastItem, status: 'finish' };
            }
            return newState;
          });
        } finally {
          chatController.current = null;
          isSending.current = false;
        }
      },
      [chatHistory, isChatting, onStartChat, setChatHistory, generatingMessage, toast]
    );

    const abortSendMessage = useCallback(() => {
      chatController.current?.abort('stop');
      chatController.current = null;
    }, []);

    const resendMessage = useCallback(
      (dataId: string) => {
        const index = chatHistory.findIndex((item) => item.dataId === dataId);
        if (index < 0) return;

        const humanItem = chatHistory[index];
        const text = humanItem.value
          ?.filter((v) => v.type === 'text')
          .map((v) => v.text?.content)
          .join('');

        const truncatedHistory = chatHistory.slice(0, index);
        setChatHistory(truncatedHistory);
        sendMessage(text || '', [], [], truncatedHistory);
      },
      [chatHistory, sendMessage, setChatHistory]
    );

    const regenerateMessage = useCallback(
      async (dataId: string) => {
        const index = chatHistory.findIndex((item) => item.dataId === dataId);
        if (index < 0) return;

        // Find the previous human message
        let humanIndex = -1;
        for (let i = index - 1; i >= 0; i--) {
          if (chatHistory[i].obj === ChatRoleEnum.Human) {
            humanIndex = i;
            break;
          }
        }
        if (humanIndex < 0) return;

        const delHistory = chatHistory.slice(humanIndex);

        // Call delete API for each message
        for (const item of delHistory) {
          console.log('[regenerate] delete params:', { appId, tenantAppId, chatId, contentId: item.dataId });
          if (item.dataId && appId && chatId) {
            await delChatRecordById({
              appId,
              tenantAppId,
              chatId,
              contentId: item.dataId
            }).catch((err) => {
              console.error('Delete chat record failed:', err);
            });
          }
        }

        const humanItem = chatHistory[humanIndex];
        const text = humanItem.value
          ?.filter((v) => v.type === 'text')
          .map((v) => v.text?.content)
          .join('');

        // Remove from the human message onward and re-send
        const truncatedHistory = chatHistory.slice(0, humanIndex);
        setChatHistory(truncatedHistory);
        sendMessage(text || '', [], [], truncatedHistory);
      },
      [chatHistory, sendMessage, setChatHistory, appId, tenantAppId, chatId]
    );

    const handleLike = useCallback(
      (dataId: string) => {
        const item = chatHistory.find((it) => it.dataId === dataId);
        if (!item) return;

        const currentFeedback = (item as any).feedbackType as FeedbackTypeEnum | undefined;
        const nextFeedback: FeedbackTypeEnum =
          currentFeedback === '1' ? ('0' as FeedbackTypeEnum) : ('1' as FeedbackTypeEnum);

        setChatHistory((prev) =>
          prev.map((it) => (it.dataId === dataId ? { ...it, feedbackType: nextFeedback } : it))
        );

        updateChatItem({ dataId, feedbackType: nextFeedback }).catch(() => {});
      },
      [chatHistory, setChatHistory]
    );

    const handleDislike = useCallback(
      (dataId: string) => {
        const item = chatHistory.find((it) => it.dataId === dataId);
        if (!item) return;

        const currentFeedback = (item as any).feedbackType as FeedbackTypeEnum | undefined;
        const nextFeedback: FeedbackTypeEnum =
          currentFeedback === '2' ? ('0' as FeedbackTypeEnum) : ('2' as FeedbackTypeEnum);

        setChatHistory((prev) =>
          prev.map((it) =>
            it.dataId === dataId ? { ...it, feedbackType: nextFeedback, customFeedback: '' } : it
          )
        );

        updateChatItem({ dataId, feedbackType: nextFeedback, customFeedback: '' }).catch(() => {});
      },
      [chatHistory, setChatHistory]
    );

    React.useImperativeHandle(ref, () => ({
      getChatHistories: () => chatHistory,
      resetVariables: () => {},
      resetHistory: (history: ChatSiteItemType[]) => setChatHistory(history),
      scrollToBottom,
      resetInputVal: () => {},
      handleAutoSend: () => {},
      pinToBottomOnInit: () => {
        setIsAutoScroll(true);
        scrollToBottom();
      }
    }));

    return (
      <Flex flexDir="column" h="100%" w="100%">
        <Box ref={scrollRef} flex={1} overflowY="auto" onScroll={handleScroll} py={2}>
          <Box maxW="800px" mx="auto" px={isPc ? 4 : 2}>
            {chatHistory.map((item, index) => (
              <ChatMessageItem
                key={item.dataId || index}
                item={item}
                index={index}
                isLast={index === chatHistory.length - 1}
                isChatting={isChatting}
                userAvatar={userAvatar}
                appAvatar={appAvatar}
                onResend={item.obj === ChatRoleEnum.Human ? resendMessage : undefined}
                onLike={item.obj === ChatRoleEnum.AI ? () => handleLike(item.dataId) : undefined}
                onDislike={
                  item.obj === ChatRoleEnum.AI ? () => handleDislike(item.dataId) : undefined
                }
                onRegenerate={
                  item.obj === ChatRoleEnum.AI ? () => regenerateMessage(item.dataId) : undefined
                }
              />
            ))}
          </Box>
        </Box>
        <MessageInput
          onSendMessage={sendMessage}
          isChatting={isChatting}
          onStop={abortSendMessage}
        />
      </Flex>
    );
  }
);

ChatBox.displayName = 'ChatBox';

export default ChatBox;
