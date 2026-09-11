import type { Question, QuestionType } from '../questionBank/types';

export type QuizStatus = 'draft' | 'published';

// 测验中的题目：快照 + 分值（题库后续修改不影响已组卷的测验）
export type QuizQuestionItem = {
  question: Question;
  score: number;
};

// 推题配置（编辑草稿时回填）
export type QuizPushConfig = {
  mode: 'chapter' | 'kp';
  chapterIds: string[];
  kpNames: string[];
  counts: Partial<Record<QuestionType, number>>;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  classNames: string[]; // 发布班级
  deadline: string; // 'YYYY-MM-DDTHH:mm'
  targetTotalScore: number; // 目标总分（初始分值分配依据）
  questions: QuizQuestionItem[];
  status: QuizStatus;
  pushConfig?: QuizPushConfig;
  createdAt: string;
};

export const totalScoreOf = (quiz: Quiz) =>
  quiz.questions.reduce((sum, item) => sum + item.score, 0);

export const QUIZ_STATUS_META: Record<QuizStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#86909C', bg: 'rgba(134,144,156,0.10)' },
  published: { label: '已发布', color: '#059669', bg: 'rgba(5,150,105,0.08)' }
};
