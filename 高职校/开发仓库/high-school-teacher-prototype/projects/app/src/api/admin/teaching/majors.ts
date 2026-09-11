import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  AddTenantMajorResponse,
  DeleteTenantMajorResponse,
  ListMajorCategoriesResponse,
  ListTenantMajorsResponse,
  TenantMajorDeleteRequest,
  TenantMajorDetailResponse,
  TenantMajorListRequest,
  TenantMajorPageResponse,
  TenantMajorQueryRequest,
  TenantMajorRequest,
  UpdateTenantMajorResponse
} from '@/types/api/admin/teaching/majors';

const baseURL = getProxyUrl('/ai-university');

/**
 * 新增专业
 * @param data 专业信息
 * @returns 新增结果
 */
export const postTenantMajorAdd = (data: TenantMajorRequest) =>
  POST<AddTenantMajorResponse>('/client/tenantMajor/add', data, { baseURL });

/**
 * 修改专业
 * @param data 专业信息
 * @returns 修改结果
 */
export const postTenantMajorUpdate = (data: TenantMajorRequest) =>
  POST<UpdateTenantMajorResponse>('/client/tenantMajor/update', data, { baseURL });

/**
 * 删除专业
 * @param data 删除参数
 * @returns 删除结果
 */
export const postTenantMajorDelete = (data: TenantMajorDeleteRequest) =>
  POST<DeleteTenantMajorResponse>('/client/tenantMajor/delete', data, { baseURL });

/**
 * 分页查询专业列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postTenantMajorPage = (data: TenantMajorQueryRequest) =>
  POST<TenantMajorPageResponse>('/client/tenantMajor/page', data, { baseURL });

/**
 * 查询专业详情
 * @param data 查询参数
 * @returns 专业详情
 */
export const postTenantMajorDetail = (data: TenantMajorDeleteRequest) =>
  POST<TenantMajorDetailResponse>('/client/tenantMajor/detail', data, { baseURL });

/**
 * 查询所有大类（管理后台大类接口不可用时使用）
 * @returns 大类列表
 */
export const postTenantMajorListCategories = () =>
  POST<ListMajorCategoriesResponse>('/client/tenantMajor/listCategories', {}, { baseURL });

/**
 * 专业列表
 * @param data 查询参数
 * @returns 专业下拉列表
 */
export const postTenantMajorList = (data: TenantMajorListRequest) =>
  POST<ListTenantMajorsResponse>('/client/tenantMajor/list', data, { baseURL });
