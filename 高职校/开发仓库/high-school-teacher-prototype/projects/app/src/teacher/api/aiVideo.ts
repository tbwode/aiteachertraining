/**
 * AI视频课 Mock API
 *
 * - 数据持久化在 localStorage（key: ai_video_projects），读写参照 avatarStorage.ts 模式
 * - 任务进度采用「时间戳确定性推导」：deriveTaskState(taskStartedAt, now) 纯函数计算，
 *   页面打开时定时物化写回存储；页面关闭后重进按经过时间推导，刷新/关闭不丢失
 * - 所有函数 Promise 化并模拟网络延迟，接口形状对齐未来真实后端，可整体平移替换
 */
import type {
  AiVideoDuration,
  CreatePptProjectInput,
  DigitalHumanConfig,
  DigitalHumanPlacement,
  DigitalHumanShotOverride,
  DigitalHumanSnapshot,
  AiVideoFailReason,
  AiVideoParams,
  AiVideoProject,
  AiVideoRatio,
  AiVideoStatus,
  AiVideoTaskStage,
  AudioConfig,
  CreateImageProjectInput,
  CreateTemplateProjectInput,
  CreateTextProjectInput,
  DerivedTaskState,
  IntroOutroTemplate,
  PptPageInfo,
  PptPageType,
  PptScriptMode,
  ShotOptimizeAction,
  StoryboardShot,
  SubtitleConfig,
  TrimConfig
} from '../types/aiVideo';

export const AI_VIDEO_PROJECTS_STORAGE_KEY = 'ai_video_projects';

const MEDIA_BASE = '/media/ai-video';

/* -------------------------------------------------------------------------- */
/* 存储层（可注入 StorageLike 便于测试）                                        */
/* -------------------------------------------------------------------------- */

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getDefaultStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadProjects(
  storage: StorageLike | undefined = getDefaultStorage()
): AiVideoProject[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(AI_VIDEO_PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AiVideoProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(
  projects: AiVideoProject[],
  storage: StorageLike | undefined = getDefaultStorage()
) {
  if (!storage) return;
  try {
    storage.setItem(AI_VIDEO_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // 存储写满等异常静默忽略，保持页面可用
  }
}

/* -------------------------------------------------------------------------- */
/* 工具函数                                                                    */
/* -------------------------------------------------------------------------- */

let idCounter = 0;
export function generateId(prefix = 'p'): string {
  idCounter = (idCounter + 1) % 10000;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function ratioToVideoUrl(ratio: AiVideoRatio): string {
  if (ratio === '9:16') return `${MEDIA_BASE}/sample-9x16.mp4`;
  if (ratio === '1:1') return `${MEDIA_BASE}/sample-1x1.mp4`;
  return `${MEDIA_BASE}/sample-16x9.mp4`;
}

export function ratioToCoverUrl(ratio: AiVideoRatio): string {
  if (ratio === '9:16') return `${MEDIA_BASE}/cover-9x16.jpg`;
  if (ratio === '1:1') return `${MEDIA_BASE}/cover-1x1.jpg`;
  return `${MEDIA_BASE}/cover-16x9.jpg`;
}

export function shotImageUrl(index: number): string {
  const normalized = ((index % 6) + 6) % 6; // 0-5
  return `${MEDIA_BASE}/shot-${normalized + 1}.jpg`;
}

/* -------------------------------------------------------------------------- */
/* 高斯消去法示例（真实视频演示数据）                                             */
/* -------------------------------------------------------------------------- */

/** 真实示例视频（高职数学·Gauss消去法原理与步骤讲解，51.4s 16:9） */
export const GAUSS_VIDEO_URL = `${MEDIA_BASE}/gauss-elimination.mp4`;
export const GAUSS_COVER_URL = `${MEDIA_BASE}/cover-gauss.jpg`;
export const GAUSS_VIDEO_DURATION = 51.4;

/** 命中高斯示例主题判定（主题含「高斯」或「gauss」即走真实视频演示链路） */
export function isGaussDemoTopic(topic: string): boolean {
  return /高斯|gauss/i.test(topic);
}

type GaussShotSeed = {
  title: string;
  scene: string;
  narration: string;
  notes: string;
  /** 在真实视频中的起始秒（缩略图抽帧点） */
  thumbAt: number;
  duration: number;
};

/**
 * 与真实视频逐屏对齐的分镜（13 镜，合计 51.4s）：
 * 片头 → 目录 → 原理(2屏) → 消元过程(4屏) → 回代求解(2屏) → 例题解析(3屏)
 */
const GAUSS_SHOT_SEEDS: GaussShotSeed[] = [
  {
    title: '片头引入',
    scene: '片头动画：深蓝背景上数学公式漂浮汇聚，主标题「Gauss消去法原理与步骤讲解」淡入',
    narration: '同学们好，今天我们一起来学习高斯消去法的原理与步骤。',
    notes: '素材：公式粒子动效；转场：标题淡入；配乐渐起',
    thumbAt: 1,
    duration: 4
  },
  {
    title: '目录导览',
    scene: '目录页：四个章节条目依次排开（原理 / 消元过程 / 回代求解 / 例题解析）',
    narration: '本节课分为四个部分：高斯消去法原理、消元过程、回代求解和例题解析。',
    notes: '素材：章节卡片；动效：序号依次点亮',
    thumbAt: 2,
    duration: 4
  },
  {
    title: '章节页·高斯消去法原理',
    scene: '章节页「01 高斯消去法原理」，右侧展示三元一次方程组引例',
    narration: '首先，我们来了解什么是高斯消去法。',
    notes: '素材：章节转场页；动效：序号 01 放大入场',
    thumbAt: 3,
    duration: 4
  },
  {
    title: '基本原理讲解',
    scene:
      '原理讲解页：左侧「基本原理」文字说明，右侧上三角方程组示意，底部「核心思想：逐步消元」高亮条',
    narration:
      '高斯消去法的基本思想，是通过初等行变换，把线性方程组转化为上三角方程组，核心就是逐步消元。',
    notes: '素材：概念卡片；动效：关键词逐个高亮',
    thumbAt: 4,
    duration: 4
  },
  {
    title: '章节页·消元过程',
    scene: '章节页「02 消元过程」',
    narration: '接下来，我们进入消元过程的学习。',
    notes: '素材：章节转场页；动效：序号 02 放大入场',
    thumbAt: 5,
    duration: 4
  },
  {
    title: '写出增广矩阵',
    scene: '消元第一步：方程组转化为增广矩阵，系数与常数项分栏排列，虚线分隔',
    narration: '第一步，写出方程组的增广矩阵，把系数和常数项排列成矩阵形式。',
    notes: '素材：矩阵排版；动效：矩阵逐行浮现',
    thumbAt: 6,
    duration: 4
  },
  {
    title: '第一步消元',
    scene: '第一步消元：标注行变换 R₂-2R₁→R₂、R₃-R₁→R₃，首列下方两个元素归零',
    narration: '第二步，用第二行减去第一行的两倍，第三行减去第一行，消去第二、三行中的 x₁。',
    notes: '素材：行变换箭头标注；动效：被消元素闪烁归零',
    thumbAt: 7,
    duration: 4
  },
  {
    title: '第二步消元',
    scene: '第二步消元：R₃+2R₂→R₃，矩阵化为上三角形式',
    narration: '再用第三行加上第二行的两倍，消去 x₂，得到上三角矩阵。',
    notes: '素材：上三角区域高亮框；动效：三角区描边强调',
    thumbAt: 8,
    duration: 4
  },
  {
    title: '章节页·回代求解',
    scene: '章节页「03 回代求解」，副标题提示「从最后一个方程开始，逐步回代」',
    narration: '消元完成后，我们从最后一个方程开始回代求解。',
    notes: '素材：章节转场页；动效：序号 03 放大入场',
    thumbAt: 9,
    duration: 4
  },
  {
    title: '回代求解过程',
    scene: '回代求解页：依次求得 x₃=2、x₂=1、x₁=1，逐步代入过程分条展示',
    narration: '由第三个方程直接得到 x₃ 等于 2，再逐一代入上面的方程，求出 x₂ 等于 1、x₁ 等于 1。',
    notes: '素材：求解步骤卡片；动效：结果逐个盖章出现',
    thumbAt: 10,
    duration: 4
  },
  {
    title: '章节页·例题解析',
    scene: '章节页「04 例题解析」',
    narration: '最后，我们通过一道例题来巩固刚才学到的消元步骤。',
    notes: '素材：章节转场页；动效：序号 04 放大入场',
    thumbAt: 11,
    duration: 4
  },
  {
    title: '例题题目呈现',
    scene: '例题页：新的三元一次方程组题目展示（2x₁+x₂-x₃=1 等）',
    narration: '请同学们先读题，尝试自己写出这个方程组的增广矩阵。',
    notes: '素材：题目卡片；互动提示：此处可暂停让学生练习',
    thumbAt: 12,
    duration: 4
  },
  {
    title: '例题消元演示',
    scene: '例题消元演示：增广矩阵与连续行变换步骤并列展示，收尾淡出',
    narration: '按照消元步骤逐步计算，就能顺利求解。今天的课就到这里，课后请完成配套练习。',
    notes: '素材：步骤对照版式；转场：淡出收尾',
    thumbAt: 13,
    duration: 3.4
  }
];

/** 生成与真实视频对齐的高斯示例分镜（深拷贝 + 新 id） */
export function buildGaussStoryboard(): StoryboardShot[] {
  return GAUSS_SHOT_SEEDS.map((seed) => ({
    id: generateId('shot'),
    title: seed.title,
    sceneDescription: seed.scene,
    narration: seed.narration,
    productionNotes: seed.notes,
    duration: seed.duration,
    imageUrl: `${MEDIA_BASE}/shot-gauss-${seed.thumbAt}.jpg`
  }));
}

/* -------------------------------------------------------------------------- */
/* 内容安全与校验（PRD 6.1）                                                    */
/* -------------------------------------------------------------------------- */

export const SENSITIVE_WORDS = [
  '暴力',
  '色情',
  '赌博',
  '毒品',
  '枪支',
  '恐怖',
  '诈骗',
  '自杀',
  '仇恨'
] as const;

/** 命中敏感词时返回该词，否则 null */
export function findSensitiveWord(text: string): string | null {
  if (!text) return null;
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) return word;
  }
  return null;
}

export const PROMPT_MIN_LENGTH = 10;
export const TOPIC_MIN_LENGTH = 4;

export function isPromptTooShort(text: string): boolean {
  return text.trim().length < PROMPT_MIN_LENGTH;
}

/** 视频主题过短判定（<4 字） */
export function isTopicTooShort(topic: string): boolean {
  return topic.trim().length < TOPIC_MIN_LENGTH;
}

/** 演示用失败触发关键词 → 失败原因 */
export const FAIL_TRIGGER_KEYWORDS: Record<string, AiVideoFailReason> = {
  测试失败: 'timeout',
  测试拦截: 'moderation',
  测试繁忙: 'busy'
};

export function matchFailReason(text: string): AiVideoFailReason | null {
  for (const [keyword, reason] of Object.entries(FAIL_TRIGGER_KEYWORDS)) {
    if (text.includes(keyword)) return reason;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* 分镜脚本生成                                                                 */
/* -------------------------------------------------------------------------- */

const SCENE_TEMPLATES = [
  {
    title: '开场引入',
    scene: '开场画面：「{topic}」的岗位真实工作场景引入，展示职业环境与设备全貌',
    narration: '同学们好，今天我们来学习{topic}。',
    notes: '素材：岗位实景或场景图；转场：淡入；配乐渐起'
  },
  {
    title: '理论讲解',
    scene: '理论讲解画面：围绕「{topic}」的核心概念与工作原理，配合结构示意图标注',
    narration: '首先，让我们了解{topic}的基本概念和工作原理。',
    notes: '素材：结构示意图；动效：关键词逐个高亮'
  },
  {
    title: '实操演示',
    scene: '实操演示画面：实训车间中标准操作流程的分步演示，特写关键动作',
    narration: '接下来进入实训环节，我们来看标准的操作流程。',
    notes: '素材：实操视频；镜头：近景与特写切换'
  },
  {
    title: '安全规范',
    scene: '安全规范画面：操作中的安全注意事项与防护要求，警示标识醒目提示',
    narration: '操作前请大家务必牢记安全规范和防护要求。',
    notes: '素材：警示标识图；动效：红色脉冲强调'
  },
  {
    title: '要点拆解',
    scene: '要点拆解画面：关键技能点逐步拆解演示，特写镜头标注易错位置',
    narration: '我们再把关键技能点拆开，一步一步来看。',
    notes: '素材：分步演示图；镜头：关键步骤慢放'
  },
  {
    title: '常见错误',
    scene: '常见错误画面：学生实操中的常见错误动作对比分析，正误画面对照',
    narration: '注意这两种常见错误，这是实训考核的扣分点。',
    notes: '素材：正误对照素材；布局：左右分屏'
  },
  {
    title: '总结回顾',
    scene: '总结回顾画面：「{topic}」知识技能要点以思维导图形式汇总呈现',
    narration: '让我们回顾一下今天学习的核心内容。',
    notes: '素材：思维导图；动效：分支逐级展开'
  },
  {
    title: '课后任务',
    scene: '结尾画面：布置课后实训任务与报告要求，预告下一实训项目',
    narration: '今天的课就到这里，课后请完成实训报告，我们下节课再见。',
    notes: '素材：任务清单卡片；转场：淡出至片尾'
  }
] as const;

/** 时长预设对应的成片目标秒数与分镜数 */
export const DURATION_PRESET_MAP: Record<
  Exclude<AiVideoDuration, 'smart'>,
  { seconds: number; shots: number }
> = {
  compact: { seconds: 45, shots: 4 },
  balanced: { seconds: 120, shots: 6 },
  relaxed: { seconds: 240, shots: 8 },
  special: { seconds: 320, shots: 10 }
};

/** 智能匹配：按主题+补充说明的信息量选择档位 */
export function resolveSmartDuration(text: string): Exclude<AiVideoDuration, 'smart'> {
  const length = text.trim().length;
  if (length < 50) return 'compact';
  if (length < 150) return 'balanced';
  return 'relaxed';
}

/** 预设 → {seconds, shots}；smart 由文本量推导 */
export function resolveDuration(
  duration: AiVideoDuration,
  text: string
): { seconds: number; shots: number } {
  const preset = duration === 'smart' ? resolveSmartDuration(text) : duration;
  return DURATION_PRESET_MAP[preset];
}

/** 根据目标时长返回分镜数量 */
export function shotCountByDuration(duration: AiVideoDuration, text = ''): number {
  return resolveDuration(duration, text).shots;
}

/** 从提示词提取主题（取首句/前 20 字） */
export function extractTopic(prompt: string): string {
  const firstLine = prompt.trim().split(/[\n。！？!?.]/)[0] || prompt.trim();
  return firstLine.slice(0, 20);
}

/** 按时长预设生成分镜脚本：含分镜标题、画面设计、分镜讲稿、制作细节 */
export function buildStoryboardFromPrompt(
  topic: string,
  notes: string,
  duration: AiVideoDuration
): StoryboardShot[] {
  // 高斯消去法示例：返回与真实视频逐屏对齐的分镜
  if (isGaussDemoTopic(topic)) return buildGaussStoryboard();
  const text = `${topic}\n${notes}`;
  const { seconds, shots: count } = resolveDuration(duration, text);
  const topicText = topic.trim() || '本期内容';
  const perShot = Math.floor(seconds / count);
  const remainder = seconds - perShot * count;

  return Array.from({ length: count }, (_, index) => {
    const template = SCENE_TEMPLATES[index % SCENE_TEMPLATES.length];
    return {
      id: generateId('shot'),
      title: template.title,
      sceneDescription: template.scene.replaceAll('{topic}', topicText),
      narration: template.narration.replaceAll('{topic}', topicText),
      productionNotes: template.notes,
      // 余数分配给最后一镜，保证合计时长等于目标时长
      duration: index === count - 1 ? perShot + remainder : perShot,
      imageUrl: shotImageUrl(index)
    };
  });
}

/* -------------------------------------------------------------------------- */
/* 任务状态机（时间戳确定性推导）                                                 */
/* -------------------------------------------------------------------------- */

/** 各阶段时间窗（相对 taskStartedAt，毫秒） */
export const TASK_TIMELINE: Array<{
  stage: AiVideoTaskStage | 'queued';
  start: number;
  end: number;
  progressStart: number;
  progressEnd: number;
}> = [
  { stage: 'queued', start: 0, end: 3000, progressStart: 0, progressEnd: 5 },
  { stage: 'script', start: 3000, end: 6000, progressStart: 5, progressEnd: 15 },
  { stage: 'visuals', start: 6000, end: 16000, progressStart: 15, progressEnd: 55 },
  { stage: 'voice', start: 16000, end: 21000, progressStart: 55, progressEnd: 75 },
  { stage: 'subtitle', start: 21000, end: 24000, progressStart: 75, progressEnd: 90 },
  { stage: 'render', start: 24000, end: 30000, progressStart: 90, progressEnd: 100 }
];

export const TASK_TOTAL_DURATION = 30000;
/** 失败任务在 visuals 阶段中点失败 */
export const TASK_FAIL_AT = 11000;

function lerp(start: number, end: number, ratio: number): number {
  return Math.round(start + (end - start) * ratio);
}

/**
 * 由 taskStartedAt + now 推导任务当前状态。
 * failReason 非空时，任务在 TASK_FAIL_AT 时刻进入 failed。
 */
export function deriveTaskState(
  taskStartedAt: number,
  now: number,
  failReason: AiVideoFailReason | null = null
): DerivedTaskState {
  const elapsed = Math.max(0, now - taskStartedAt);

  if (failReason && elapsed >= TASK_FAIL_AT) {
    return { status: 'failed', stage: 'visuals', progress: 40, queuePosition: 0 };
  }

  if (elapsed >= TASK_TOTAL_DURATION) {
    return { status: 'success', stage: 'render', progress: 100, queuePosition: 0 };
  }

  for (const segment of TASK_TIMELINE) {
    if (elapsed >= segment.start && elapsed < segment.end) {
      const ratio = (elapsed - segment.start) / (segment.end - segment.start);
      const progress = lerp(segment.progressStart, segment.progressEnd, ratio);

      if (segment.stage === 'queued') {
        // 排队人数从 2 递减到 0（round：前段为 2，中段为 1，尾段为 0）
        const queuePosition = Math.max(0, Math.round(2 * (1 - ratio)));
        return { status: 'queued', stage: null, progress, queuePosition };
      }

      return { status: 'generating', stage: segment.stage, progress, queuePosition: 0 };
    }
  }

  return { status: 'queued', stage: null, progress: 0, queuePosition: 2 };
}

/* -------------------------------------------------------------------------- */
/* 二次编辑工作台：字幕/音频/裁剪/片头片尾                                       */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  fontSize: 'medium',
  color: '#FFFFFF',
  autoBreak: true,
  visible: true
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  voice: 'femaleClear',
  speed: 1,
  bgm: 'none',
  voiceVolume: 100,
  bgmVolume: 60
};

/** 数字人默认摆放：画面右下角（中心点百分比坐标） */
export const DEFAULT_DIGITAL_HUMAN_PLACEMENT: DigitalHumanPlacement = {
  x: 86,
  y: 78,
  scale: 1
};

export const DEFAULT_DIGITAL_HUMAN_CONFIG: DigitalHumanConfig = {
  enabled: false,
  avatar: 'bailuwei',
  mode: 'floatingAvatar',
  placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
};

/** 数字人缩放范围 */
export const DIGITAL_HUMAN_SCALE_MIN = 0.6;
export const DIGITAL_HUMAN_SCALE_MAX = 1.6;

/** 约束数字人摆放在画面内（保留边距）并限制缩放范围 */
export function clampDigitalHumanPlacement(
  placement: DigitalHumanPlacement
): DigitalHumanPlacement {
  return {
    x: Math.min(96, Math.max(4, Math.round(placement.x * 10) / 10)),
    y: Math.min(96, Math.max(4, Math.round(placement.y * 10) / 10)),
    scale:
      Math.round(
        Math.min(DIGITAL_HUMAN_SCALE_MAX, Math.max(DIGITAL_HUMAN_SCALE_MIN, placement.scale)) * 100
      ) / 100
  };
}

/** 片头/片尾模板各占时长（秒） */
export const INTRO_OUTRO_DURATION = 2;

/** 旧版数值时长 → 预设档位 */
function migrateDuration(raw: unknown): AiVideoDuration {
  if (typeof raw !== 'number') return 'smart';
  if (raw <= 30) return 'compact';
  if (raw <= 60) return 'balanced';
  return 'relaxed';
}

/** 补齐旧项目缺失的工作台配置（向后兼容） */
export function normalizeProject(project: AiVideoProject): AiVideoProject {
  // 旧版 params 携带 voice/speed/bgm，迁移至 audio 配置
  const legacyParams = project.params as AiVideoProject['params'] &
    Partial<Pick<AudioConfig, 'voice' | 'speed' | 'bgm'>>;
  const duration =
    typeof (project.params as { duration?: unknown }).duration === 'string'
      ? project.params.duration
      : migrateDuration((project.params as { duration?: unknown }).duration);

  const storyboard = project.storyboard.map((shot, index) => ({
    ...shot,
    title: shot.title ?? `分镜 ${index + 1}`,
    productionNotes: shot.productionNotes ?? ''
  }));

  const normalized: AiVideoProject = {
    ...project,
    params: { ratio: project.params.ratio, duration, style: project.params.style },
    storyboard,
    subtitle: project.subtitle ?? { ...DEFAULT_SUBTITLE_CONFIG },
    audio: project.audio ?? {
      ...DEFAULT_AUDIO_CONFIG,
      voice: legacyParams.voice ?? DEFAULT_AUDIO_CONFIG.voice,
      speed: legacyParams.speed ?? DEFAULT_AUDIO_CONFIG.speed,
      bgm: legacyParams.bgm ?? DEFAULT_AUDIO_CONFIG.bgm
    },
    intro: project.intro ?? 'none',
    outro: project.outro ?? 'none',
    aiBadge: project.aiBadge ?? true,
    aiBadgePosition: project.aiBadgePosition ?? 'topRight',
    digitalHuman: {
      ...DEFAULT_DIGITAL_HUMAN_CONFIG,
      ...project.digitalHuman,
      placement: {
        ...DEFAULT_DIGITAL_HUMAN_PLACEMENT,
        ...project.digitalHuman?.placement
      }
    },
    trim: { start: 0, end: 0 }
  };
  /* 裁剪区间自愈：缺失或非法（end<=start / 超出总时长）时重置为全区间 */
  const rawTrim = project.trim;
  const trimTotal = totalDuration(normalized);
  normalized.trim =
    rawTrim && rawTrim.end > rawTrim.start
      ? {
          start: Math.max(0, Math.min(rawTrim.start, Math.max(0, trimTotal - 1))),
          end: Math.max(1, Math.min(rawTrim.end, trimTotal))
        }
      : { start: 0, end: trimTotal };
  return normalized;
}

/** 成片总时长 = 分镜时长合计 + 片头片尾 */
export function totalDuration(project: AiVideoProject): number {
  const shots = project.storyboard.reduce((sum, shot) => sum + (Number(shot.duration) || 0), 0);
  const intro = project.intro && project.intro !== 'none' ? INTRO_OUTRO_DURATION : 0;
  const outro = project.outro && project.outro !== 'none' ? INTRO_OUTRO_DURATION : 0;
  return shots + intro + outro;
}

/** 字幕自动断句：按中英文标点拆分长句；autoBreak=false 时原样返回 */
export function splitSubtitle(text: string, autoBreak: boolean): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [''];
  if (!autoBreak) return [trimmed];
  const parts = trimmed
    .split(/(?<=[，。！？；,.!?;：:])/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

/**
 * 读取项目时物化派生状态：若项目处于 queued/generating，
 * 按当前时间推导最新状态并（可选）写回存储。
 */
export function materializeProject(
  project: AiVideoProject,
  now: number = Date.now()
): AiVideoProject {
  if (project.status !== 'queued' && project.status !== 'generating')
    return normalizeProject(project);
  if (!project.taskStartedAt) return project;

  const derived = deriveTaskState(project.taskStartedAt, now, project.failReason);
  const next: AiVideoProject = {
    ...normalizeProject(project),
    status: derived.status,
    stage: derived.stage,
    progress: derived.progress,
    queuePosition: derived.queuePosition,
    updatedAt: nowIso()
  };

  if (derived.status === 'success') {
    if (project.demoVideo === 'gauss') {
      next.videoUrl = GAUSS_VIDEO_URL;
      next.coverUrl = GAUSS_COVER_URL;
    } else {
      next.videoUrl = ratioToVideoUrl(project.params.ratio);
      next.coverUrl = ratioToCoverUrl(project.params.ratio);
    }
  }

  return next;
}

/* -------------------------------------------------------------------------- */
/* Mock API（Promise + 模拟延迟）                                                */
/* -------------------------------------------------------------------------- */

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function touch(project: AiVideoProject): AiVideoProject {
  return { ...project, updatedAt: nowIso() };
}

function upsertInList(projects: AiVideoProject[], project: AiVideoProject): AiVideoProject[] {
  const index = projects.findIndex((item) => item.id === project.id);
  if (index === -1) return [project, ...projects];
  const next = [...projects];
  next[index] = project;
  return next;
}

/** 项目列表（自动物化进行中的任务状态） */
export async function listProjects(): Promise<AiVideoProject[]> {
  const projects = loadProjects();
  const now = Date.now();
  let changed = false;
  const materialized = projects.map((project) => {
    const next = normalizeProject(materializeProject(project, now));
    if (next !== project) changed = true;
    return next;
  });
  if (changed) saveProjects(materialized);
  return delay(materialized.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function getProject(id: string): Promise<AiVideoProject | null> {
  const projects = loadProjects();
  const found = projects.find((item) => item.id === id);
  if (!found) return delay(null);
  const materialized = normalizeProject(materializeProject(found));
  if (materialized !== found) {
    saveProjects(upsertInList(projects, materialized));
  }
  return delay(materialized);
}

/** 创建文本生成项目：主题+补充说明；内含内容安全与长度校验，违规抛错码 */
export async function createTextProject(
  input: CreateTextProjectInput & { allowShort?: boolean },
  storage: StorageLike | undefined = getDefaultStorage()
): Promise<{ project: AiVideoProject }> {
  const topic = input.topic.trim();
  const notes = input.notes.trim();
  const prompt = [topic, notes].filter(Boolean).join('\n');

  const sensitive = findSensitiveWord(prompt);
  if (sensitive) {
    throw Object.assign(new Error('moderation'), { code: 'MODERATION', word: sensitive });
  }
  if (!input.allowShort && isTopicTooShort(topic)) {
    throw Object.assign(new Error('too_short'), { code: 'TOO_SHORT' });
  }

  const gaussDemo = isGaussDemoTopic(topic);

  const project: AiVideoProject = {
    id: generateId('video'),
    title: topic || '未命名视频项目',
    mode: 'text',
    prompt,
    params: gaussDemo ? { ...input.params, ratio: '16:9' } : input.params,
    demoVideo: gaussDemo ? 'gauss' : null,
    // 示例项目默认开启轻音乐，贴合课堂讲解氛围
    audio: gaussDemo ? { ...DEFAULT_AUDIO_CONFIG, bgm: 'freePiano' } : undefined,
    // 分镜逐步生成：先创建空脚本，由页面轮询 appendNextShot 逐条生成
    storyboard: [],
    storyboardPending: true,
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    coverUrl: gaussDemo ? GAUSS_COVER_URL : ratioToCoverUrl(input.params.ratio),
    taskStartedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  saveProjects(upsertInList(loadProjects(storage), project), storage);
  return delay({ project });
}

/**
 * 创建图片转视频项目：每张图片对应一个分镜，保留用户排序、镜头动效、旁白与停留时长。
 * 原型使用压缩后的 dataURL 或内置示例图片，后续对接后端时可无缝替换为素材资源 ID。
 */
export async function createImageProject(
  input: CreateImageProjectInput,
  storage: StorageLike | undefined = getDefaultStorage()
): Promise<{ project: AiVideoProject }> {
  const title = input.title.trim() || '未命名图片视频';
  const sensitive = findSensitiveWord(
    `${title}\n${input.images.map((item) => item.narration).join('\n')}`
  );
  if (sensitive) {
    throw Object.assign(new Error('moderation'), { code: 'MODERATION', word: sensitive });
  }
  if (input.images.length < 2) {
    throw Object.assign(new Error('not_enough_images'), { code: 'NOT_ENOUGH_IMAGES' });
  }

  const motionLabel: Record<CreateImageProjectInput['images'][number]['motion'], string> = {
    none: '静态展示',
    zoomIn: '缓慢推进',
    panLeft: '向左平移',
    panRight: '向右平移'
  };
  const storyboard: StoryboardShot[] = input.images.map((item, index) => ({
    id: `shot_${generateId('image')}`,
    title: `画面 ${index + 1} · ${item.name.replace(/\.[^.]+$/, '')}`,
    sceneDescription: `使用图片素材「${item.name}」作为主画面`,
    narration: item.narration.trim() || `接下来请看第 ${index + 1} 个教学画面。`,
    productionNotes: `镜头动效：${motionLabel[item.motion]}；智能适配画幅并保持主体安全区`,
    duration: Math.min(15, Math.max(3, Math.round(item.duration))),
    imageUrl: item.src,
    customMediaUrl: item.src,
    mediaType: 'image'
  }));

  const now = nowIso();
  const project: AiVideoProject = {
    id: generateId('video'),
    title,
    mode: 'images',
    prompt: `${title}\n${input.images.length} 张图片生成视频`,
    params: { ...input.params },
    storyboard,
    storyboardPending: false,
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    coverUrl: input.images[0]?.src ?? ratioToCoverUrl(input.params.ratio),
    taskStartedAt: null,
    audio: { ...input.audio },
    subtitle: { ...DEFAULT_SUBTITLE_CONFIG },
    digitalHuman: { ...DEFAULT_DIGITAL_HUMAN_CONFIG },
    createdAt: now,
    updatedAt: now
  };

  saveProjects(upsertInList(loadProjects(storage), project), storage);
  return delay({ project });
}

/**
 * 从空白画布或模板创建视频项目。
 * 模板项目预置 4 个可编辑教学镜头；空白项目仅放入 1 个初始场景，进入同一分镜工作台继续创作。
 */
export async function createTemplateProject(
  input: CreateTemplateProjectInput,
  storage: StorageLike | undefined = getDefaultStorage()
): Promise<{ project: AiVideoProject }> {
  const isBlank = input.templateId === null;
  const templateName = input.templateName?.trim() || '空白视频';
  const category = input.category?.trim() || '教育';
  const baseShots = isBlank
    ? [
        {
          title: '场景 1',
          sceneDescription: '空白教学画布，可添加标题、图片、视频、数字人等素材。',
          narration: '请在这里输入第一个场景的讲解内容。',
          productionNotes: '空白场景 · 16:9 安全区',
          duration: 5,
          imageUrl: ratioToCoverUrl(input.params.ratio)
        }
      ]
    : buildStoryboardFromPrompt(
        templateName,
        `采用${category}视频模板，保留版式结构并替换为当前课程内容。`,
        'compact'
      ).slice(0, 4);

  const storyboard: StoryboardShot[] = baseShots.map((shot) => ({
    ...shot,
    id: `shot_${generateId('template')}`
  }));
  const now = nowIso();
  const project: AiVideoProject = {
    id: generateId('video'),
    title: isBlank ? '未命名模板视频' : `${templateName} · 副本`,
    mode: 'template',
    prompt: isBlank ? '从空白画布创建视频' : `使用模板：${templateName}`,
    params: { ...input.params, duration: isBlank ? 'compact' : input.params.duration },
    storyboard,
    storyboardPending: false,
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    coverUrl: input.coverUrl ?? storyboard[0]?.imageUrl ?? ratioToCoverUrl(input.params.ratio),
    taskStartedAt: null,
    audio: { ...DEFAULT_AUDIO_CONFIG, bgm: 'freeLight' },
    subtitle: { ...DEFAULT_SUBTITLE_CONFIG },
    digitalHuman: {
      ...DEFAULT_DIGITAL_HUMAN_CONFIG,
      placement: { ...DEFAULT_DIGITAL_HUMAN_CONFIG.placement }
    },
    templateId: input.templateId,
    createdAt: now,
    updatedAt: now
  };

  saveProjects(upsertInList(loadProjects(storage), project), storage);
  return delay({ project });
}

/**
 * 逐步生成分镜：每次调用追加下一条分镜（内容由主题+时长确定，幂等），
 * 全部生成完毕后将 storyboardPending 置为 false。
 */
export async function appendNextShot(
  projectId: string,
  storage: StorageLike | undefined = getDefaultStorage()
): Promise<{ project: AiVideoProject; done: boolean } | null> {
  await delay(undefined, 600); // 模拟 AI 逐条生成耗时
  const projects = loadProjects(storage);
  const found = projects.find((item) => item.id === projectId);
  if (!found) return null;

  const plan = buildStoryboardFromPrompt(
    extractTopic(found.prompt),
    found.prompt.split('\n').slice(1).join('\n'),
    found.params.duration
  );
  const currentCount = found.storyboard.length;
  const done = currentCount + 1 >= plan.length;

  const next: AiVideoProject = {
    ...found,
    storyboard:
      currentCount >= plan.length ? found.storyboard : [...found.storyboard, plan[currentCount]],
    storyboardPending: !done,
    updatedAt: nowIso()
  };
  saveProjects(upsertInList(projects, next), storage);
  return { project: next, done };
}

export async function duplicateProject(id: string): Promise<AiVideoProject | null> {
  const projects = loadProjects();
  const source = projects.find((item) => item.id === id);
  if (!source) return delay(null);

  const copy: AiVideoProject = {
    ...source,
    id: generateId('video'),
    title: `${source.title}（副本）`,
    storyboard: source.storyboard.map((shot) => ({ ...shot, id: generateId('shot') })),
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    taskStartedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  saveProjects(upsertInList(projects, copy));
  return delay(copy);
}

export async function deleteProject(id: string): Promise<void> {
  const projects = loadProjects();
  saveProjects(projects.filter((item) => item.id !== id));
  return delay(undefined);
}

export async function updateProject(
  id: string,
  updater: (project: AiVideoProject) => AiVideoProject
): Promise<AiVideoProject | null> {
  const projects = loadProjects();
  const found = projects.find((item) => item.id === id);
  if (!found) return delay(null);
  const next = touch(updater(found));
  saveProjects(upsertInList(projects, next));
  return delay(next);
}

export async function updateStoryboard(
  id: string,
  storyboard: StoryboardShot[]
): Promise<AiVideoProject | null> {
  return updateProject(id, (project) => ({ ...project, storyboard }));
}

/** 单分镜重生成画面：短暂延迟后换一张占位图 */
export async function regenerateShotImage(
  projectId: string,
  shotId: string
): Promise<AiVideoProject | null> {
  await delay(undefined, 800);
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) =>
      shot.id === shotId ? { ...shot, imageUrl: shotImageUrl(Date.now() % 6) } : shot
    )
  }));
}

/** 重生成全部分镜画面（AI编辑面板一键操作） */
export async function regenerateAllShotImages(projectId: string): Promise<AiVideoProject | null> {
  await delay(undefined, 1200);
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: project.storyboard.map((shot, index) => ({
      ...shot,
      imageUrl: shotImageUrl(Date.now() + index + 1)
    }))
  }));
}

/** 全部重生成脚本：清空分镜并进入逐步生成（页面轮询 appendNextShot 重建） */
export async function regenerateStoryboard(projectId: string): Promise<AiVideoProject | null> {
  await delay(undefined, 500);
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: [],
    storyboardPending: true
  }));
}

/** 提交生成任务：进入排队，记录 taskStartedAt */
export async function submitGenerateTask(projectId: string): Promise<AiVideoProject | null> {
  const projects = loadProjects();
  const found = projects.find((item) => item.id === projectId);
  if (!found) return delay(null);

  // 生成前再做一次内容安全校验（分镜可能被改成违规内容）
  const fullText = [
    found.prompt,
    ...found.storyboard.flatMap((s) => [s.sceneDescription, s.narration])
  ].join('\n');
  const sensitive = findSensitiveWord(fullText);
  const failReason = sensitive ? 'moderation' : matchFailReason(found.prompt);

  const next: AiVideoProject = {
    ...found,
    status: 'queued',
    stage: null,
    progress: 0,
    queuePosition: 2,
    failReason,
    videoUrl: null,
    taskStartedAt: Date.now(),
    updatedAt: nowIso()
  };
  saveProjects(upsertInList(projects, next));
  return delay(next);
}

/** 失败/成功后返回分镜编辑（清除成片与任务状态） */
export async function backToDraft(projectId: string): Promise<AiVideoProject | null> {
  return updateProject(projectId, (project) => ({
    ...project,
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    taskStartedAt: null
  }));
}

/** 更新工作台配置（字幕/音频/裁剪/片头片尾） */
export async function updateProjectConfig(
  id: string,
  patch: Partial<
    Pick<
      AiVideoProject,
      | 'subtitle'
      | 'audio'
      | 'trim'
      | 'intro'
      | 'outro'
      | 'aiBadge'
      | 'aiBadgePosition'
      | 'digitalHuman'
    >
  >
): Promise<AiVideoProject | null> {
  return updateProject(id, (project) => {
    const merged = { ...project, ...patch };
    // 片头片尾变化会影响总时长，裁剪区间同步收敛到新总时长内
    const total = totalDuration(merged);
    const trim = merged.trim ?? { start: 0, end: total };
    merged.trim = {
      start: Math.max(0, Math.min(trim.start, total - 1)),
      end: Math.max(1, Math.min(trim.end, total))
    };
    if (merged.trim.end <= merged.trim.start) {
      merged.trim.end = Math.min(total, merged.trim.start + 1);
    }
    return merged;
  });
}

/**
 * 数字人分镜级覆盖（「仅此片段」的位置/缩放/隐藏）
 * override 传 null 表示清除该分镜的覆盖（回退到全局配置）
 */
export async function updateShotDigitalHuman(
  projectId: string,
  shotId: string,
  override: DigitalHumanShotOverride | null
): Promise<AiVideoProject | null> {
  await delay(200);
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) => {
      if (shot.id !== shotId) return shot;
      if (override === null) {
        const { digitalHumanOverride: _removed, ...rest } = shot;
        return rest;
      }
      const merged: DigitalHumanShotOverride = {
        ...shot.digitalHumanOverride,
        ...override,
        placement: override.placement
          ? clampDigitalHumanPlacement(override.placement)
          : shot.digitalHumanOverride?.placement
      };
      return { ...shot, digitalHumanOverride: merged };
    })
  }));
}

/**
 * 恢复数字人状态快照（撤销最近一次位置/大小/删除调整）：
 * 整体还原全局配置与各分镜覆盖（无快照的分镜清除覆盖）
 */
export async function restoreDigitalHumanState(
  projectId: string,
  snapshot: DigitalHumanSnapshot
): Promise<AiVideoProject | null> {
  await delay(200);
  return updateProject(projectId, (project) => ({
    ...project,
    digitalHuman: {
      ...snapshot.config,
      placement: { ...snapshot.config.placement }
    },
    storyboard: project.storyboard.map((shot) => {
      const hit = snapshot.overrides.find((item) => item.shotId === shot.id);
      const { digitalHumanOverride: _removed, ...restShot } = shot;
      if (!hit?.override) return restShot;
      return {
        ...restShot,
        digitalHumanOverride: {
          ...hit.override,
          placement: hit.override.placement ? { ...hit.override.placement } : undefined
        }
      };
    })
  }));
}

/**
 * 数字人摆放「同步到所有片段」：更新全局 placement，
 * 并清除各分镜的 placement 覆盖（hidden 覆盖保留）
 */
export async function syncDigitalHumanPlacement(
  id: string,
  placement: DigitalHumanPlacement
): Promise<AiVideoProject | null> {
  await delay(200);
  const clamped = clampDigitalHumanPlacement(placement);
  return updateProject(id, (project) => ({
    ...project,
    digitalHuman: {
      ...project.digitalHuman,
      enabled: project.digitalHuman?.enabled ?? true,
      avatar: project.digitalHuman?.avatar ?? 'bailuwei',
      mode: project.digitalHuman?.mode ?? 'floatingAvatar',
      placement: clamped
    },
    storyboard: project.storyboard.map((shot) => {
      if (!shot.digitalHumanOverride?.placement) return shot;
      const { placement: _removed, ...restOverride } = shot.digitalHumanOverride;
      const hasRest = Object.keys(restOverride).length > 0;
      if (hasRest) return { ...shot, digitalHumanOverride: restOverride };
      const { digitalHumanOverride: _drop, ...restShot } = shot;
      return restShot;
    })
  }));
}

/** 数字人启用/关闭（关闭时清除各分镜的 hidden 覆盖，重新开启后所有片段恢复展示） */
export async function setDigitalHumanEnabled(
  id: string,
  enabled: boolean
): Promise<AiVideoProject | null> {
  await delay(200);
  return updateProject(id, (project) => ({
    ...project,
    digitalHuman: {
      ...project.digitalHuman,
      enabled,
      avatar: project.digitalHuman?.avatar ?? 'bailuwei',
      mode: project.digitalHuman?.mode ?? 'floatingAvatar',
      placement: project.digitalHuman?.placement ?? { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
    },
    storyboard: enabled
      ? project.storyboard
      : project.storyboard.map((shot) => {
          if (!shot.digitalHumanOverride?.hidden) return shot;
          const { hidden: _removed, ...restOverride } = shot.digitalHumanOverride;
          const hasRest = Object.keys(restOverride).length > 0;
          if (hasRest) return { ...shot, digitalHumanOverride: restOverride };
          const { digitalHumanOverride: _drop, ...restShot } = shot;
          return restShot;
        })
  }));
}

/**
 * AI编辑 - 分镜优化（模拟智能体快捷指令）
 * pacing-优化动画节奏：按讲稿篇幅调整单镜时长，补充节奏说明
 * enrich-丰富细节：画面/讲稿/制作细节补充更丰富的描述
 * simplify-精简内容：讲稿与画面描述收敛为核心一句，制作细节标注精简版
 */
export async function optimizeShot(
  projectId: string,
  shotId: string,
  action: ShotOptimizeAction
): Promise<AiVideoProject | null> {
  await delay(900);
  return updateProject(projectId, (project) => {
    const storyboard = project.storyboard.map((shot) => {
      if (shot.id !== shotId) return shot;
      if (action === 'pacing') {
        // 按讲稿篇幅估算舒适时长（约 8 字/秒），收敛到 3-8s
        const target = Math.min(8, Math.max(3, Math.round(shot.narration.length / 8)));
        return {
          ...shot,
          duration: target,
          productionNotes: `节奏优化：画面随讲解重点缓入缓出，单镜时长调整为 ${target}s。${shot.productionNotes}`
        };
      }
      if (action === 'enrich') {
        return {
          ...shot,
          sceneDescription: `${shot.sceneDescription}，特写关键公式与步骤标注，重点内容高亮呈现`,
          narration: `${shot.narration} 注意这一步的符号变化，这是同学们最容易出错的地方。`,
          productionNotes: `${shot.productionNotes}；补充重点高亮与公式推导动画，关键步骤逐字显现`
        };
      }
      // simplify：讲稿只保留第一句，画面描述保留核心描述
      const firstSentence = shot.narration.split(/(?<=[。！？!?])/)[0] || shot.narration;
      const firstScene = shot.sceneDescription.split(/[，,]/)[0] || shot.sceneDescription;
      return {
        ...shot,
        sceneDescription: firstScene,
        narration: firstSentence.endsWith('。') ? firstSentence : `${firstSentence}。`,
        productionNotes: '精简版：聚焦核心步骤，去除冗余动画与装饰元素。'
      };
    });
    return { ...project, storyboard };
  });
}

/** 上传自定义镜头素材（图片/视频 dataURL） */
export async function updateShotMedia(
  projectId: string,
  shotId: string,
  media: { customMediaUrl: string; mediaType: 'image' | 'video' }
): Promise<AiVideoProject | null> {
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) =>
      shot.id === shotId
        ? { ...shot, customMediaUrl: media.customMediaUrl, mediaType: media.mediaType }
        : shot
    )
  }));
}

/** 恢复 AI 生成画面（清除自定义素材） */
export async function restoreShotMedia(
  projectId: string,
  shotId: string
): Promise<AiVideoProject | null> {
  return updateProject(projectId, (project) => ({
    ...project,
    storyboard: project.storyboard.map((shot) =>
      shot.id === shotId ? { ...shot, customMediaUrl: undefined, mediaType: 'ai' as const } : shot
    )
  }));
}

/** 导出视频：仅成功状态允许导出，返回 720P 下载地址 */
export async function exportVideo(projectId: string): Promise<{ url: string }> {
  const project = loadProjects().find((item) => item.id === projectId);
  if (!project || project.status !== 'success' || !project.videoUrl) {
    throw Object.assign(new Error('not_exportable'), { code: 'NOT_EXPORTABLE' });
  }
  return delay({ url: project.videoUrl });
}
/* -------------------------------------------------------------------------- */
/* PPT/文档转视频（PRD 5.2-5.6 Mock 实现）                                        */
/* -------------------------------------------------------------------------- */

/** 支持上传的文件扩展名（ppt / word / pdf） */
export const PPT_ACCEPT_EXTENSIONS = ['ppt', 'pptx', 'doc', 'docx', 'pdf'] as const;
/** 免费版上传上限 100MB */
export const PPT_MAX_SIZE_BYTES = 100 * 1024 * 1024;
/** 会员上传上限 500MB */
export const PPT_VIP_MAX_SIZE_BYTES = 500 * 1024 * 1024;

/** 文件扩展名校验（5.2.2 格式校验） */
export function isPptFileNameAccepted(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return (PPT_ACCEPT_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * 文件完整性校验（5.2.2）：按扩展名嗅探文件头签名，
 * pptx/docx=ZIP(PK)、pdf=%PDF、旧版 ppt/doc=OLE2；签名不符视为加密/损坏/无法解析
 */
export function sniffPptFileIntegrity(bytes: Uint8Array, fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes.length > i && bytes[i] === b);
  switch (ext) {
    case 'pptx':
    case 'docx':
      return startsWith([0x50, 0x4b, 0x03, 0x04]);
    case 'pdf':
      return startsWith([0x25, 0x50, 0x44, 0x46]);
    case 'ppt':
    case 'doc':
      return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    default:
      return false;
  }
}

/** 文件名稳定散列（驱动模拟解析的确定性） */
function hashFileName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 去掉扩展名的课件名 */
export function pptBaseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').trim() || '未命名课件';
}

/**
 * 智能解析（5.3 Mock）：按文件名确定性拆出 封面/目录/内容/图表/结尾 结构，
 * 标记页面类型、要点数、字数、视觉素材与动画；含 1 个空白页（自动过滤）与 1 个字数过少页（AI 补充）
 */
export function mockParsePptFile(fileName: string): PptPageInfo[] {
  const base = pptBaseName(fileName);
  const hash = hashFileName(fileName);
  const contentCount = 4 + (hash % 3); // 4-6 个内容页
  const enrichIndex = 2 + (hash % Math.max(1, contentCount - 1)); // 其中一页字数过少

  const pages: PptPageInfo[] = [
    {
      index: 1,
      type: 'cover',
      title: base,
      points: 1,
      words: 12,
      hasVisual: true,
      hasAnimation: true
    },
    {
      index: 2,
      type: 'toc',
      title: '目录',
      points: Math.min(5, contentCount),
      words: 20,
      hasVisual: false,
      hasAnimation: false
    }
  ];

  for (let i = 1; i <= contentCount; i += 1) {
    const aiEnrich = i === enrichIndex;
    pages.push({
      index: pages.length + 1,
      type: 'content',
      title: `第${i}章 ${base}（${i}）`,
      points: 2 + ((hash + i) % 3),
      words: aiEnrich ? 8 : 60 + ((hash * (i + 7)) % 80),
      hasVisual: i % 2 === 0,
      hasAnimation: (hash + i) % 3 === 0,
      aiEnrich
    });
  }

  pages.push({
    index: pages.length + 1,
    type: 'chart',
    title: `${base}·数据图表分析`,
    points: 2,
    words: 45,
    hasVisual: true,
    hasAnimation: true
  });
  pages.push({
    index: pages.length + 1,
    type: 'content',
    title: `${base}·课堂小结`,
    points: 3,
    words: 66,
    hasVisual: false,
    hasAnimation: false
  });
  // 空白页：自动过滤，不生成无效镜头（5.3.2）
  pages.push({
    index: pages.length + 1,
    type: 'content',
    title: '',
    points: 0,
    words: 0,
    hasVisual: false,
    hasAnimation: false,
    blank: true
  });
  pages.push({
    index: pages.length + 1,
    type: 'ending',
    title: '总结与致谢',
    points: 1,
    words: 18,
    hasVisual: false,
    hasAnimation: true
  });
  return pages;
}

/** 逐页讲解旁白（5.6.1）：按页面类型 × 脚本模式生成，确定性输出 */
export function buildPptNarration(page: PptPageInfo, mode: PptScriptMode): string {
  const title = page.title || '本页';
  if (mode === 'minimal') return `【${title}】`;

  const byType: Record<PptPageType, Record<Exclude<PptScriptMode, 'minimal'>, string>> = {
    cover: {
      concise: `大家好，今天我们来学习《${title}》。`,
      detailed: `各位同学，大家好！从今天开始，我们将一起学习《${title}》。本次课程内容循序渐进，请大家跟随讲解逐步掌握核心要点。`,
      formal: `各位领导、各位同事，大家好。下面由我为大家汇报《${title}》的相关内容。`
    },
    toc: {
      concise: `本次内容共分为${page.points}个部分，下面逐一展开。`,
      detailed: `在正式开始之前，我们先看一下本次内容的整体框架：共分为${page.points}个部分，建议同学们先建立整体认知，再逐章深入。`,
      formal: `首先介绍本次汇报的整体结构，共分为${page.points}个部分，请各位参照目录了解汇报脉络。`
    },
    content: {
      concise: `这一页我们来看「${title}」，重点掌握${page.points}个要点。`,
      detailed: `这一页我们详细讲解「${title}」。请大家聚焦本页的${page.points}个要点，结合实际案例理解其应用场景与常见误区。`,
      formal: `下面汇报「${title}」部分，本部分包含${page.points}个要点，请各位审阅。`
    },
    chart: {
      concise: `这一页是数据图表「${title}」，请关注关键趋势与结论。`,
      detailed: `这一页通过图表呈现「${title}」。请大家观察数据的变化趋势，重点理解峰值与拐点背后的业务含义。`,
      formal: `请看这组数据图表，「${title}」的核心指标如图所示，请各位关注趋势变化。`
    },
    ending: {
      concise: `以上就是本次内容的全部要点，感谢观看。`,
      detailed: `到这里，本次课程的全部内容就讲解完了。建议大家课后结合要点及时复习巩固，感谢大家的聆听，我们下次再见。`,
      formal: `以上即本次汇报的全部内容，恳请各位领导、同事批评指正，谢谢大家。`
    }
  };

  let text = byType[page.type][mode];
  // 字数过少页面：AI 自动补充适配讲解逻辑（5.3.2）
  if (page.aiEnrich) {
    text += '本页要点较少，这里为大家补充相关背景与示例说明。';
  }
  return text;
}

/** 单页停留时长（5.4.2）：auto 按字数动态分配（3-10s），custom 用自定义秒数 */
export function resolvePptShotDuration(
  page: PptPageInfo,
  config: Pick<CreatePptProjectInput['pptConfig'], 'pageDuration' | 'customDuration'>
): number {
  if (config.pageDuration === 'custom') {
    return Math.min(15, Math.max(3, Math.round(config.customDuration) || 5));
  }
  if (config.pageDuration !== 'auto') return Number(config.pageDuration);
  return Math.min(10, Math.max(3, Math.round(page.words / 20) || 3));
}

/** 创建 PPT 转视频项目：1 页 PPT = 1 个分镜（空白页已过滤），直接产出完整脚本进入草稿态 */
export async function createPptProject(
  input: CreatePptProjectInput,
  storage: StorageLike | undefined = getDefaultStorage()
): Promise<{ project: AiVideoProject }> {
  const base = pptBaseName(input.fileName);
  const sensitive = findSensitiveWord(input.fileName);
  if (sensitive) {
    throw Object.assign(new Error('moderation'), { code: 'MODERATION', word: sensitive });
  }

  const pages = input.pages.filter((page) => !page.blank);
  const transitionText = `翻页动画:${input.pptConfig.transition}，过渡间隙:${input.pptConfig.transitionGap}s`;

  const storyboard: StoryboardShot[] = pages.map((page, index) => {
    const disabled = input.digitalHumanDisabledPages.includes(page.index);
    // 智能避让：图表/含视觉素材页数字人缩小并贴右下角，避让核心内容区（5.5）
    const avoid =
      input.pptConfig.smartAvoid && page.hasVisual
        ? {
            placement: {
              x: DEFAULT_DIGITAL_HUMAN_PLACEMENT.x,
              y: DEFAULT_DIGITAL_HUMAN_PLACEMENT.y,
              scale: 0.8
            }
          }
        : undefined;
    const override: DigitalHumanShotOverride | undefined = disabled
      ? { ...avoid, hidden: true }
      : avoid;

    return {
      id: `shot_${generateId('ppt')}`,
      title: page.title || `第 ${page.index} 页`,
      sceneDescription: `PPT 第 ${page.index} 页（${page.type}）`,
      narration: buildPptNarration(page, input.pptConfig.scriptMode),
      productionNotes: transitionText,
      duration: resolvePptShotDuration(page, input.pptConfig),
      imageUrl: shotImageUrl(index),
      digitalHumanOverride: override
    };
  });

  const now = nowIso();
  const project: AiVideoProject = {
    id: generateId('video'),
    title: base,
    mode: 'ppt',
    prompt: `${input.fileName}
脚本模式:${input.pptConfig.scriptMode}`,
    params: { ...input.params },
    storyboard,
    storyboardPending: false,
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    coverUrl: ratioToCoverUrl(input.params.ratio),
    taskStartedAt: null,
    audio: { ...input.audio },
    subtitle: { ...input.subtitle },
    digitalHuman: {
      ...input.digitalHuman,
      placement: { ...input.digitalHuman.placement }
    },
    pptConfig: { ...input.pptConfig },
    sourceFileName: input.fileName,
    createdAt: now,
    updatedAt: now
  };

  saveProjects(upsertInList(loadProjects(storage), project), storage);
  return delay({ project });
}
