/**
 * AI 课程封面生成 API
 *
 * 后端走 /huayun-tool/api/chat/commonBusiness，由后端代理图片生成模型调用，
 * 避免在前端 bundle 中暴露任何 API Key。
 */
import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';

const baseURL = getProxyUrl('/huayun-tool');

type GenerateCoverParams = {
  courseName: string;
  courseTheme: string;
  styleType: string;
};

type CommonBusinessResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: { content?: string };
          }>;
    };
  }>;
};

type InnerPayload = {
  code: number;
  message?: string;
  data: string;
};

function extractImageUrl(resp: CommonBusinessResponse): string {
  const content = resp?.choices?.[0]?.message?.content;

  let raw: string | undefined;
  if (typeof content === 'string') {
    raw = content.trim();
  } else if (Array.isArray(content)) {
    const lastText = [...content].reverse().find((p) => p?.text?.content?.trim());
    raw = lastText?.text?.content?.trim();
  }

  if (!raw) {
    throw new Error('生成失败：返回内容为空');
  }

  let inner: InnerPayload;
  try {
    inner = JSON.parse(raw) as InnerPayload;
  } catch {
    throw new Error('生成失败：返回内容格式错误');
  }

  if (inner.code !== 200 || !inner.data) {
    throw new Error(inner.message || '生成失败');
  }
  return inner.data;
}

export const generateCourseCover = async (
  params: GenerateCoverParams,
  cancelToken?: AbortController
): Promise<string> => {
  const resp = await POST<CommonBusinessResponse>(
    '/api/chat/commonBusiness',
    {
      businessType: 'courseCoverGeneration',
      stream: false,
      variables: params,
      messages: [
        {
          role: 'user',
          content: '测试一次调用智能体的请求'
        }
      ]
    },
    { baseURL, cancelToken, timeout: 120000 }
  );
  return extractImageUrl(resp);
};
