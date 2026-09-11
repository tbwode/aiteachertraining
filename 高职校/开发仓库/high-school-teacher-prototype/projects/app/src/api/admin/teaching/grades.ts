import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  GradeCreateRequest,
  GradeDeleteRequest,
  GradeDetailRequest,
  GradeDetailResponse,
  GradeListItem,
  GradePageRequest,
  GradePageResponse,
  GradeUpdateRequest
} from '@/types/api/admin/teaching/grades';

const baseURL = getProxyUrl('/ai-university');

/**
 * 分页查询年级列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postGradePageList = (data: GradePageRequest) =>
  POST<GradePageResponse>('/client/grade/pageList', data, { baseURL });

/**
 * 查询年级详情
 * @param data 查询参数
 * @returns 年级详情
 */
export const postGradeDetail = (data: GradeDetailRequest) =>
  POST<GradeDetailResponse>('/client/grade/detail', data, { baseURL });

/**
 * 创建年级
 * @param data 年级信息
 * @returns 创建结果
 */
export const postGradeCreate = (data: GradeCreateRequest) =>
  POST<null>('/client/grade/create', data, { baseURL });

/**
 * 更新年级
 * @param data 年级信息
 * @returns 更新结果
 */
export const postGradeUpdate = (data: GradeUpdateRequest) =>
  POST<null>('/client/grade/update', data, { baseURL });

/**
 * 删除年级
 * @param data 删除参数
 * @returns 删除结果
 */
export const postGradeDelete = (data: GradeDeleteRequest) =>
  POST<null>('/client/grade/delete', data, { baseURL });

/**
 * 查询年级列表（不分页）
 * @param data 查询参数（空对象）
 * @returns 年级列表
 */
export const postGradeList = (data: Record<string, never> = {}) =>
  POST<GradeListItem[]>('/client/grade/list', data, { baseURL });
