export type StudentPreferenceQueryRequest = {};

export type StudentPreferenceRequest = {
  id?: number;
  teachingStyle?: number;
  explanationDepth?: number;
  interactionFrequency?: number;
  explanationMethods?: string;
  coursewareTypes?: string;
  feedbackStyle?: string;
  learningPace?: number;
};

export type StudentPreferenceVO = {
  id?: number;
  teachingStyle?: number;
  explanationDepth?: number;
  interactionFrequency?: number;
  explanationMethods?: string;
  coursewareTypes?: string;
  feedbackStyle?: string;
  learningPace?: number;
};

export type RBoolean = boolean;

export type StudentAiTeacherStatsRequest = {};

export type StudentAiTeacherStatsVO = {
  aiTeacherCount?: number;
  interactionCount?: number;
  totalStudyHours?: number;
};

export type StudentCourseListRequest = {};

export type StudentCourseCardVO = {
  avatarId: number;
  courseId: number;
  teachingTaskId: number;
  courseType: number;
  hours: number;
  courseName: string;
  courseImage?: string;
  majorName: string;
  teacherName: string;
  studentCount: number;
  progress?: number;
  studyStatus: number;
  startTime?: string;
};

export type JoinAvatarStudyRequest = {
  avatarId: number;
};

export type StudentCourseDetailRequest = {
  avatarId: number;
  courseId?: number;
  teachingTaskId?: number;
};

export type ConversationPageRequest = {
  current?: number;
  size?: number;
  avatarId?: number;
};

export type ConversationItemVO = {
  id: number;
  avatarId: number;
  title: string;
  messageCount: number;
  lastMessageTime: string;
  createTime: string;
};

export type ConversationMessageItem = {
  role: 'user' | 'ai';
  content: string;
};

export type ConversationSaveRequest = {
  conversationId?: number;
  avatarId: number;
  messages: ConversationMessageItem[];
};

export type ConversationDetailRequest = {
  conversationId: number;
};

export type ConversationMessageVO = {
  role: 'user' | 'ai';
  content: string;
  createTime?: string;
};

export type ConversationDetailVO = {
  id: number;
  avatarId: number;
  title: string;
  messages: ConversationMessageVO[];
  createTime: string;
};

export type KnowledgePointVO = {
  id?: number;
  name?: string;
  sortOrder?: number;
  [key: string]: any;
};

export type MaterialVO = {
  materialId?: number;
  fileName?: string;
  fileType?: string;
  fileFormat?: string;
  fileUrl?: string;
  coverUrl?: string;
  duration?: number;
  studyStatus?: number; // 0-未开始，1-学习中，2-已完成
  studyProgress?: number;
  lastStudyAt?: string;
  completedAt?: string;
  sortOrder?: number;
  [key: string]: any;
};

export type ChapterVO = {
  chapterId?: number;
  parentId?: number;
  title?: string;
  sortOrder?: number;
  knowledgePoints?: KnowledgePointVO[];
  materials?: MaterialVO[];
  children?: ChapterVO[];
  [key: string]: any;
};

export type StudentCourseDetailVO = {
  avatarId?: number;
  courseId?: number;
  teachingTaskId?: number;
  majorName?: string;
  teacherName?: string;
  hours?: number;
  courseName?: string;
  coverUrl?: string;
  description?: string;
  progress?: number;
  chapters?: ChapterVO[];
  startTime?: string;
  endTime?: string;
  status?: number; // 0-未开始，1-运行中，2-已截止
  datasetId?: string;
  teachingConfig?: string; // JSON 字符串，教学配置
  /**
   * 获取课程完整结构数据
   * @returns {string} 返回 JSON 格式的课程数据字符串，需要手动 JSON.parse 转为 Course 类型对象
   * @typedef {Object} KnowledgePoint 知识点
   * @property {number} id 知识点ID
   * @property {string} name 知识点名称
   * @property {number} sortOrder 排序序号
   * @typedef {Object} ChapterNode 章节节点（大章/小节统一结构）
   * @property {number} chapterId 章节ID
   * @property {string} title 章节标题
   * @property {number} sortOrder 排序序号
   * @property {KnowledgePoint[]} knowledgePoints 知识点列表
   * @property {ChapterNode[] | null} children 子章节列表
   * @typedef {Object} Course 课程根对象
   * @property {string} courseName 课程名称
   * @property {Chapter[]} chapters 章节列表
   */
  courseStructure?: string;
};
/**
 * 知识点（courseStructure 内部类型）
 */
export type CourseStructureKnowledgePoint = {
  id: number;
  name: string;
  sortOrder: number;
};

/**
 * 章节节点（courseStructure 内部类型，大章/小节统一结构）
 */
export type CourseStructureChapter = {
  chapterId: number;
  title: string;
  sortOrder: number;
  knowledgePoints: CourseStructureKnowledgePoint[];
  children: CourseStructureChapter[] | null;
};

/**
 * 课程根信息（courseStructure JSON.parse 后的类型）
 */
export type CourseStructure = {
  courseName: string;
  chapters: CourseStructureChapter[];
};

export type SaveStudyProgressRequest = {
  /**
   * AI分身ID
   */
  avatarId: number;
  /**
   * 章节ID
   */
  chapterId: number;
  /**
   * 课件总时长（秒），音视频传总时长，非音视频传0
   */
  duration?: number;
  /**
   * 是否音视频：true-音视频（video/audio），false-其他（document/image/other）
   */
  isMedia: boolean;
  /**
   * 课件ID
   */
  materialId: number;
  /**
   * 学生ID
   */
  studentId?: number;
  /**
   * 学习进度（秒），音视频传播放进度，非音视频传0
   */
  studyProgress?: number;
};
