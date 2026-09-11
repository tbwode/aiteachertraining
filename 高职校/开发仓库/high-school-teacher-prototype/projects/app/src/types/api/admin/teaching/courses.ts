/**
 * 教学管理-课程管理 API 类型定义
 */

/**
 * 课程新增/修改请求参数
 */
export type TenantCourseRequest = {
  /** 课程ID，修改时必填 */
  id?: number;
  /** 课程编号，为空时系统自动生成 */
  code?: string;
  /** 课程名称 */
  name: string;
  /** 课程类型：1-必修，2-选修 */
  type: number;
  /** 课时，1-200 */
  hours: number;
  /** 所属租户专业ID，为0时全校通用 */
  tenantMajorId?: number;
  /** 课程描述 */
  description?: string;
  /** 状态：1-启用，0-停用 */
  status?: number;
};

/**
 * 课程ID请求参数
 */
export type TenantCourseIdRequest = {
  /** 课程ID */
  id: number;
};

/**
 * 分页查询课程列表请求参数
 */
export type TenantCourseQueryRequest = {
  /** 当前页 */
  current?: number;
  /** 每页的数量 */
  size?: number;
  /** 正序排序字段名 */
  ascs?: string;
  /** 倒序排序字段名 */
  descs?: string;
  /** 搜索关键词（课程名称/编号） */
  searchKey?: string;
  /** 课程类型：1-必修，2-选修 */
  type?: number;
  /** 所属租户专业ID，为0时查询全校通用课程 */
  tenantMajorId?: number;
  /** 状态：1-启用，0-停用 */
  status?: number;
};

/**
 * 切换课程状态请求参数
 */
export type TenantCourseToggleStatusRequest = {
  /** 课程ID */
  id: number;
  /** 状态：1-启用，0-停用 */
  status: number;
};

/**
 * 校验课程编码请求参数
 */
export type TenantCourseCheckCodeRequest = {
  /** 课程编码 */
  code: string;
  /** 排除的课程ID（编辑时使用） */
  excludeId?: number;
};

/**
 * 排序字段信息
 */
export type TenantCourseOrderItem = {
  /** 需要进行排序的字段 */
  column?: string;
  /** 是否正序排列，默认 true */
  asc?: boolean;
};

/**
 * 课程列表项
 */
export type TenantCourseVO = {
  /** 课程ID */
  id?: number;
  /** 课程编号 */
  code?: string;
  /** 课程名称 */
  name?: string;
  /** 课程类型：1-必修，2-选修 */
  type?: number;
  /** 课时，1-200 */
  hours?: number;
  /** 所属租户专业ID */
  tenantMajorId?: number;
  /** 所属专业名称 */
  majorName?: string;
  /** 课程描述 */
  description?: string;
  /** 状态：1-启用，0-停用 */
  status?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 课程详情
 */
export type TenantCourseDetailResponse = {
  /** 课程ID */
  id?: number;
  /** 课程编号 */
  code?: string;
  /** 课程名称 */
  name?: string;
  /** 课程类型：1-必修，2-选修 */
  type?: number;
  /** 课时，1-200 */
  hours?: number;
  /** 所属租户专业ID */
  tenantMajorId?: number;
  /** 所属专业名称 */
  majorName?: string;
  /** 课程描述 */
  description?: string;
  /** 状态：1-启用，0-停用 */
  status?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 分页查询课程列表返回数据
 */
export type TenantCoursePageResponse = {
  /** 查询数据列表 */
  records?: TenantCourseVO[];
  /** 总数 */
  total?: number;
  /** 每页显示条数 */
  size?: number;
  /** 当前页 */
  current?: number;
  /** 排序字段信息 */
  orders?: TenantCourseOrderItem[];
  /** 自动优化 COUNT SQL */
  optimizeCountSql?: boolean;
  /** 是否进行 count 查询 */
  isSearchCount?: boolean;
  searchCount?: boolean;
  /** 当前分页总页数 */
  pages?: number;
  /** 正序排序字段 */
  ascs?: string[];
  /** 升序字段 */
  asc?: string[];
  /** 倒序排序字段 */
  descs?: string[];
  /** 降序字段 */
  desc?: string[];
};

/**
 * 新增课程返回数据
 */
export type AddTenantCourseResponse = Record<string, never>;

/**
 * 修改课程返回数据
 */
export type UpdateTenantCourseResponse = Record<string, never>;

/**
 * 删除课程返回数据
 */
export type DeleteTenantCourseResponse = Record<string, never>;

/**
 * 切换课程状态返回数据
 */
export type ToggleTenantCourseStatusResponse = Record<string, never>;

/**
 * 生成课程编码返回数据
 */
export type GenerateTenantCourseCodeResponse = string;

/**
 * 校验课程编码返回数据
 */
export type CheckTenantCourseCodeResponse = boolean;

/**
 * 课程列表返回数据
 */
export type ListTenantCoursesResponse = TenantCourseVO[];
