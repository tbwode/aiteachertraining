import { POST } from '@/web/common/api/requestStudent';
import type {
  AgentChatPageRequest,
  AgentChatPageResponse,
  DetailRequest,
  AgentChatDetailResponse,
  AgentChatCreateRequest,
  AgentChatCreateResponse,
  AgentChatUpdateRequest,
  AgentChatUpdateResponse,
  AgentChatDeleteResponse,
  AgentChatItemCreateRequest,
  AgentChatItemCreateResponse,
  AgentChatItemDeleteResponse
} from '../types/agentChat';
import type { GetHistoriesResponseType } from '@fastgpt/global/openapi/core/chat/history/api';
import type { PaginationType } from '@fastgpt/global/openapi/api';

/**
 * 适配函数：将 AgentChatPageResponse 转换为 GetHistoriesResponseType
 * @param response AgentChatPageResponse
 * @returns GetHistoriesResponseType
 */
export const adaptAgentChatPageToHistories = (
  response: AgentChatPageResponse
): GetHistoriesResponseType => {
  return {
    list: (response.records || []).map((item) => ({
      id: item.id || '',
      chatId: item.chatId || '',
      updateTime: item.updateTime ? new Date(item.updateTime) : new Date(),
      appId: item.fastgptAppId || '',
      customTitle: item.title || undefined,
      title: item.title || '',
      top: false // Java后台暂无置顶字段，默认false
    })),
    total: response.total || 0
  };
};

/**
 * 会话分页列表（带适配器，适配 useScrollPagination 的参数格式）
 * @param data PaginationType (包含 offset, pageSize)
 * @returns 会话分页数据（适配为 GetHistoriesResponseType）
 */
export const getAgentChatPageAdapted = (data: PaginationType) => {
  // 将 offset/pageSize 转换为 Java 接口的 current/size
  const offset = typeof data.offset === 'string' ? parseInt(data.offset) : data.offset || 0;
  const pageSize =
    typeof data.pageSize === 'string' ? parseInt(data.pageSize) : data.pageSize || 10;
  const current = Math.floor(offset / pageSize) + 1;

  const request: AgentChatPageRequest = {
    current,
    size: pageSize
  };

  return getAgentChatPage(request).then(adaptAgentChatPageToHistories);
};

/**
 * 会话分页列表
 * @param data 请求参数
 * @returns 会话分页数据
 */
export const getAgentChatPage = (data: AgentChatPageRequest) =>
  POST<AgentChatPageResponse>('/client/agentChat/page', data);

/**
 * 会话详情
 * @param data 请求参数
 * @returns 会话详情
 */
export const getAgentChatDetail = (data: DetailRequest) =>
  POST<AgentChatDetailResponse>('/client/agentChat/detail', data);

/**
 * 创建会话
 * @param data 请求参数
 * @returns 创建的会话
 */
export const createAgentChat = (data: AgentChatCreateRequest) =>
  POST<AgentChatCreateResponse>('/client/agentChat/create', data);

/**
 * 更新会话
 * @param data 请求参数
 * @returns 是否成功
 */
export const updateAgentChat = (data: AgentChatUpdateRequest) =>
  POST<AgentChatUpdateResponse>('/client/agentChat/update', data);

/**
 * 删除会话
 * @param data 请求参数
 * @returns 是否成功
 */
export const deleteAgentChat = (data: DetailRequest) =>
  POST<AgentChatDeleteResponse>('/client/agentChat/delete', data);

/**
 * 新建消息
 * @param data 请求参数
 * @returns 创建的消息
 */
export const createAgentChatItem = (data: AgentChatItemCreateRequest) =>
  POST<AgentChatItemCreateResponse>('/client/agentChat/item/create', data);

/**
 * 删除消息
 * @param data 请求参数
 * @returns 是否成功
 */
export const deleteAgentChatItem = (data: DetailRequest) =>
  POST<AgentChatItemDeleteResponse>('/client/agentChat/item/delete', data);

// 适配原接口参数格式
export type DelChatHistoryParams = {
  appId?: string;
  chatId: string;
  shareId?: string;
  outLinkUid?: string;
};

/**
 * 适配原 delChatHistoryById 接口
 * 通过 chatId 找到对应的 dbId 进行删除
 * @param params 原接口参数
 * @returns 是否成功
 */
export const delChatHistoryByIdAdapter = async (
  params: DelChatHistoryParams & { dbId?: number }
) => {
  if (!params.dbId) {
    throw new Error('dbId is required');
  }
  return deleteAgentChat({ id: params.dbId });
};
