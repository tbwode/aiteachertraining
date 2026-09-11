/**
 * AI视频课 类型定义
 */

export type AiVideoMode = 'text' | 'ppt' | 'template' | 'images';

export type AiVideoRatio = '16:9' | '9:16' | '1:1';

/**
 * 视频时长预设：
 * smart-智能匹配(推荐) / compact-紧凑(约30s-1min) / balanced-均衡(约1-3min) /
 * relaxed-从容(约3-5min) / special-专题(5min以上)
 */
export type AiVideoDuration = 'smart' | 'compact' | 'balanced' | 'relaxed' | 'special';

export type AiVideoStyle =
  | 'realistic'
  | 'anime'
  | 'tech'
  | 'simpleCourseware'
  | 'corporate'
  | 'documentary'
  | 'knowledgeTalk'
  | 'flashCut';

export type AiVideoVoice = 'femaleClear' | 'femaleGentle' | 'maleDeep' | 'maleEnergetic';

export type AiVideoBgm = 'none' | 'freePiano' | 'freeLight' | 'vipEpic';

export type AiVideoParams = {
  ratio: AiVideoRatio;
  duration: AiVideoDuration;
  style: AiVideoStyle;
};

export type StoryboardShot = {
  id: string;
  /** 分镜标题 */
  title: string;
  /** 画面设计 */
  sceneDescription: string;
  /** 分镜讲稿（台词/字幕） */
  narration: string;
  /** 制作细节（素材/镜头/动效说明） */
  productionNotes: string;
  /** 单镜头时长（秒） */
  duration: number;
  /** 分镜占位图 */
  imageUrl: string;
  /** 自定义素材（上传图片/视频的 dataURL），优先于 imageUrl 展示 */
  customMediaUrl?: string;
  /** 素材来源：ai-生成（默认）/ image-上传图片 / video-上传视频 */
  mediaType?: 'ai' | 'image' | 'video';
  /** 数字人分镜级覆盖（仅此片段的位置/缩放/隐藏） */
  digitalHumanOverride?: DigitalHumanShotOverride;
  /** 字幕高亮片段（选中文稿文字设置为高亮的子串列表，画布字幕条标黄展示） */
  subtitleHighlights?: string[];
  /** 文本框叠加层（PPT 预览编辑「文字」面板添加） */
  textOverlays?: PptTextOverlay[];
  /** 媒体叠加层（PPT 预览编辑「素材」面板添加到画面） */
  mediaOverlays?: PptMediaOverlay[];
};

/** 字幕配置（二次编辑工作台） */
export type SubtitleConfig = {
  fontSize: 'small' | 'medium' | 'large';
  color: string;
  /** 自动断句：按标点拆分长句字幕 */
  autoBreak: boolean;
  /** 字幕是否展示在视频画面（默认 true） */
  visible: boolean;
  /** 字幕画面位置（百分比坐标，画面中心为 50，缺省 { x: 50, y: 88 }，画布内拖动调整） */
  position?: { x: number; y: number };
  /** 字幕条整体宽度（占画面宽度百分比 10-96，缺省自适应文字宽度，画布内拖拽边缘调整） */
  width?: number;
};

/** 音频配置（二次编辑工作台） */
export type AudioConfig = {
  voice: AiVideoVoice;
  /** 语速 0.7 - 1.3 */
  speed: number;
  bgm: AiVideoBgm;
  /** 人声音量 0-100 */
  voiceVolume: number;
  /** BGM 音量 0-100 */
  bgmVolume: number;
};

/** 裁剪配置：保留 [start, end) 区间（秒，基于成片总时长） */
export type TrimConfig = {
  start: number;
  end: number;
};

/** 片头片尾模板 */
export type IntroOutroTemplate = 'none' | 'schoolBadge' | 'minimalText' | 'courseTitle';

/** 「AI 生成」标识在视频画面上的位置 */
export type AiBadgePosition = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';

/** 数字人形象（femaleTeacher/maleTeacher 为早期形象 id，向后兼容保留） */
export type DigitalHumanAvatarId =
  | 'femaleTeacher'
  | 'maleTeacher'
  | 'bailuwei'
  | 'xiayouyou'
  | 'luyumo'
  | 'chenzhiyue'
  | 'wenyicheng'
  | 'yunshu'
  | 'baishihan'
  | 'linwanqing'
  | 'wenyanshu';

/** 数字人展示模式：halfBody-半身出镜 / fullBody-全身出镜 / floatingAvatar-悬浮头像 */
export type DigitalHumanMode = 'halfBody' | 'fullBody' | 'floatingAvatar';

/** 数字人在画面上的摆放（位置为相对画面容器的百分比坐标，指数字人中心点） */
export type DigitalHumanPlacement = {
  /** 水平位置 0-100（默认 86，靠右） */
  x: number;
  /** 垂直位置 0-100（默认 78，靠下） */
  y: number;
  /** 缩放倍率 0.6-1.6（默认 1） */
  scale: number;
};

/** 数字人配置（二次编辑工作台） */
export type DigitalHumanConfig = {
  /** 是否启用数字人讲解（叠加在视频画面上） */
  enabled: boolean;
  avatar: DigitalHumanAvatarId;
  /** 展示模式（默认 floatingAvatar 悬浮头像） */
  mode: DigitalHumanMode;
  /** 全局摆放（所有片段默认跟随该位置与缩放） */
  placement: DigitalHumanPlacement;
};

/** 数字人分镜级覆盖（「仅此片段」的调整/删除） */
export type DigitalHumanShotOverride = {
  /** 仅此片段的摆放（优先于全局 placement） */
  placement?: DigitalHumanPlacement;
  /** 仅此片段的数字人形象（优先于全局 avatar） */
  avatar?: DigitalHumanAvatarId;
  /** 仅此片段隐藏数字人 */
  hidden?: boolean;
};

/** 数字人状态快照（撤销最近一次位置/大小/删除调整时整体还原） */
export type DigitalHumanSnapshot = {
  config: DigitalHumanConfig;
  overrides: Array<{ shotId: string; override?: DigitalHumanShotOverride }>;
};

export type AiVideoTaskStage = 'script' | 'visuals' | 'voice' | 'subtitle' | 'render';

export type AiVideoStatus = 'draft' | 'queued' | 'generating' | 'success' | 'failed';

export type AiVideoFailReason = 'timeout' | 'moderation' | 'busy';

export type AiVideoProject = {
  id: string;
  title: string;
  mode: AiVideoMode;
  prompt: string;
  params: AiVideoParams;
  storyboard: StoryboardShot[];
  status: AiVideoStatus;
  stage: AiVideoTaskStage | null;
  /** 0-100 */
  progress: number;
  queuePosition: number;
  failReason: AiVideoFailReason | null;
  videoUrl: string | null;
  coverUrl: string | null;
  /** 任务开始时间戳（用于离线推进推导） */
  taskStartedAt: number | null;
  /** 分镜脚本生成中（逐步生成分镜，生成完毕后置 false） */
  storyboardPending?: boolean;
  /** 字幕配置（缺省时由 normalizeProject 填充默认值） */
  subtitle?: SubtitleConfig;
  /** 音频配置 */
  audio?: AudioConfig;
  /** 裁剪配置 */
  trim?: TrimConfig;
  /** 片头模板 */
  intro?: IntroOutroTemplate;
  /** 片尾模板 */
  outro?: IntroOutroTemplate;
  /** 「AI 生成」标识是否展示在视频画面（默认 true） */
  aiBadge?: boolean;
  /** 「AI 生成」标识位置（默认 topRight） */
  aiBadgePosition?: AiBadgePosition;
  /** 数字人配置 */
  digitalHuman?: DigitalHumanConfig;
  /** 演示成片标识：gauss-高斯消去法真实示例视频 */
  demoVideo?: 'gauss' | null;
  /** PPT 转视频专属配置（mode=ppt 时存在） */
  pptConfig?: PptVideoConfig;
  /** PPT 源文件名（mode=ppt 时存在） */
  sourceFileName?: string;
  /** 模板视频来源；null 表示从空白画布创建 */
  templateId?: string | null;
  /** 素材库（PPT 预览编辑「素材」面板上传的图片/视频，dataURL 存储） */
  materials?: PptMaterialItem[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTextProjectInput = {
  /** 视频主题 */
  topic: string;
  /** 补充说明（选填，≤1200 字符）：风格偏好、目标受众、重点要素等 */
  notes: string;
  params: AiVideoParams;
};

/** 图片转视频的单张素材与镜头参数 */
export type ImageVideoSourceItem = {
  id: string;
  name: string;
  /** 本地上传图片的 dataURL，或原型内置示例图片地址 */
  src: string;
  narration: string;
  duration: number;
  motion: 'none' | 'zoomIn' | 'panLeft' | 'panRight';
};

/** 创建图片转视频项目的输入 */
export type CreateImageProjectInput = {
  title: string;
  images: ImageVideoSourceItem[];
  params: AiVideoParams;
  audio: AudioConfig;
};

/** 从空白或模板创建视频项目 */
export type CreateTemplateProjectInput = {
  templateId: string | null;
  templateName?: string;
  coverUrl?: string;
  category?: string;
  params: AiVideoParams;
};

export type UpdateStoryboardInput = {
  projectId: string;
  storyboard: StoryboardShot[];
};

/** 任务推导结果（由 taskStartedAt + now 确定性计算） */
export type DerivedTaskState = {
  status: AiVideoStatus;
  stage: AiVideoTaskStage | null;
  progress: number;
  queuePosition: number;
};

/** AI编辑 - 分镜优化动作：pacing-优化动画节奏 / enrich-丰富细节 / simplify-精简内容 */
export type ShotOptimizeAction = 'pacing' | 'enrich' | 'simplify';

/* -------------------------------------------------------------------------- */
/* PPT/文档转视频                                                                */
/* -------------------------------------------------------------------------- */

/** PPT 页面类型：cover-封面 / toc-目录 / content-内容 / chart-图表 / ending-结尾 */
export type PptPageType = 'cover' | 'toc' | 'content' | 'chart' | 'ending';

/** PPT 解析后的单页信息 */
export type PptPageInfo = {
  /** 原始页码（从 1 开始） */
  index: number;
  type: PptPageType;
  title: string;
  /** 提取的正文要点数 */
  points: number;
  /** 提取的文本字数 */
  words: number;
  /** 是否含图片/图表等视觉素材 */
  hasVisual: boolean;
  /** 是否含翻页/元素动画 */
  hasAnimation: boolean;
  /** 空白页：自动过滤，不生成分镜 */
  blank?: boolean;
  /** 字数过少：AI 自动补充适配讲解逻辑 */
  aiEnrich?: boolean;
};

/** 讲解脚本模式：concise-精简讲解 / detailed-详细授课 / formal-正式汇报 / minimal-极简字幕 */
export type PptScriptMode = 'concise' | 'detailed' | 'formal' | 'minimal';

/** 单页停留时长：auto-自动适配（按字数动态分配） / 3 / 5 / 8 / custom-自定义 */
export type PptPageDuration = 'auto' | '3' | '5' | '8' | 'custom';

/** 翻页动画效果：none-无动画 / smooth-平滑翻页 / fade-淡入淡出 / original-还原PPT原动画（会员） */
export type PptTransition = 'none' | 'smooth' | 'fade' | 'original';

/** 页面过渡间隙（秒） */
export type PptTransitionGap = 0.5 | 1 | 1.5;

/** 情感模式：calm-平静 / warm-亲和 / energetic-激昂 */
export type PptEmotion = 'calm' | 'warm' | 'energetic';

/**
 * 课件布局（课件版式 × 数字人形态）：
 * leftDh-左课件·讲师侧立 / centerNone-居中课件·无数字人 / fullNone-全屏课件·无数字人 /
 * fullDh-全屏课件·讲师侧立 / fullAvatar-全屏课件·讲师镜头 / centerAvatar-居中课件·讲师镜头
 */
export type PptLayoutId =
  | 'leftDh'
  | 'centerNone'
  | 'fullNone'
  | 'fullDh'
  | 'fullAvatar'
  | 'centerAvatar';

/** 文本框字体：sans-默认 / serif-宋体 / kai-楷体 / yuanti-圆体 */
export type PptTextFont = 'sans' | 'serif' | 'kai' | 'yuanti';

/** 文本框水平对齐方式 */
export type PptTextAlign = 'left' | 'center' | 'right';

/** 文本框垂直对齐方式 */
export type PptTextVAlign = 'top' | 'middle' | 'bottom';

/** @deprecated 旧版单动画字段（读取时迁移为进场动画） */
export type PptTextAnimation = 'none' | 'fadeIn' | 'slideUp' | 'zoomIn' | 'typewriter';

/** 文本框进场动画：none-无动效 / fadeIn-淡入 / slideInRight-向右滑入 / slideInLeft-向左滑入 / slideInUp-向上滑入 / slideInDown-向下滑入 */
export type PptTextEnterAnimation =
  | 'none'
  | 'fadeIn'
  | 'slideInRight'
  | 'slideInLeft'
  | 'slideInUp'
  | 'slideInDown';

/** 文本框出场动画：none-无动效 / fadeOut-淡出 / slideOutRight-向右滑出 / slideOutLeft-向左滑出 / slideOutUp-向上滑出 / slideOutDown-向下滑出 */
export type PptTextExitAnimation =
  | 'none'
  | 'fadeOut'
  | 'slideOutRight'
  | 'slideOutLeft'
  | 'slideOutUp'
  | 'slideOutDown';

/** 画布文本框叠加层 */
export type PptTextOverlay = {
  id: string;
  /** 文本内容（≤100 字） */
  content: string;
  /** 水平位置 0-100（中心点百分比） */
  x: number;
  /** 垂直位置 0-100（中心点百分比） */
  y: number;
  fontFamily: PptTextFont;
  /** 字号（760px 参考画布下的像素值，渲染时按画布宽等比缩放） */
  fontSize: number;
  color: string;
  /** 水平对齐 */
  align: PptTextAlign;
  /** 垂直对齐（默认 middle） */
  vAlign: PptTextVAlign;
  /** 透明度 10-100 */
  opacity: number;
  /** 进场动画 */
  enterAnimation: PptTextEnterAnimation;
  /** 出场动画（播放片段末段触发预览） */
  exitAnimation: PptTextExitAnimation;
  /** 文本框宽度（画布宽度百分比，默认 40） */
  width?: number;
  /** 文本框高度（画布高度百分比，默认 18） */
  height?: number;
  /** @deprecated 旧版单动画字段（读取时迁移为 enterAnimation） */
  animation?: PptTextAnimation;
};

/** 素材类型：image-图片 / video-视频 */
export type PptMaterialType = 'image' | 'video';

/** 素材库条目 */
export type PptMaterialItem = {
  id: string;
  type: PptMaterialType;
  /** dataURL */
  url: string;
  /** 原始文件名 */
  name: string;
};

/** 画布媒体叠加层（素材添加到画面后生成） */
export type PptMediaOverlay = {
  id: string;
  type: PptMaterialType;
  /** dataURL */
  url: string;
  /** 水平位置 0-100（中心点百分比） */
  x: number;
  /** 垂直位置 0-100（中心点百分比） */
  y: number;
  /** 宽度（画布宽度百分比） */
  width: number;
  /** 宽高比 w/h（缩放时保持比例） */
  aspect: number;
};

/** 智能进度条章节：标题 + 包含的片段数（按片段顺序依次划分） */
export type PptProgressChapter = {
  id: string;
  /** 章节标题（展示在进度条上，支持修改/删除/添加） */
  title: string;
  /** 包含的片段数（≥1，拖动章节边界可调整） */
  count: number;
};

/** PPT 转视频专属配置（创建时固化到项目） */
export type PptVideoConfig = {
  scriptMode: PptScriptMode;
  pageDuration: PptPageDuration;
  /** pageDuration=custom 时的自定义秒数（3-15） */
  customDuration: number;
  transition: PptTransition;
  transitionGap: PptTransitionGap;
  /** 分辨率（默认 1080p） */
  resolution: '480p' | '720p' | '1080p';
  /** 画面质量（默认 medium） */
  quality?: 'high' | 'medium' | 'low';
  /** 帧率（默认 25fps） */
  frameRate?: 25 | 30;
  /** 水印开关（跟随会员权限） */
  watermark: boolean;
  emotion: PptEmotion;
  /** 数字人智能避让：自动识别标题/正文/图表区域，悬浮位置避开核心内容区 */
  smartAvoid: boolean;
  /** 课件布局（默认 leftDh：左课件·讲师侧立） */
  layout?: PptLayoutId;
  /** 画布背景：系统背景预设 id 或本地上传图片 dataURL（缺省跟随模板氛围背景） */
  background?: string;
  /** 智能进度条开关（画布底部章节进度条） */
  progressBar?: boolean;
  /** 智能进度条章节配置（按顺序划分全部片段，count 之和应等于片段总数） */
  progressChapters?: PptProgressChapter[];
};

/** 创建 PPT 转视频项目的输入 */
export type CreatePptProjectInput = {
  /** 源文件名 */
  fileName: string;
  /** 解析得到的页面列表（含被过滤的空白页，由本函数内部过滤） */
  pages: PptPageInfo[];
  params: AiVideoParams;
  audio: AudioConfig;
  subtitle: SubtitleConfig;
  digitalHuman: DigitalHumanConfig;
  /** 逐页关闭数字人播报的页码（PptPageInfo.index） */
  digitalHumanDisabledPages: number[];
  pptConfig: PptVideoConfig;
};
