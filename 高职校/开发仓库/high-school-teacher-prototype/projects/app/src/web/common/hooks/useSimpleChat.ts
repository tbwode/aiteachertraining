import { useCallback, useRef, useState } from 'react';
import { streamFetch } from '@/web/common/api/fetch';
import { SseResponseEventEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import { getAgentDetailByAppointedType } from '@/common/api/agent';
import { AgentAppointedTypeEnum } from '@/student/types/agent';

// 生成随机 chatId
const generateChatId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// 文件/图片项类型
export type ChatFileItem = {
  url: string;
  name?: string;
  key?: string;
};

// 导出枚举供外部使用
export { AgentAppointedTypeEnum };

export type SendMessageProps = {
  appId?: string; // 应用ID，与 type 二选一
  type?: AgentAppointedTypeEnum | number; // 业务类型，传此值会自动获取对应的 appId
  input: string;
  variables?: Record<string, any>;
  files?: string[];
  images?: string[];
  chatId?: string;
  stream?: boolean; // 是否流式输出，默认 true
  jsonFormat?: boolean; // 是否将返回内容解析为 JSON
  onMessage?: (text: string, reasoningText?: string) => void;
  onFinish?: (fullText: string, responseJson?: any) => void;
  onError?: (error: Error) => void;
};

export type UseSimpleChatReturn = {
  sendMessage: (props: SendMessageProps) => Promise<{ responseText: string; responseJson: any }>;
  abort: () => void;
  loading: boolean;
  responseText: string;
  responseJson: any;
};

/**
 * 简化版聊天 Hook
 * 直接传入参数获取智能体输出，无需复杂的 Context 嵌套
 *
 * @example 流式输出（使用 appId）
 * const { sendMessage, loading, abort } = useSimpleChat();
 *
 * const handleSend = async () => {
 *   const response = await sendMessage({
 *     appId: 'xxx',
 *     input: '你好',
 *     variables: { dataset: [{ datasetId: 'xxx' }] },
 *     onMessage: (text) => console.log('实时:', text),
 *   });
 *   console.log('完整回复:', response);
 * };
 *
 * @example 使用 type（自动获取 appId）
 * const { sendMessage, loading } = useSimpleChat();
 *
 * const handleSend = async () => {
 *   const response = await sendMessage({
 *     type: AgentAppointedTypeEnum.COURSE_AI_TEACHER, // 传 type 自动获取对应 appId
 *     input: '你好',
 *     stream: false,
 *   });
 *   console.log('完整回复:', response);
 * };
 *
 * @example 非流式（当接口用）
 * const { sendMessage, loading } = useSimpleChat();
 *
 * const handleSend = async () => {
 *   const response = await sendMessage({
 *     appId: 'xxx',
 *     input: '你好',
 *     stream: false, // 关闭流式
 *   });
 *   // loading 自动变为 false 后，response 才是完整的
 *   console.log('完整回复:', response);
 * };
 */
export function useSimpleChat(): UseSimpleChatReturn {
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseJson, setResponseJson] = useState<any>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort('用户取消');
      abortCtrlRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    async ({
      appId,
      type,
      input,
      variables = {},
      files = [],
      images = [],
      chatId,
      stream = true,
      jsonFormat = false,
      onMessage,
      onFinish,
      onError
    }: SendMessageProps): Promise<{ responseText: string; responseJson: any }> => {
      // ===== 开发环境临时 mock：绕过 FastGPT 403 权限问题 =====
      if (process.env.NODE_ENV === 'development' && !appId && type) {
        console.log('[DEV MOCK] useSimpleChat type=' + type, input);
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);

        // type 29 = AI教学大纲分析
        if (type === 29) {
          const mockSyllabus = {
            course_name: '《计算机组成原理》',
            chapters: [
              {
                chapter_name: '第一章 计算机系统概述',
                openMode: 'unlimited',
                openTime: '',
                sections: [
                  { section_name: '1.1 计算机发展历史', openMode: 'unlimited', openTime: '', topics: ['计算机发展史', '硬件演进'] },
                  { section_name: '1.2 计算机系统层次结构', openMode: 'unlimited', openTime: '', topics: ['系统层次', '软硬件接口'] }
                ]
              },
              {
                chapter_name: '第二章 数据的表示和运算',
                openMode: 'unlimited',
                openTime: '',
                sections: [
                  { section_name: '2.1 数制与编码', openMode: 'unlimited', openTime: '', topics: ['二进制', '补码', '浮点数'] },
                  { section_name: '2.2 定点数运算', openMode: 'unlimited', openTime: '', topics: ['加减乘除', '溢出判断'] }
                ]
              },
              {
                chapter_name: '第三章 存储系统',
                openMode: 'unlimited',
                openTime: '',
                sections: [
                  { section_name: '3.1 存储器概述', openMode: 'unlimited', openTime: '', topics: ['存储层次', 'Cache原理'] },
                  { section_name: '3.2 主存储器', openMode: 'unlimited', openTime: '', topics: ['DRAM', 'SRAM', 'ROM'] }
                ]
              }
            ]
          };
          const responseText = JSON.stringify(mockSyllabus);
          onFinish?.(responseText, mockSyllabus);
          return { responseText, responseJson: mockSyllabus };
        }

        // type 28 = 知识匹配分析
        if (type === 28) {
          const tree = variables?.tree;
          const mockChapters = (tree?.chapters || []).map((ch: any) => ({
            chapter_name: ch.chapter_name || '章节',
            sections: (ch.sections || []).map((sec: any, idx: number) => ({
              section_name: sec.section_name || '小节',
              status: idx % 3 === 0 ? '部分覆盖' : '已覆盖'
            }))
          }));
          const mockMatch = { chapters: mockChapters };
          const responseText = JSON.stringify(mockMatch);
          onFinish?.(responseText, mockMatch);
          return { responseText, responseJson: mockMatch };
        }
      }
      // ===== mock 结束 =====

      // 取消之前的请求
      abort();

      setLoading(true);
      setResponseText('');
      setResponseJson(null);

      // 校验参数：appId 和 type 必须传一个
      if (!appId && !type) {
        const error = new Error('appId 和 type 必须传一个');
        onError?.(error);
        setLoading(false);
        throw error;
      }

      // 如果传了 type，通过 API 获取 appId
      let finalAppId = appId;
      if (type) {
        try {
          const agentDetail = await getAgentDetailByAppointedType({ appointedType: type });
          if (!agentDetail?.fastgptAppId) {
            const error = new Error(`未找到类型 ${type} 对应的智能体`);
            onError?.(error);
            setLoading(false);
            throw error;
          }
          finalAppId = agentDetail.fastgptAppId;
        } catch (error: any) {
          const err =
            error instanceof Error ? error : new Error(error?.message || '获取智能体信息失败');
          onError?.(err);
          setLoading(false);
          throw err;
        }
      }

      if (!finalAppId) {
        const error = new Error('无法获取有效的 appId');
        onError?.(error);
        setLoading(false);
        throw error;
      }

      const abortCtrl = new AbortController();
      abortCtrlRef.current = abortCtrl;

      // 构建消息 - 适配 chats2GPTMessages 格式
      // https://github.com/anthropics/anthropic-cookbook/blob/main/patterns/multimodal/building_blocks/combined.ipynb
      const contentParts: any[] = [
        {
          type: 'text',
          text: input
        }
      ];

      // 添加图片文件
      images?.forEach((url) => {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url
          }
        });
      });

      // 添加普通文件
      files?.forEach((url) => {
        const name = url.split('/').pop() || url;
        contentParts.push({
          type: 'file_url',
          name: name.split('.')[0],
          url
        });
      });

      const messages = [
        {
          role: 'user' as const,
          content: contentParts
        }
      ];

      // 如果没有传 chatId，随机生成一个
      const finalChatId = chatId || generateChatId();

      let fullText = '';
      let currentReasoningText = '';

      try {
        const result = await streamFetch({
          data: {
            appId: finalAppId,
            chatId: finalChatId,
            messages,
            variables
          },
          abortCtrl,
          onMessage: ({ event, text, reasoningText }) => {
            if (
              event === SseResponseEventEnum.answer ||
              event === SseResponseEventEnum.fastAnswer
            ) {
              if (text) {
                fullText += text;
                // 只有流式模式才实时更新 state 和回调
                if (stream) {
                  setResponseText(fullText);
                  onMessage?.(fullText, currentReasoningText);
                }
              }
              if (reasoningText) {
                currentReasoningText = reasoningText;
              }
            }
          }
        });

        // 非流式模式下，最后统一设置结果
        if (!stream) {
          setResponseText(result.responseText);
        }

        // 如果需要 JSON 格式，解析返回内容
        let parsedJson = null;
        if (jsonFormat && result.responseText) {
          let textToParse = result.responseText.trim();

          // 尝试提取 markdown 代码块中的 JSON
          const codeBlockMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            textToParse = codeBlockMatch[1].trim();
          }

          // 如果还不是有效 JSON，尝试从文本中提取第一个 JSON 对象/数组
          if (!textToParse.startsWith('{') && !textToParse.startsWith('[')) {
            const jsonMatch = textToParse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (jsonMatch) {
              textToParse = jsonMatch[1].trim();
            }
          }

          try {
            parsedJson = JSON.parse(textToParse);
            setResponseJson(parsedJson);
          } catch (e) {
            setResponseJson(null);
            const parseError = new Error(
              `返回内容不是有效的 JSON 格式: ${e instanceof Error ? e.message : '解析失败'}`
            );
            onError?.(parseError);
            throw parseError;
          }
        }

        onFinish?.(result.responseText, parsedJson);
        return { responseText: result.responseText, responseJson: parsedJson };
      } catch (error: any) {
        const err = error instanceof Error ? error : new Error(error?.message || '请求失败');
        // 如果错误已经被 onError 处理过（如 JSON 解析错误），不再重复触发
        if (!err.message.includes('JSON')) {
          onError?.(err);
        }
        throw err;
      } finally {
        setLoading(false);
        abortCtrlRef.current = null;
      }
    },
    [abort]
  );

  return {
    sendMessage,
    abort,
    loading,
    responseText,
    responseJson
  };
}

export default useSimpleChat;
