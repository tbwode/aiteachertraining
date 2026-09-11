/**
 * 部门管理 API 类型定义
 */

/**
 * 部门列表请求参数
 */
export interface DeptListRequest {
  /**
   * 是否是子组织成员
   */
  isSubOrgMember?: boolean;
  /**
   * 部门名称
   */
  name?: string;
  /**
   * 租户ID
   */
  tenantId?: number;
  /**
   * tmbId
   */
  tmbId?: number;
}

/**
 * 部门项
 */
export interface DeptItem {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  name: string;
  parentId: string;
  tenantId: string;
  sort: number;
  type: number | null;
  tmbId: number | null;
  deptKey: string;
  parentKey: string;
  /**
   * 上级部门名称
   */
  parentName?: string;
  /**
   * 部门用户数量
   */
  deptUserNum?: number;
  /**
   * 权限
   */
  privilege?: number;
  /**
   * 是否有子部门
   */
  hasChildren?: boolean;
  /**
   * 子部门列表
   */
  children?: DeptItem[];
}

/**
 * 部门列表响应
 */
export interface DeptListResponse {
  code: number;
  data: DeptItem[];
  msg: string;
  success: boolean;
}

/**
 * 创建部门请求参数
 */
export interface CreateDeptParams {
  name: string;
  parentId: string;
  id?: string;
  tenantId?: string;
}

/**
 * 更新部门请求参数
 */
export interface UpdateDeptParams {
  name: string;
  parentId: string;
  id?: string;
  tenantId?: string;
}

/**
 * 删除部门请求参数
 */
export interface DeleteDeptParams {
  id: string;
  tenantId?: string;
}

/**
 * 部门排序请求参数
 */
export interface SortDeptParams {
  param: DeptItem[];
  tenantId?: string;
}
