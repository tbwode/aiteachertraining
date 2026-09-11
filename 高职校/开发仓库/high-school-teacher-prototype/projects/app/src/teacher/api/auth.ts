/**
 * 教师端认证相关 API
 */
import { GET, POST } from '@/web/common/api/requestTeacher';
import type {
  LoginParams,
  AuthInfo,
  CaptchaData,
  ClientAuthResetPwdParams,
  ClientUserFirstUpdatePwdParams,
  TokenLoginRes,
  WechatQRCodeResponse,
  WechatScanResultResponse,
  WechatBindPhoneRequest,
  WechatBindPhoneResponse,
  WechatLoginByUnionIdResponse
} from '../types/auth';

/**
 * 教师登录
 * @param data 登录参数
 * @returns 登录响应数据
 */
export const postLogin = (data: LoginParams): Promise<AuthInfo> =>
  POST<AuthInfo>('/client/auth/university/login', data);

/**
 * Token 单点登录
 * @param token URL 中携带的 token
 * @returns 登录响应数据
 */
export const getTokenLogin = (token: string): Promise<TokenLoginRes> =>
  POST<TokenLoginRes>(
    '/client/auth/token',
    {},
    {
      maxQuantity: 1,
      headers: {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    }
  );

/**
 * 退出登录
 */
export const postTeacherLogout = (): Promise<void> => POST<void>('/client/auth/logout');

/**
 * 刷新 token
 */
export const postRefreshToken = (): Promise<{ accessToken: string }> =>
  POST<{ accessToken: string }>('/client/auth/refresh');

/**
 * 获取拼图验证码
 * @returns 验证码数据
 */
export const getCaptcha = (): Promise<CaptchaData> => POST<CaptchaData>('/client/auth/getCaptcha');

/**
 * 发送短信验证码
 */
export const getClientUserSmsCode = ({
  bizType,
  mobile,
  newMobile,
  ticket,
  moveLength,
  accessToken
}: {
  bizType: number;
  mobile: string;
  newMobile?: string;
  ticket?: string;
  moveLength?: number;
  accessToken?: string;
}): Promise<any> => {
  const searchParams = new URLSearchParams({
    bizType: String(bizType),
    mobile
  });
  const normalizedMoveLength =
    moveLength !== undefined && Number.isFinite(moveLength) ? Math.trunc(moveLength) : undefined;

  if (newMobile) {
    searchParams.set('newMobile', newMobile);
  }
  if (ticket !== undefined) {
    searchParams.set('ticket', ticket);
  }
  if (normalizedMoveLength !== undefined) {
    searchParams.set('moveLength', String(normalizedMoveLength));
  }

  return POST(`/client/user/smsCode?${searchParams.toString()}`, '', {
    headers: accessToken
      ? {
          Authorization: accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
        }
      : {}
  });
};

/**
 * 校验短信验证码
 */
export const postValidSmsCode = (params: {
  bizType: number;
  code: string;
  mobile: string;
}): Promise<any> => {
  const searchParams = new URLSearchParams({
    bizType: String(params.bizType),
    code: params.code,
    mobile: params.mobile
  });
  return POST(`/client/user/valid?${searchParams.toString()}`, '');
};

/**
 * 更换用户手机号
 */
export const postChangePhoneNum = (data: {
  bizType: number;
  mobile: string;
  code: string;
}): Promise<any> => POST('/client/user/changePhoneNum', data);

/**
 * 首次登录修改密码
 */
export const postTeacherFirstUpdatePwd = (
  data: ClientUserFirstUpdatePwdParams,
  accessToken: string
): Promise<void> =>
  POST<void>('/client/user/university/first/update', data, {
    headers: {
      Authorization: accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
    }
  });

/**
 * 忘记密码 - 重置密码
 */
export const postResetPwd = (data: ClientAuthResetPwdParams): Promise<void> =>
  POST<void>('/client/auth/resetPwd', data);

// ========== 微信扫码登录 ==========

/**
 * 获取微信扫码二维码
 */
export const getWechatQRCode = (): Promise<WechatQRCodeResponse> =>
  GET<WechatQRCodeResponse>('/wx/getLoginQRCode');

/**
 * 查询微信扫码状态
 */
export const getWechatScanResult = (ticket: string): Promise<WechatScanResultResponse> =>
  GET<WechatScanResultResponse>('/wx/getLoginQRCodeResult', { ticket });

/**
 * 根据 UnionId 登录
 */
export const getWechatLoginByUnionId = (unionId: string): Promise<WechatLoginByUnionIdResponse> =>
  GET<WechatLoginByUnionIdResponse>('/wx/loginByUnionIdForUniversity', { unionId });

/**
 * 微信绑定手机号并登录
 */
export const postWechatBindUserLogin = (
  data: WechatBindPhoneRequest
): Promise<WechatBindPhoneResponse> =>
  POST<WechatBindPhoneResponse>('/wx/bindUserLoginForUniversity', data);
