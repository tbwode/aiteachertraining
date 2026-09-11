/**
 * 角色管理 API 类型定义
 */

/**
 * 角色列表请求参数
 */
export interface RoleListRequest {
  /**
   * ID
   */
  id?: number;
  /**
   * 名称
   */
  name?: string;
}

/**
 * 角色数据权限
 */
export interface RoleDataAuthorityResponse {
  /**
   * 班级权限类型 1:全部学段 2:所在学段 3:所在年级 4:所在班级
   */
  classAuthority?: number;
  /**
   * 部门权限类型 1:所有部门 2:所在部门 3:所在部门及子部门 4:自己的数据
   */
  deptAuthority?: number;
  /**
   * 所有数据权限：0-否，1-是
   */
  isAll?: number;
  /**
   * 学科权限类型 1:所有学科 2:所任教学科
   */
  subjectAuthority?: number;
}

/**
 * 角色 VO
 */
export interface RoleVO {
  /**
   * 权限ID集合
   */
  authorityIds?: string;
  /**
   * 权限名称集合
   */
  authorityNames?: string[];
  /**
   * 创建时间
   */
  createTime?: string;
  id?: string;
  /**
   * 角色描述
   */
  info: string;
  /**
   * 所有权限：0-否，1-是
   */
  isAllAuthority?: number;
  isDeleted?: number;
  /**
   * 目录ID集合
   */
  menuIds?: string;
  /**
   * 目录名称集合
   */
  menuNames?: string[];
  /**
   * 角色名称
   */
  name: string;
  /**
   * 角色数据权限
   */
  roleDataAuthority?: RoleDataAuthorityResponse;
  /**
   * 来源 1、系统默认 2、自建
   */
  source: number;
  /**
   * 角色状态：1-启用，0-禁用
   */
  status?: number;
  /**
   * 租户Id
   */
  tenantId: string;
  /**
   * 场景ID
   */
  tenantSceneIds?: string;
  /**
   * 角色类型 1:用户管理员, 2:普通用户
   */
  type: number;
  /**
   * 更新时间
   */
  updateTime?: string;
}

/**
 * 角色列表响应
 */
export interface RoleListResponse {
  /**
   * 状态码
   */
  code: number;
  /**
   * 承载数据
   */
  data?: RoleVO[];
  /**
   * 返回消息
   */
  msg: string;
  /**
   * 是否成功
   */
  success: boolean;
}

/**
 * 角色分页列表请求参数
 */
export interface RolePageRequest {
  /**
   * 角色名称
   */
  name?: string;
  /**
   * 当前页
   */
  current?: number;
  /**
   * 每页数量
   */
  size?: number;
}

/**
 * 角色分页数据
 */
export interface RolePageData {
  current: number;
  orders: string[];
  pages: number;
  records: RoleVO[];
  searchCount: boolean;
  size: number;
  total: number;
}

/**
 * 角色删除请求参数
 */
export interface RoleDeleteRequest {
  /**
   * 角色ID
   */
  id: string;
}

/**
 * 创建角色请求参数
 */
export interface RoleCreateRequest {
  /**
   * 角色名称
   */
  name: string;
  /**
   * 角色说明
   */
  info: string;
}

/**
 * 更新角色请求参数
 */
export interface RoleUpdateRequest extends RoleCreateRequest {
  /**
   * 角色ID
   */
  id: string;
}

/**
 * 创建角色响应
 */
export interface RoleCreateResponse {
  id: string;
  name: string;
  info: string;
}

/**
 * 角色权限创建请求参数
 */
export interface RoleAuthorityCreateRequest {
  /**
   * 角色ID
   */
  roleId: string;
  /**
   * 权限ID集合（逗号分隔）
   */
  authorityIds: string;
  /**
   * 是否所有数据权限 0-否 1-是
   */
  isAll: number;
  /**
   * 班级权限 1:全部学段 2:所在学段 3:所在年级 4:所在班级
   */
  classAuthority: number;
  /**
   * 学科权限 1:所有学科 2:所任教学科
   */
  subjectAuthority: number;
  /**
   * 部门权限 1:所有部门 2:所在部门 3:所在部门及子部门 4:自己的数据
   */
  deptAuthority: number;
  /**
   * 是否拥有全部功能权限 0-否 1-是
   */
  isAllAuthority: number;
}

/**
 * 菜单树节点
 */
export interface MenuTreeNode {
  id: string;
  name: string;
  children?: MenuTreeNode[];
}

/**
 * 角色详情响应
 */
export interface RoleDetailResponse extends RoleVO {
  /**
   * 菜单ID集合（逗号分隔）
   */
  menuIds?: string;
  /**
   * 角色数据权限
   */
  roleDataAuthority?: {
    isAll: number;
    classAuthority: number;
    subjectAuthority: number;
    deptAuthority: number;
    allFunctionPerms?: number;
  };
}

/**
 * 角色状态更新请求参数
 */
export interface RoleUpdateStatusRequest {
  /**
   * 角色ID
   */
  id: string;
}
