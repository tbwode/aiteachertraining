// 智能体会话聊天相关类型定义

/**
 * 聊天对象枚举
 */
export enum ChatObjEnum {
  /** 用户提问 */
  HUMAN = 'HUMAN',
  /** AI回复 */
  AI = 'AI'
}

/**
 * 消息来源枚举
 */
export enum ChatSourceEnum {
  /** 客户端 */
  CLIENT = 'client',
  /** App */
  APP = 'app',
  /** 小程序 */
  MINI = 'mini'
}

/**
 * 排序项
 */
export type OrderItem = {
  /** 需要进行排序的字段 */
  column?: string;
  /** 是否正序排列，默认 true */
  asc?: boolean;
};

/**
 * 智能体会话
 */
export type AgentChat = {
  /** ID */
  id?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 是否删除 */
  isDeleted?: number;
  /** 聊天ID */
  chatId?: string;
  /** 业务侧智能体ID，agents.id */
  agentId?: number;
  /** 新 FastGPT 侧应用 ID */
  fastgptAppId?: string;
  /** 租户ID */
  tenantId?: number;
  /** 租户成员ID */
  tmbId?: number;
  /** 标题 */
  title?: string;
};

/**
 * 分页数据
 */
export type IPage<T> = {
  /** 查询数据列表 */
  records?: T[];
  /** 总数 */
  total?: number;
  /** 每页显示条数 */
  size?: number;
  /** 当前页 */
  current?: number;
  /** 排序字段信息 */
  orders?: OrderItem[];
  /** 自动优化 COUNT SQL */
  optimizeCountSql?: boolean;
  /** 是否进行 count 查询 */
  isSearchCount?: boolean;
  searchCount?: boolean;
  /** 当前分页总页数 */
  pages?: number;
  /** 正序排序字段名 */
  ascs?: string[];
  asc?: string[];
  /** 倒序排序字段名 */
  descs?: string[];
  desc?: string[];
};

/**
 * 通用响应
 */
export type R<T> = {
  /** 状态码 */
  code: number;
  /** 是否成功 */
  success: boolean;
  /** 承载数据 */
  data?: T;
  /** 返回消息 */
  msg: string;
};

/**
 * 会话分页列表请求
 */
export type AgentChatPageRequest = {
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
  /** 业务侧智能体ID agents.id，可选筛选 */
  agentId?: number;
};

/**
 * 详情请求
 */
export type DetailRequest = {
  /** id */
  id: number;
  tenantId?: number;
  tmbId?: number;
  /** 父空间Id，回收站恢复时若父空间不存在需要选择一个空间/文件夹ID */
  parentId?: number;
  /** 学期ID */
  semesterId?: number;
};

/**
 * 创建会话请求
 */
export type AgentChatCreateRequest = {
  /** 聊天ID */
  chatId: string;
  /** 业务侧智能体ID agents.id */
  agentId: number;
  /** 新 FastGPT 侧应用 ID */
  fastgptAppId: string;
  /** 标题 */
  title?: string;
};

/**
 * 更新会话请求
 */
export type AgentChatUpdateRequest = {
  /** 聊天ID */
  chatId: string;
  /** 标题 */
  title?: string;
};

/**
 * 智能体聊天消息项
 */
export type AgentChatItem = {
  /** ID */
  id?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 是否删除 */
  isDeleted?: number;
  /** 聊天ID */
  chatId?: string;
  /** 聊天内容ID */
  dataId?: string;
  /** 业务侧智能体ID，agents.id */
  agentId?: number;
  /** 新 FastGPT 侧应用 ID */
  fastgptAppId?: string;
  /** 租户ID */
  tenantId?: number;
  /** 租户成员ID */
  tmbId?: number;
  /** 聊天对象 HUMAN-用户提问 AI-ai回复 */
  obj?: string;
  /** OCR/表单等文件 key */
  ocrFileKey?: string;
  /** 来源 */
  source?: string;
};

/**
 * 创建消息请求
 */
export type AgentChatItemCreateRequest = {
  /** 聊天ID */
  chatId: string;
  /** 聊天内容ID */
  dataId: string;
  /** 业务侧智能体ID agents.id */
  agentId: number;
  /** 新 FastGPT 侧应用 ID */
  fastgptAppId: string;
  /** 聊天对象 HUMAN-用户提问 AI-ai回复 */
  obj: string;
  /** OCR/表单等文件 key */
  ocrFileKey?: string;
  /** 来源，默认 client */
  source?: string;
};

/**
 * 分页响应类型
 */
export type AgentChatPageResponse = IPage<AgentChat>;
export type AgentChatDetailResponse = AgentChat;
export type AgentChatCreateResponse = AgentChat;
export type AgentChatUpdateResponse = boolean;
export type AgentChatDeleteResponse = boolean;
export type AgentChatItemCreateResponse = AgentChatItem;
export type AgentChatItemDeleteResponse = boolean;
