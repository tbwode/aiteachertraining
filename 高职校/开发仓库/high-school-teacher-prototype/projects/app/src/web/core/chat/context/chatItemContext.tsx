import { type ChatBoxInputFormType } from '@/components/core/chat/ChatContainer/ChatBox/type';
import { PluginRunBoxTabEnum } from '@/components/core/chat/ChatContainer/PluginRunBox/constants';
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createContext } from 'use-context-selector';
import { type ComponentRef as ChatComponentRef } from '@/components/core/chat/ChatContainer/ChatBox/type';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { defaultChatData } from '@/global/core/chat/constants';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { type AppChatConfigType, type VariableItemType } from '@fastgpt/global/core/app/type';
import { type FlowNodeInputItemType } from '@fastgpt/global/core/workflow/type/io';
import { type SearchDataResponseItemType } from '@fastgpt/global/core/dataset/type';
import { type OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';

type ContextProps = {
  showRouteToDatasetDetail: boolean;
  canDownloadSource: boolean;
  isShowCite: boolean;
  isShowFullText: boolean;
  showRunningStatus: boolean;
  showWholeResponse: boolean;
  showController: boolean;
  showAiDisclaimer: boolean;
  isLargeScreen: boolean;
  showHistory: boolean;
  showChatHeader: boolean;
  showResponseTags?: boolean;
  aiBubbleMode?: boolean;
  chatBgTransparent?: boolean;
  welcomeText?: string;
  inputMinHeight?: number | string;
  aiAvatarId?: number;
  simpleInputMode?: boolean;
};
type ChatBoxDataType = {
  chatId?: string;
  appId: string;
  title?: string;
  userAvatar?: string;

  app: {
    chatConfig?: AppChatConfigType;
    name: string;
    avatar: string;
    type: `${AppTypeEnum}`;
    pluginInputs: FlowNodeInputItemType[];
    chatModels?: string[];
  };
};

// 知识库引用相关 type
export type GetQuoteDataBasicProps = {
  appId: string;
  chatId: string;
  chatItemDataId: string;
  outLinkAuthData?: OutLinkChatAuthProps;
};
export type GetCollectionQuoteDataProps = GetQuoteDataBasicProps & {
  quoteId?: string;
  collectionId: string;
  sourceId: string;
  sourceName: string;
  datasetId: string;
};
export type GetAllQuoteDataProps = GetQuoteDataBasicProps & {
  collectionIdList: string[];
  sourceId?: string;
  sourceName?: string;
};
export type GetQuoteProps = GetAllQuoteDataProps | GetCollectionQuoteDataProps;
export type QuoteDataType = {
  rawSearch: SearchDataResponseItemType[];
  metadata: GetQuoteProps;
};
export type OnOpenCiteModalProps = {
  collectionId?: string;
  sourceId?: string;
  sourceName?: string;
  datasetId?: string;
  quoteId?: string;
};

type ChatItemContextType = {
  ChatBoxRef: React.RefObject<ChatComponentRef> | null;
  variablesForm: UseFormReturn<ChatBoxInputFormType, any>;
  pluginRunTab: PluginRunBoxTabEnum;
  setPluginRunTab: React.Dispatch<React.SetStateAction<PluginRunBoxTabEnum>>;
  resetVariables: (props?: {
    variables: Record<string, any> | undefined;
    variableList?: VariableItemType[];
  }) => void;
  clearChatRecords: () => void;
  chatBoxData: ChatBoxDataType;
  setChatBoxData: React.Dispatch<React.SetStateAction<ChatBoxDataType>>;
  isPlugin: boolean;
  variables?: Record<string, any>; // 传入的初始 variables

  datasetCiteData?: QuoteDataType;
  setCiteModalData: React.Dispatch<React.SetStateAction<QuoteDataType | undefined>>;
  isVariableVisible: boolean;
  setIsVariableVisible: React.Dispatch<React.SetStateAction<boolean>>;
  inputMinHeight?: number | string;
  aiAvatarId?: number;
} & ContextProps;

export const ChatItemContext = createContext<ChatItemContextType>({
  ChatBoxRef: null,
  // @ts-ignore
  variablesForm: undefined,
  pluginRunTab: PluginRunBoxTabEnum.input,
  setPluginRunTab: function (value: React.SetStateAction<PluginRunBoxTabEnum>): void {
    throw new Error('Function not implemented.');
  },
  resetVariables: function (props?: {
    variables: Record<string, any> | undefined;
    variableList?: VariableItemType[];
  }): void {
    throw new Error('Function not implemented.');
  },
  clearChatRecords: function (): void {
    throw new Error('Function not implemented.');
  },
  variables: undefined,

  datasetCiteData: undefined,
  setCiteModalData: function (value: React.SetStateAction<QuoteDataType | undefined>): void {
    throw new Error('Function not implemented.');
  },
  isVariableVisible: true,
  setIsVariableVisible: function (value: React.SetStateAction<boolean>): void {
    throw new Error('Function not implemented.');
  }
});

/* 
    Chat 对象的上下文
*/
const ChatItemContextProvider = ({
  children,
  showRouteToDatasetDetail,
  canDownloadSource,
  isShowCite,
  isShowFullText,
  showRunningStatus,
  showWholeResponse,
  showController,
  showAiDisclaimer,
  isLargeScreen,
  showHistory,
  showChatHeader,
  showResponseTags = true,
  aiBubbleMode = false,
  chatBgTransparent = false,
  variables,
  welcomeText,
  inputMinHeight,
  aiAvatarId,
  simpleInputMode
}: {
  children: ReactNode;
  variables?: Record<string, any>;
  welcomeText?: string;
  inputMinHeight?: number | string;
  aiAvatarId?: number;
  simpleInputMode?: boolean;
} & ContextProps) => {
  const ChatBoxRef = useRef<ChatComponentRef>(null);
  const variablesForm = useForm<ChatBoxInputFormType>();
  const [isVariableVisible, setIsVariableVisible] = useState(true);
  const { chatLogos } = useSystemStore();

  const [chatBoxData, setChatBoxData] = useState<ChatBoxDataType>({
    ...defaultChatData,
    app: {
      ...defaultChatData.app,
      avatar: chatLogos.squareLogoUrl || defaultChatData.app.avatar
    }
  });

  // 当 logo 变化时更新 chatBoxData 中的 avatar
  useEffect(() => {
    if (chatLogos.squareLogoUrl && chatBoxData.app.avatar === '/icon/logo.svg') {
      setChatBoxData((prev) => ({
        ...prev,
        app: {
          ...prev.app,
          avatar: chatLogos.squareLogoUrl || defaultChatData.app.avatar
        }
      }));
    }
  }, [chatLogos.squareLogoUrl, chatBoxData.app.avatar]);

  const isPlugin = chatBoxData.app.type === AppTypeEnum.workflowTool;

  // plugin
  const [pluginRunTab, setPluginRunTab] = useState<PluginRunBoxTabEnum>(PluginRunBoxTabEnum.input);

  const resetVariables = useCallback(
    (props?: { variables?: Record<string, any>; variableList?: VariableItemType[] }) => {
      const { variables = {}, variableList = [] } = props || {};

      const values = variablesForm.getValues();

      if (variableList.length) {
        const varValues: Record<string, any> = {};
        variableList.forEach((item) => {
          varValues[item.key] = variables[item.key] ?? variables[item.label] ?? item.defaultValue;
        });

        variablesForm.reset({
          ...values,
          variables: varValues
        });
      } else {
        variablesForm.reset({
          ...values,
          variables
        });
      }
    },
    [variablesForm]
  );

  const clearChatRecords = useCallback(() => {
    const variables = chatBoxData?.app?.chatConfig?.variables || [];
    const values = variablesForm.getValues();

    variables.forEach((item) => {
      if (item.defaultValue !== undefined) {
        values.variables[item.key] = item.defaultValue;
      } else {
        values.variables[item.key] = '';
      }
    });
    variablesForm.reset(values);

    ChatBoxRef.current?.restartChat?.();
  }, [chatBoxData?.app?.chatConfig?.variables, variablesForm]);

  // 初始化传入的 variables
  useEffect(() => {
    if (variables && Object.keys(variables).length > 0) {
      resetVariables({ variables });
    }
  }, []);

  const [datasetCiteData, setCiteModalData] = useState<QuoteDataType>();

  const contextValue = useMemo(() => {
    return {
      chatBoxData,
      setChatBoxData,
      isPlugin,
      ChatBoxRef,
      variablesForm,
      pluginRunTab,
      setPluginRunTab,
      resetVariables,
      clearChatRecords,
      variables,
      showRouteToDatasetDetail,
      canDownloadSource,
      isShowCite,
      isShowFullText,
      showRunningStatus,
      showWholeResponse,
      showController,
      showAiDisclaimer,
      isLargeScreen,
      showHistory,
      showChatHeader,
      showResponseTags,
      aiBubbleMode,
      chatBgTransparent,
      welcomeText,
      inputMinHeight,
      aiAvatarId,
      simpleInputMode,

      datasetCiteData,
      setCiteModalData,
      isVariableVisible,
      setIsVariableVisible
    };
  }, [
    chatBoxData,
    isPlugin,
    variablesForm,
    pluginRunTab,
    resetVariables,
    clearChatRecords,
    variables,
    showRouteToDatasetDetail,
    canDownloadSource,
    isShowCite,
    showRunningStatus,
    isShowFullText,
    showWholeResponse,
    showController,
    showAiDisclaimer,
    isLargeScreen,
    showHistory,
    showChatHeader,
    showResponseTags,
    aiBubbleMode,
    chatBgTransparent,
    welcomeText,
    inputMinHeight,
    aiAvatarId,
    simpleInputMode,
    datasetCiteData,
    setCiteModalData,
    isVariableVisible,
    setIsVariableVisible
  ]);

  return <ChatItemContext.Provider value={contextValue}>{children}</ChatItemContext.Provider>;
};

export default ChatItemContextProvider;
