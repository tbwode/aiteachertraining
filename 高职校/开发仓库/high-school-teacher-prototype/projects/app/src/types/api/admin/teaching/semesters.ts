/**
 * 教学管理-学期管理 API 类型定义
 */

/**
 * 学期列表项
 */
export interface SemesterItem {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  name: string;
  year: string;
  type: number;
  startDate: string;
  endDate: string;
  isCurrent: number;
}

/**
 * 学期分页列表请求参数
 */
export interface SemesterPageRequest {
  current?: number;
  size?: number;
}

/**
 * 学期分页列表响应
 */
export interface SemesterPageResponse {
  records: SemesterItem[];
  total: number;
  size: number;
  current: number;
  orders: string[];
  searchCount: boolean;
  pages: number;
}

/**
 * 学期列表项（不分页）
 */
export interface SemesterListItem {
  id: string;
  createTime: string;
  endDate: string;
  isCurrent: number;
  isDeleted: number;
  name: string;
  startDate: string;
  tenantId: number;
  type: number;
  updateTime: string;
  year: string;
}

/**
 * 学期详情请求参数
 */
export interface SemesterDetailRequest {
  id: number;
}

/**
 * 学期详情响应
 */
export interface SemesterDetailResponse {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  name: string;
  year: string;
  type: number;
  startDate: string;
  endDate: string;
  isCurrent: number;
}

/**
 * 创建学期请求参数
 */
export interface SemesterCreateRequest {
  endDate: string;
  isCurrent?: number;
  name?: string;
  startDate: string;
  type: number;
  year: string;
}

/**
 * 更新学期请求参数
 */
export interface SemesterUpdateRequest {
  id: number;
  endDate?: string;
  isCurrent?: number;
  name?: string;
  startDate?: string;
  type: number;
  year: string;
}

/**
 * 删除学期请求参数
 */
export interface SemesterDeleteRequest {
  id: number;
}
