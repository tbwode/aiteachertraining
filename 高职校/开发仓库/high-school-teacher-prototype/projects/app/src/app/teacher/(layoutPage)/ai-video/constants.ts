/**
 * AI视频课 页面常量
 */
import type {
  AiVideoBgm,
  AiVideoDuration,
  AiVideoParams,
  AiVideoRatio,
  AiVideoStyle,
  AiVideoTaskStage,
  AiVideoVoice,
  DigitalHumanAvatarId
} from '@/teacher/types/aiVideo';

export const AI_VIDEO_PRIMARY = '#C8000B';
export const AI_VIDEO_PRIMARY_HOVER = '#A80009';
export const AI_VIDEO_PRIMARY_BG = '#FFF1F0';
export const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
export const CARD_SHADOW_HOVER = '0 8px 24px rgba(0,0,0,0.12)';
export const PAGE_MAX_WIDTH = '1200px';

/** 视频比例：横屏 16:9 / 竖屏 9:16 */
export const RATIO_OPTIONS: AiVideoRatio[] = ['16:9', '9:16'];

/** 时长预设：智能匹配(推荐)/紧凑/均衡/从容/专题 */
export const DURATION_OPTIONS: AiVideoDuration[] = [
  'smart',
  'compact',
  'balanced',
  'relaxed',
  'special'
];

/** 主题风格模板按比例分组展示 */
export const STYLE_TEMPLATES_BY_RATIO: Record<'16:9' | '9:16', AiVideoStyle[]> = {
  '16:9': ['simpleCourseware', 'realistic', 'corporate', 'documentary'],
  '9:16': ['knowledgeTalk', 'anime', 'tech', 'flashCut']
};

export const STYLE_OPTIONS: AiVideoStyle[] = [
  'realistic',
  'anime',
  'tech',
  'simpleCourseware',
  'corporate',
  'documentary',
  'knowledgeTalk',
  'flashCut'
];

/** 风格模板缩略图（按比例取图） */
export function styleThumbnail(style: AiVideoStyle, ratio: AiVideoRatio): string {
  const suffix = ratio === '9:16' ? '9x16' : '16x9';
  return `/media/ai-video/style-${style}-${suffix}.jpg`;
}
export const VOICE_OPTIONS: AiVideoVoice[] = [
  'femaleClear',
  'femaleGentle',
  'maleDeep',
  'maleEnergetic'
];
/** isVip 的 BGM 选项在免费版下置灰 */
export const BGM_OPTIONS: Array<{ value: AiVideoBgm; isVip?: boolean }> = [
  { value: 'none' },
  { value: 'freePiano' },
  { value: 'freeLight' },
  { value: 'vipEpic', isVip: true }
];

export const TASK_STAGES: AiVideoTaskStage[] = ['script', 'visuals', 'voice', 'subtitle', 'render'];

export const DEFAULT_AI_VIDEO_PARAMS: AiVideoParams = {
  ratio: '16:9',
  duration: 'smart',
  style: 'simpleCourseware'
};

/** 补充说明字数上限 */
export const NOTES_MAX_LENGTH = 1200;

/** 数字人形象列表（SVG 扁平插画） */
/** 数字人形象库：realistic-写实 / cartoon-卡通 */
export const DIGITAL_HUMAN_AVATARS: Array<{
  id: DigitalHumanAvatarId;
  src: string;
  category: 'realistic' | 'cartoon';
}> = [
  { id: 'bailuwei', src: '/media/ai-video/avatar-bailuwei.svg', category: 'realistic' },
  { id: 'xiayouyou', src: '/media/ai-video/avatar-xiayouyou.svg', category: 'realistic' },
  { id: 'luyumo', src: '/media/ai-video/avatar-luyumo.svg', category: 'realistic' },
  { id: 'chenzhiyue', src: '/media/ai-video/avatar-chenzhiyue.svg', category: 'realistic' },
  { id: 'wenyicheng', src: '/media/ai-video/avatar-wenyicheng.svg', category: 'realistic' },
  { id: 'yunshu', src: '/media/ai-video/avatar-yunshu.svg', category: 'realistic' },
  { id: 'femaleTeacher', src: '/media/ai-video/avatar-female-teacher.svg', category: 'realistic' },
  { id: 'maleTeacher', src: '/media/ai-video/avatar-male-teacher.svg', category: 'realistic' },
  { id: 'baishihan', src: '/media/ai-video/avatar-baishihan.svg', category: 'cartoon' },
  { id: 'linwanqing', src: '/media/ai-video/avatar-linwanqing.svg', category: 'cartoon' },
  { id: 'wenyanshu', src: '/media/ai-video/avatar-wenyanshu.svg', category: 'cartoon' }
];

/** 字幕字号档位 */
export const SUBTITLE_FONT_SIZE_KEYS = ['small', 'medium', 'large'] as const;

/** 字幕颜色选项 */
export const SUBTITLE_COLOR_OPTIONS = ['#FFFFFF', '#FFE58F', '#FF4D4F', '#1F1F1F'] as const;

/** 「AI 生成」标识位置选项（四角） */
export const AI_BADGE_POSITION_OPTIONS = [
  'topRight',
  'topLeft',
  'bottomRight',
  'bottomLeft'
] as const;

export const PROMPT_EXAMPLE_KEYS = ['example1', 'example2', 'example3'] as const;

/** PPT 预览编辑 - 系统背景预设（渐变） */
export const PPT_BACKGROUND_PRESETS: Array<{ id: string; css: string }> = [
  { id: 'skyBlue', css: 'linear-gradient(135deg, #EAF2FF 0%, #C9DDFB 55%, #A9CBF5 100%)' },
  { id: 'mint', css: 'linear-gradient(135deg, #E6FBF3 0%, #C2F0DC 55%, #9FE3C6 100%)' },
  { id: 'lavender', css: 'linear-gradient(135deg, #F1ECFD 0%, #DBD0F8 55%, #C1B0F0 100%)' },
  { id: 'peach', css: 'linear-gradient(135deg, #FFF1E8 0%, #FBDCC8 55%, #F3C2A3 100%)' },
  { id: 'lightGray', css: 'linear-gradient(135deg, #F4F6F9 0%, #E2E7EF 55%, #CBD4E0 100%)' },
  { id: 'deepBlue', css: 'linear-gradient(135deg, #1D2B64 0%, #2A4A9E 55%, #3D6BD8 100%)' },
  { id: 'forest', css: 'linear-gradient(135deg, #10372A 0%, #1C5C46 55%, #2E8263 100%)' },
  { id: 'sunset', css: 'linear-gradient(135deg, #4A1D5E 0%, #8E3A8F 55%, #E0699B 100%)' }
];
