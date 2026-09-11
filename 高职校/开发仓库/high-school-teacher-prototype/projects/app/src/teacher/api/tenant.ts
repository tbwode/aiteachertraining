/**
 * 租户管理相关 API
 */
import { POST } from '@/web/common/api/requestTeacher';

/**
 * 获取知雀跳转链接
 * @returns 知雀跳转链接字符串
 */
export const postZhiqueRedirectUrl = (): Promise<string> =>
  POST<string>('/client/tenant/zhique/redirectUrl');

/**
 * 获取智汇空间跳转链接
 * @returns 智汇空间跳转链接字符串
 */
export const postZhihuiSpaceRedirectUrl = (): Promise<string> =>
  POST<string>('/client/tenant/fastgpt/redirectUrl');
