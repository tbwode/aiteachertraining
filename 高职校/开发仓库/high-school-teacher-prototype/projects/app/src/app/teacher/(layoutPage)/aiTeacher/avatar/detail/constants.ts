// 颜色常量
export const PRIMARY_COLOR = '#C83E3E';
export const SUCCESS_COLOR = '#52C41A';
export const WARNING_COLOR = '#FAAD14';
export const ERROR_COLOR = '#F5222D';

// 学生状态类型
export type StudentStatus = 'not-started' | 'normal' | 'lagging' | 'completed';

// 学生数据类型
export type StudentData = {
  id: string;
  studentId?: number; // 真实的学生ID（用于API调用）
  name: string;
  classId: number | null; // 班级ID
  className: string;
  progress: number;
  studyHours: number;
  lastStudy: string;
  status: StudentStatus;
  reminded?: boolean; // 今日是否已提醒
};

// 章节数据类型
export type ChapterData = {
  id: string;
  title: string;
  color: string;
  description: string;
  tags: string[];
  sections: string[];
};

// 课程目录项类型
export type CatalogItem = {
  chapter: string;
  lessons: LessonItem[];
};

// 课程项类型
export type LessonItem = {
  title: string;
  type: 'video' | 'pdf' | 'image';
  icon: string;
};

// 状态元数据类型
export type StatusMeta = {
  label: string;
  bg: string;
  color: string;
};
