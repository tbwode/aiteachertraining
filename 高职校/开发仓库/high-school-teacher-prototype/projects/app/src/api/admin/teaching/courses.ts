import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  AddTenantCourseResponse,
  CheckTenantCourseCodeResponse,
  DeleteTenantCourseResponse,
  GenerateTenantCourseCodeResponse,
  ListTenantCoursesResponse,
  TenantCourseCheckCodeRequest,
  TenantCourseDetailResponse,
  TenantCourseIdRequest,
  TenantCoursePageResponse,
  TenantCourseQueryRequest,
  TenantCourseRequest,
  TenantCourseToggleStatusRequest,
  ToggleTenantCourseStatusResponse,
  UpdateTenantCourseResponse
} from '@/types/api/admin/teaching/courses';

const baseURL = getProxyUrl('/ai-university');

/**
 * 新增课程
 * @param data 课程信息
 * @returns 新增结果
 */
export const postTenantCourseAdd = (data: TenantCourseRequest) =>
  POST<AddTenantCourseResponse>('/client/course/add', data, { baseURL });

/**
 * 修改课程
 * @param data 课程信息
 * @returns 修改结果
 */
export const postTenantCourseUpdate = (data: TenantCourseRequest) =>
  POST<UpdateTenantCourseResponse>('/client/course/update', data, { baseURL });

/**
 * 删除课程
 * @param data 删除参数
 * @returns 删除结果
 */
export const postTenantCourseDelete = (data: TenantCourseIdRequest) =>
  POST<DeleteTenantCourseResponse>('/client/course/delete', data, { baseURL });

/**
 * 分页查询课程列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postTenantCoursePage = (data: TenantCourseQueryRequest) =>
  POST<TenantCoursePageResponse>('/client/course/page', data, { baseURL });

/**
 * 查询课程详情
 * @param data 查询参数
 * @returns 课程详情
 */
export const postTenantCourseDetail = (data: TenantCourseIdRequest) =>
  POST<TenantCourseDetailResponse>('/client/course/detail', data, { baseURL });

/**
 * 切换课程状态
 * @param data 状态参数
 * @returns 切换结果
 */
export const postTenantCourseToggleStatus = (data: TenantCourseToggleStatusRequest) =>
  POST<ToggleTenantCourseStatusResponse>('/client/course/toggleStatus', data, { baseURL });

/**
 * 生成课程编码
 * @returns 课程编码
 */
export const postTenantCourseGenerateCode = () =>
  POST<GenerateTenantCourseCodeResponse>('/client/course/generateCode', {}, { baseURL });

/**
 * 校验课程编码
 * @param data 校验参数
 * @returns 是否可用
 */
export const postTenantCourseCheckCode = (data: TenantCourseCheckCodeRequest) =>
  POST<CheckTenantCourseCodeResponse>('/client/course/checkCode', data, { baseURL });

/**
 * 课程列表
 * @returns 课程下拉列表
 */
export const postTenantCourseList = () =>
  POST<ListTenantCoursesResponse>('/client/course/list', {}, { baseURL });
