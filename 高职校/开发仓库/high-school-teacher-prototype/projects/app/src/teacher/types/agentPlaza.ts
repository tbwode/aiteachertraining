/**
 * 租户子场景
 */
export interface TenantLabelResp {
  id: number;
  name: string;
}

/**
 * 租户场景响应
 */
export interface TenantSceneResp {
  id: number;
  name: string;
  avatarUrl?: string;
  endpointType?: string;
  labels?: TenantLabelResp[];
}

/**
 * 获取场景导航栏请求
 */
export interface GetTenantSceneNavbarRequest {
  tenantId?: number;
  endpointType?: string;
  roleId?: number;
  roleIds?: number[];
  tenantSceneIds?: number[];
}

/**
 * 智能体关联的场景标签项
 */
export interface TenantAppLabelItem {
  tenantSceneId?: number;
  tenantLabelId?: number;
  tenantSceneName?: string;
  tenantLabelName?: string;
}

/**
 * 租户智能体响应
 */
export interface TenantAppResp {
  id: number;
  name: string;
  avatarUrl?: string;
  intro?: string;
  status?: number;
  source?: number;
  finalAppId?: string;
  createUsername?: string;
  updateUsername?: string;
  sortNum?: number;
  /** 所属场景标签列表 */
  labelList?: TenantAppLabelItem[];
  /** 使用人数 */
  useUserCount?: number;
}

/**
 * 智能体筛选列表请求
 */
export interface GetAgentFilterListRequest {
  tenantId?: number;
  tmbId?: number;
  roleIds?: number[];
  tenantSceneId?: number;
  tenantLabelId?: number;
  searchKey?: string;
  tenantAppIds?: number[];
  type?: number;
}
