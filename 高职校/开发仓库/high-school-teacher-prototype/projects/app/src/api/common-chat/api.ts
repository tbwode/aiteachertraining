import axios from 'axios';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  AgentChatRequest,
  AgentChatResponse,
  GetConversationListRequest,
  GetConversationListResponse,
  GetConversationDetailResponse,
  CourseOption
} from '@/types/common-chat';
import { isMockMode, resolveMockRequest } from '@/mocks/engine';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('system_access_token');
}

function getLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('i18nextLng');
  if (!raw) return null;
  const normalized = raw.toLowerCase().replace(/_/g, '-');
  if (normalized.startsWith('zh')) {
    if (normalized.includes('hant') || normalized.includes('hk') || normalized.includes('tw')) {
      return 'zh-HK';
    }
    return 'zh-CN';
  }
  if (normalized.startsWith('en')) {
    return 'en-US';
  }
  return raw;
}

function commonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  const language = getLanguage();
  if (language) {
    headers.language = language;
  }
  return headers;
}

function injectLanguage(data: AgentChatRequest): AgentChatRequest {
  const language = getLanguage();
  if (!language) return data;
  return {
    ...data,
    variables: {
      ...data.variables,
      language
    }
  };
}

// 改为相对路径，域名交给环境层决定：dev 由 next.co1nfig rewrites 代理，prod 由 nginx 反代
const MAIC_BASE_URL = getProxyUrl('/huayun-ai');
const GPT_BASE_URL = getProxyUrl('/huayun-ai');

const agentChatInstance = axios.create({
  baseURL: GPT_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

agentChatInstance.interceptors.request.use((config) => {
  Object.assign(config.headers, commonHeaders());
  return config;
});

/**
 * Agent 对话接口（非流式）
 */
export const agentChat = (data: AgentChatRequest) => {
  const payload = injectLanguage(data);
  if (isMockMode) {
    return resolveMockRequest<AgentChatResponse>({
      method: 'POST',
      url: '/client/ai-base/agent/chat',
      data: payload
    });
  }
  return agentChatInstance
    .post<AgentChatResponse>('/client/ai-base/agent/chat', payload)
    .then((res) => res.data);
};

/**
 * Agent 对话接口（SSE 流式）
 */
export const agentChatStream = async (
  data: AgentChatRequest,
  onChunk: (chunk: string) => void,
  onCustomEvent?: (eventName: string, eventData: any) => void,
  onInterrupt?: (interruptData: any) => void,
  onToolStart?: (toolName: string, toolInput: any) => void,
  onToolEnd?: (toolName: string, toolOutput: any) => void,
  timeoutMs = 3 * 600000 // 默认 30 分钟，可覆盖
): Promise<void> => {
  if (isMockMode) {
    const question = data.user_question?.trim();
    onChunk(
      question
        ? `这是 Mock AI 助手对“${question}”的演示回复。当前原型不会向后端或大模型发送任何数据。`
        : '这是 Mock AI 助手的演示回复。当前原型不会向后端或大模型发送任何数据。'
    );
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${GPT_BASE_URL}/client/ai-base/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...commonHeaders()
      },
      body: JSON.stringify(injectLanguage(data)),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    if (!res.body) throw new Error('Response body is null');

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (process.env.NODE_ENV === 'development') {
            console.log('[SSE event]', parsed.event, JSON.stringify(parsed, null, 2));
          }
          if (
            (parsed.event === 'on_chat_model_stream' || parsed.event === 'chat_stream') &&
            typeof parsed.content === 'string'
          ) {
            onChunk(parsed.content);
          }
          if ((parsed.event === 'on_custom_event' || parsed.event === 'custom') && onCustomEvent) {
            onCustomEvent(parsed.name, parsed.data);
          }
          if (parsed.event === 'interrupt' && onInterrupt) {
            onInterrupt(parsed.data);
          }
          if (parsed.event === 'on_tool_start' && onToolStart) {
            onToolStart(parsed.name, parsed.input);
          }
          if (parsed.event === 'on_tool_end' && onToolEnd) {
            onToolEnd(parsed.name, parsed.output);
          }
          if (parsed.event === 'over') {
            return;
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * 查询历史会话列表
 */

const gptInstance = axios.create({
  baseURL: GPT_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

gptInstance.interceptors.request.use((config) => {
  Object.assign(config.headers, commonHeaders());
  return config;
});

export const getConversationList = (params: GetConversationListRequest) =>
  isMockMode
    ? resolveMockRequest<GetConversationListResponse>({
        method: 'GET',
        url: '/client/ai-base/conversations',
        data: params
      })
    : gptInstance
        .get<GetConversationListResponse>('/client/ai-base/conversations', { params })
        .then((res) => res.data);

/**
 * 查询单个会话详情
 */
export const getConversationDetail = (chatId: string) =>
  isMockMode
    ? resolveMockRequest<GetConversationDetailResponse>({
        method: 'GET',
        url: `/client/ai-base/conversations/${chatId}`
      })
    : gptInstance
        .get<GetConversationDetailResponse>(`/client/ai-base/conversations/${chatId}`)
        .then((res) => res.data);

/**
 * 删除单个会话
 */
export const deleteConversation = (chatId: string) =>
  isMockMode
    ? resolveMockRequest({ method: 'DELETE', url: `/client/ai-base/conversations/${chatId}` })
    : gptInstance.delete(`/client/ai-base/conversations/${chatId}`).then((res) => res.data);

/**
 * 查询当前教师授课课程列表
 */
export const getTeacherCourses = () =>
  isMockMode
    ? resolveMockRequest<{ data: CourseOption[] }>({
        method: 'GET',
        url: '/api/v1/teacher/courses'
      })
    : agentChatInstance
        .get<{ data: CourseOption[] }>('/api/v1/teacher/courses')
        .then((res) => res.data);

/* ==================== MAIC Outline ==================== */

export type MaicOutlineSceneRequest = {
  description?: string;
  estimatedDuration?: number;
  interactiveConfig?: Record<string, any>;
  keyPoints?: string[];
  orderNum?: number;
  quizConfig?: Record<string, any>;
  sceneId?: string;
  suggestedImageIds?: Record<string, any>[];
  teachingObjective?: string;
  title?: string;
  type: string;
};

export type StateInfo = {
  description?: string;
  name: string;
  style?: number;
};

export type CreateOutlineRequest = {
  agentIds?: number[];
  allOutlines?: MaicOutlineSceneRequest[];
  imageMapping?: Record<string, any>;
  languageDirective?: string;
  pdfImages?: Record<string, any>;
  stateInfo?: StateInfo;
};

export type CreateOutlineResponse = {
  code: number;
  success: boolean;
  data?: {
    id: string;
    taskId: string;
    url: string;
    name: string;
  };
  msg: string;
};

/**
 * 创建 MAIC 大纲
 */
export const createMaicOutline = (data: CreateOutlineRequest) =>
  isMockMode
    ? resolveMockRequest<CreateOutlineResponse>({
        method: 'POST',
        url: '/client/maicOutlineConfig/create',
        data
      })
    : gptInstance
        .post<CreateOutlineResponse>('/client/maicOutlineConfig/create', data, {
          baseURL: MAIC_BASE_URL
        })
        .then((res) => res.data);

export type GetOutlineDetailResponse = {
  code: number;
  success: boolean;
  data?: {
    taskId: string;
    status: number;
    content?: string;
  };
  msg: string;
};

/**
 * 根据 taskId 查询 MAIC 大纲详情
 */
export const getMaicOutlineDetail = (taskId: string) =>
  isMockMode
    ? resolveMockRequest<GetOutlineDetailResponse>({
        method: 'GET',
        url: '/client/maicOutlineConfig/detail',
        data: { taskId }
      })
    : gptInstance
        .get<GetOutlineDetailResponse>('/client/maicOutlineConfig/detail', {
          params: { taskId },
          baseURL: MAIC_BASE_URL
        })
        .then((res) => res.data);

/* ==================== Digital Courseware ==================== */

export type CreateDigitalCoursewareRequest = {
  chatId: string;
};

export type CreateDigitalCoursewareResponse = {
  code: number;
  success: boolean;
  data: boolean;
  msg: string;
};

const AI_UNIVERSITY_BASE_URL = getProxyUrl('/ai-university');

/**
 * 创建数字课件记录
 */
export const createDigitalCourseware = (data: CreateDigitalCoursewareRequest) =>
  isMockMode
    ? resolveMockRequest<CreateDigitalCoursewareResponse>({
        method: 'POST',
        url: '/client/digital-courseware/create',
        data
      })
    : gptInstance
        .post<CreateDigitalCoursewareResponse>('/client/digital-courseware/create', data, {
          baseURL: AI_UNIVERSITY_BASE_URL
        })
        .then((res) => res.data);
