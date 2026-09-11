import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  ClassCreateRequest,
  ClassDeleteRequest,
  ClassDetailRequest,
  ClassDetailResponse,
  ClassListItem,
  ClassListRequest,
  ClassPageRequest,
  ClassPageResponse,
  ClassUpdateRequest
} from '@/types/api/admin/teaching/classes';

const baseURL = getProxyUrl('/ai-university');

/**
 * 分页查询班级列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postClassPageList = (data: ClassPageRequest) =>
  POST<ClassPageResponse>('/client/clazz/pageList', data, { baseURL });

/**
 * 查询班级列表（不分页）
 * @param data 查询参数
 * @returns 班级列表
 */
export const postClassList = (data: ClassListRequest = {}) =>
  POST<ClassListItem[]>('/client/clazz/list', data, { baseURL });

/**
 * 查询班级详情
 * @param data 查询参数
 * @returns 班级详情
 */
export const postClassDetail = (data: ClassDetailRequest) =>
  POST<ClassDetailResponse>('/client/clazz/detail', data, { baseURL });

/**
 * 创建班级
 * @param data 班级信息
 * @returns 创建结果
 */
export const postClassCreate = (data: ClassCreateRequest) =>
  POST<null>('/client/clazz/create', data, { baseURL });

/**
 * 更新班级
 * @param data 班级信息
 * @returns 更新结果
 */
export const postClassUpdate = (data: ClassUpdateRequest) =>
  POST<null>('/client/clazz/update', data, { baseURL });

/**
 * 删除班级
 * @param data 删除参数
 * @returns 删除结果
 */
export const postClassDelete = (data: ClassDeleteRequest) =>
  POST<null>('/client/clazz/delete', data, { baseURL });
