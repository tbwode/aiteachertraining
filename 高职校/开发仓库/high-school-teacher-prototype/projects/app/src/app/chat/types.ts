import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import type { ChatHistoryItemResType, ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import type { SseResponseEventEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import type { ChatFileTypeEnum } from '@fastgpt/global/core/chat/constants';

export type MessageFileType = {
  name?: string;
  fileKey?: string;
  fileUrl: string;
  fileContent?: string;
};

export type RawInputType = {
  inputVal?: string;
  images?: ImageType[];
  files?: FileType[];
  prompt?: MessagePromptType;
  chatApp?: ChatAppType;
};

export type ImageType = {
  icon: string;
  src?: string;
  rawFile?: File;
  key: string;
  uploadStatus: UploadStatusEnum;
  sort: number;
} & MessageFileType;

export type FileType = {
  svgIcon?: string;
  imgIcon?: string;
  type: string;
  sizeText: string;
  rawFile: File;
  key: string;
  uploadStatus: UploadStatusEnum;
  percent: number;
  sort: number;
} & MessageFileType;

export enum UploadStatusEnum {
  waiting = 'waiting',
  uploading = 'uploading',
  success = 'success',
  error = 'error'
}

export type MessagePromptType = {
  id?: string;
  promptTitle?: string;
  description?: string;
  inputContent?: string;
  proContent?: string;
  hiddenContent?: string;
  externalType?: string;
  workflowStepId?: string;
  type?: number;
};

export type ChatAppType = {
  id: string;
  name: string;
  avatarUrl?: string;
  prompt?: MessagePromptType;
  workflowStepId?: string;
};

export type SendMessageType = {
  ocrFileKey?: string;
  chatApp?: ChatAppType;
  inputVal: string;
  files?: MessageFileType[];
  images?: MessageFileType[];
  prompt?: MessagePromptType;
  rawInput?: RawInputType;
  fileKeys?: string[];
  appContextDetail?: any;
  hideInUI?: boolean;
};

export type MessageInputRef = {
  focus: () => void;
  addFile: (rawFiles: File[]) => void;
  setRawInput: (e: RawInputType) => void;
  addPrompt: (val: string) => void;
};

export type generatingMessageProps = {
  event: SseResponseEventEnum;
  text?: string;
  reasoningText?: string;
  name?: string;
  status?: 'running' | 'finish';
  tool?: any;
  variables?: Record<string, any>;
  nodeResponse?: ChatHistoryItemResType;
  isAnswerDone?: boolean;
  interactive?: any;
};

export type StartChatFnProps = {
  chatAppId?: string;
  ocrFileKey?: string;
  value: string;
  content: string;
  fileKeys: string[];
  messages: ChatCompletionMessageParam[];
  responseChatItemId: string;
  controller: AbortController;
  variables: Record<string, any>;
  inputVal: string;
  rawInput?: string | RawInputType;
  rawParseResult?: any | null;
  single?: number;
  quotedRef?: { fileContent: string; fileName: string }[] | undefined;
  searchSelectedRef?: any[];
  generatingMessage: (e: generatingMessageProps) => void;
  getHistory?: () => ChatSiteItemType[];
  history?: ChatSiteItemType[];
};

export type ChatBoxRef = {
  getChatHistories: () => ChatSiteItemType[];
  resetVariables: (data?: Record<string, any>) => void;
  resetHistory: (history: ChatSiteItemType[]) => void;
  pinToBottomOnInit?: () => void;
  scrollToBottom: (behavior?: 'smooth' | 'auto') => void;
  resetInputVal: (rawInput: string | RawInputType) => void;
  handleAutoSend: (initInputs: RawInputType | string) => void;
};

export type ChatHistoryItemType = {
  id?: string;
  chatId: string;
  title: string;
  updateTime: Date;
  appId: string;
  top: boolean;
  tenantAppId: string;
};

export type getHistoriesProps = {
  appId?: string;
  size?: number;
  current?: number;
};

export type DelHistoryProps = {
  chatId: string;
  id?: string;
};

export type UpdateHistoryProps = {
  chatId: string;
  title?: string;
  tenantAppId?: string;
};

export enum FeedbackTypeEnum {
  Upvote = '1',
  Downvote = '2',
  None = '0'
}

export type UpdateChatItemProps = {
  dataId: string;
  value?: string;
  content?: string;
  responseData?: string;
  variables?: string;
  feedbackType?: FeedbackTypeEnum;
  customFeedback?: string;
};

export type InitChatProps = {
  tenantAppId: string;
  chatId?: string;
};

export type DeleteChatItemProps = {
  appId: string;
  chatId: string;
  contentId?: string;
  tenantAppId?: string;
  delFile?: boolean;
};

export type InitChatResponse = {
  chatId?: string;
  appId: string;
  userAvatar?: string;
  title?: string;
  variables?: Record<string, any>;
  app: {
    name: string;
    avatar: string;
    intro: string;
    type: string;
    pluginInputs: any[];
    chatConfig?: any;
    chatModels?: string[];
    canUse?: boolean;
    fastgptAppId?: string;
  };
  history?: any[];
};

export type ParseResultProps = any;

export type PagingData<T> = {
  current?: number;
  size?: number;
  records: T[];
  list?: T[];
  pages: number;
  total?: number;
};
