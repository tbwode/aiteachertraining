import { GET, POST, DELETE } from '@/web/common/api/requestTeacher';
import type { PagingData } from '@/types';
import type {
  ChatHistoryItemType,
  InitChatResponse
} from './types';
import type {
  getHistoriesProps,
  DelHistoryProps,
  UpdateHistoryProps,
  UpdateChatItemProps,
  InitChatProps,
  DeleteChatItemProps
} from './types';

/**
 * 获取初始化聊天内容
 */
export const getInitChatInfo = (data: InitChatProps) =>
  POST<InitChatResponse>(`/client/chat/new/init`, data);

/**
 * 获取历史记录列表
 */
export const getChatHistories = (data: getHistoriesProps) =>
  POST<PagingData<ChatHistoryItemType>>('/client/chat/page', data);

/**
 * 删除单条历史记录
 */
export const delChatHistoryById = (data: DelHistoryProps) =>
  POST(`/client/chat/delete`, data);

/**
 * 清空某应用的所有历史
 */
export const clearChatHistoryByAppId = (data: { appId: string }) =>
  DELETE(`/core/chat/clearHistories`, data);

/**
 * 删除单条聊天记录
 */
export const delChatRecordById = (data: DeleteChatItemProps) =>
  POST<number>(`/client/chat/item/delete`, data);

/**
 * 修改历史记录: 标题/置顶
 */
export const chatUpdate = (data: UpdateHistoryProps) =>
  POST('/client/chat/update', data);

/**
 * 更新聊天项内容
 */
export const updateChatItem = (data: UpdateChatItemProps) =>
  POST('/client/chat/item/update', data);

/**
 * 清空聊天
 */
export const cleanChat = (data: { chatId: string; appId: string }) =>
  POST('/client/chat/clean', data);

/**
 * 语音转文字
 */
export const audioTranscriptions = (data: FormData) =>
  POST<string>('/client/chat/huawei/cloud/audio/transcriptions', data, {
    timeout: 60000
  });
