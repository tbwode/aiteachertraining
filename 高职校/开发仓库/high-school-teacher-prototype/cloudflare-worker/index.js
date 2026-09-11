/**
 * Cloudflare Worker - API Proxy
 * 代理前端请求到国内后端服务，解决 Vercel 502 问题
 */

const ALLOWED_ORIGINS = [
  'https://app-two-liart-20.vercel.app',
  'https://app-tbwodes-projects.vercel.app',
  'https://app-tbwode-tbwodes-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3388'
];

// 后端服务映射
const BACKEND_MAP = {
  '/api/': 'https://ai-course-fast-pre.hwzxs.com',
  '/huayun-ai/': 'https://high-school-01.huayungpt.com',
  '/ai-notice/': 'https://high-school-01.huayungpt.com',
  '/ai-university/': 'https://high-school-01.huayungpt.com',
  '/huayun-tool/': 'https://high-school-01.huayungpt.com'
};

function getAllowedOrigin(origin) {
  if (!origin) return '*';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // 允许所有 vercel.app 子域名
  if (origin.endsWith('.vercel.app')) return origin;
  return '*';
}

function createCORSHeaders(origin) {
  const allowedOrigin = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Token, X-Requested-With, X-Language, Language',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: createCORSHeaders(origin)
      });
    }

    // 查找匹配的后端
    let targetBase = null;
    let matchedPath = '';

    for (const [prefix, base] of Object.entries(BACKEND_MAP)) {
      if (url.pathname.startsWith(prefix)) {
        targetBase = base;
        matchedPath = prefix;
        break;
      }
    }

    if (!targetBase) {
      return new Response(JSON.stringify({ error: 'Not Found', path: url.pathname }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...createCORSHeaders(origin)
        }
      });
    }

    // 构建目标 URL
    const targetUrl = targetBase + url.pathname + url.search;

    // 复制请求头（排除 host 和 origin）
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'origin') {
        headers.set(key, value);
      }
    });

    // 创建转发请求
    const init = {
      method: request.method,
      headers: headers,
      body: request.body
    };

    try {
      // 转发请求到后端
      const response = await fetch(targetUrl, init);

      // 构建响应头（添加 CORS）
      const responseHeaders = new Headers(response.headers);
      const corsHeaders = createCORSHeaders(origin);
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Proxy Error', message: error.message }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...createCORSHeaders(origin)
          }
        }
      );
    }
  }
};
