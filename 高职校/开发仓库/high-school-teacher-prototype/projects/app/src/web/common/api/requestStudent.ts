import axios, {
  type Method,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosProgressEvent
} from 'axios';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getHuayunAiUrl } from './apiProxy';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import dayjs from 'dayjs';
import { safeEncodeURIComponent } from '@/web/common/utils/uri';
import { isMockMode, resolveMockRequest } from '@/mocks/engine';

interface ConfigType {
  headers?: { [key: string]: string };
  timeout?: number;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  cancelToken?: AbortController;
  maxQuantity?: number;
  withCredentials?: boolean;
  baseURL?: string;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
}

interface ResponseDataType {
  code: number;
  message: string;
  data: any;
}

const maxQuantityMap: Record<
  string,
  | undefined
  | {
      id: string;
      sign: AbortController;
    }[]
> = {};

function checkMaxQuantity({ url, maxQuantity }: { url: string; maxQuantity?: number }) {
  if (!maxQuantity) return {};
  const item = maxQuantityMap[url];
  const id = getNanoid();
  const sign = new AbortController();

  if (item && item.length > 0) {
    if (item.length >= maxQuantity) {
      const firstSign = item.shift();
      firstSign?.sign.abort();
    }
    item.push({ id, sign });
  } else {
    maxQuantityMap[url] = [{ id, sign }];
  }
  return {
    id,
    abortSignal: sign?.signal
  };
}

function requestFinish({ signId, url }: { signId?: string; url: string }) {
  const item = maxQuantityMap[url];
  if (item) {
    if (signId) {
      const index = item.findIndex((item) => item.id === signId);
      if (index !== -1) {
        item.splice(index, 1);
      }
    }
    if (item.length <= 0) {
      delete maxQuantityMap[url];
    }
  }
}

/**
 * 获取系统登录 Token
 */
function getStudentToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('student_access_token') || localStorage.getItem('system_access_token')
  );
}

/**
 * 请求开始 - 自动添加 Authorization Header
 */
function startInterceptors(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (config.headers) {
    const studentToken = getStudentToken();
    if (studentToken) {
      // 如果 token 已包含 Bearer 前缀，则不再添加
      const authHeader = studentToken.startsWith('Bearer ')
        ? studentToken
        : `Bearer ${studentToken}`;
      config.headers['Authorization'] = authHeader;
    }
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      config.headers['Language'] = 'zh-CN';
    }
  }
  return config;
}

/**
 * 请求成功
 */
function responseSuccess(response: AxiosResponse<ResponseDataType>) {
  return response;
}

/**
 * 响应数据检查
 */
function checkRes(data: ResponseDataType) {
  console.log('requestStudent checkRes:', data);
  if (data === undefined) {
    console.log('student request error->', 'data is empty');
    return Promise.reject('服务器异常');
  }
  // 支持多种成功状态码: 0, 200-399
  const isSuccess = data.code === 0 || (data.code >= 200 && data.code < 400);
  if (!isSuccess) {
    console.log('requestStudent 业务错误:', data);
    return Promise.reject(data);
  }
  console.log('requestStudent 返回 data:', data.data);
  return data.data;
}

/**
 * 响应错误 - 学生端专用处理
 */
function responseError(err: any) {
  console.log('student request error->', err);
  const pathname = window.location.pathname;

  const data = err?.response?.data || err;

  if (!err) {
    return Promise.reject({ message: '未知错误' });
  }
  if (typeof err === 'string') {
    return Promise.reject({ message: err });
  }
  if (typeof data === 'string') {
    return Promise.reject(data);
  }

  // Token 错误，重定向到统一登录页
  if (data?.code === 403 || data?.code === 401) {
    localStorage.removeItem('system_access_token');
    localStorage.removeItem('course-auth-user');
    localStorage.removeItem('course-selected-role');
    localStorage.removeItem('teacher_access_token');
    localStorage.removeItem('student_access_token');
    window.location.replace(
      getWebReqUrl(
        `/login?lastRoute=${safeEncodeURIComponent(location.pathname + location.search)}`
      )
    );
    return Promise.reject({ message: '登录已过期' });
  }

  return Promise.reject(data);
}

/* 创建请求实例 */
const instance = axios.create({
  timeout: 60000,
  withCredentials: true
});

/* 请求拦截 */
instance.interceptors.request.use(startInterceptors, (err) => Promise.reject(err));
/* 响应拦截 */
instance.interceptors.response.use(responseSuccess, (err) => Promise.reject(err));

function request(
  url: string,
  data: any,
  { cancelToken, maxQuantity, withCredentials, baseURL, responseType, ...config }: ConfigType,
  method: Method
): any {
  /* 去空 */
  for (const key in data) {
    const val = data[key];
    if (data[key] === undefined) {
      delete data[key];
    } else if (val instanceof Date) {
      data[key] = dayjs(val).format();
    }
  }

  if (isMockMode) {
    return resolveMockRequest({ method, url, data, responseType });
  }

  const { id: signId, abortSignal } = checkMaxQuantity({ url, maxQuantity });

  // 学生端 API 路径以 /huayun-ai 开头，不需要再加 /api
  return instance
    .request({
      baseURL: baseURL || getHuayunAiUrl('/huayun-ai'),
      url,
      method,
      data: ['POST', 'PUT'].includes(method) ? data : undefined,
      params: !['POST', 'PUT'].includes(method) ? data : undefined,
      signal: cancelToken?.signal ?? abortSignal,
      withCredentials,
      responseType,
      ...config
    })
    .then((res) => checkRes(res.data))
    .catch((err) => responseError(err))
    .finally(() => requestFinish({ signId, url }));
}

export function GET<T = undefined>(url: string, params = {}, config: ConfigType = {}): Promise<T> {
  return request(url, params, config, 'GET');
}

export function POST<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'POST');
}

export function PUT<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'PUT');
}

export function DELETE<T = undefined>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'DELETE');
}

export {
  maxQuantityMap,
  checkMaxQuantity,
  requestFinish,
  startInterceptors,
  responseSuccess,
  checkRes,
  responseError,
  instance,
  request
};
