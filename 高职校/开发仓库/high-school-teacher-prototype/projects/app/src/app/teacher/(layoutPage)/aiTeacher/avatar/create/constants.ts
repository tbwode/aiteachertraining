// 颜色常量
export const PRIMARY_COLOR = '#C83E3E';
export const SUCCESS_COLOR = '#52C41A';
export const ERROR_COLOR = '#F5222D';
export const INFO_COLOR = '#1677FF';
export const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

// 业务常量
export const MAX_COURSEWARE_FILES = 20;

// 课件上传文件类型与大小限制
export const COURSEWARE_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv'] as const;
export const COURSEWARE_DOCUMENT_MAX_SIZE = 500 * 1024 * 1024; // 500MB
export const COURSEWARE_VIDEO_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
export const STEP_TITLES = ['班级配置', '教学路径', '知识聚合'] as const;

export type WizardStep = 1 | 2 | 3;

// 推荐资源类型
export type RecommendedResource = {
  id: string;
  category: 'doc' | 'video' | 'ai';
  title: string;
  description: string;
  chapterId: string;
};

// 缺失章节类型
export type MissingChapter = {
  id: string;
  title: string;
  status: 'partial' | 'missing';
  missingPoints: string[];
  selectedAiResourceId: string;
  defaultText: string;
};

// 模拟数据 - 已清空，等待真实数据
export const missingChapters: MissingChapter[] = [];

export const recommendedResources: RecommendedResource[] = [];

export const parsedSyllabusChapters: Array<{
  id: string;
  title: string;
  points: string[];
}> = [];

// 模拟已上传的课件文件列表
export const MOCK_COURSEWARE_FILES = [
  { id: 'mock-cw-1', name: '关于规范办公环...境管01.pdf', size: '2.5 MB', fileKey: 'mock-cw-key-1' },
  { id: 'mock-cw-2', name: '关于规范办公环...境管01.pdf', size: '1.8 MB', fileKey: 'mock-cw-key-2' },
  { id: 'mock-cw-3', name: '关于规范办公环...境管01.pdf', size: '3.2 MB', fileKey: 'mock-cw-key-3' }
];
