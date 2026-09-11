/**
 * 教学管理-学生管理 API 类型定义
 */

/**
 * 学生列表项
 */
export interface StudentItem {
  clazzId: number;
  clazzName: string;
  code: string;
  createTime: string;
  enrollmentDate: string;
  gender: number;
  gradeId: number;
  id: string;
  idCard: string;
  isDeleted: number;
  majorId: number;
  majorName: string;
  name: string;
  phone: string;
  status: number;
  tenantId: number;
  tmbId: number;
  updateTime: string;
}

/**
 * 学生分页列表请求参数
 */
export interface StudentPageRequest {
  clazzId?: number;
  current?: number;
  gradeId?: number;
  majorId?: number;
  searchKey?: string;
  size?: number;
  status?: number;
}

/**
 * 学生分页列表响应数据
 */
export interface StudentPageData {
  current: number;
  orders: string[];
  pages: number;
  records: StudentItem[];
  searchCount: boolean;
  size: number;
  total: number;
}

/**
 * 学生分页列表响应
 */
export interface StudentPageResponse {
  code: number;
  data: StudentPageData;
  msg: string;
  success: boolean;
}

/**
 * 学生详情请求参数
 */
export interface StudentDetailRequest {
  id: number;
}

/**
 * 学生详情响应数据
 */
export interface StudentDetailData {
  categoryId: number;
  categoryName: string;
  clazzId: number;
  clazzName: string;
  code: string;
  createTime: string;
  enrollmentDate: string;
  gender: number;
  gradeId: number;
  id: string;
  idCard: string;
  isDeleted: number;
  majorId: number;
  majorName: string;
  name: string;
  phone: string;
  status: number;
  tenantId: number;
  tmbId: number;
  updateTime: string;
}

/**
 * 学生详情响应
 */
export interface StudentDetailResponse {
  code: number;
  data: StudentDetailData;
  msg: string;
  success: boolean;
}

/**
 * 创建学生请求参数
 */
export interface StudentCreateRequest {
  clazzId: number;
  code: string;
  enrollmentDate?: string;
  gender: number;
  idCard?: string;
  majorId: number;
  name: string;
  phone?: string;
  status: number;
}

/**
 * 更新学生请求参数
 */
export interface StudentUpdateRequest {
  clazzId: number;
  code: string;
  enrollmentDate?: string;
  gender: number;
  id: number;
  idCard?: string;
  majorId: number;
  name: string;
  phone?: string;
  status?: number;
}

/**
 * 删除学生请求参数
 */
export interface StudentDeleteRequest {
  id: number;
}

/**
 * 批量导入学生请求参数
 */
export interface StudentImportRequest {
  file: string;
}

/**
 * 批量导入学生响应数据
 */
export interface StudentImportData {
  valid: number;
  msg: string;
  errMsgs: string[];
}

/**
 * 批量导入学生响应
 */
export interface StudentImportResponse {
  code: number;
  data: StudentImportData;
  msg: string;
  success: boolean;
}
