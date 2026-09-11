import React, { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import NextHead from '@/components/common/NextHead';
import { Box, Flex } from '@chakra-ui/react';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import PageContainer from '@/components/PageContainer';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import ChatContextProvider from '@/web/core/chat/context/chatContext';
import { useContextSelector } from 'use-context-selector';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider from '@/web/core/chat/context/chatRecordContext';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import HuayunChatWindow from '@/pageComponents/chat/ChatWindow/HuayunChatWindow';
import { ChatPageContext, ChatPageContextProvider } from '@/web/core/chat/context/chatPageContext';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { LoginSuccessResponse } from '@/global/support/api/userRes';

const Chat = ({
  placeholder,
  minHeight
}: {
  placeholder?: string;
  minHeight?: number | string;
}) => {
  return (
    <Flex h={'100%'} overflow="hidden">
      {
        <PageContainer flex="1 0 0" w={0} position="relative">
          {/* 首页 */}
          {<HuayunChatWindow placeholder={placeholder} minHeight={minHeight} />}
        </PageContainer>
      }
    </Flex>
  );
};

type ChatPageProps = {
  appId: string;
  isStandalone?: string;
  showRunningStatus: boolean;
  showCite: boolean;
  showFullText: boolean;
  canDownloadSource: boolean;
  showWholeResponse: boolean;
  showController?: boolean;
  showAiDisclaimer?: boolean;
  isLargeScreen?: boolean;
  showHistory?: boolean;
  showChatHeader?: boolean;
  showResponseTags?: boolean;
  aiBubbleMode?: boolean;
  chatBgTransparent?: boolean;
  placeholder?: string;
  minHeight?: number | string;
  variables?: Record<string, any>;
  welcomeText?: string;
  simpleInput?: boolean;
};

const ChatContent = (props: ChatPageProps & { aiAvatarId?: number; simpleInput?: boolean }) => {
  const { appId, isStandalone, placeholder, minHeight, variables, welcomeText, aiAvatarId } = props;
  const { chatId } = useChatStore();
  const { setUserInfo } = useUserStore();
  const { feConfigs } = useSystemStore();

  const isInitedUser = useContextSelector(ChatPageContext, (v) => v.isInitedUser);
  const userInfo = useContextSelector(ChatPageContext, (v) => v.userInfo);

  const chatHistoryProviderParams = useMemo(
    () => ({ appId, source: ChatSourceEnum.online }),
    [appId]
  );

  const chatRecordProviderParams = useMemo(() => {
    return {
      appId,
      type: GetChatTypeEnum.normal,
      chatId
    };
  }, [appId, chatId]);

  const loginSuccess = useCallback(
    async (res: LoginSuccessResponse) => {
      setUserInfo(res.user);
    },
    [setUserInfo]
  );

  // Waiting for user info to be initialized
  if (!isInitedUser) {
    return (
      <PageContainer isLoading flex={'1'} p={4}>
        <NextHead title={feConfigs?.systemTitle} icon={feConfigs?.favicon} />
      </PageContainer>
    );
  }

  // Not login
  if (!userInfo) {
    return (
      <>
        <NextHead title={feConfigs?.systemTitle}></NextHead>
      </>
    );
  }

  // show main chat interface
  return (
    <ChatContextProvider params={chatHistoryProviderParams}>
      <ChatItemContextProvider
        showRouteToDatasetDetail={isStandalone !== '1'}
        showRunningStatus={props.showRunningStatus}
        canDownloadSource={props.canDownloadSource}
        isShowCite={props.showCite}
        isShowFullText={props.showFullText}
        showWholeResponse={props.showWholeResponse}
        showController={props.showController ?? false}
        showAiDisclaimer={props.showAiDisclaimer ?? false}
        isLargeScreen={props.isLargeScreen ?? false}
        showHistory={props.showHistory ?? false}
        showChatHeader={props.showChatHeader ?? false}
        showResponseTags={props.showResponseTags ?? true}
        aiBubbleMode={props.aiBubbleMode ?? false}
        chatBgTransparent={props.chatBgTransparent ?? false}
        variables={variables}
        welcomeText={welcomeText}
        inputMinHeight={minHeight}
        aiAvatarId={aiAvatarId}
        simpleInputMode={props.simpleInput ?? false}
      >
        <ChatRecordContextProvider params={chatRecordProviderParams}>
          <Chat placeholder={placeholder} minHeight={minHeight} />
        </ChatRecordContextProvider>
      </ChatItemContextProvider>
    </ChatContextProvider>
  );
};

const Render = ({
  appId: propAppId,
  forceNewChat = false,
  placeholder: propPlaceholder,
  minHeight,
  variables,
  welcomeText,
  aiAvatarId,
  simpleInput
}: {
  appId?: string;
  forceNewChat?: boolean;
  placeholder?: string;
  minHeight?: number | string;
  variables?: Record<string, any>;
  welcomeText?: string;
  aiAvatarId?: number;
  simpleInput?: boolean;
} = {}) => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const appId = propAppId || searchParams?.get('appId') || '';
  const setChatId = useChatStore((state) => state.setChatId);

  // 如果 forceNewChat 为 true，每次挂载时生成新的 chatId
  useEffect(() => {
    if (forceNewChat) {
      setChatId();
    }
  }, [forceNewChat, setChatId]);

  // 使用传入的 placeholder 或国际化的默认值
  const placeholder = propPlaceholder || t('common:smallchat.placeholder');

  // 小窗口模式配置
  // showController: 是否显示控制器
  // showAiDisclaimer: 是否显示"内容由第三方 AI 生成..."提示
  // isLargeScreen: 是否大屏模式
  const props: ChatPageProps = {
    appId,
    isStandalone: searchParams?.get('isStandalone') || undefined,
    showRunningStatus: false,
    showCite: true,
    showFullText: false,
    canDownloadSource: false,
    showWholeResponse: false,
    showController: false, // false = 隐藏
    showAiDisclaimer: false, // false = 隐藏
    isLargeScreen: false, // false = 小屏
    showHistory: false, // false = 隐藏历史记录侧边栏
    showChatHeader: false, // false = 隐藏 ChatHeader
    showResponseTags: false, // false = 隐藏 AI 回复底部的引用标签（如"13条上下文"）
    aiBubbleMode: true, // true = AI 回复带气泡样式
    chatBgTransparent: true, // true = 聊天背景透明
    placeholder,
    minHeight,
    variables,
    welcomeText
  };

  return (
    <ChatPageContextProvider appId={props.appId}>
      <ChatContent {...props} aiAvatarId={aiAvatarId} simpleInput={simpleInput} />
    </ChatPageContextProvider>
  );
};

export default Render;
