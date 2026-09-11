/**
 * API 代理配置
 * 解决 Vercel 部署到国内后端 502 问题
 *
 * - 本地开发：使用 Next.js dev server 代理（相对路径）
 * - 生产环境：使用 Cloudflare Worker 代理
 */

const isProduction = process.env.NODE_ENV === 'production';

// Cloudflare Worker 代理地址（部署后替换为实际地址）
const CLOUDFLARE_WORKER_URL = 'https://high-school-api-proxy.tbwode.workers.dev';

// 需要代理的后端路径前缀
const PROXY_PREFIXES = ['/api', '/huayun-ai', '/ai-notice', '/ai-university', '/huayun-tool'];

/**
 * 判断路径是否需要代理
 */
const needsProxy = (path: string): boolean => {
  return PROXY_PREFIXES.some((prefix) => path.startsWith(prefix));
};

/**
 * 获取代理 URL
 * 生产环境下将后端路径代理到 Cloudflare Worker
 * @param path API 路径
 * @returns 完整的请求 URL
 */
export const getProxyUrl = (path: string): string => {
  if (!isProduction || !needsProxy(path)) {
    return path;
  }
  return `${CLOUDFLARE_WORKER_URL}${path}`;
};

/**
 * 获取 API 基础 URL（/api/* 路径）
 * @deprecated 请使用 getProxyUrl
 */
export const getApiUrl = (path: string): string => getProxyUrl(path);

/**
 * 获取教师端/学生端 API 基础 URL（/huayun-ai/* 等路径）
 * @deprecated 请使用 getProxyUrl
 */
export const getHuayunAiUrl = (path: string): string => getProxyUrl(path);
