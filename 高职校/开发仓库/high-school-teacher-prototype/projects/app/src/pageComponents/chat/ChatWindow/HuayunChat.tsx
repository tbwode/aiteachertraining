import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import NextHead from '@/components/common/NextHead';
import { Box, Flex } from '@chakra-ui/react';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import PageContainer from '@/components/PageContainer';
import ChatSlider from '@/pageComponents/chat/slider';
import { ChatSidebarPaneEnum } from '@/pageComponents/chat/constants';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import ChatContextProvider from '@/web/core/chat/context/chatContext';
import { useContextSelector } from 'use-context-selector';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider from '@/web/core/chat/context/chatRecordContext';
import ChatQuoteList from '@/pageComponents/chat/ChatQuoteList';
import { useSystemStore } from '@/web/common/system/useSystemStore';
// import ChatSetting from '@/pageComponents/chat/ChatSetting';
import AppChatWindow from '@/pageComponents/chat/ChatWindow/AppChatWindow';
import HuayunChatWindow from '@/pageComponents/chat/ChatWindow/HuayunChatWindow';
import { ChatPageContext, ChatPageContextProvider } from '@/web/core/chat/context/chatPageContext';
import ChatTeamApp from '@/pageComponents/chat/ChatTeamApp';
import ChatFavouriteApp from '@/pageComponents/chat/ChatFavouriteApp';
import { useUserStore } from '@/web/support/user/useUserStore';
import type { LoginSuccessResponse } from '@/global/support/api/userRes';

const Chat = () => {
  const { isPc } = useSystem();

  const { appId } = useChatStore();

  const datasetCiteData = useContextSelector(ChatItemContext, (v) => v.datasetCiteData);
  const setCiteModalData = useContextSelector(ChatItemContext, (v) => v.setCiteModalData);

  const collapse = useContextSelector(ChatPageContext, (v) => v.collapse);
  const pane = useContextSelector(ChatPageContext, (v) => v.pane);

  return (
    <Flex
      h={'calc(100% - 24px)'}
      borderRadius="20px"
      borderColor="#E5E6EB"
      borderWidth="1px"
      mx={3}
      mb={3}
      mt={isPc ? 0 : 3}
      overflow="hidden"
    >
      {/* Side bar */}
      {/* {isPc && (
        <Box
          flexGrow={0}
          flexShrink={0}
          // w={collapse ? '72px' : '220px'}
          w={'213px'}
          overflow={'hidden'}
          borderRight="1px solid #E5E6EB"
          transition={'width 0.1s ease-in-out'}
        >
          <ChatSlider activeAppId={appId} />
        </Box>
      )} */}

      {
        <PageContainer flex="1 0 0" w={0} position="relative">
          {/* 首页 */}
          {<HuayunChatWindow />}
        </PageContainer>
      }

      {/* {datasetCiteData && (
        <PageContainer flex="1 0 0" w={0} maxW="560px">
          <ChatQuoteList
            metadata={datasetCiteData.metadata}
            rawSearch={datasetCiteData.rawSearch}
            onClose={() => setCiteModalData(undefined)}
          />
        </PageContainer>
      )} */}
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
};

const ChatContent = (props: ChatPageProps) => {
  const { appId, isStandalone } = props;
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
        showController={props.showController ?? true}
        showAiDisclaimer={props.showAiDisclaimer ?? true}
        isLargeScreen={props.isLargeScreen ?? true}
        showHistory={props.showHistory ?? true}
        showChatHeader={props.showChatHeader ?? true}
        showResponseTags={props.showResponseTags ?? true}
        aiBubbleMode={props.aiBubbleMode ?? false}
        chatBgTransparent={props.chatBgTransparent ?? false}
      >
        <ChatRecordContextProvider params={chatRecordProviderParams}>
          <Chat />
        </ChatRecordContextProvider>
      </ChatItemContextProvider>
    </ChatContextProvider>
  );
};

const Render = () => {
  const searchParams = useSearchParams();
  const appId = searchParams?.get('appId') || '';

  // 在这里直接配置展示/隐藏
  // showController: 是否显示控制器
  // showAiDisclaimer: 是否显示"内容由第三方 AI 生成..."提示
  // isLargeScreen: 是否大屏模式
  // showHistory: 是否显示历史记录侧边栏
  // showChatHeader: 是否显示聊天头部
  const props: ChatPageProps = {
    appId,
    isStandalone: searchParams?.get('isStandalone') || undefined,
    showRunningStatus: false,
    showCite: true,
    showFullText: true,
    canDownloadSource: true,
    showWholeResponse: true,
    showController: true, // true = 显示, false = 隐藏
    showAiDisclaimer: true, // true = 显示, false = 隐藏
    isLargeScreen: true, // true = 大屏, false = 小屏
    showHistory: true, // true = 显示, false = 隐藏
    showChatHeader: true // true = 显示, false = 隐藏
  };

  return (
    <ChatPageContextProvider appId={props.appId}>
      <ChatContent {...props} />
    </ChatPageContextProvider>
  );
};

export default Render;
