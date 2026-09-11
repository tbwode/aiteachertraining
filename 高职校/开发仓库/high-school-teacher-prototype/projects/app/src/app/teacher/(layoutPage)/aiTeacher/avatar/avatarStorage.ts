'use client';

export type CourseType = 'required' | 'optional';
export type AvatarStatus = 'running' | 'pending' | 'expired';

export type StoredFileMeta = {
  id: string;
  name: string;
  size: string;
  fileKey?: string; // 上传后返回的文件key
  parseStatus?: 'pending' | 'parsing' | 'parsed' | 'error'; // 文件解析状态
  parseProgress?: number; // 解析进度 0-100
};

export type DigitalTextbook = {
  id: string;
  chapterId: string;
  name: string;
  createdAt: string;
};

// 知识匹配分析结果 - 缺失章节信息
export type MissingChapterInfo = {
  id: string; // 章节ID
  title: string; // 章节标题
  status: 'partial' | 'missing'; // 部分缺失 | 完全缺失
  missingPoints: string[]; // 缺失的知识点列表
  defaultText: string; // AI拓展学习的默认文本
  selectedAiResourceId: string; // AI资源的ID（用于勾选状态）
};

// 推荐资源
export type RecommendedResource = {
  id: string;
  chapterId: string; // 所属章节ID
  category: 'doc' | 'video'; // 文档 | 视频
  title: string; // 资源标题
  description: string; // 资源描述（覆盖的知识点）
};

export type AvatarWizardDraft = {
  id: string;
  courseId: string;
  title: string;
  courseType: CourseType;
  semester: string;
  hours: number;
  courseImagePreview: string;
  courseImageName: string;
  courseImageUrl?: string; // 上传后的文件 URL
  courseImageKey?: string; // 上传后的文件 Key
  coverageClasses: string[];
  startDate: string;
  endDate: string;
  weights: {
    knowledge: number;
    ability: number;
    quality: number;
  };
  quizMethods: string[];
  reportDimensions: string[];
  syllabusFile: StoredFileMeta | null;
  syllabusTree?: string; // 大纲 AI 分析返回的 tree 结果
  coursewareFiles: StoredFileMeta[];
  coursewareParseResult?: Array<{
    // 课件解析结果
    id: number;
    fileKey: string;
    fileName: string;
    parseStatus: number;
    content: string;
  }>;
  analysisCompleted: boolean;
  matchScore: number;
  matchAnalysisResult?: {
    // AI type:28 返回的数据结构（知识匹配分析）
    course_name?: string;
    chapters?: Array<{
      chapter_name: string;
      sections: Array<{
        section_name: string;
        status: '已覆盖' | '部分覆盖' | '未覆盖';
        covered_topics: string[];
        uncovered_topics: string[];
      }>;
    }>;
    // 旧的数据结构（兼容）
    data?: Array<{
      chapterId: string;
      chapterName: string;
      sections: Array<{
        sectionId: string;
        sectionName: string;
        resources: Array<{
          title?: string;
          name?: string;
          [key: string]: any;
        }>;
      }>;
    }>;
    missingChapters?: MissingChapterInfo[];
    recommendedResources?: RecommendedResource[];
  };
  resourceRecommendations?: any; // AI type:30 返回的资源推荐结果
  selectedResourceIds: string[];
  selectedRecommendedResources: Array<{
    // 用户勾选的推荐资源
    fileKey: string;
    fileName: string;
    category: string;
    chapterIndex: number;
    sectionIndex: number;
    chapterName: string;
    sectionName: string;
  }>;
  digitalTextbooks: DigitalTextbook[];
  updatedAt: string;
};

export type AvatarRecord = AvatarWizardDraft & {
  createdAt: string;
  publishedAt?: string;
  status: Exclude<AvatarStatus, 'expired'>;
};

export type TeacherAvatarCard = {
  id: string;
  title: string;
  status: AvatarStatus;
  studentScale: string;
  interactions: string;
  coverageLabel: string;
  coverageText: string;
  coverageBg: string;
  coverageColor: string;
  heroBg: string;
  heroText: string;
  accentColor: string;
};

export type AvatarFlashMessage = {
  translationKey: string;
  values?: Record<string, string | number>;
  status: 'success' | 'info' | 'warning' | 'error';
};

export type CourseOption = {
  id: string; // 教学任务ID
  tenantCourseId: number; // 租户课程ID（用于文件解析等接口）
  semester: string;
  title: string;
  type: CourseType;
  hours: number;
  classes: string[]; // 班级名称数组
  classIds: number[]; // 班级ID数组（与classes对应）
  majors?: string[];
  heroText: string;
  heroBg: string;
  accentColor: string;
  coverageBg: string;
  coverageColor: string;
};

export const QUIZ_METHOD_OPTIONS = [
  'afterClassExercise',
  'chapterTest',
  'randomQuestionQuiz',
  'aiQaAssessment'
] as const;

export const REPORT_DIMENSION_OPTIONS = [
  'learningProgress',
  'knowledgeMastery',
  'abilityGrowth',
  'learningBehavior',
  'peerComparison'
] as const;

// 教学目标权重等级定义
export const WEIGHT_LEVELS = {
  knowledge: ['基础认知', '理解关联', '迁移应用', '综合创新'],
  ability: ['模仿练习', '独立操作', '灵活变通', '熟练创新'],
  quality: ['好奇质疑', '发散思维', '批判构建', '实践引领']
} as const;

export const WEIGHT_LABELS = {
  knowledge: '知识掌握',
  ability: '技能应用',
  quality: '创新素质'
} as const;

// 用于存储从API加载的课程列表
let cachedCourseOptions: CourseOption[] | null = null;

// 颜色配置数组,用于为课程分配不同的视觉样式
const COURSE_VISUAL_CONFIGS = [
  {
    heroBg: 'linear-gradient(135deg, #FEE2E2 0%, #FED7AA 100%)',
    accentColor: '#C83E3E',
    coverageBg: '#EFF6FF',
    coverageColor: '#2563EB'
  },
  {
    heroBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    accentColor: '#FAAD14',
    coverageBg: '#FFFBEB',
    coverageColor: '#B45309'
  },
  {
    heroBg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
    accentColor: '#52C41A',
    coverageBg: '#F0FFF4',
    coverageColor: '#2F855A'
  },
  {
    heroBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    accentColor: '#1677FF',
    coverageBg: '#EFF6FF',
    coverageColor: '#2563EB'
  },
  {
    heroBg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
    accentColor: '#EC4899',
    coverageBg: '#FDF2F8',
    coverageColor: '#BE185D'
  }
];

/**
 * 获取课程名称的首字母或首字作为heroText
 */
function getCourseHeroText(courseName: string): string {
  if (!courseName) return '课';

  // 尝试提取中文首字
  const chineseMatch = courseName.match(/[\u4e00-\u9fa5]/);
  if (chineseMatch) {
    return chineseMatch[0];
  }

  // 尝试提取英文首字母
  const englishMatch = courseName.match(/[A-Za-z]/);
  if (englishMatch) {
    return englishMatch[0].toUpperCase();
  }

  return courseName.charAt(0);
}

export const COURSE_OPTIONS: CourseOption[] = [];

export const STATIC_OCCUPIED_CLASSES: Record<string, string[]> = {};

export const AVATAR_RECORDS_STORAGE_KEY_PREFIX = 'teacher-avatar-records';
export const AVATAR_WIZARD_DRAFT_STORAGE_KEY_PREFIX = 'teacher-avatar-create-draft';
export const AVATAR_FLASH_STORAGE_KEY = 'teacher-avatar-flash';

/**
 * 生成带用户 ID 的存储键
 */
function getUserStorageKey(prefix: string, userId?: string): string {
  if (!userId) {
    return prefix; // 兼容旧版本，如果没有 userId 则使用原始 key
  }
  return `${prefix}-${userId}`;
}

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 设置课程选项列表(从API加载后调用)
 */
export function setCourseOptions(courses: CourseOption[]) {
  cachedCourseOptions = courses;
}

/**
 * 获取所有课程选项
 */
export function getAllCourseOptions(): CourseOption[] {
  // 优先返回从API加载的课程
  if (cachedCourseOptions && cachedCourseOptions.length > 0) {
    return cachedCourseOptions;
  }

  // 降级到静态数据
  return COURSE_OPTIONS;
}

export function getCourseOptionById(courseId: string) {
  return getAllCourseOptions().find((course) => course.id === courseId);
}

export function createEmptyWizardDraft(): AvatarWizardDraft {
  const now = new Date().toISOString();

  return {
    id: `avatar-${Date.now()}`,
    courseId: '',
    title: '',
    courseType: 'required',
    semester: '',
    hours: 0,
    courseImagePreview: '',
    courseImageName: '',
    coverageClasses: [],
    startDate: '',
    endDate: '',
    weights: {
      knowledge: 0, // 0-3: 0-基础认知，1-理解关联，2-迁移应用，3-综合创新
      ability: 0, // 0-3: 0-模仿练习，1-独立操作，2-灵活变通，3-熟练创新
      quality: 0 // 0-3: 0-好奇质疑，1-发散思维，2-批判构建，3-实践引领
    },
    quizMethods: ['afterClassExercise', 'chapterTest'],
    reportDimensions: ['learningProgress', 'knowledgeMastery', 'abilityGrowth'],
    syllabusFile: null,
    coursewareFiles: [],
    analysisCompleted: false,
    matchScore: 0,
    selectedResourceIds: [], // 初始为空数组，用户勾选后再添加
    selectedRecommendedResources: [], // 用户勾选的推荐资源
    digitalTextbooks: [],
    updatedAt: now
  };
}

export function getStoredWizardDraft(userId?: string) {
  const key = getUserStorageKey(AVATAR_WIZARD_DRAFT_STORAGE_KEY_PREFIX, userId);
  return readStorage<AvatarWizardDraft | null>(key, null);
}

export function saveStoredWizardDraft(draft: AvatarWizardDraft, userId?: string) {
  const key = getUserStorageKey(AVATAR_WIZARD_DRAFT_STORAGE_KEY_PREFIX, userId);
  writeStorage(key, {
    ...draft,
    // 推荐资源的勾选状态仅用于 Step3 发布时使用，不持久化到缓存
    selectedResourceIds: [],
    selectedRecommendedResources: [],
    updatedAt: new Date().toISOString()
  });
}

export function clearStoredWizardDraft(userId?: string) {
  if (!canUseStorage()) {
    return;
  }

  const key = getUserStorageKey(AVATAR_WIZARD_DRAFT_STORAGE_KEY_PREFIX, userId);
  window.localStorage.removeItem(key);
}

export function getStoredAvatarRecords(userId?: string) {
  const key = getUserStorageKey(AVATAR_RECORDS_STORAGE_KEY_PREFIX, userId);
  return readStorage<AvatarRecord[]>(key, []);
}

export function saveStoredAvatarRecords(records: AvatarRecord[], userId?: string) {
  const key = getUserStorageKey(AVATAR_RECORDS_STORAGE_KEY_PREFIX, userId);
  writeStorage(key, records);
}

export function upsertStoredAvatarRecord(record: AvatarRecord, userId?: string) {
  const records = getStoredAvatarRecords(userId);
  const nextRecords = [record, ...records.filter((item) => item.id !== record.id)];
  saveStoredAvatarRecords(nextRecords, userId);
  return nextRecords;
}

export function getStoredAvatarRecordById(id: string, userId?: string) {
  return getStoredAvatarRecords(userId).find((item) => item.id === id) ?? null;
}

export function updateStoredAvatarStatus(
  id: string,
  status: Exclude<AvatarStatus, 'expired'>,
  userId?: string
) {
  const records = getStoredAvatarRecords(userId);
  const target = records.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  const updated: AvatarRecord = {
    ...target,
    status,
    publishedAt: status === 'running' ? new Date().toISOString() : target.publishedAt,
    updatedAt: new Date().toISOString()
  };

  upsertStoredAvatarRecord(updated, userId);
  return updated;
}

export function setAvatarFlashMessage(message: AvatarFlashMessage) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(AVATAR_FLASH_STORAGE_KEY, JSON.stringify(message));
}

export function consumeAvatarFlashMessage() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(AVATAR_FLASH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(AVATAR_FLASH_STORAGE_KEY);

  try {
    return JSON.parse(raw) as AvatarFlashMessage;
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function createStoredFileMeta(file: File): StoredFileMeta {
  return {
    id: `${file.name}-${file.size}-${Date.now()}`,
    name: file.name,
    size: formatFileSize(file.size)
  };
}

export function getUnavailableClasses(courseId: string, userId?: string) {
  const records = getStoredAvatarRecords(userId);
  const dynamicOccupied = records
    .filter((record) => record.courseId === courseId && record.status === 'running') // 只统计运行中的AI分身
    .flatMap((record) => record.coverageClasses);

  return Array.from(new Set([...(STATIC_OCCUPIED_CLASSES[courseId] ?? []), ...dynamicOccupied]));
}

export function buildCoverageLabel(record: Pick<AvatarRecord, 'courseType'>) {
  return record.courseType === 'optional' ? '学员专业' : '覆盖班级';
}

export function buildCoverageText(
  record: Pick<AvatarRecord, 'courseType' | 'coverageClasses' | 'courseId'>
) {
  if (record.courseType === 'optional') {
    return getCourseOptionById(record.courseId)?.majors?.join('、') ?? '按选课学员专业自动聚合';
  }

  return record.coverageClasses.join('、');
}

export function buildStudentScale(
  record: Pick<AvatarRecord, 'courseType' | 'coverageClasses' | 'status'>
) {
  if (record.status === 'pending') {
    return '--';
  }

  if (record.courseType === 'optional') {
    return '108人';
  }

  return `${Math.max(record.coverageClasses.length * 43, 32)}人`;
}

export function buildInteractionCount(record: Pick<AvatarRecord, 'status'>) {
  return record.status === 'pending' ? '--' : '0';
}

export function buildAvatarCardFromRecord(record: AvatarRecord): TeacherAvatarCard {
  const course = getCourseOptionById(record.courseId);

  return {
    id: record.id,
    title: record.title,
    status: record.status,
    studentScale: buildStudentScale(record),
    interactions: buildInteractionCount(record),
    coverageLabel: buildCoverageLabel(record),
    coverageText: buildCoverageText(record),
    coverageBg: course?.coverageBg ?? '#F3F4F6',
    coverageColor: course?.coverageColor ?? '#6B7280',
    heroBg: course?.heroBg ?? 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    heroText: course?.heroText ?? record.title.slice(0, 2),
    accentColor: course?.accentColor ?? '#C83E3E'
  };
}

export function mergeTeacherAvatarCards(baseCards: TeacherAvatarCard[], records: AvatarRecord[]) {
  const dynamicCards = [...records]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(buildAvatarCardFromRecord);

  const dynamicIds = new Set(dynamicCards.map((card) => card.id));
  return [...dynamicCards, ...baseCards.filter((card) => !dynamicIds.has(card.id))];
}

export function buildRecordFromDraft(
  draft: AvatarWizardDraft,
  status: Exclude<AvatarStatus, 'expired'>
): AvatarRecord {
  const now = new Date().toISOString();

  return {
    ...draft,
    status,
    createdAt: now,
    publishedAt: status === 'running' ? now : undefined,
    updatedAt: now
  };
}
