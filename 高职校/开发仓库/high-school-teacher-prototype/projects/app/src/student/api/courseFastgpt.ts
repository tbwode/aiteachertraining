import { POST } from '@/web/common/api/requestStudent';
import type { GetCourseFastgptTokenResponse } from '../types/courseFastgpt';

/**
 * 获取 courseFastgpt token
 * @returns Token 响应数据
 */
export const getCourseFastgptToken = () =>
  POST<GetCourseFastgptTokenResponse>('/client/courseFastgpt/token', {});
