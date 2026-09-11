import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  SemesterCreateRequest,
  SemesterDeleteRequest,
  SemesterDetailRequest,
  SemesterDetailResponse,
  SemesterListItem,
  SemesterPageRequest,
  SemesterPageResponse,
  SemesterUpdateRequest
} from '@/types/api/admin/teaching/semesters';

const baseURL = getProxyUrl('/ai-university');

/**
 * 分页查询学期列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postSemesterPageList = (data: SemesterPageRequest) =>
  POST<SemesterPageResponse>('/client/semester/pageList', data, { baseURL });

/**
 * 查询学期列表（不分页）
 * @param data 查询参数（空对象）
 * @returns 学期列表
 */
export const postSemesterList = (data: Record<string, never> = {}) =>
  POST<SemesterListItem[]>('/client/semester/list', data, { baseURL });

/**
 * 查询学期详情
 * @param data 查询参数
 * @returns 学期详情
 */
export const postSemesterDetail = (data: SemesterDetailRequest) =>
  POST<SemesterDetailResponse>('/client/semester/detail', data, { baseURL });

/**
 * 创建学期
 * @param data 学期信息
 * @returns 创建结果
 */
export const postSemesterCreate = (data: SemesterCreateRequest) =>
  POST<null>('/client/semester/create', data, { baseURL });

/**
 * 更新学期
 * @param data 学期信息
 * @returns 更新结果
 */
export const postSemesterUpdate = (data: SemesterUpdateRequest) =>
  POST<null>('/client/semester/update', data, { baseURL });

/**
 * 删除学期
 * @param data 删除参数
 * @returns 删除结果
 */
export const postSemesterDelete = (data: SemesterDeleteRequest) =>
  POST<null>('/client/semester/delete', data, { baseURL });
