import { isProduction } from '@fastgpt/global/common/system/constants';

/**
 * 获取 OpenMAIC 域名（不含结尾斜杠，便于直接拼接路径）
 *
 * - 非生产环境：https://ai-openmaic.huayuntiantu.com
 * - 生产环境：https://openmaic-pre.hwzxs.com
 *
 * 说明：环境判断依据 `isProduction`（即 `process.env.NODE_ENV === 'production'`），
 * 本地 `next dev` 为非生产，打包部署为生产。
 */
export const getOpenMaicBaseUrl = (): string =>
  isProduction ? 'https://openmaic-pre.hwzxs.com' : 'https://ai-openmaic.huayuntiantu.com';
