export type QuestionType = 'single' | 'multiple' | 'judge' | 'blank' | 'essay';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionSource = 'manual' | 'ai';

export type QuestionOption = {
  key: string;
  text: string;
};

// 题干内嵌图片（题干中通过 ![名称](id) 引用）
export type QuestionImage = {
  id: string;
  name: string;
  url: string; // dataURL 或远程地址
};

export type Question = {
  id: string;
  type: QuestionType;
  stem: string; // 支持 $LaTeX$ 公式与 ![名称](id) 图片引用
  options: QuestionOption[];
  answer: string[];
  analysis: string;
  gradingCriteria?: string; // 简答题：评分标准（AI 评价参考）
  images?: QuestionImage[];
  difficulty: QuestionDifficulty;
  chapterId: string;
  chapterTitle: string;
  knowledgePoints: string[];
  source: QuestionSource;
  createdAt: string;
};

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; color: string; bg: string }> = {
  single: { label: '单选', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  multiple: { label: '多选', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  judge: { label: '判断', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  blank: { label: '填空', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  essay: { label: '简答', color: '#C8000B', bg: 'rgba(200,0,11,0.08)' }
};

export const QUESTION_TYPE_ORDER: QuestionType[] = ['single', 'multiple', 'judge', 'blank', 'essay'];

export const DIFFICULTY_META: Record<QuestionDifficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: '#059669' },
  medium: { label: '中等', color: '#D97706' },
  hard: { label: '困难', color: '#C8000B' }
};

export const DIFFICULTY_ORDER: QuestionDifficulty[] = ['easy', 'medium', 'hard'];

// 章节树节点（从 avatarDetail.chapterList 收敛）
export type ChapterNode = {
  id: string;
  title: string;
  knowledgePoints: string[];
  children: ChapterNode[];
};

// AI 按知识点出题：章节-知识点树中的一个选中项
export type KpSelection = {
  chapterId: string;
  chapterTitle: string;
  kp: string;
};

// AI 上传文件出题：已上传文件（原型仅存元信息）
export type AiSourceFile = {
  id: string;
  name: string;
  size: number;
};
