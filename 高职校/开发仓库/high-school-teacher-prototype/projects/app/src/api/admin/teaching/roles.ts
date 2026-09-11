import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  RoleListRequest,
  RoleVO,
  RolePageRequest,
  RolePageData,
  RoleDeleteRequest,
  RoleUpdateStatusRequest,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleCreateResponse,
  RoleAuthorityCreateRequest,
  MenuTreeNode,
  RoleDetailResponse
} from '@/types/api/admin/teaching/roles';

const baseURL = getProxyUrl('/huayun-ai');

/**
 * 查询角色列表
 * @param data 查询参数
 * @returns 角色列表
 */
export const postRoleList = (data: RoleListRequest = {}) =>
  POST<RoleVO[]>('/client/role/list', data, { baseURL });

/**
 * 分页查询角色列表
 * @param data 查询参数
 * @returns 角色分页列表
 */
export const postRolePageList = (data: RolePageRequest) => {
  const payload = {
    name: data.name ?? '',
    current: String(data.current),
    size: String(data.size)
  };
  return POST<RolePageData>('/client/role/page', payload, { baseURL });
};

/**
 * 删除角色
 * @param data 删除参数
 * @returns 删除结果
 */
export const postRoleDelete = (data: RoleDeleteRequest) =>
  POST<null>('/client/role/delete', data, { baseURL });

/**
 * 更新角色状态
 * @param data 更新参数
 * @returns 更新结果
 */
export const postRoleUpdateStatus = (data: RoleUpdateStatusRequest) =>
  POST<null>('/client/role/updateStatus', data, { baseURL });

/**
 * 创建角色
 * @param data 创建参数
 * @returns 创建结果
 */
export const createRole = (data: RoleCreateRequest) =>
  POST<RoleCreateResponse>('/client/role/create', data, { baseURL });

/**
 * 更新角色
 * @param data 更新参数
 * @returns 更新结果
 */
export const updateRole = (data: RoleUpdateRequest) =>
  POST<RoleCreateResponse>('/client/role/update', data, { baseURL });

/**
 * 获取角色详情
 * @param id 角色ID
 * @returns 角色详情
 */
export const getDetailRole = (id: string) =>
  POST<RoleDetailResponse>('/client/role/detail', { id }, { baseURL });

/**
 * 获取菜单树列表
 * @returns 菜单树列表
 */
export const getMenuTreeList = () =>
  POST<MenuTreeNode[]>('/client/tenant/authority/list', {}, { baseURL });

/**
 * 创建角色权限（功能+数据权限）
 * @param data 权限参数
 * @returns 创建结果
 */
export const createRoleAuthority = (data: RoleAuthorityCreateRequest) =>
  POST<null>('/client/role/authority/create', data, { baseURL });
