/**
 * 资讯管理 API 类型定义
 */

/**
 * 资讯类型
 */
export enum ENewsType {
  /** 未知 */
  UNKNOWN = 0,
  /** 通知公告 */
  NOTICE = 1,
  /** 新闻动态 */
  NEWS = 2,
  /** 政策落实 */
  POLICY = 3,
  /** 教学动态 */
  TEACHING = 4,
  /** 对外交流 */
  EXCHANGE = 5,
  /** 师生成果 */
  ACHIEVEMENT = 6,
  /** 学校荣誉 */
  HONOR = 7
}

/**
 * 资讯状态
 */
export enum ENewsStatus {
  /** 草稿 */
  DRAFT = 0,
  /** 已发布 */
  PUBLISHED = 1,
  /** 未发布 */
  UNPUBLISHED = 2
}

/**
 * 归属层级
 */
export enum ENewsLevel {
  /** 学校层级资讯 */
  SCHOOL = 1,
  /** 集团层级资讯 */
  GROUP = 2
}

/**
 * 模式：1-站内查看内容；2-跳转站外链接
 */
export enum ENewsMode {
  /** 站内查看内容 */
  INTERNAL = 1,
  /** 跳转站外链接 */
  EXTERNAL = 2
}

/**
 * 资讯项
 */
export interface NewsVO {
  /** 主键ID */
  id: string;
  /** 租户ID */
  tenantId: string;
  /** 标题 */
  title: string;
  /** 资讯类型 */
  newsType: ENewsType;
  /** 封面图片 */
  coverImage: string;
  /** 简介 */
  introduction: string;
  /** 部门ID */
  deptId: number;
  /** 模式 */
  mode: ENewsMode;
  /** 内容 */
  content: string;
  /** 来源链接 */
  sourceUrl: string;
  /** 资讯状态 */
  status: ENewsStatus;
  /** 是否置顶 0-否 1-是 */
  isTop: number;
  /** 发布时间 */
  publishTime: string;
  /** 置顶时间 */
  topTime: string;
  /** 创建者租户成员ID */
  creatorTmbId: number;
  /** 更新者租户成员ID */
  updaterTmbId: number;
  /** 资讯类型名称 */
  newsTypeName: string;
  /** 状态名称 */
  statusName: string;
  /** 创建者姓名 */
  creatorName: string;
  /** 更新者姓名 */
  updaterName: string;
  /** 部门名称 */
  deptName: string;
  /** 归属层级：1-学校层级资讯；2-集团层级资讯 */
  level: ENewsLevel;
  /** 阅读次数 */
  readCount: number;
  /** 租户子校名称 */
  tenantName: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 资讯分页查询参数
 */
export interface NewsPageRequest {
  /** 当前页 */
  current?: number;
  /** 每页数量 */
  size?: number;
  /** 归属层级 */
  level?: ENewsLevel;
  /** 资讯状态 */
  status?: ENewsStatus;
  /** 资讯类型 */
  newsType?: ENewsType;
  /** 目标租户ID（可选，集团校可用来查询特定子校资讯） */
  targetTenantId?: string;
  /** 搜索关键词（标题或创建人姓名） */
  searchKey?: string;
  /** 创建时间开始 */
  createTimeStart?: string;
  /** 创建时间结束 */
  createTimeEnd?: string;
  /** 更新时间开始 */
  updateTimeStart?: string;
  /** 更新时间结束 */
  updateTimeEnd?: string;
  /** 发布时间开始 */
  publishTimeStart?: string;
  /** 发布时间结束 */
  publishTimeEnd?: string;
}

/**
 * 资讯分页数据
 */
export interface NewsPageData {
  current: number;
  orders: string[];
  pages: number;
  records: NewsVO[];
  searchCount: boolean;
  size: number;
  total: number;
}

/**
 * 创建资讯参数
 */
export interface NewsCreateRequest {
  title: string;
  newsType: ENewsType;
  deptId: number;
  coverImage: string;
  introduction: string;
  sourceUrl: string;
  isTop: number;
  mode: ENewsMode;
  status: ENewsStatus;
}

/**
 * 更新资讯参数
 */
export interface NewsUpdateRequest extends NewsCreateRequest {
  id: string;
}

/**
 * 更新资讯状态参数
 */
export interface NewsUpdateStatusRequest {
  id: string;
  status: ENewsStatus;
}

/**
 * 更新置顶状态参数
 */
export interface NewsUpdateTopRequest {
  id: string;
  isTop: number;
}

/**
 * 删除资讯参数
 */
export interface NewsDeleteRequest {
  id: string;
}

/**
 * 获取资讯详情参数
 */
export interface NewsDetailRequest {
  id: string;
}

/**
 * 资讯详情响应
 */
export interface NewsDetailResponse extends NewsVO {
  /** 阅读次数 */
  readCount: number;
  /** 租户名称 */
  tenantName: string;
}

/**
 * 增加阅读量参数
 */
export interface NewsIncrementReadRequest {
  id: string;
}
