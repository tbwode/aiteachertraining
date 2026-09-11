/**
 * 教学管理-专业管理 API 类型定义
 */

/**
 * 专业新增/修改请求参数
 */
export type TenantMajorRequest = {
  /** 专业ID，修改时必填 */
  id?: number;
  /** 编码，如：ZY-001，不填则系统自动生成 */
  code?: string;
  /** 专业名称 */
  name: string;
  /** 所属大类ID */
  categoryId: number;
  /** 学制(年) */
  duration: number;
  /** 专业简介 */
  description?: string;
  /** 状态：0-停用，1-启用，默认1 */
  status?: number;
  /** 排序，默认0 */
  sortOrder?: number;
};

/**
 * 删除专业请求参数
 */
export type TenantMajorDeleteRequest = {
  /** 专业ID */
  id: number;
};

/**
 * 分页查询专业列表请求参数
 */
export type TenantMajorQueryRequest = {
  /** 当前页 */
  current?: number;
  /** 每页的数量 */
  size?: number;
  /** 正序排序字段名 */
  ascs?: string;
  /** 倒序排序字段名 */
  descs?: string;
  /** 关键字 */
  searchKey?: string;
  /** 所属大类ID */
  categoryId?: number;
  /** 状态：0-停用，1-启用 */
  status?: number;
};

/**
 * 专业列表请求参数
 */
export type TenantMajorListRequest = {
  /** 所属大类ID，不传查全部 */
  categoryId?: number;
};

/**
 * 排序字段信息
 */
export type TenantMajorOrderItem = {
  /** 需要进行排序的字段 */
  column?: string;
  /** 是否正序排列，默认 true */
  asc?: boolean;
};

/**
 * 专业列表项
 */
export type TenantMajorVO = {
  /** 专业ID */
  id?: number;
  /** 编码 */
  code?: string;
  /** 专业名称 */
  name?: string;
  /** 所属大类ID */
  categoryId?: number;
  /** 所属大类名称 */
  categoryName?: string;
  /** 学制(年) */
  duration?: number;
  /** 专业简介 */
  description?: string;
  /** 状态：0-停用，1-启用 */
  status?: number;
  /** 排序 */
  sortOrder?: number;
  /** 班级数量 */
  classCount?: number;
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 专业详情
 */
export type TenantMajorDetailResponse = {
  /** 专业ID */
  id?: number;
  /** 编码 */
  code?: string;
  /** 专业名称 */
  name?: string;
  /** 所属大类ID */
  categoryId?: number;
  /** 所属大类名称 */
  categoryName?: string;
  /** 学制(年) */
  duration?: number;
  /** 专业简介 */
  description?: string;
  /** 状态：0-停用，1-启用 */
  status?: number;
  /** 排序 */
  sortOrder?: number;
  /** 班级数量 */
  classCount?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 专业大类
 */
export type MajorCategoryVO = {
  /** 专业大类ID */
  id?: number;
  /** 编码 */
  code?: string;
  /** 大类名称 */
  name?: string;
  /** 排序 */
  sortOrder?: number;
  /** 专业数量 */
  majorCount?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 专业下拉项
 */
export type TenantMajorSimpleVO = {
  /** 专业ID */
  id?: number;
  /** 专业名称 */
  name?: string;
};

/**
 * 分页查询专业列表返回数据
 */
export type TenantMajorPageResponse = {
  /** 查询数据列表 */
  records?: TenantMajorVO[];
  /** 总数 */
  total?: number;
  /** 每页显示条数 */
  size?: number;
  /** 当前页 */
  current?: number;
  /** 排序字段信息 */
  orders?: TenantMajorOrderItem[];
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
 * 新增专业返回数据
 */
export type AddTenantMajorResponse = Record<string, never>;

/**
 * 修改专业返回数据
 */
export type UpdateTenantMajorResponse = Record<string, never>;

/**
 * 删除专业返回数据
 */
export type DeleteTenantMajorResponse = Record<string, never>;

/**
 * 查询所有大类返回数据
 */
export type ListMajorCategoriesResponse = MajorCategoryVO[];

/**
 * 专业列表返回数据
 */
export type ListTenantMajorsResponse = TenantMajorSimpleVO[];
