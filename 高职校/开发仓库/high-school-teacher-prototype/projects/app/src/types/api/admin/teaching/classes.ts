/**
 * 教学管理-班级管理 API 类型定义
 */

/**
 * 班级列表项
 */
export interface ClassItem {
  id: string;
  createTime: string;
  updateTime: string;
  isDeleted: number | null;
  tenantId: number | null;
  code: string;
  name: string;
  majorId: number;
  gradeId: number;
  teacherId: number;
  status: number;
  categoryId: number;
  majorName: string;
  gradeName: string;
  teacherName: string;
  studentCount: number;
}

/**
 * 班级分页列表请求参数
 */
export interface ClassPageRequest {
  categoryId?: number;
  current?: number;
  gradeId?: number;
  majorId?: number;
  size?: number;
  status?: number;
}

/**
 * 班级分页列表响应
 */
export interface ClassPageResponse {
  records: ClassItem[];
  total: number;
  size: number;
  current: number;
  orders: string[];
  searchCount: boolean;
  pages: number;
}

/**
 * 班级列表请求参数（不分页）
 */
export interface ClassListRequest {
  majorId?: number;
}

/**
 * 班级列表项（不分页）
 */
export interface ClassListItem {
  code: string;
  createTime: string;
  gradeId: number;
  id: string;
  isDeleted: number;
  majorId: number;
  name: string;
  status: number;
  teacherId: number;
  tenantId: number;
  updateTime: string;
}

/**
 * 班级列表响应
 */
export interface ClassListResponse {
  code: number;
  data: ClassListItem[];
  msg: string;
  success: boolean;
}

/**
 * 班级详情请求参数
 */
export interface ClassDetailRequest {
  id: number;
}

/**
 * 班级详情响应
 */
export interface ClassDetailResponse {
  id: number;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  code: string;
  name: string;
  majorId: number;
  gradeId: number;
  teacherId: number;
  status: number;
  categoryId: number;
}

/**
 * 创建班级请求参数
 */
export interface ClassCreateRequest {
  code?: string;
  categoryId: number;
  gradeId: number;
  majorId: number;
  name: string;
  status?: number;
  teacherId?: number;
}

/**
 * 更新班级请求参数
 */
export interface ClassUpdateRequest {
  categoryId: number;
  gradeId: number;
  id: number;
  majorId: number;
  name: string;
  status: number;
  teacherId: number;
}

/**
 * 删除班级请求参数
 */
export interface ClassDeleteRequest {
  id: number;
}
