import type { ChapterNode, Question, QuestionType } from '../questionBank/types';
import { collectChapterIds, findChapter } from '../questionBank/mockData';
import type { Quiz, QuizPushConfig, QuizQuestionItem } from './types';

// 班级兜底数据（avatarDetail.classList 为空时使用）
export const MOCK_CLASSES = ['机械工程1班(人才班)', '机械工程2班', '数控技术1班', '电气自动化1班'];

let quizSeq = 0;
export const nextQuizId = () => `quiz-${Date.now().toString(36)}-${(quizSeq++).toString(36)}`;

// 推题：按章节（含子节）或知识点从题库抽题，按题型截取数量
export function pickQuestionsFromBank(params: {
  bank: Question[];
  tree: ChapterNode[];
  config: QuizPushConfig;
}): Question[] {
  const { bank, tree, config } = params;
  let pool = bank;
  if (config.mode === 'chapter') {
    const idSet = new Set<string>();
    config.chapterIds.forEach((id) => {
      const node = findChapter(tree, id);
      if (node) collectChapterIds(node).forEach((cid) => idSet.add(cid));
    });
    pool = bank.filter((q) => idSet.has(q.chapterId));
  } else {
    const kpSet = new Set(config.kpNames);
    pool = bank.filter((q) => q.knowledgePoints.some((k) => kpSet.has(k)));
  }
  const result: Question[] = [];
  (Object.keys(config.counts) as QuestionType[]).forEach((type) => {
    const want = config.counts[type] || 0;
    if (want <= 0) return;
    result.push(...pool.filter((q) => q.type === type).slice(0, want));
  });
  return result;
}

// 目标总分均分到每题（不能整除时余数从前往后每题 +1；题数超过总分时每题保底 1 分）
export function distributeScores(target: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(target / count);
  if (base < 1) return Array.from({ length: count }, () => 1);
  const scores = Array.from({ length: count }, () => base);
  let remainder = target - base * count;
  for (let i = 0; i < scores.length && remainder > 0; i++, remainder--) {
    scores[i] += 1;
  }
  return scores;
}

// 截止时间展示：'2026-09-15T23:59' → '2026-09-15 23:59'
export const formatDeadline = (deadline: string) => deadline.replace('T', ' ');

export const isExpired = (deadline: string) => {
  const t = new Date(deadline).getTime();
  return Number.isFinite(t) && t < Date.now();
};

// 种子测验：让列表开箱有数据（1 个已发布 + 1 个草稿）
export function buildSeedQuizzes(bank: Question[], classNames: string[]): Quiz[] {
  if (bank.length < 3) return [];
  const classes = classNames.length > 0 ? classNames : MOCK_CLASSES;
  const first = bank[0];
  const sameChapter = bank.filter((q) => q.chapterId === first.chapterId);
  const picked = (sameChapter.length >= 3 ? sameChapter : bank).slice(0, 4);

  const published: Quiz = {
    id: nextQuizId(),
    title: `${first.chapterTitle.replace(/^第[一二三四五六七八九十百零\d]+[编章节]\s*/, '')} 随堂测验`,
    description: '覆盖本章核心知识点，检验基础概念掌握情况，请同学们按时完成。',
    classNames: classes.slice(0, 2),
    deadline: '2026-09-15T23:59',
    targetTotalScore: 100,
    questions: picked.map((q, i) => ({
      question: q,
      score: distributeScores(100, picked.length)[i]
    })),
    status: 'published',
    createdAt: '2026-09-01'
  };

  const draftPicked = bank.slice(4, 7);
  // 回填草稿的推题配置，保证编辑时「下一步」不会清空已组题目
  const draftChapterIds = [...new Set(draftPicked.map((q) => q.chapterId))];
  const draftCounts: Partial<Record<QuestionType, number>> = {};
  draftPicked.forEach((q) => {
    draftCounts[q.type] = (draftCounts[q.type] || 0) + 1;
  });
  const draft: Quiz = {
    id: nextQuizId(),
    title: '阶段复习测验（草稿）',
    description: '',
    classNames: classes.slice(0, 1),
    deadline: '2026-09-20T18:00',
    targetTotalScore: 60,
    questions: draftPicked.map((q, i) => ({
      question: q,
      score: distributeScores(60, draftPicked.length)[i]
    })),
    status: 'draft',
    pushConfig: { mode: 'chapter', chapterIds: draftChapterIds, kpNames: [], counts: draftCounts },
    createdAt: new Date().toISOString().slice(0, 10)
  };

  return [published, draft];
}
