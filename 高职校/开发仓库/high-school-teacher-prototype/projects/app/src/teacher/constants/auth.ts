/**
 * 验证码类型枚举
 */
export enum CaptchaTypeEnum {
  /** 登录 */
  LOGIN = 1,
  /** 注册 */
  REGISTER = 2,
  /** 找回密码 */
  FORGET_PASSWORD = 3,
  /** 修改密码 */
  CHANGE_PASSWORD = 4,
  /** 绑定手机 */
  BIND_PHONE = 5,
  /** 解绑手机 */
  UNBIND_PHONE = 6,
  /** 发送短信 */
  SEND_SMS = 7
}

/**
 * 用户角色类型枚举
 */
export enum UserRoleTypeEnum {
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
 * 租户类型枚举
 */
export enum TenantTypeEnum {
  /** 单校 */
  SINGLE = 0,
  /** 集团校 */
  GROUP = 1,
  /** 集团子校 */
  GROUP_SUB = 2
}

/**
 * 性别枚举
 */
export enum GenderEnum {
  /** 默认/未知 */
  DEFAULT = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2
}
