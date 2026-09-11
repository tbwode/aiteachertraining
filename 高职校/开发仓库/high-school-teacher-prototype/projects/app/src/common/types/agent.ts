// 智能体相关类型定义

/**
 * 智能体指定类型枚举
 */
export enum AgentAppointedTypeEnum {
  /** 思维导图 */
  MIND_MAP = 1,
  /** 文档解读 */
  DOCUMENT_ANALYSIS = 2,
  /** 课程AI教师 */
  COURSE_AI_TEACHER = 27
}

/**
 * 智能体来源枚举
 */
export enum AgentSourceEnum {
  /** 来源 */
  SOURCE = 1,
  /** 租户 */
  TENANT = 2,
  /** 官方 */
  OFFICIAL = 3,
  /** 个人 */
  PERSONAL = 4
}

/**
 * 智能体状态枚举
 */
export enum AgentStatusEnum {
  /** 上线 */
  ONLINE = 1,
  /** 下线 */
  OFFLINE = 2
}

/**
 * 智能体行业枚举
 */
export enum AgentIndustryEnum {
  /** 其他 */
  OTHER = 0,
  /** 教育 */
  EDUCATION = 1,
  /** 金融 */
  FINANCE = 2,
  /** 互联网 */
  INTERNET = 3,
  /** 医疗 */
  MEDICAL = 4,
  /** 政府 */
  GOVERNMENT = 5
}

/**
 * 智能体模式枚举
 */
export enum AgentModeEnum {
  /** 简易 */
  SIMPLE = 1,
  /** 高阶 */
  ADVANCED = 2,
  /** 第三方 */
  THIRD_PARTY = 3
}

/**
 * 智能体配置枚举
 */
export enum AgentConfigEnum {
  /** 公开配置 */
  PUBLIC = 0,
  /** 私有配置 */
  PRIVATE = 1
}

/**
 * 智能体是否默认枚举
 */
export enum AgentIsDefaultEnum {
  /** 否 */
  NO = 0,
  /** 是 */
  YES = 1
}

/**
 * 智能体首页使用配置枚举
 */
export enum AgentHomePageUseEnum {
  /** 未使用 */
  UNUSED = 0,
  /** 文生图 */
  TEXT_TO_IMAGE = 1,
  /** 教学设计 */
  TEACHING_DESIGN = 2,
  /** 项目化教学 */
  PROJECT_BASED_TEACHING = 3,
  /** 行政公文撰写 */
  OFFICIAL_DOCUMENT = 4,
  /** 活动方案 */
  ACTIVITY_PLAN = 5,
  /** 文本润色 */
  TEXT_POLISHING = 6,
  /** 思维导图 */
  MIND_MAP = 7,
  /** 文案撰写 */
  COPYWRITING = 8
}

/**
 * 智能体是否展示枚举
 */
export enum AgentIsShowAppEnum {
  /** 否 */
  NO = 0,
  /** 是 */
  YES = 1
}

/**
 * 智能体端点类型枚举
 */
export enum AgentEndpointTypeEnum {
  /** 教师端 */
  TEACHER = '1',
  /** 学生端 */
  STUDENT = '2'
}

/**
 * 智能体是否上架枚举
 */
export enum AgentIsPublishedEnum {
  /** 否 */
  NO = 0,
  /** 是 */
  YES = 1
}

/**
 * 智能体是否开启分享枚举
 */
export enum AgentIsSharingEnum {
  /** 否 */
  NO = 0,
  /** 是 */
  YES = 1
}

/**
 * 智能体信息
 */
export type Agent = {
  /** ID */
  id?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 是否删除 */
  isDeleted?: number;
  /** 租户ID，官方智能体为0 */
  tenantId?: number;
  /** 租户成员ID，官方智能体为0 */
  tmbId?: number;
  /** 来源，见 SourceEnum：来源 1、租户 2、官方 3、个人；官方行要求 tenant_id=0 且 tmb_id=0 */
  source?: number;
  /** 新 FastGPT 侧应用 ID */
  fastgptAppId?: string;
  /** 智能体名称 */
  name?: string;
  /** 头像 */
  avatarUrl?: string;
  /** 介绍 */
  intro?: string;
  /** 置顶状态,0为置顶,1为未置顶 */
  sort?: number;
  /** 1、私有 0、公开 */
  permission?: number;
  /** 创建用户名称 */
  createUsername?: string;
  /** 状态 1:上线, 2:下线 */
  status?: number;
  /** 行业 0:其他, 1:教育, 2:金融, 3:互联网, 4:医疗, 5:政府 */
  industry?: number;
  /** 更新用户名称 */
  updateUsername?: string;
  /** 顺序，越大越靠前 */
  sortNum?: number;
  /** 类型 simple;special */
  type?: string;
  /** 1、简易 2、高阶 3、第三方 */
  mode?: number;
  /** 0、公开配置 1、私有配置 */
  config?: number;
  /** 是否系统默认 0、否 1、是 */
  isDefault?: number;
  /** 首页使用配置 0:未使用, 1:文生图, 2:教学设计, 3:项目化教学, 4:行政公文撰写, 5:活动方案, 6:文本润色, 7:思维导图, 8:文案撰写 */
  homePageUse?: number;
  /** 指定类型 1、思维导图 2、文档解读 */
  appointedType?: number;
  /** 是否在App和小程序端展示 0-否 1-是 默认展示 */
  isShowApp?: number;
  /** 1:教师端, 2:学生端 */
  endpointType?: string;
  /** 备注 */
  remark?: string;
  /** 是否已经上架 0-否 1-是 默认否 */
  isPublished?: number;
  /** 复制来源 agent id，0-非复制 */
  copySourceId?: number;
  /** 是否开启分享 0-否 1-是 默认否 */
  isSharing?: number;
};

/**
 * 按指定类型获取官方智能体详情请求参数
 */
export type GetAgentDetailByAppointedTypeRequest = {
  /** 指定类型 */
  appointedType: AgentAppointedTypeEnum | number;
};

/**
 * 按指定类型获取官方智能体详情响应数据
 */
export type GetAgentDetailByAppointedTypeResponse = Agent;
