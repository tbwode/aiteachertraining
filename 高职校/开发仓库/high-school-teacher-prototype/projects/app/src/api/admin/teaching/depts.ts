import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  DeptItem,
  DeptListRequest,
  CreateDeptParams,
  UpdateDeptParams,
  DeleteDeptParams,
  SortDeptParams
} from '@/types/api/admin/teaching/depts';

const baseURL = getProxyUrl('/huayun-ai');

/**
 * 查询部门列表
 * @param data 查询参数
 * @returns 部门列表
 */
export const postDeptList = (data: DeptListRequest = {}) =>
  POST<DeptItem[]>('/client/dept/list', data, { baseURL });

/**
 * 创建部门
 * @param data 创建参数
 */
export const createDept = (data: CreateDeptParams) =>
  POST('/client/dept/create', data, { baseURL });

/**
 * 更新部门
 * @param data 更新参数
 */
export const updateDept = (data: UpdateDeptParams) =>
  POST('/client/dept/update', data, { baseURL });

/**
 * 删除部门
 * @param params 删除参数
 */
export const deleteDept = (params: DeleteDeptParams) =>
  POST('/client/dept/delete', params, { baseURL });

/**
 * 部门排序
 * @param data 排序参数
 */
export const sortDept = (data: SortDeptParams) => POST('/client/dept/sort', data, { baseURL });
