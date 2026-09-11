// 学生认证相关常量

/**
 * 性别枚举
 */
export enum GenderEnum {
  /** 默认 */
  DEFAULT = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2
}

/**
 * 角色类型枚举
 */
export enum RoleTypeEnum {
  /** 未绑定 */
  UNBOUND = 0,
  /** 学生 */
  STUDENT = 1,
  /** 老师 */
  TEACHER = 2,
  /** 家长 */
  PARENT = 3
}

/**
 * 集团校类型枚举
 */
export enum SubTypeEnum {
  /** 单校 */
  SINGLE = 0,
  /** 集团校 */
  GROUP = 1,
  /** 集团子校 */
  GROUP_SUB = 2
}

/**
 * AI审核状态枚举
 */
export enum AiReviewEnum {
  /** 关闭 */
  DISABLED = 0,
  /** 开启 */
  ENABLED = 1
}

/**
 * Token 存储键名
 */
export const STUDENT_TOKEN_KEY = 'student_access_token';

/**
 * 用户信息存储键名
 */
export const STUDENT_USER_KEY = 'student_user_info';
