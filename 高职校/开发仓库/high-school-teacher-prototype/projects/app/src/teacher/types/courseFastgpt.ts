// courseFastgpt 相关类型定义

/**
 * Token 响应数据
 */
export type TokenResponse = {
  /** 域名 */
  domain: string;
  /** token */
  token: string;
  /** 生成聊天标题的智能体ID */
  titleAppId: string;
};

/**
 * 获取 courseFastgpt token 响应
 */
export type GetCourseFastgptTokenResponse = TokenResponse;
