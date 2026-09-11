import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  NewsCreateRequest,
  NewsUpdateRequest,
  NewsPageRequest,
  NewsPageData,
  NewsUpdateStatusRequest,
  NewsUpdateTopRequest,
  NewsDeleteRequest,
  NewsDetailRequest,
  NewsDetailResponse,
  NewsIncrementReadRequest
} from '@/types/api/admin/teaching/news';

const baseURL = getProxyUrl('/huayun-ai');

/**
 * 创建资讯
 * @param data 创建参数
 * @returns 创建结果
 */
export const createNews = (data: NewsCreateRequest) =>
  POST<null>('/client/tenant/news/create', data, { baseURL });

/**
 * 更新资讯
 * @param data 更新参数
 * @returns 更新结果
 */
export const updateNews = (data: NewsUpdateRequest) =>
  POST<null>('/client/tenant/news/update', data, { baseURL });

/**
 * 获取资讯列表（分页）
 * @param data 查询参数
 * @returns 资讯分页列表
 */
export const getNewsPage = (data: NewsPageRequest) => {
  const payload: Record<string, any> = {
    current: String(data.current ?? 1),
    size: String(data.size ?? 10)
  };

  if (data.level !== undefined) payload.level = String(data.level);
  if (data.status !== undefined) payload.status = String(data.status);
  if (data.newsType !== undefined) payload.newsType = String(data.newsType);
  if (data.targetTenantId) payload.targetTenantId = data.targetTenantId;
  if (data.searchKey) payload.searchKey = data.searchKey;
  if (data.createTimeStart) payload.createTimeStart = data.createTimeStart;
  if (data.createTimeEnd) payload.createTimeEnd = data.createTimeEnd;
  if (data.updateTimeStart) payload.updateTimeStart = data.updateTimeStart;
  if (data.updateTimeEnd) payload.updateTimeEnd = data.updateTimeEnd;
  if (data.publishTimeStart) payload.publishTimeStart = data.publishTimeStart;
  if (data.publishTimeEnd) payload.publishTimeEnd = data.publishTimeEnd;

  return POST<NewsPageData>('/client/tenant/news/page', payload, { baseURL });
};

/**
 * 更新资讯状态
 * @param data 更新参数
 * @returns 更新结果
 */
export const updateNewsStatus = (data: NewsUpdateStatusRequest) =>
  POST<null>('/client/tenant/news/updateStatus', data, { baseURL });

/**
 * 更新置顶状态
 * @param data 更新参数
 * @returns 更新结果
 */
export const updateNewsTopStatus = (data: NewsUpdateTopRequest) =>
  POST<null>('/client/tenant/news/updateTopStatus', data, { baseURL });

/**
 * 删除资讯
 * @param data 删除参数
 * @returns 删除结果
 */
export const deleteNews = (data: NewsDeleteRequest) =>
  POST<null>('/client/tenant/news/delete', data, { baseURL });

/**
 * 获取资讯详情
 * @param data 查询参数
 * @returns 资讯详情
 */
export const getNewsDetail = (data: NewsDetailRequest) =>
  POST<NewsDetailResponse>('/client/tenant/news/detail', data, { baseURL });

/**
 * 增加阅读量
 * @param data 增加参数
 * @returns 增加结果
 */
export const incrementNewsReadCount = (data: NewsIncrementReadRequest) =>
  POST<null>('/client/tenant/news/incrementReadCount', data, { baseURL });
