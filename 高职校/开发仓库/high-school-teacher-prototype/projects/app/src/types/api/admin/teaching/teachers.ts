/**
 * 教学管理-教师管理 API 类型定义
 */

/**
 * 教师列表项（Record）
 */
export interface TeacherItem {
  /**
   * 编号
   */
  code: string;
  /**
   * 创建时间
   */
  createTime: string;
  /**
   * 部门ID集合
   */
  deptIds: number[];
  /**
   * 部门名称集合
   */
  deptNames?: string[];
  /**
   * 邮箱
   */
  email: string;
  /**
   * 性别，1-男，2-女
   */
  gender: number;
  /**
   * ID
   */
  id: string;
  /**
   * 是否删除
   */
  isDeleted: number;
  /**
   * 姓名
   */
  name: string;
  /**
   * 手机号
   */
  phone: string;
  /**
   * 职称，1-助理讲师，2-高级讲师，3-助教，4-讲师，5-副教授，6-教授
   */
  professionalTitle: number;
  /**
   * 角色ID
   */
  roleId: string;
  /**
   * 角色ID集合
   */
  roleIds: number[];
  /**
   * 角色名称集合
   */
  roleNames?: string[];
  /**
   * 登录账号
   */
  loginAccount?: string;
  /**
   * 账号激活状态：0-未激活，1-已激活，2-禁用
   */
  accountStatus?: number;
  /**
   * 激活时间
   */
  activateTime?: string;
  /**
   * 状态，1-在职，2-离职
   */
  status: number;
  /**
   * 租户ID
   */
  tenantId: number;
  /**
   * TMB ID
   */
  tmbId: number;
  /**
   * 类型，1-教师，2-行政人员
   */
  type: number;
  /**
   * 更新时间
   */
  updateTime: string;
}

/**
 * 教师分页列表请求参数
 */
export interface TeacherPageRequest {
  /**
   * 当前页
   */
  current?: number;
  /**
   * 部门ID
   */
  deptId?: number;
  /**
   * 是否仅看管理员：1-仅看管理员，0-否
   */
  isAdmin?: number;
  /**
   * 关键字
   */
  searchKey?: string;
  /**
   * 每页的数量
   */
  size?: number;
  /**
   * 状态
   */
  status?: number;
  /**
   * 用户类型：1-教师，2-行政人员
   */
  type?: number;
}

/**
 * 教师分页列表数据
 */
export interface TeacherPageData {
  current: number;
  orders: string[];
  pages: number;
  records: TeacherItem[];
  searchCount: boolean;
  size: number;
  total: number;
}

/**
 * 教师分页列表响应
 */
export interface TeacherPageResponse {
  /**
   * 状态码
   */
  code: number;
  data: TeacherPageData;
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
 * 教师详情请求参数
 */
export interface TeacherDetailRequest {
  /**
   * id
   */
  id: number;
}

/**
 * 教师详情数据
 */
export interface TeacherDetailData {
  code: string;
  createTime: string;
  deptIds: number[];
  deptNames?: string[];
  email: string;
  gender: number;
  id: string;
  isDeleted: number;
  name: string;
  phone: string;
  professionalTitle: number;
  roleIds: number[];
  roleNames?: string[];
  loginAccount?: string;
  /**
   * 账号激活状态：0-未激活，1-已激活，2-禁用
   */
  accountStatus?: number;
  /**
   * 激活时间
   */
  activateTime?: string;
  status: number;
  tenantId: number;
  tmbId: number;
  type: number;
  updateTime: string;
}

/**
 * 教师详情响应
 */
export interface TeacherDetailResponse {
  code: number;
  data: TeacherDetailData;
  msg: string;
  success: boolean;
}

/**
 * 创建教师请求参数
 */
export interface TeacherCreateRequest {
  /**
   * 教师编号
   */
  code: string;
  /**
   * 部门ID集合
   */
  deptIds?: number[];
  /**
   * 邮箱
   */
  email?: string;
  /**
   * 性别：1-男，2-女
   */
  gender: number;
  /**
   * 姓名
   */
  name: string;
  /**
   * 手机号
   */
  phone?: string;
  /**
   * 职称：1-助理讲师，2-高级讲师，3-助教，4-讲师，5-副教授，6-教授
   */
  professionalTitle?: number;
  /**
   * 角色ID集合
   */
  roleIds?: number[];
  /**
   * 状态：1-在职，2-离职
   */
  status?: number;
  /**
   * 用户类型：1-教师，2-行政人员
   */
  type?: number;
}

/**
 * 更新教师请求参数
 */
export interface TeacherUpdateRequest {
  /**
   * 教师编号
   */
  code: string;
  /**
   * 部门ID集合
   */
  deptIds: number[];
  /**
   * 部门名称集合
   */
  deptNames?: string[];
  /**
   * 邮箱
   */
  email: string;
  /**
   * 性别：1-男，2-女
   */
  gender: number;
  /**
   * ID
   */
  id: string;
  /**
   * 姓名
   */
  name: string;
  /**
   * 手机号
   */
  phone: string;
  /**
   * 职称：1-助理讲师，2-高级讲师，3-助教，4-讲师，5-副教授，6-教授
   */
  professionalTitle: number;
  /**
   * 角色ID集合
   */
  roleIds: number[];
  /**
   * 状态：1-在职，2-离职
   */
  status: number;
  /**
   * 用户类型：1-教师，2-行政人员
   */
  type: number;
}

/**
 * 删除教师请求参数
 */
export interface TeacherDeleteRequest {
  /**
   * id
   */
  id: number;
}

/**
 * 批量导入教师请求参数
 */
export interface TeacherImportRequest {
  /**
   * 导入文件 excel文件
   */
  file: string;
}

/**
 * 批量导入教师响应数据
 */
export interface TeacherImportData {
  valid: number;
  msg: string;
  errMsgs: string[];
}

/**
 * 批量导入教师响应
 */
export interface TeacherImportResponse {
  code: number;
  data: TeacherImportData;
  msg: string;
  success: boolean;
}

// ========== 兼容旧类型定义 ==========

/**
 * 教师列表请求参数（不分页）
 */
export interface TeacherListRequest {
  status?: number;
  type?: number;
}

/**
 * 教师列表项（旧定义）
 */
export interface TeacherListItem {
  code: string;
  createTime: string;
  email: string;
  gender: number;
  id: string;
  isDeleted: number;
  name: string;
  phone: string;
  professionalTitle: number;
  status: number;
  tenantId: number;
  tmbId: number;
  type: number;
  updateTime: string;
}

/**
 * 教师列表响应（旧定义）
 * @deprecated 请使用 TeacherPageResponse
 */
export interface TeacherListResponse {
  code: number;
  data: TeacherListItem[];
  msg: string;
  success: boolean;
}
