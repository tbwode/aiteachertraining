/**
 * 教师端认证相关类型定义
 */

/**
 * 租户应用信息
 */
export type TenantApp = {
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
 * 用户类型：1-学生，2-老师
 */
export enum UserTypeEnum {
  STUDENT = 1,
  TEACHER = 2
}

/**
 * 角色类型：1-管理员，2-普通成员
 */
export enum RoleTypeEnum {
  ADMIN = 1,
  MEMBER = 2
}

/**
 * 登录响应数据
 */
export type AuthInfo = {
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
  defaultApp: TenantApp;
  /** 状态，0 表示需要先修改密码 */
  status: number | string;
  /** 目录code列表 */
  menuCodes: string[];
  /** 聊天ID */
  chatId: string;
  /** is_sso */
  isSso: number;
  /** 官方介绍数据集ID（用于AI分析） */
  officialIntroDatasetId?: string;
  /** 介绍数据集ID（用于AI分析） */
  introDatasetId?: string;
  /** is_shared */
  isShared: number;
  /** 教师ID */
  teacherId: number;
  /** 学生ID */
  studentId: number;
  /** 是否开启 ai 审核 0 否 1 是 */
  isAiReview: number;
  /** 用户类型：1-学生，2-老师 */
  type: UserTypeEnum;
  /** 角色类型：1-管理员，2-普通成员 */
  roleType: RoleTypeEnum;
};

/**
 * 单点登录返回数据
 */
export type TokenLoginRes = Partial<AuthInfo> & {
  accessToken: string;
  tokenType?: string;
  expiresTime?: number;
  userId: string | number;
  username: string;
  account: string;
  phone?: string;
  avatar?: string;
  roleId?: string | number;
  roleName?: string;
  roleType?: RoleTypeEnum | `${number}`;
  tenantId?: string | number;
  tenantName?: string;
  domain?: string;
  tmbId?: string | number;
  menuCodes?: string[];
  defaultApp?: TenantApp;
  status?: string | number;
  isSso?: number;
  gender?: number | string;
  subType?: number | string;
  parentTenantId?: number | string;
  isAiReview?: 0 | 1 | number;
  teacherId?: string | number;
  studentId?: string | number;
  isShared?: number | string;
  chatId?: string;
  language?: string;
  wpsConfig?: {
    appId: string;
    maxFileSize: number;
  };
  source?: string;
  roleIds?: Array<string | number>;
  roleNames?: string[];
  officialIntroDatasetId?: string;
  introDatasetId?: string;
  type?: UserTypeEnum | `${number}`;
};

/**
 * 登录请求参数
 */
export type LoginParams = {
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
  /** ticket */
  ticket?: string;
  /** moveLength */
  moveLength?: string | number;
};

/**
 * 首次登录修改密码参数
 */
export type ClientUserFirstUpdatePwdParams = {
  /** 验证码 */
  code: string;
  /** 手机号 */
  mobile: string;
  /** 新密码 */
  password: string;
  /** 确认新密码 */
  password1: string;
};

/**
 * 忘记密码-重置密码参数
 */
export type ClientAuthResetPwdParams = {
  /** 验证码 */
  code: string;
  /** 手机号 */
  mobile: string;
  /** 新密码（已 sha256） */
  password: string;
  /** 确认新密码（已 sha256） */
  password1: string;
};

/**
 * 登录响应结果
 */
export type LoginResponse = {
  /** 状态码 */
  code: number;
  /** 是否成功 */
  success: boolean;
  /** 承载数据 */
  data: AuthInfo;
  /** 返回消息 */
  msg: string;
};

/**
 * 微信扫码登录二维码响应
 */
export type WechatQRCodeResponse = {
  /** 微信二维码 ticket，用于轮询校验 */
  ticket: string;
  /** 二维码内容 URL */
  url: string;
  /** 过期秒数 */
  expire_seconds: number;
};

/**
 * 微信扫码轮询 data 结构（已关注时返回）
 */
export type WechatScanData = {
  id: string;
  ticket: string;
  unionid: string;
  senceid: number;
  nickName: string;
  status: number;
  openid: string;
};

/**
 * 微信扫码结果响应
 */
export type WechatScanResultResponse = WechatScanData | null;

/**
 * 微信绑定手机号请求
 */
export type WechatBindPhoneRequest = {
  phone: string;
  unionId: string;
};

/**
 * 微信绑定手机号响应
 * 后端 /wx/bindUserLoginForUniversity 与 /wx/loginByUnionIdForUniversity 返回同一 RAuthInfo 结构，
 * 经请求拦截器拆包后直接得到 AuthInfo，没有 { token, userInfo } 包装层。
 */
export type WechatBindPhoneResponse = AuthInfo | null;

/**
 * 微信 UnionId 登录响应
 */
export type WechatLoginByUnionIdResponse = AuthInfo | null;

/**
 * 教师认证信息（存储在 store 中）
 */
export type TeacherAuthInfo = {
  accessToken: string;
  userId: number;
  username: string;
  account: string;
  avatar: string;
  roleId: number;
  roleName: string;
  tenantId: number;
  tenantName: string;
  teacherId: number;
  type: number;
};

/**
 * 拼图验证码响应数据
 */
export type CaptchaData = {
  /** 随机字符串 */
  ticket: string;
  /** 验证值 */
  value?: string;
  /** 生成的画布base64 */
  canvasSrc: string;
  /** 画布宽度 */
  canvasWidth: number;
  /** 画布高度 */
  canvasHeight: number;
  /** 生成的阻塞块base64 */
  blockSrc: string;
  /** 阻塞块宽度 */
  blockWidth: number;
  /** 阻塞块高度 */
  blockHeight: number;
  /** 阻塞块凸凹半径 */
  blockRadius: number;
  /** 阻塞块的横轴坐标 */
  blockX: number;
  /** 阻塞块的纵轴坐标 */
  blockY: number;
  /** 图片获取位置 */
  place: number;
};

// 从 constants 重新导出枚举
export { CaptchaTypeEnum } from '@/teacher/constants/auth';
