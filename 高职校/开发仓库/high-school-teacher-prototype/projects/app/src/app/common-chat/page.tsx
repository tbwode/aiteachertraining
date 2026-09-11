'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, VStack, useColorModeValue, Spinner, Center, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import ChatHeader from './components/ChatHeader';
import MessageItem from './components/MessageItem';
import HistoryBar from './components/HistoryBar';
import ChatInput from './components/ChatInput';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import {
  agentChatStream,
  getConversationList,
  getConversationDetail,
  createMaicOutline
} from '@/api/common-chat/api';
import type {
  Message,
  Conversation,
  CourseOption,
  AttachmentFile,
  StudentLearningQueryEvent,
  StudentLearningDetailData
} from '@/types/common-chat';
import { useZhiqueRedirectUrl } from '@/teacher/hooks/tenant';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
  getAiAvatarList,
  getAvatarStudentsPage,
  getStudentConversationList
} from '@/teacher/api/aiTeacher';
import type { AiAvatarVO } from '@/teacher/types/aiTeacher';
import {
  summarizeConversations,
  avatarCourseName,
  toCourseProgress
} from './utils/studentLearning';

function findAnswersForMessage(
  allMessages: Array<{
    custom_events?: Array<{ data: Record<string, any> }>;
    tool_events?: Array<{
      tool_name: string;
      tool_input?: Record<string, any>;
      tool_output?: Record<string, any>;
    }>;
  }>,
  currentIndex: number
): Record<number, any> | null {
  const currentMsg = allMessages[currentIndex];
  const customQuestions = currentMsg.custom_events?.[0]?.data?.questions as
    | Array<{ name?: string }>
    | undefined;
  if (!customQuestions || customQuestions.length === 0) return null;

  // 从当前消息往后找，第一条有 ask_human_for_choice tool_event 的消息就是答案来源
  for (let i = currentIndex + 1; i < allMessages.length; i++) {
    const nextMsg = allMessages[i];
    const toolEvent = nextMsg.tool_events?.find((e) => e.tool_name === 'ask_human_for_choice');
    if (!toolEvent) continue;

    const raw = toolEvent.tool_output?.value;
    if (!raw || typeof raw !== 'string') continue;
    const match = raw.match(/content='(.*?)'\s+name=/s);
    if (!match) continue;

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const toolInputQuestions = toolEvent.tool_input?.questions as Array<{ name?: string }> | undefined;

    const result: Record<number, any> = {};
    customQuestions.forEach((q, idx) => {
      // 优先用 customQuestions 自己的 name，否则按索引取 tool_input 的 name
      const name = q.name || toolInputQuestions?.[idx]?.name;
      if (name && parsed[name] !== undefined) {
        result[idx] = parsed[name];
      }
    });

    if (Object.keys(result).length > 0) {
      console.log('[findAnswersForMessage] matched answers:', result);
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  return null;
}

const TEACHER_ACTIONS = [
  { key: 'create_ai_lecture', value: 'create_ai_lecture' },
  { key: 'create_material', value: 'create_material' },
  { key: 'create_course', value: 'create_course' },
  { key: 'ask_progress', value: 'ask_progress' }
];

const STUDENT_ACTIONS = [
  { key: 'create_ai_lecture_student', value: 'create_ai_lecture' },
  { key: 'learning_portrait', value: 'learning_portrait' }
];

export default function CommonChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReady = useTeacherPageI18n(['commonChat', 'workspace']);
  const { isStudent, user } = useAuth();
  const agentName = isStudent ? 'student_assistant' : 'teacher_assistant';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [activeQuickAction, setActiveQuickAction] = useState<string>('');
  const chatIdRef = useRef<string>(nanoid());
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<AttachmentFile[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const { getRedirectUrl, redirectUrl: zhiqueBaseUrl } = useZhiqueRedirectUrl();

  useEffect(() => {
    getRedirectUrl();
  }, [getRedirectUrl]);

  const displayMessages = useMemo(() => {
    return messages.map((msg: Message) => {
      if (msg.type === 'materialCreate') {
        const cwId = msg.data?.coursewareId;
        const sessonid = cwId || '';
        let redirectUrl = '#';
        if (zhiqueBaseUrl) {
          const stateObj = { redirect: `workspace?chatId=${sessonid}` };
          const state = encodeURIComponent(JSON.stringify(stateObj));
          const separator = zhiqueBaseUrl.includes('?') ? '&' : '?';
          redirectUrl = `${zhiqueBaseUrl}${separator}state=${state}`;
        }
        return {
          ...msg,
          data: {
            ...(msg.data ?? {}),
            redirectUrl
          }
        };
      }
      return msg;
    });
  }, [messages, zhiqueBaseUrl]);

  const bgPrimary = useColorModeValue('#fff', '#1a1a1a');
  const bgSecondary = useColorModeValue('#F9FAFB', '#2a2a2a');
  const borderColor = useColorModeValue('#E5E6EB', '#333');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationList = useCallback(() => {
    getConversationList({
      page: 1,
      page_size: 20,
      agent_name: isStudent ? 'student_assistant' : 'teacher_assistant'
    })
      .then((res) => {
        const list = res?.data?.items ?? [];
        const realEntries = list.map((item) => ({
          id: String(item.id),
          chatId: item.chat_id,
          title: item.title,
          updated_at: item.last_message_at || item.updated_at || item.created_at
        }));
        const realChatIds = new Set(realEntries.map((e) => e.chatId));

        setConversations((prev) => {
          const tempMap = new Map(
            prev.filter((c) => c.id.startsWith('temp-')).map((c) => [c.chatId, c])
          );
          // 如果 API 返回的标题为空，沿用乐观标题
          const merged = realEntries.map((e) => {
            if (!e.title) {
              const temp = tempMap.get(e.chatId);
              if (temp) return { ...e, title: temp.title };
            }
            return e;
          });
          const pendingTemps = prev.filter(
            (c) => c.id.startsWith('temp-') && !realChatIds.has(c.chatId)
          );
          return [...merged, ...pendingTemps];
        });
      })
      .catch(() => {
        // 保持现有列表不变
      });
  }, [isStudent]);

  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  /** patch studentLearningDetail 消息的 data */
  const patchLearningDetail = useCallback(
    (msgId: string, updater: (d: StudentLearningDetailData) => StudentLearningDetailData) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.type === 'studentLearningDetail'
            ? { ...m, data: updater(m.data as StudentLearningDetailData) }
            : m
        )
      );
    },
    []
  );

  /** 学员学情数据编排：解析 avatarId → 取课程进度 + AI 问答 */
  const fetchStudentLearningDetail = useCallback(
    async (msgId: string, query: StudentLearningQueryEvent) => {
      const teacherId = (user as any)?.teacherId;
      const searchKey = query.studentName || query.studentCode || query.rawQuery;

      try {
        // 1. 解析 avatarId（agent 给则用；否则遍历教师运行中分身前 6 个）
        let avatars: AiAvatarVO[] = [];
        let avatarIds: number[] = [];
        if (query.avatarId) {
          avatarIds = [query.avatarId];
        } else if (teacherId) {
          avatars = await getAiAvatarList({ teacherId, status: 1 }).catch(() => []);
          avatarIds = avatars.slice(0, 6).map((a) => a.id);
        }

        // 2. 并发查每个分身命中 searchKey 的学员
        const hits = await Promise.all(
          avatarIds.map((aid) =>
            getAvatarStudentsPage({ avatarId: aid, current: 1, size: 1, searchKey })
              .then((res) =>
                res?.records?.[0] ? { avatarId: aid, student: res.records[0] } : null
              )
              .catch(() => null)
          )
        );
        const found = hits.filter(Boolean) as { avatarId: number; student: any }[];

        if (found.length === 0) {
          patchLearningDetail(msgId, (d) => ({
            ...d,
            loading: { courses: false, conversation: false, suggestion: false },
            error: { studentNotFound: true }
          }));
          return;
        }

        // 补全 avatars 用于 courseName 映射
        if (avatars.length === 0 && teacherId) {
          avatars = await getAiAvatarList({ teacherId, status: 1 }).catch(() => []);
        }

        // 3. 课程进度（多课程）
        patchLearningDetail(msgId, (d) => ({
          ...d,
          studentId: found[0].student.studentId,
          className: found[0].student.className,
          courses: found.map((f) =>
            toCourseProgress(f.avatarId, avatarCourseName(f.avatarId, avatars), f.student)
          ),
          loading: { ...d.loading, courses: false }
        }));

        // 4. AI 问答（取第一个命中分身）
        const studentId = found[0].student.studentId;
        try {
          const groups = await getStudentConversationList({
            avatarId: found[0].avatarId,
            studentId
          });
          patchLearningDetail(msgId, (d) => ({
            ...d,
            conversation: summarizeConversations(groups ?? []),
            loading: { ...d.loading, conversation: false }
          }));
        } catch {
          patchLearningDetail(msgId, (d) => ({
            ...d,
            error: { ...d.error, conversation: 'failed' },
            loading: { ...d.loading, conversation: false }
          }));
        }
      } catch (e) {
        patchLearningDetail(msgId, (d) => ({
          ...d,
          loading: { courses: false, conversation: false, suggestion: false },
          error: { studentNotFound: true }
        }));
      }
    },
    [user, patchLearningDetail]
  );

  /** 处理 student_learning_query 事件：切消息类型 + 触发数据编排 */
  const handleStudentLearningQuery = useCallback(
    (streamMsgId: string, query: StudentLearningQueryEvent) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsgId
            ? {
                ...m,
                type: 'studentLearningDetail' as const,
                content: '',
                data: {
                  studentName: query.studentName || query.rawQuery,
                  studentCode: query.studentCode,
                  studentId: query.studentId,
                  courses: [],
                  conversation: null,
                  suggestion: '',
                  loading: { courses: true, conversation: true, suggestion: true }
                }
              }
            : m
        )
      );
      void fetchStudentLearningDetail(streamMsgId, query);
    },
    [fetchStudentLearningDetail]
  );

  const callAgentChat = useCallback(
    async (question: string, extraAttachments?: AttachmentFile[]) => {
      setIsLoading(true);
      const streamMsgId = `stream-${nanoid()}`;

      // 乐观插入新会话：用前15字作为临时标题，等流式完成后由 fetchConversationList 替换为真实标题
      const chatId = chatIdRef.current;
      const isNewConversation = !conversationsRef.current.some((c) => c.chatId === chatId);
      if (isNewConversation) {
        const optimisticTitle = question.slice(0, 15);
        setConversations((prev) => [
          {
            id: `temp-${chatId}`,
            chatId,
            title: optimisticTitle,
            updated_at: new Date().toISOString()
          },
          ...prev
        ]);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: streamMsgId,
          role: 'assistant',
          type: 'text',
          content: '',
          createdAt: Date.now()
        }
      ]);

      const files =
        extraAttachments && extraAttachments.length > 0 ? extraAttachments : attachmentsRef.current;

      // ⚠️ MOCK：教师问单学员学情示例（teacher_assistant agent 配置 student_learning_query 事件后可删除）
      if (!isStudent && /学情|学习情况/.test(question) && !/科目|课程整体|我教的/.test(question)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamMsgId
              ? {
                  ...m,
                  type: 'studentLearningDetail' as const,
                  content: '',
                  data: {
                    studentName: '张三',
                    studentCode: '20250101',
                    className: '机械工程1班',
                    courses: [
                      { avatarId: 1, courseName: '计算机网络', progress: 60, studyHours: 12, status: 1, lastLearnTime: '2026-07-01' },
                      { avatarId: 2, courseName: '机械制图', progress: 35, studyHours: 6, status: 2, lagDays: 5, lastLearnTime: '2026-06-25' },
                      { avatarId: 3, courseName: '机械原理', progress: 100, studyHours: 48, status: 3, lastLearnTime: '2026-06-20' }
                    ],
                    conversation: {
                      totalSessions: 8,
                      totalMessages: 24,
                      lastActiveTime: '2026-07-01 10:30',
                      keywords: [
                        { word: 'TCP', count: 6 },
                        { word: '三次握手', count: 5 },
                        { word: 'OSI模型', count: 4 },
                        { word: 'IP地址', count: 4 },
                        { word: '路由', count: 3 },
                        { word: '协议', count: 3 },
                        { word: '传输层', count: 3 },
                        { word: '网络层', count: 2 },
                        { word: '子网掩码', count: 2 },
                        { word: '端口号', count: 2 }
                      ]
                    },
                    analysis: {
                      strengths: [
                        '《机械原理》已 100% 完成，基础理论扎实',
                        'AI 问答活跃，聚焦计算机网络核心概念（TCP、OSI 模型），学习方向明确',
                        '《计算机网络》进度 60%，学习节奏正常'
                      ],
                      weaknesses: [
                        '《机械制图》进度仅 35%，滞后 5 天，实践能力偏弱需重点补齐',
                        '问答高频词集中在理论概念，缺少实操类问题，动手实践不足',
                        '最近活跃度一般，学习连贯性需加强'
                      ]
                    },
                    suggestion: '',
                    loading: { courses: false, conversation: false, suggestion: true }
                  }
                }
              : m
          )
        );
        const mockSuggestion = `根据张三同学的学习数据，建议如下：\n\n**1. 加强实践能力训练**\n当前《机械制图》进度 35%、滞后 5 天，建议尽快补齐，并选修实训项目强化动手能力。\n\n**2. 巩固计算机网络基础**\n《计算机网络》进度 60%，AI 问答聚焦在 TCP/IP 基础，建议继续深入理解协议原理。\n\n**3. 提升学习连贯性**\n最近活跃度"一般"，建议制定每日学习计划，保持连续学习，避免滞后扩大。`;
        let i = 0;
        const chunkSize = 8;
        const streamMock = () => {
          if (i >= mockSuggestion.length) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamMsgId && m.type === 'studentLearningDetail'
                  ? { ...m, data: { ...(m.data as StudentLearningDetailData), loading: { ...(m.data as StudentLearningDetailData)?.loading, suggestion: false } } }
                  : m
              )
            );
            setIsLoading(false);
            return;
          }
          const chunk = mockSuggestion.slice(i, i + chunkSize);
          i += chunkSize;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamMsgId && m.type === 'studentLearningDetail'
                ? {
                    ...m,
                    data: {
                      ...(m.data as StudentLearningDetailData),
                      suggestion: ((m.data as StudentLearningDetailData)?.suggestion || '') + chunk,
                      loading: { ...(m.data as StudentLearningDetailData)?.loading, suggestion: false }
                    }
                  }
                : m
            )
          );
          setTimeout(streamMock, 50);
        };
        setTimeout(streamMock, 600);
        return;
      }
      // ⚠️ MOCK END

      try {
        await agentChatStream(
          {
            chat_id: chatIdRef.current,
            agent: agentName,
            user_question: question,
            is_resume: false,
            decisions: [],
            variables:
              files.length > 0
                ? {
                    uploaded_files: files
                      .filter((f) => f.taskId)
                      .map((f) => ({ taskId: f.taskId, fileName: f.fileName }))
                  }
                : {}
          },
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== streamMsgId) return m;
                if (m.type === 'studentLearningDetail') {
                  return {
                    ...m,
                    data: {
                      ...(m.data as StudentLearningDetailData),
                      suggestion: ((m.data as StudentLearningDetailData)?.suggestion || '') + chunk,
                      loading: { ...(m.data as StudentLearningDetailData)?.loading, suggestion: false }
                    }
                  };
                }
                return { ...m, content: m.content + chunk };
              })
            );
          },
          (eventName, eventData) => {
            if (eventName === 'student_learning_query') {
              handleStudentLearningQuery(streamMsgId, eventData as StudentLearningQueryEvent);
            }
            if (
              eventName === 'learning_situation_data' ||
              eventName === 'ask_learning_situation_data'
            ) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentStats' as const, data: { stats: eventData } }
                    : m
                )
              );
            }
            if (eventName === 'student_portrait_data') {
              setMessages((prev) => {
                const alreadyHasAction = prev.some(
                  (m) => m.type === 'actionButton' && m.data?.actionUrl === '/common-chat/study-portrait'
                );
                const updated = prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentPortrait' as const, data: { portrait: eventData } }
                    : m
                );
                if (alreadyHasAction) return updated;
                return [
                  ...updated,
                  {
                    id: `action-${nanoid()}`,
                    role: 'assistant',
                    type: 'actionButton' as const,
                    content: '',
                    data: {
                      title:
                        t('commonChat.action.view_portrait_title'),
                      actionUrl: '/common-chat/study-portrait',
                      actionLabel: t('commonChat.action.view_portrait_label')
                    },
                    createdAt: Date.now()
                  }
                ];
              });
            }
            if (eventName === 'courseware_creation_courseware_id_generated') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? {
                        ...m,
                        type: 'materialCreate' as const,
                        content:
                          '已为您识别到需求，您想新建一门独立数字课件，点击下方按钮即可开始制作。',
                        data: { coursewareId: eventData }
                      }
                    : m
                )
              );
            }
            if (eventName === 'course_management_course') {
              const list = Array.isArray(eventData) ? eventData : [];
              if (list.length > 0) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    '[course_management_course] raw item:',
                    JSON.stringify(list[0], null, 2)
                  );
                }
                const getCourseTypeLabel = (type?: number) => {
                  if (type === 1) return t('commonChat.course_type.required');
                  if (type === 2) return t('commonChat.course_type.elective');
                  return '';
                };
                const courses = list.map((item: any) => ({
                  id: item?.tenant_course_id,
                  name: item?.course_name,
                  category: item?.category_name
                    ? `${item.category_name} · ${getCourseTypeLabel(item.course_type)}`
                    : getCourseTypeLabel(item?.course_type),
                  hours: item?.course_hours,
                  teachingTaskId: item?.teaching_task_id
                }));
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          type: 'courseList' as const,
                          content:
                            '好的，我来帮您创建AI教师。根据您的任课信息，您目前教授以下课程：',
                          data: {
                            courses,
                            footer: '请点击选择要创建AI教师的课程'
                          }
                        }
                      : m
                  )
                );
              }
            }
          },
          (interruptData) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `interrupt-${nanoid()}`,
                role: 'assistant',
                type: 'interrupt' as const,
                content: '',
                data: { interrupt: interruptData },
                createdAt: Date.now()
              }
            ]);
          },
          (toolName, toolInput) => {
            if (toolName === 'task' && toolInput?.subagent_type === 'courseware-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建数字课件，请稍候...' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'ai-course-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在生成课程大纲，请稍候...' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'course-management') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建课程，请稍候...' } : m
                )
              );
            }
          },
          (toolName) => {
            if (isStudent && toolName === 'task') {
              setMessages((prev) => {
                const alreadyHasAction = prev.some(
                  (m) => m.type === 'actionButton' && m.data?.actionUrl === '/common-chat/study-portrait'
                );
                if (alreadyHasAction) return prev;
                return [
                  ...prev,
                  {
                    id: `action-${nanoid()}`,
                    role: 'assistant',
                    type: 'actionButton' as const,
                    content: '',
                    data: {
                      title:
                        t('commonChat.action.view_portrait_title'),
                      actionUrl: '/common-chat/study-portrait',
                      actionLabel: t('commonChat.action.view_portrait_label')
                    },
                    createdAt: Date.now()
                  }
                ];
              });
            }
          }
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, content: '请求失败，请稍后重试' } : m))
        );
      } finally {
        setIsLoading(false);
        setMessages((prev) =>
          prev.filter((m) => !(m.id === streamMsgId && m.type === 'text' && !m.content?.trim()))
        );
        fetchConversationList();
        setTimeout(() => {
          fetchConversationList();
        }, 1000);
      }
    },
    [isStudent, fetchConversationList, handleStudentLearningQuery]
  );

  const handleInterruptSubmit = useCallback(
    async (answers: any[]) => {
      setIsLoading(true);

      // 将当前 interrupt 消息标记为只读，防止重复提交
      setMessages((prev) => {
        const lastIndex = prev.map((m) => m.type).lastIndexOf('interrupt');
        if (lastIndex === -1) return prev;
        return prev.map((m, i) =>
          i === lastIndex ? { ...m, data: { ...(m.data ?? {}), readOnly: true } } : m
        );
      });

      // 后续提交给 /chat 的 decisions，默认沿用原始 answers；大纲分支会替换为带 stageId 的结构
      let decisions = answers;

      // 检测是否为 AI 课程大纲确认
      const outlineAnswer = answers.find(
        (a) => a?.type?.stageInfo && Array.isArray(a?.type?.allOutlines)
      );
      if (outlineAnswer) {
        const payload = outlineAnswer.type;
        try {
          setMessages((prev) => [
            ...prev,
            {
              id: nanoid(),
              role: 'assistant',
              type: 'text',
              content: '正在为您生成课程大纲，请稍候...',
              createdAt: Date.now()
            }
          ]);
          const res = await createMaicOutline({
            stateInfo: payload.stageInfo,
            allOutlines: payload.allOutlines,
            languageDirective: payload.stageInfo?.languageDirective
          });
          if (res?.success) {
            const { taskId = '' } = res?.data || {};
            const url = isStudent
              ? `/student/digital-textbook?stageId=${taskId}`
              : `/teacher/digital-textbook?stageId=${taskId}`;
            setMessages((prev) => [
              ...prev,
              {
                id: nanoid(),
                role: 'assistant',
                type: 'actionButton',
                content: `任务ID：${taskId}`,
                data: {
                  title: `课程大纲已生成成功！《${res.data?.name ?? ''}》`,
                  actionUrl: url,
                  actionLabel: '进入课堂'
                },
                createdAt: Date.now()
              }
            ]);

            // 拿到 /create 返回的 stageId 后，连同大纲信息组装进 decisions，继续走 /chat
            decisions = [
              {
                message: outlineAnswer.message,
                type: {
                  stageId: taskId,
                  stageInfo: payload.stageInfo,
                  allOutlines: payload.allOutlines
                }
              }
            ];
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: nanoid(),
                role: 'assistant',
                type: 'text',
                content: `大纲生成失败：${res.msg || '请稍后重试'}`,
                createdAt: Date.now()
              }
            ]);
            setIsLoading(false);
            return;
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: nanoid(),
              role: 'assistant',
              type: 'text',
              content: '大纲生成请求失败，请检查网络后重试。',
              createdAt: Date.now()
            }
          ]);
          setIsLoading(false);
          return;
        }
      }

      const streamMsgId = `stream-${nanoid()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: streamMsgId,
          role: 'assistant',
          type: 'text',
          content: '',
          createdAt: Date.now()
        }
      ]);

      try {
        await agentChatStream(
          {
            chat_id: chatIdRef.current,
            agent: agentName,
            user_question: '',
            is_resume: true,
            decisions,
            variables:
              attachments.length > 0
                ? {
                    uploaded_files: attachments
                      .filter((f) => f.taskId)
                      .map((f) => ({ taskId: f.taskId, fileName: f.fileName }))
                  }
                : {}
          },
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== streamMsgId) return m;
                if (m.type === 'studentLearningDetail') {
                  return {
                    ...m,
                    data: {
                      ...(m.data as StudentLearningDetailData),
                      suggestion: ((m.data as StudentLearningDetailData)?.suggestion || '') + chunk,
                      loading: { ...(m.data as StudentLearningDetailData)?.loading, suggestion: false }
                    }
                  };
                }
                return { ...m, content: m.content + chunk };
              })
            );
          },
          (eventName, eventData) => {
            if (eventName === 'student_learning_query') {
              handleStudentLearningQuery(streamMsgId, eventData as StudentLearningQueryEvent);
            }
            if (
              eventName === 'learning_situation_data' ||
              eventName === 'ask_learning_situation_data'
            ) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentStats' as const, data: { stats: eventData } }
                    : m
                )
              );
            }
            if (eventName === 'student_portrait_data') {
              setMessages((prev) => {
                const alreadyHasAction = prev.some(
                  (m) => m.type === 'actionButton' && m.data?.actionUrl === '/common-chat/study-portrait'
                );
                const updated = prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentPortrait' as const, data: { portrait: eventData } }
                    : m
                );
                if (alreadyHasAction) return updated;
                return [
                  ...updated,
                  {
                    id: `action-${nanoid()}`,
                    role: 'assistant',
                    type: 'actionButton' as const,
                    content: '',
                    data: {
                      title:
                        t('commonChat.action.view_portrait_title'),
                      actionUrl: '/common-chat/study-portrait',
                      actionLabel: t('commonChat.action.view_portrait_label')
                    },
                    createdAt: Date.now()
                  }
                ];
              });
            }
            if (eventName === 'courseware_creation_courseware_id_generated') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? {
                        ...m,
                        type: 'materialCreate' as const,
                        content:
                          '已为您识别到需求，您想新建一门独立数字课件，点击下方按钮即可开始制作。',
                        data: { coursewareId: eventData }
                      }
                    : m
                )
              );
            }
            if (eventName === 'course_management_course') {
              const list = Array.isArray(eventData) ? eventData : [];
              if (list.length > 0) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    '[course_management_course] raw item:',
                    JSON.stringify(list[0], null, 2)
                  );
                }
                const getCourseTypeLabel = (type?: number) => {
                  if (type === 1) return t('commonChat.course_type.required');
                  if (type === 2) return t('commonChat.course_type.elective');
                  return '';
                };
                const courses = list.map((item: any) => ({
                  id: item?.tenant_course_id,
                  name: item?.course_name,
                  category: item?.category_name
                    ? `${item.category_name} · ${getCourseTypeLabel(item.course_type)}`
                    : getCourseTypeLabel(item?.course_type),
                  hours: item?.course_hours,
                  teachingTaskId: item?.teaching_task_id
                }));
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          type: 'courseList' as const,
                          content:
                            '好的，我来帮您创建AI教师。根据您的任课信息，您目前教授以下课程：',
                          data: {
                            courses,
                            footer: '请点击选择要创建AI教师的课程'
                          }
                        }
                      : m
                  )
                );
              }
            }
          },
          (interruptData) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `interrupt-${nanoid()}`,
                role: 'assistant',
                type: 'interrupt' as const,
                content: '',
                data: { interrupt: interruptData },
                createdAt: Date.now()
              }
            ]);
          },
          (toolName, toolInput) => {
            if (toolName === 'task' && toolInput?.subagent_type === 'courseware-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建数字课件，请稍候...' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'ai-course-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'course-management') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建课程，请稍候...' } : m
                )
              );
            }
          }
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, content: '请求失败，请稍后重试' } : m))
        );
      } finally {
        setIsLoading(false);
        setMessages((prev) =>
          prev.filter((m) => !(m.id === streamMsgId && m.type === 'text' && !m.content?.trim()))
        );
      }
    },
    [attachments, handleStudentLearningQuery]
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setSelectedConversationId(id);
      const conv = conversations.find((c) => c.id === id);
      if (!conv) return;

      // 取消之前的请求，避免竞态
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const detail = await getConversationDetail(conv.chatId);
        if (controller.signal.aborted) return;

        chatIdRef.current = conv.chatId;
        const sortedMessages = (detail.data?.messages ?? [])
          .sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
            return ta - tb;
          });
        setMessages(
          sortedMessages
            .flatMap((msg, index): Message[] => {
              const isUser = msg.role === 'human';
              const baseMsg = {
                id: `${id}-${index}`,
                role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
                content: msg.display_content || msg.content,
                createdAt: new Date(msg.created_at).getTime() || Date.now(),
                customEvents: msg.custom_events
              };

              // 非用户消息，检查是否为 interrupt 类型或包含课程大纲 custom_events
              if (!isUser) {
                if (msg.message_type === 'interrupt') {
                  const answers = findAnswersForMessage(sortedMessages, index);
                  return [
                    {
                      ...baseMsg,
                      type: 'interrupt' as const,
                      data: { interrupt: msg.custom_events?.[0]?.data ?? {}, readOnly: true, answers }
                    }
                  ];
                }
                const outlineEvent = msg.custom_events?.find(
                  (e) => e.data?.type === 'custom_ai_course_creation_outlines_json_data'
                );
                if (outlineEvent) {
                  const answers = findAnswersForMessage(sortedMessages, index);
                  return [
                    {
                      ...baseMsg,
                      type: 'interrupt' as const,
                      data: { interrupt: outlineEvent.data, readOnly: true, answers }
                    }
                  ];
                }
                const hasPortraitTool = msg.tool_events?.some(
                  (e) => e.tool_input?.subagent_type === 'student-portrait'
                );
                if (hasPortraitTool || msg.message_type === 'student_portrait') {
                  return [
                    { ...baseMsg, type: 'text' as const },
                    {
                      id: `${id}-${index}-action`,
                      role: 'assistant' as const,
                      type: 'actionButton' as const,
                      content: '',
                      data: {
                        title: t('commonChat.action.view_portrait_title'),
                        actionUrl: '/common-chat/study-portrait',
                        actionLabel: t('commonChat.action.view_portrait_label')
                      },
                      createdAt: (new Date(msg.created_at).getTime() || Date.now()) + 1
                    }
                  ];
                }
              }

              return [{ ...baseMsg, type: 'text' as const }];
            })
        );
      } catch {
        // 保持现有消息不变
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [conversations]
  );

  const handleCreateNewConversation = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setSelectedConversationId('');
    setAttachments([]);
    setActiveQuickAction('');
    setIsLoading(false);
    chatIdRef.current = nanoid();
  }, []);

  const handleAICourseGenerate = useCallback(() => {
    // Mock: 点击后添加风格声明输入提示
    const aiMsg: Message = {
      id: nanoid(),
      role: 'assistant',
      type: 'text',
      content:
        '请补充您的风格声明，以便生成更贴合您需求的 AI 互动课。\n\n例如：\n• 互动性强，多用提问和讨论\n• 案例丰富，贴近实际应用场景\n• 深入浅出，适合零基础学生',
      createdAt: Date.now()
    };
    setMessages((prev) => [...prev, aiMsg]);
  }, []);

  const handleCourseSelect = useCallback(
    async (course: CourseOption) => {
      const userMsg: Message = {
        id: nanoid(),
        role: 'user',
        type: 'text',
        content: course.name,
        createdAt: Date.now()
      };
      setMessages((prev) => [...prev, userMsg]);

      if (course.teachingTaskId) {
        const confirmMsg: Message = {
          id: nanoid(),
          role: 'assistant',
          type: 'text',
          content: `您选择了《${course.name}》${course.category ? '，' + course.category : ''}。正在为您创建AI教师分身，请稍候...`,
          createdAt: Date.now()
        };
        setMessages((prev) => [...prev, confirmMsg]);
        router.push(`/teacher/aiTeacher/avatar/create?courseId=${course.teachingTaskId}`);
        return;
      }

      setIsLoading(true);
      const streamMsgId = `stream-${nanoid()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: streamMsgId,
          role: 'assistant',
          type: 'text',
          content: '',
          createdAt: Date.now()
        }
      ]);

      try {
        await agentChatStream(
          {
            chat_id: chatIdRef.current,
            agent: agentName,
            user_question: '',
            is_resume: true,
            decisions: [course],
            variables:
              attachmentsRef.current.length > 0
                ? {
                    uploaded_files: attachmentsRef.current
                      .filter((f) => f.taskId)
                      .map((f) => ({ taskId: f.taskId, fileName: f.fileName }))
                  }
                : {}
          },
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== streamMsgId) return m;
                if (m.type === 'studentLearningDetail') {
                  return {
                    ...m,
                    data: {
                      ...(m.data as StudentLearningDetailData),
                      suggestion: ((m.data as StudentLearningDetailData)?.suggestion || '') + chunk,
                      loading: { ...(m.data as StudentLearningDetailData)?.loading, suggestion: false }
                    }
                  };
                }
                return { ...m, content: m.content + chunk };
              })
            );
          },
          (eventName, eventData) => {
            if (eventName === 'student_learning_query') {
              handleStudentLearningQuery(streamMsgId, eventData as StudentLearningQueryEvent);
            }
            if (
              eventName === 'learning_situation_data' ||
              eventName === 'ask_learning_situation_data'
            ) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentStats' as const, data: { stats: eventData } }
                    : m
                )
              );
            }
            if (eventName === 'student_portrait_data') {
              setMessages((prev) => {
                const alreadyHasAction = prev.some(
                  (m) => m.type === 'actionButton' && m.data?.actionUrl === '/common-chat/study-portrait'
                );
                const updated = prev.map((m) =>
                  m.id === streamMsgId
                    ? { ...m, type: 'studentPortrait' as const, data: { portrait: eventData } }
                    : m
                );
                if (alreadyHasAction) return updated;
                return [
                  ...updated,
                  {
                    id: `action-${nanoid()}`,
                    role: 'assistant',
                    type: 'actionButton' as const,
                    content: '',
                    data: {
                      title:
                        t('commonChat.action.view_portrait_title'),
                      actionUrl: '/common-chat/study-portrait',
                      actionLabel: t('commonChat.action.view_portrait_label')
                    },
                    createdAt: Date.now()
                  }
                ];
              });
            }
            if (eventName === 'courseware_creation_courseware_id_generated') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId
                    ? {
                        ...m,
                        type: 'materialCreate' as const,
                        content:
                          '已为您识别到需求，您想新建一门独立数字课件，点击下方按钮即可开始制作。',
                        data: { coursewareId: eventData }
                      }
                    : m
                )
              );
            }
            if (eventName === 'course_management_course') {
              const list = Array.isArray(eventData) ? eventData : [];
              if (list.length > 0) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    '[course_management_course] raw item:',
                    JSON.stringify(list[0], null, 2)
                  );
                }
                const getCourseTypeLabel = (type?: number) => {
                  if (type === 1) return t('commonChat.course_type.required');
                  if (type === 2) return t('commonChat.course_type.elective');
                  return '';
                };
                const courses = list.map((item: any) => ({
                  id: item?.tenant_course_id,
                  name: item?.course_name,
                  category: item?.category_name
                    ? `${item.category_name} · ${getCourseTypeLabel(item.course_type)}`
                    : getCourseTypeLabel(item?.course_type),
                  hours: item?.course_hours,
                  teachingTaskId: item?.teaching_task_id
                }));
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          type: 'courseList' as const,
                          content:
                            '好的，我来帮您创建AI教师。根据您的任课信息，您目前教授以下课程：',
                          data: {
                            courses,
                            footer: '请点击选择要创建AI教师的课程'
                          }
                        }
                      : m
                  )
                );
              }
            }
          },
          (interruptData) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `interrupt-${nanoid()}`,
                role: 'assistant',
                type: 'interrupt' as const,
                content: '',
                data: { interrupt: interruptData },
                createdAt: Date.now()
              }
            ]);
          },
          (toolName, toolInput) => {
            if (toolName === 'task' && toolInput?.subagent_type === 'courseware-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建数字课件，请稍候...' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'ai-course-creation') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在生成课程大纲，请稍候...' } : m
                )
              );
            } else if (toolName === 'task' && toolInput?.subagent_type === 'course-management') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: '正在为您创建课程，请稍候...' } : m
                )
              );
            }
          }
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, content: '请求失败，请稍后重试' } : m))
        );
      } finally {
        setIsLoading(false);
        setMessages((prev) =>
          prev.filter((m) => !(m.id === streamMsgId && m.type === 'text' && !m.content?.trim()))
        );
      }
    },
    [isStudent, attachments, handleStudentLearningQuery]
  );

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue.trim();
    const currentAttachments = attachments;
    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      type: 'text',
      content: text,
      createdAt: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    callAgentChat(text, currentAttachments);
  };

  const handleQuickAction = (action: string) => {
    if (isLoading) return;
    setActiveQuickAction(action);

    if (action === 'home') {
      router.push(isStudent ? '/student' : '/teacher');
      return;
    }

    let userQuestion = '';

    switch (action) {
      case 'create_course':
        userQuestion = isStudent ? '我要开一门课' : '我想创建一门课程的AI教师';
        break;
      case 'create_material':
        userQuestion = '我想做一门数字课件';
        break;
      case 'create_ai_lecture':
        userQuestion = isStudent ? '我要上AI主讲课' : '我要做主讲课';
        break;
      case 'ask_progress':
        userQuestion = isStudent ? '我要问进度' : '我要查一下我教的科目的学习进度';
        break;
      case 'learning_portrait':
        userQuestion = '我本周学习画像';
        break;
      default:
        userQuestion = action;
        break;
    }

    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      type: 'text',
      content: userQuestion || action,
      createdAt: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);

    callAgentChat(userQuestion, attachments);
    setAttachments([]);
  };

  // 根据 URL type / text 参数自动触发行为
  useEffect(() => {
    if (!isReady || hasAutoSentRef.current) return;
    const type = searchParams.get('type');
    const text = searchParams.get('text');

    if (text) {
      hasAutoSentRef.current = true;
      // 从 localStorage 读取 workspace 页面传入的附件
      const stored = localStorage.getItem('common_chat_attachments');
      let parsedAttachments: AttachmentFile[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsedAttachments = parsed;
          }
        } catch {
          // 忽略解析错误
        }
        localStorage.removeItem('common_chat_attachments');
      }

      // 开启新会话并直接发送
      handleCreateNewConversation();
      attachmentsRef.current = parsedAttachments;
      setAttachments(parsedAttachments);

      const userMsg: Message = {
        id: nanoid(),
        role: 'user',
        type: 'text',
        content: text,
        createdAt: Date.now(),
        attachments: parsedAttachments.length > 0 ? parsedAttachments : undefined
      };
      setMessages([userMsg]);
      setAttachments([]);
      callAgentChat(text, parsedAttachments);

      // 清理 URL 参数，避免刷新后重复触发
      const url = new URL(window.location.href);
      url.searchParams.delete('text');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    if (!type) return;

    const typeToAction: Record<string, string> = {
      open_course: 'create_course',
      make_courseware: 'create_material',
      make_ai_main: 'create_ai_lecture',
      ask_progress: 'ask_progress',
      create_ai_lecture: 'create_ai_lecture',
      learning_portrait: 'learning_portrait'
    };

    const action = typeToAction[type];
    if (action) {
      hasAutoSentRef.current = true;
      handleQuickAction(action);
      // 清理 URL 参数，避免刷新后重复触发
      const url = new URL(window.location.href);
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isReady, searchParams, handleCreateNewConversation, callAgentChat]);

  if (!isReady) {
    return (
      <Center h="100vh" w="100%" bg={bgSecondary}>
        <Spinner size="lg" color="#C8000B" />
      </Center>
    );
  }

  return (
    <Flex h="100vh" w="100%" bg={bgSecondary} flexDirection="column">
      <ChatHeader />

      {/* 下方内容区：左右两栏 */}
      <Flex
        flex={1}
        overflow="hidden"
        bgImage="url('/imgs/app/chat-background.png')"
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
      >
        <HistoryBar
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          onCreateNew={handleCreateNewConversation}
        />

        {/* 右侧聊天主区域 */}
        <Flex flex={1} flexDirection="column" h="100%">
          {/* 消息列表区域 */}
          <Flex flex={1} flexDirection="column" overflowY="auto" px="24px" py="20px">
            <VStack spacing="20px" align="stretch" maxW="1000px" w="100%" mx="auto">
              {displayMessages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onCourseSelect={handleCourseSelect}
                  onAICourseGenerate={handleAICourseGenerate}
                  onInterruptSubmit={handleInterruptSubmit}
                  onNavigate={(path) => router.push(path)}
                />
              ))}
              <div ref={messagesEndRef} />
            </VStack>
          </Flex>

          <Flex justify="center" w="100%">
            <ChatInput
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={handleSend}
              onQuickAction={handleQuickAction}
              isLoading={isLoading}
              onFileUpload={(file) => {
                setAttachments((prev) => [...prev, file]);
              }}
              attachments={attachments}
              onRemoveAttachment={(fileKey) =>
                setAttachments((prev) => prev.filter((f) => f.fileKey !== fileKey))
              }
              quickActions={isStudent ? STUDENT_ACTIONS : TEACHER_ACTIONS}
              showPrefix={!isStudent}
              activeQuickAction={activeQuickAction}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
