import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { ChatSettingTabOptionEnum } from '@/pageComponents/chat/constants';
import {
  ChatSidebarPaneEnum,
  defaultCollapseStatus,
  type CollapseStatusType
} from '@/pageComponents/chat/constants';
import { getChatSetting } from '@/web/core/chat/api';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import type { ChatSettingType } from '@fastgpt/global/core/chat/setting/type';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createContext } from 'use-context-selector';
import { useMemoEnhance } from '@fastgpt/web/hooks/useMemoEnhance';
import { getRecentlyUsedApps } from '@/web/core/chat/api';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useMount } from 'ahooks';
import type { GetRecentlyUsedAppsResponseType } from '@fastgpt/global/openapi/core/chat/api';
import type { UserType } from '@fastgpt/global/support/user/type';

export type ChatPageContextValue = {
  // Pane & collapse
  pane: ChatSidebarPaneEnum;
  handlePaneChange: (
    pane: ChatSidebarPaneEnum,
    _id?: string,
    _tab?: ChatSettingTabOptionEnum
  ) => void;
  collapse: CollapseStatusType;
  onTriggerCollapse: () => void;
  // Chat settings
  chatSettings: ChatSettingType | undefined;
  refreshChatSetting: () => Promise<ChatSettingType | undefined>;
  logos: { wideLogoUrl?: string; squareLogoUrl?: string };

  // User & apps
  isInitedUser: boolean;
  userInfo: UserType | null;
  myApps: GetRecentlyUsedAppsResponseType;
  refreshRecentlyUsed: () => void;
};

export const ChatPageContext = createContext<ChatPageContextValue>({
  pane: ChatSidebarPaneEnum.HOME,
  handlePaneChange: () => {},
  collapse: defaultCollapseStatus,
  onTriggerCollapse: () => {},
  chatSettings: undefined,
  logos: { wideLogoUrl: '', squareLogoUrl: '' },
  refreshChatSetting: function (): Promise<ChatSettingType | undefined> {
    throw new Error('Function not implemented.');
  },
  isInitedUser: false,
  userInfo: null,
  myApps: [],
  refreshRecentlyUsed: () => {}
});

export const ChatPageContextProvider = ({
  appId: routeAppId,
  children
}: {
  appId: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { feConfigs } = useSystemStore();
  const { setSource, setAppId, setLastPane, setLastChatAppId, lastPane } = useChatStore();
  const { userInfo, initUserInfo } = useUserStore();

  const pane =
    (searchParams?.get('pane') as ChatSidebarPaneEnum) || lastPane || ChatSidebarPaneEnum.HOME;

  const [collapse, setCollapse] = useState<CollapseStatusType>(defaultCollapseStatus);
  const [isInitedUser, setIsInitedUser] = useState(false);

  // Get recently used apps
  const { data: myApps = [], refresh: refreshRecentlyUsed } = useRequest2(
    () => getRecentlyUsedApps(),
    {
      manual: false,
      errorToast: '',
      refreshDeps: [userInfo],
      pollingInterval: 30000,
      throttleWait: 500 // 500ms throttle
    }
  );

  // Initialize user info
  useMount(async () => {
    if (routeAppId) setAppId(routeAppId);
    try {
      await initUserInfo();
    } catch (error) {
      console.log('User not logged in:', error);
    } finally {
      setSource('online');
      setIsInitedUser(true);
    }
  });

  // Sync appId to store as route/appId changes
  useEffect(() => {
    if (routeAppId) {
      setAppId(routeAppId);
    }
  }, [routeAppId, setAppId, userInfo]);

  const { data: chatSettings, runAsync: refreshChatSetting } = useRequest2(
    async () => {
      if (!feConfigs.isPlus) return;
      return await getChatSetting();
    },
    {
      manual: false,
      refreshDeps: [feConfigs.isPlus],
      onSuccess: (data) => {
        if (!data) return;

        if (!data.enableHome && pane === ChatSidebarPaneEnum.HOME) {
          handlePaneChange(ChatSidebarPaneEnum.TEAM_APPS);
          return;
        }

        // 不再自动重定向到默认 appId，允许通过 URL 参数访问任意 app
        // if (
        //   pane === ChatSidebarPaneEnum.HOME &&
        //   routeAppId !== data.appId &&
        //   data.quickAppList.every((q) => q._id !== routeAppId)
        // ) {
        //   handlePaneChange(ChatSidebarPaneEnum.HOME, data.appId);
        // }
      }
    }
  );

  const handlePaneChange = useCallback(
    async (newPane: ChatSidebarPaneEnum, id?: string, tab?: ChatSettingTabOptionEnum) => {
      if (newPane === pane && !id && !tab) return;

      const _id = (() => {
        if (id) return id;

        const hiddenAppId = chatSettings?.appId;
        if (newPane === ChatSidebarPaneEnum.HOME && hiddenAppId) {
          return hiddenAppId;
        }

        return '';
      })();

      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('appId', _id);
      params.set('pane', newPane);
      if (tab) {
        params.set('tab', tab);
      } else {
        params.delete('tab');
      }

      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);

      setLastPane(newPane);
      setLastChatAppId(_id);
    },
    [pane, pathname, searchParams, setLastPane, setLastChatAppId, chatSettings?.appId]
  );

  useEffect(() => {
    if (!Object.values(ChatSidebarPaneEnum).includes(pane)) {
      handlePaneChange(ChatSidebarPaneEnum.HOME);
    }
  }, [pane, handlePaneChange]);

  const logos: Pick<ChatSettingType, 'wideLogoUrl' | 'squareLogoUrl'> = useMemo(
    () => ({
      wideLogoUrl: chatSettings?.wideLogoUrl,
      squareLogoUrl: chatSettings?.squareLogoUrl
    }),
    [chatSettings?.squareLogoUrl, chatSettings?.wideLogoUrl]
  );

  // 同步 logo 到全局 store
  const { setChatLogos } = useSystemStore();
  useEffect(() => {
    if (chatSettings?.wideLogoUrl !== undefined || chatSettings?.squareLogoUrl !== undefined) {
      setChatLogos({
        wideLogoUrl: chatSettings?.wideLogoUrl,
        squareLogoUrl: chatSettings?.squareLogoUrl
      });
    }
  }, [chatSettings?.wideLogoUrl, chatSettings?.squareLogoUrl, setChatLogos]);

  const onTriggerCollapse = useCallback(() => {
    setCollapse(collapse === 0 ? 1 : 0);
  }, [collapse]);

  const value: ChatPageContextValue = useMemoEnhance(
    () => ({
      pane,
      handlePaneChange,
      collapse,
      onTriggerCollapse,
      chatSettings,
      refreshChatSetting,
      logos,
      isInitedUser,
      userInfo,
      myApps,
      refreshRecentlyUsed
    }),
    [
      pane,
      handlePaneChange,
      collapse,
      onTriggerCollapse,
      chatSettings,
      refreshChatSetting,
      logos,
      isInitedUser,
      userInfo,
      myApps,
      refreshRecentlyUsed
    ]
  );

  return <ChatPageContext.Provider value={value}>{children}</ChatPageContext.Provider>;
};
