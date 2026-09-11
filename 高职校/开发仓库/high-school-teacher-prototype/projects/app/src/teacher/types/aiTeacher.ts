/**
 * AI教师相关类型定义
 */

/**
 * 首页统计数据
 */
export type HomeStatsData = {
  courseCount: number; // 我的课程数（教学任务数）
  aiAvatarCount: number; // AI分身数量
  todayInteractionCount: number; // 今日互动次数
};

/**
 * AI智能建议
 */
export type AiSuggestion = {
  id: number; // 建议ID
  suggestionType: number; // 类型：1-前沿资讯，2-课程优化，3-能力图谱
  title: string; // 建议标题
  content: string; // 建议内容
  relatedCourseName?: string; // 关联课程名称
  relatedCourseId?: number; // 关联课程ID
  publishTime?: string; // 发布时间
  isRead: number; // 是否已读：0-未读，1-已读
  createTime?: string; // 创建时间
  priority?: 'high' | 'medium' | 'low';
  confidence?: number;
  sourceLabel?: string;
  evidenceList?: string[];
  impactSummary?: string;
  targetAudience?: string;
  expectedOutcome?: string;
  recommendedActions?: string[];
};

/**
 * 待办学生
 */
export type TodoStudent = {
  studentId: number;
  studentName: string;
  className: string;
  avatarId: number; // AI分身ID
  avatarName: string; // 课程名称
  courseName: string; // 课程名称（与avatarName相同）
  progress: number; // 进度百分比
  lagDays: number; // 滞后天数
  isReminded: number; // 今日是否已提醒：0-未提醒，1-已提醒
  studyHours: number; // 学习时长（小时）
  lastStudyTimeDesc: string; // 最后学习时间描述
  lagReasonList: string[]; // 滞后原因列表
  riskLevel?: 'critical' | 'high' | 'medium';
  riskType?: string;
  riskScore?: number;
  progressGap?: number;
  uncompletedTaskCount?: number;
  riskSignalList?: string[];
  weakKnowledgePoints?: string[];
  recommendedActions?: string[];
};

/**
 * 待办列表
 */
export type TodoListData = {
  totalCount: number; // 需关注学生总数
  list: TodoStudent[]; // 待办学生列表（最多5条）
};

/**
 * 教学任务班级
 */
export type TeachingTaskClazz = {
  clazzId: number; // 班级ID
  clazzName: string; // 班级名称
  clazzCode: string; // 班级编码
};

/**
 * 教学任务课程
 */
export type TeachingTaskCourse = {
  teachingTaskId: number; // 教学任务ID
  tenantCourseId: number; // 租户课程ID
  courseName: string; // 课程名称
  courseHours: number; // 课时，1-200
  courseType: number; // 课程类型：1-必修，2-选修
  clazzList: TeachingTaskClazz[]; // 班级列表
};

/**
 * 教学任务课程学期分组
 */
export type TeachingTaskCourseSemesterGroup = {
  semesterId: number; // 学期ID
  semesterName: string; // 学期名称
  courses: TeachingTaskCourse[]; // 该学期下的课程列表
};

/**
 * API 请求参数
 */
export type AiTeacherBaseRequest = {
  teacherId: number;
};

/**
 * AI 前沿资讯列表请求参数
 */
export type AiTeacherSuggestionRequest = {
  teacherId: number;
  tenantCourseId?: number; // 租户课程ID，按当前选中课程过滤资讯
};

/**
 * AI分身列表请求参数
 */
export type AiAvatarListRequest = {
  teacherId: number;
  status?: number; // 状态：0-未开始，1-运行中，2-已结束，不传查全部
};

/**
 * AI分身详情请求参数
 */
export type AiAvatarDetailRequest = {
  id: number; // AI分身ID（实际接口使用 id 而不是 avatarId）
};

/**
 * AI分身发布请求参数
 */
export type AiAvatarPublishRequest = {
  id: number; // AI分身ID
  status: number; // 操作类型：1-发布，0-取消发布
  teacherId: number; // 教师ID
};

/**
 * AI分身基本信息
 */
export type AiAvatarVO = {
  id: number;
  status: number; // 状态：0-未开始，1-运行中，2-已截止
  coverUrl: string;
  courseName: string; // 课程名称（从关联课程获取）
  semesterName: string; // 学期名称
  startTime: string;
  endTime: string;
  studentCount: number;
  todayInteractionCount: number; // 今日互动次数（实时统计）
  classList: Array<{ classId: number; className: string }>; // 覆盖班级列表（必修）
  majorList: Array<{ majorId: number; majorName: string }>; // 覆盖专业列表（选修）
  // 兼容旧字段名
  classNameList?: string[];
  majorNameList?: string[];
};

/**
 * 教学配置
 */
export type TeachingConfigVO = {
  knowledgeWeight: number;
  skillWeight: number;
  innovationWeight: number;
  enableAfterClassQuiz: boolean;
  enableChapterTest: boolean;
  enableRandomQuiz: boolean;
  enableAIEvaluation: boolean;
  enableProgressTracking: boolean;
  enableKnowledgeAnalysis: boolean;
  enableAbilityGrowth: boolean;
  enableBehaviorAnalysis: boolean;
  enablePeerComparison: boolean;
};

/**
 * 课件信息
 */
export type AiAvatarMaterialVO = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileKey?: string; // 文件Key（OSS存储Key）- 可选，后端可能还未返回
  fileType: string; // 文件类型：video/document/image/audio
  fileFormat: string;
  fileSize?: number; // 文件大小（字节）- 可选，后端可能还未返回
  duration?: number; // 时长（音视频）
  coverUrl?: string;
  coverageStatus: number; // 覆盖状态：0-未分析，1-已覆盖，2-部分覆盖，3-完全缺失
};

/**
 * 知识点
 */
export type KnowledgePointVO = {
  id: number;
  name: string;
  sortOrder?: number;
};

/**
 * 章节信息
 */
export type AiAvatarChapterVO = {
  id: number;
  title: string;
  sortOrder: number;
  openMode?: 'unlimited' | 'scheduled' | 'prerequisite';
  openTime?: string; // 章节开放时间
  knowledgePoints: string[] | KnowledgePointVO[]; // 知识点列表（可能是字符串数组或对象数组）
  children: AiAvatarChapterVO[]; // 子节点（节列表）
  materialList: AiAvatarMaterialVO[]; // 课件列表
  hasLearned: number; // 是否有学生学习过：0-未学习，1-已学习
};

/**
 * AI分身详情
 */
export type AiAvatarDetailVO = {
  id: number;
  status: number; // 状态：0-未开始，1-运行中，2-已截止
  coverUrl: string;
  courseName: string; // 课程名称（从关联课程获取）
  semesterName: string; // 学期名称
  startTime: string;
  endTime: string;
  studentCount: number;
  todayInteractionCount: number; // 今日互动次数（实时统计）
  classList: Array<{
    classId: number;
    className: string;
    classCode?: string;
    isAvailable?: boolean; // 是否可用（编辑时只显示可用的班级）
    avatarId?: number;
    isSelected?: boolean;
  }>; // 覆盖班级列表（必修）
  majorList: Array<{ majorId: number; majorName: string }>; // 覆盖专业列表（选修）
  description: string; // 课程介绍
  teachingConfig: TeachingConfigVO; // 教学配置
  knowledgeGraph: string; // 知识图谱JSON
  chapterList: AiAvatarChapterVO[]; // 章节列表
};

/**
 * 教学配置请求参数
 */
export type TeachingConfigRequest = {
  knowledgeLevel: number; // 知识掌握层级：0-基础认知，1-理解关联，2-迁移应用，3-综合创新
  skillLevel: number; // 技能应用层级：0-模仿练习，1-独立操作，2-灵活变通，3-熟练创新
  innovationLevel: number; // 创新素质层级：0-好奇质疑，1-发散思维，2-批判构建，3-实践引领
  enableAfterClassQuiz: boolean; // 课后习题
  enableChapterTest: boolean; // 章节测试
  enableRandomQuiz: boolean; // 随堂测验
  enableAIEvaluation: boolean; // AI评估
  enableProgressTracking: boolean; // 进度追踪
  enableKnowledgeAnalysis: boolean; // 知识点分析
  enableAbilityGrowth: boolean; // 能力提升分析
  enableBehaviorAnalysis: boolean; // 学习行为分析
  enablePeerComparison: boolean; // 同学对比
};

/**
 * 课件创建/更新请求参数
 */
export type MaterialCreateRequest = {
  id?: number; // 课件ID（更新时必传，新增时不传）
  fileName: string; // 文件名
  fileKey: string; // 文件Key（OSS存储Key）
  fileUrl?: string; // 文件URL
  fileSize?: number; // 文件大小（字节）
  fileType?: string; // 文件类型：document/video/image/audio
  fileFormat?: string; // 文件格式：pdf/docx/mp4/png/mp3等
  sortOrder?: number; // 排序号
};

/**
 * 知识点请求参数
 */
export type KnowledgePointRequest = {
  id?: number; // 知识点ID（详情接口返回，更新时后端会忽略此字段）
  name: string; // 知识点名称
  sortOrder?: number; // 排序号
};

/**
 * 章节创建/更新请求参数
 */
export type ChapterCreateRequest = {
  id?: number; // 章节ID（更新时必传，新增时不传）
  title: string; // 标题
  sortOrder?: number; // 排序号
  openTime?: string; // 开放时间
  children?: ChapterCreateRequest[]; // 子节点列表（章下的节）
  materials?: MaterialCreateRequest[]; // 该章节的课件资源列表
  knowledgePoints?: KnowledgePointRequest[]; // 知识点列表（对象数组）
};

/**
 * AI分身更新请求参数
 */
export type AiAvatarUpdateRequest = {
  id: number; // AI分身ID
  courseName?: string; // 课程名称
  coverUrl?: string; // 封面URL
  description?: string; // 课程介绍
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  teachingConfig?: TeachingConfigVO | TeachingConfigRequest; // 教学配置（兼容两种格式）
  classIds?: number[]; // 覆盖班级ID列表（必修）
  tenantMajorIds?: number[]; // 覆盖专业ID列表（选修）
  chapterList?: ChapterCreateRequest[]; // 章节列表
  forceDelete?: boolean; // 是否强制删除有学习记录的课件（二次确认时传 true）
};

/**
 * 待删除但有学生学习记录的课件
 */
export type MaterialWithRecordVO = {
  id: number; // 课件ID
  fileName: string; // 文件名
  studentCount: number; // 学习过该课件的学生人数
};

/**
 * AI分身更新结果
 */
export type AiAvatarUpdateResultVO = {
  success: boolean; // true=已写库保存成功；false=未写库，等待二次确认
  needsConfirm: boolean; // true=需要二次确认；false=无需确认
  materialsWithRecords?: MaterialWithRecordVO[]; // 仅当 needsConfirm=true 时返回
};

/**
 * AI分身创建请求参数
 */
export type AiAvatarCreateRequest = {
  teacherId: number; // 教师ID
  teachingTaskId: number; // 教学任务ID
  coverUrl: string; // 课程封面URL
  description?: string; // 课程描述
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  teachingConfig: TeachingConfigRequest; // 教学配置
  classIds?: number[]; // 覆盖班级ID列表（必修课程时必填）
  knowledgeGraph?: Record<string, any>; // 知识图谱（整个课程的知识点树结构，存为JSON）
  chapterList?: ChapterCreateRequest[]; // 章节列表（含子节点和课件资源）
};

/**
 * 学生列表分页请求参数
 */
export type AvatarStudentsPageRequest = {
  avatarId: number; // AI分身ID
  current: number; // 当前页码，从1开始
  size: number; // 每页数量
  searchKey?: string; // 搜索关键字（学生姓名或学号）
  classId?: number; // 班级ID筛选
  status?: number; // 学习状态筛选：0-未开始，1-学习中，2-已完成，3-需要关注
};

/**
 * 学生信息
 */
export type AvatarStudentVO = {
  studentId: number; // 学生ID
  studentName: string; // 学生姓名
  studentCode: string; // 学号
  classId: number | null; // 班级ID
  className: string; // 班级名称
  progress: number; // 学习进度（0-100）
  studyHours: number; // 学习时长（小时）
  lastLearnTime: string; // 最后学习时间
  status: number; // 学习状态：0-未开始，1-正常，2-滞后，3-已完成
  lagDays: number; // 滞后天数
  lagReason: string; // 滞后原因
  isReminded: number; // 是否已提醒：0-否，1-是（当天是否已提醒）
  remindCount: number; // 提醒次数
  lastRemindTime: string; // 最后提醒时间
};

/**
 * 学生列表分页响应
 */
export type AvatarStudentsPageResponse = {
  records: AvatarStudentVO[]; // 学生列表
  total: number; // 总记录数
  size: number; // 每页数量
  current: number; // 当前页码
  pages: number; // 总页数
};

/**
 * 学生统计请求参数
 */
export type AvatarStudentsStatsRequest = {
  avatarId: number; // AI分身ID
};

/**
 * 学生统计响应
 */
export type AvatarStudentsStatsResponse = {
  totalCount: number; // 学生总数
  studyingCount: number; // 学习中人数
  completedCount: number; // 已完成人数
  needAttentionCount: number; // 需要关注人数
};

/**
 * 授课内容 - 单个课程
 */
export type TeachingContentCourseVO = {
  teachingTaskId: number; // 教学任务ID
  tenantCourseId: number; // 租户课程ID
  courseName: string; // 课程名称
  categoryName: string; // 所属专业大类名称
  courseHours: number; // 课时
  latestAvatarId: number | null; // 该教学任务下最新创建的AI分身ID,未创建则为null
};

/**
 * 授课内容(当前学期教学任务课程列表)
 */
export type TeachingContentVO = {
  courseCount: number; // 当前学期课程数量
  courses: TeachingContentCourseVO[]; // 课程列表
};

/**
 * 课程教学概况请求
 */
export type CourseOverviewRequest = {
  teachingTaskId: number; // 教学任务ID
};

/**
 * 课程教学概况
 */
export type CourseOverviewVO = {
  teachingTaskId: number;
  courseName: string;
  statusLabel: string; // 状态标签:正常/异常
  totalStudentCount: number; // 学生总人数
  studyingCount: number; // 学习人数(status=1)
  normalProgressCount: number; // 进度正常人数
  laggingCount: number; // 滞后人数
  averageProgress: number; // 整体学习进度平均值(0-100)
};

/**
 * 对话消息
 */
export type ConversationMessage = {
  role: 'user' | 'ai';
  content: string;
  createTime: string;
};

/**
 * 对话话题（含消息）
 */
export type ConversationGroupVO = {
  id: number;
  avatarId: number;
  title: string;
  messageCount: number;
  lastMessageTime: string;
  createTime: string;
  messages: ConversationMessage[];
};

/**
 * 教师查看学生对话记录列表请求
 */
export type StudentConversationListRequest = {
  avatarId: number;
  studentId: number;
};

/**
 * AI互动课分页请求参数
 */
export type MaicTaskPageRequest = {
  current?: number;
  size?: number;
  name?: string;
  status?: number; // 状态筛选：2-已发布
};

/**
 * AI互动课单条记录
 */
export type MaicTaskRecord = {
  createTime: string;
  name: string;
  fileKey: string | null;
  url: string;
  size: number;
  resourceTypeName: string;
};

/**
 * AI互动课分页响应
 */
export type MaicTaskPageResponse = {
  records: MaicTaskRecord[];
  total: number;
  size: number;
  current: number;
  pages: number;
};

/**
 * 数字课件列表请求参数
 */
export type DigitalCoursewareListRequest = {
  searchKey?: string; // 文件名关键字（不区分大小写，模糊匹配）
};

/**
 * 数字课件单条记录
 */
export type DigitalCoursewareRecord = {
  createTime: string; // 创建时间
  fileKey: string; // 文件 Key（占位字段，当前默认为空）
  name: string; // 文件名
  fileUrl: string; // 文件访问 URL
  fileSize: number; // 文件大小（字节）
  resourceTypeName: string; // 资源类型名称，固定为 "数字课件"
};

/**
 * 数字课件列表响应
 */
export type DigitalCoursewareListResponse = {
  records: DigitalCoursewareRecord[];
};

/**
 * 教学资源库分页请求参数
 */
export type ResourceLibraryPageRequest = {
  current?: number;
  size?: number;
  searchKey?: string; // 文件名关键字（按 file_name LIKE %?% 过滤）
};

/**
 * 教学资源库单条记录
 */
export type ResourceLibraryRecord = {
  fileName: string; // 文件名
  fileSize: number; // 文件大小（字节）
  fileKey: string; // 文件 Key
  fileUrl: string; // 文件访问 URL
  resourceType: number; // 资源类型 ID
  resourceTypeName: string | null; // 资源类型名称
  createTime: string; // 资源创建时间
};

/**
 * 教学资源库分页响应
 */
export type ResourceLibraryPageResponse = {
  records: ResourceLibraryRecord[];
  total: number;
  size: number;
  current: number;
  pages: number;
};

/**
 * 课件文件上传响应（批量上传单条记录）
 */
export type CoursewareFileUploadRecord = {
  id: number; // 文件记录 ID
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  fileName: string; // 文件名称
  fileUrl: string; // 文件链接
  fileKey: string; // OSS objectKey
  fileSize: number; // 文件大小（字节）
  fileJson: string; // 文件详情 JSON 数据
  fileType: string; // 文件类型：图片、音频、视频等
};

/**
 * 课件文件批量上传响应
 */
export type CoursewareFileUploadResponse = {
  records: CoursewareFileUploadRecord[];
};
