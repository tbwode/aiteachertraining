import type { FileMetaType } from '@/teacher/api/file';

export type AttachmentFile = FileMetaType & { taskId?: string };

export type MessageRole = 'user' | 'assistant';

export type MessageType =
  | 'text'
  | 'courseList'
  | 'materialCreate'
  | 'aiCourseCreate'
  | 'studentStats'
  | 'studentPortrait'
  | 'studentLearningDetail'
  | 'actionButton'
  | 'loading'
  | 'report'
  | 'chart'
  | 'interrupt';

export type CourseOption = {
  id: string | number;
  name: string;
  category: string;
  hours: number;
  teachingTaskId?: number;
};

export type Message = {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  display_content?: string;
  data?: Record<string, any> & {
    courses?: CourseOption[];
    footer?: string;
    onSelect?: (course: CourseOption) => void;
  };
  createdAt: number;
  attachments?: AttachmentFile[];
  customEvents?: Array<{
    id: number;
    name: string;
    data: Record<string, any>;
  }>;
};

export type Conversation = {
  id: string;
  chatId: string;
  title: string;
  updated_at: string;
};

/* ==================== Agent Chat API ==================== */

export type AgentChatRequest = {
  chat_id: string;
  agent: string;
  user_question: string;
  is_resume: boolean;
  decisions: any[];
  variables: Record<string, any>;
};

export type AgentChatResponse = any;

/* ==================== Conversation List API ==================== */

export type GetConversationListRequest = {
  page?: number;
  page_size?: number;
  agent_name?: string;
  tz?: string;
};

export type ConversationItem = {
  id: number;
  chat_id: string;
  title: string;
  agent_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

export type GetConversationListResponse = {
  data: {
    items: ConversationItem[];
  };
};

/* ==================== Conversation Detail API ==================== */

export type ConversationMessageItem = {
  id: number;
  role: 'human' | 'ai';
  content: string;
  display_content: string;
  message_type: string;
  created_at: string;
  custom_events?: Array<{
    id: number;
    name: string;
    data: Record<string, any>;
  }>;
  tool_events?: Array<{
    id: number;
    tool_name: string;
    tool_input: Record<string, any>;
    tool_output: Record<string, any>;
    status: string;
    sort_order: number;
  }>;
};

export type GetConversationDetailResponse = {
  code: number;
  success: boolean;
  data: {
    id: number;
    chat_id: string;
    title: string;
    messages: ConversationMessageItem[];
  };
  msg: string;
};

/* ==================== Learning Situation Data ==================== */

export type ProgressDistributionItem = {
  range: string;
  student_count: number;
};

export type TimeSlotItem = {
  interaction_count: number;
  slot_index: number;
  slot_name: string;
};

export type FocusStudentItem = {
  student_name: string;
};

export type BasicInformation = {
  course_name: string;
  class_names: string;
  course_type: number;
  course_type_label: string;
  student_count: number;
  average_progress: number;
  average_study_hours: number;
  video_completion_rate: number;
  progress_distribution: ProgressDistributionItem[];
};

export type InteractionTimeDistribution = {
  course_name: string;
  teaching_task_id: number;
  time_slots: TimeSlotItem[];
};

export type LearningSituationData = {
  basic_information: BasicInformation;
  interaction_time_distribution: InteractionTimeDistribution;
  focus_on_students: FocusStudentItem[];
};

export type StudentStatsData = LearningSituationData;

/* ==================== AI Course Outline ==================== */

export type OutlineSceneType = 'slide' | 'interactive' | 'quiz' | 'pbl' | string;

export type OutlineScene = {
  id: string;
  type: OutlineSceneType;
  title: string;
  description: string;
  keyPoints: string[];
  order: number;
  teachingObjective: string;
  estimatedDuration: number;
  quizConfig?: Record<string, any> | null;
  interactiveConfig?: Record<string, any> | null;
  pblConfig?: Record<string, any> | null;
};

export type OutlineStageInfo = {
  style?: string;
  name: string;
  description?: string;
  languageDirective?: string;
  language?: string;
};

export type AICourseOutlineData = {
  stageInfo: OutlineStageInfo;
  allOutlines: OutlineScene[];
};

/* ==================== Interrupt (交互式问卷) ==================== */

export type InterruptQuestionOption = {
  course_name?: string;
  teaching_task_id?: number;
  tenant_course_id?: number;
  clazz_list?: any[];
  [key: string]: any;
};

export type InterruptQuestion = {
  input_type: 'single_choice' | 'text_input' | 'confirm' | string;
  name?: string;
  question: string;
  options?: InterruptQuestionOption[] | string[] | Record<string, any>;
  type?: string;
};

export type InterruptData = {
  questions: InterruptQuestion[];
  type: string;
  answers?: Record<number, any>;
};

/* ==================== Student Portrait (学习画像) ==================== */

export type CourseProgressItem = {
  name: string;
  progress: number;
  status: '继续' | '复习' | string;
};

export type AbilityRadarItem = {
  subject: string;
  score: number;
  fullMark?: number;
};

export type ImprovementPlanItem = {
  title: string;
  priority: string;
  description: string;
  courseName?: string;
  courseLink?: string;
};

/** 后端返回的原始学习画像数据 */
export type StudentPortraitRawData = {
  completed_course_count?: number;
  course_progress_list: {
    avatar_id?: number;
    course_id?: number;
    course_name: string;
    progress: number;
  }[];
  major_id?: number;
  major_name: string;
  radar_dimensions?: string;
  student_code: string;
  student_name: string;
  studying_course_count: number;
  total_study_hours: number;
  portrait_json?: string;
  portrait_updated_today: boolean;
  radar_chart: {
    items: {
      dimension: string;
      value: number;
    }[];
  };
  career_analysis: string;
  major_analysis: string;
  improvement_plan: string;
};

export type StudentPortraitData = StudentPortraitRawData;

/* ==================== 学员学情详情（教师问单学员学情） ==================== */

/** agent 识别学员意图后返回的 custom event payload */
export type StudentLearningQueryEvent = {
  studentName?: string;
  studentCode?: string;
  studentId?: number;
  avatarId?: number;
  courseName?: string;
  rawQuery: string;
};

/** 单课程学习进度 */
export type StudentLearningCourseProgress = {
  avatarId: number;
  courseName: string;
  progress: number; // 0-100
  studyHours: number;
  status: number; // 0未开始 1正常 2滞后 3已完成
  lagDays?: number;
  lastLearnTime?: string;
};

/** AI 问答情况汇总 */
export type StudentLearningConversationSummary = {
  totalSessions: number;
  totalMessages: number;
  lastActiveTime?: string;
  keywords: Array<{ word: string; count: number }>;
};

/** 学情发展优劣势剖析 */
export type StudentLearningAnalysis = {
  strengths: string[];
  weaknesses: string[];
};

/** 学员学情详情卡片数据 */
export type StudentLearningDetailData = {
  studentName: string;
  studentCode?: string;
  className?: string;
  studentId?: number;
  courses: StudentLearningCourseProgress[];
  conversation: StudentLearningConversationSummary | null;
  analysis?: StudentLearningAnalysis;
  suggestion: string;
  loading?: { courses?: boolean; conversation?: boolean; suggestion?: boolean };
  error?: { courses?: string; conversation?: string; studentNotFound?: boolean };
};

