// 颜色常量
export const PRIMARY_COLOR = '#C83E3E';
export const SUCCESS_COLOR = '#52C41A';
export const WARNING_COLOR = '#FAAD14';
export const ERROR_COLOR = '#F5222D';
export const INFO_COLOR = '#1677FF';

// 节点类型
export type NodeType = 'course' | 'chapter' | 'section' | 'knowledge';

// 思维导图节点
export type MindmapNode = {
  id: string;
  name: string;
  subtitle?: string;
  type: NodeType;
  expanded?: boolean;
  children?: MindmapNode[];
};

// 课件项
export type CoursewareItem = {
  id: string;
  sectionId: string; // 所属节 id（当课件挂在章下时，存储的是章 id）
  name: string;
  size: string;
  date: string;
  type: 'video' | 'pdf' | 'doc' | 'ppt' | 'image' | 'audio' | 'iframe';
  hasStudyRecord?: boolean;
  fileUrl?: string;
  fileKey?: string;
  fileType?: string; // 后端需要的文件类型：image/audio/video/document/digital/openmaic/other
};

// 章节开放模式
export type OpenMode = 'unlimited' | 'scheduled' | 'prerequisite';

// 章节数据
export type ChapterData = {
  id: string;
  title: string;
  openMode?: OpenMode; // 章节开放模式
  openTime?: string; // 章节开放时间
  expanded?: boolean;
  sections: SectionData[];
  coursewareCount: number;
  hasStudents?: boolean;
  coursewareList?: CoursewareItem[]; // 课件列表
};

// 小节数据
export type SectionData = {
  id: string;
  title: string;
  openMode?: OpenMode; // 小节开放模式
  openTime?: string; // 小节开放时间
  coursewareCount: number;
  knowledgeCount: number;
  hasStudents: boolean;
  coursewareList?: CoursewareItem[]; // 课件列表
};

// 表单数据
export type AvatarEditFormData = {
  name: string;
  description: string;
  coverageClasses: string[];
  startDate: string;
  endDate: string;
};
