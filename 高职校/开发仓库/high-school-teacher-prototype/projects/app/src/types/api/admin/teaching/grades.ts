/**
 * 年级管理 API 类型定义
 */

// 年级列表项
export interface GradeItem {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number | null;
  tenantId: number | null;
  name: string;
  description: string;
  sort: number | null;
  clazzCount: number;
  studentCount: number;
}

// 分页列表请求
export interface GradePageRequest {
  current: string | number;
  name: string;
  size: string | number;
}

// 分页列表响应
export interface GradePageResponse {
  records: GradeItem[];
  total: number;
  size: number;
  current: number;
  orders: string[];
  searchCount: boolean;
  pages: number;
}

// 详情请求
export interface GradeDetailRequest {
  id: string | number;
}

// 详情响应
export interface GradeDetailResponse {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  name: string;
  description: string;
  sort: number;
}

// 创建年级请求
export interface GradeCreateRequest {
  name: string;
  description?: string;
  sort?: number;
}

// 更新年级请求
export interface GradeUpdateRequest {
  id: string | number;
  name: string;
  description?: string;
  sort?: number;
}

// 删除年级请求
export interface GradeDeleteRequest {
  id: string | number;
}

// 年级列表项（不分页）
export interface GradeListItem {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  name: string;
  description: string;
  sort: number;
}

// 年级列表响应
export interface GradeListResponse {
  code: number;
  data: GradeListItem[];
  msg: string;
  success: boolean;
}

// 通用 API 响应
export interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T;
  msg: string;
}
