// 学生登录相关类型定义

/**
 * 学生登录请求参数
 */
export type StudentLoginParams = {
  /** 账号 */
  account: string;
  /** 密码 */
  password: string;
  /** 租户ID */
  tenantId?: number;
  /** 类型 */
  type?: number;
  /** 来源 */
  source?: string;
  /** 验证码ticket */
  ticket?: string;
  /** 滑块移动距离 */
  moveLength?: string;
};

/**
 * 租户应用信息
 */
export type TenantApps = {
  id: number;
  createTime: string;
  updateTime: string;
  isDeleted: number;
  tenantId: number;
  appId: number;
  tmbId: number;
  permission: number;
  sort: number;
  name: string;
  avatarUrl: string;
  createUsername: string;
  finalAppId: string;
  intro: string;
  status: number;
  source: number;
  updateUsername: string;
  sortNum: number;
  modulesJson: string;
  edgesJson: string;
  type: string;
  mode: number;
  isAICreated: number;
  config: number;
  isStructuredPrompt: number;
  isDefault: number;
  chatConfigJson: string;
  nodesJson: string;
  homePageUse: number;
  editStatus: number;
  appointedType: number;
  isDigitalHuman: number;
  timbreId: number;
  imageId: number;
  isShowApp: number;
  isPublished: number;
  copySourceId: number;
  endpointType: string;
  isSharing: number;
  baseUrl: string;
  thirdPartyKey: string;
  remark: string;
};

/**
 * 登录响应数据（实际返回的 data 内容）
 */
export type StudentAuthInfo = {
  /** 令牌 */
  accessToken: string;
  /** 来源 */
  source: string;
  /** 用户ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 账号名 */
  account: string;
  /** 手机号 */
  phone: string;
  /** 头像 */
  avatar: string;
  /** 性别：0-默认，1-男，2-女 */
  gender: number;
  /** 角色id */
  roleId: number;
  /** 角色类型 */
  roleType: number;
  /** 角色名称 */
  roleName: string;
  /** 角色ID集合 */
  roleIds: number[];
  /** 角色名称集合 */
  roleNames: string[];
  /** 租户人员ID */
  tmbId: number;
  /** 租户ID */
  tenantId: number;
  /** 租户名称 */
  tenantName: string;
  /** 租户域名 */
  domain: string;
  /** 是否为集团校：0-单校，1-集团校，2-集团子校 */
  subType: number;
  /** 集团ID */
  parentTenantId: number;
  /** 默认智能体 */
  defaultApp: TenantApps;
  /** 状态 */
  status: number;
  /** 目录code列表 */
  menuCodes: string[];
  /** chatId */
  chatId: string;
  /** is_sso */
  isSso: number;
  /** is_shared */
  isShared: number;
  /** 角色类型：0-未绑定，1-学生，2-老师，3-家长 */
  type: number;
  /** 教师ID */
  teacherId: number;
  /** 学生ID */
  studentId: number;
  /** 是否开启 ai 审核 0 否 1 是 */
  isAiReview: number;
};

/**
 * 学生登录响应数据
 * @deprecated 直接使用 StudentAuthInfo，request.ts 已经解析了外层
 */
export type StudentLoginResponse = StudentAuthInfo;

/**
 * 学生用户信息
 */
export type StudentUserInfo = {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 账号 */
  account: string;
  /** 手机号 */
  phone: string;
  /** 头像 */
  avatar: string;
  /** 性别 */
  gender: number;
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName: string;
  /** 租户ID */
  tenantId: number;
  /** 租户名称 */
  tenantName: string;
  /** 学生ID */
  studentId: number;
  /** 类型 */
  type: number;
};
