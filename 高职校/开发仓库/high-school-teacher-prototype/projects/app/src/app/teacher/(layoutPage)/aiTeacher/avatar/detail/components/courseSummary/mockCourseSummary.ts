import type { ChapterNode } from '../questionBank/types';
import { flattenChapters } from '../questionBank/mockData';

// ---------- 数据模型 ----------

export type MonthPoint = {
  month: string; // '4月'
  avg: number;
  max: number;
  min: number;
  completionRate: number; // 0-1
};

export type KpMasteryItem = {
  kp: string;
  chapterTitle: string;
  rate: number; // 掌握率 0-1
  wrongCount: number; // 累计答错人次
};

export type ErrorCause = { cause: string; ratio: number };

export type HotQuestion = { question: string; chapterTitle: string; count: number };

export type CourseSummaryData = {
  months: MonthPoint[];
  avgScore: number; // 平均总分（百分制）
  avgScoreDelta: number; // 较上月
  kpMasteryRate: number; // 整体知识点掌握率 0-1
  kpMasteryDelta: number;
  quizCompletionRate: number; // 测验完成率 0-1
  quizCompletionDelta: number;
  dailyStudyMinutes: number; // 日均学习时长（分钟）
  dailyStudyDelta: number;
  kpList: KpMasteryItem[];
  kpBands: { label: string; count: number }[]; // 掌握率分布
  topMissed: KpMasteryItem[]; // 高频失分点 top5（掌握率最低）
  errorCauses: ErrorCause[];
  hotQuestions: HotQuestion[];
};

// ---------- 确定性伪随机 ----------

const hashCode = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------- 生成课程总结数据 ----------

const ERROR_CAUSE_POOL: { cause: string; base: number }[] = [
  { cause: '概念理解不清', base: 0.3 },
  { cause: '审题不仔细', base: 0.24 },
  { cause: '公式运用错误', base: 0.18 },
  { cause: '知识点记忆模糊', base: 0.15 },
  { cause: '答题表达不完整', base: 0.13 }
];

const HOT_QUESTION_TEMPLATES = [
  (kp: string) => `如何理解「${kp}」的核心概念？`,
  (kp: string) => `「${kp}」的公式是怎么推导出来的？`,
  (kp: string) => `「${kp}」在考试中有哪些常见题型？`,
  (kp: string) => `「${kp}」和相近知识点有什么区别？`,
  (kp: string) => `做「${kp}」相关题目时总是出错，有什么解题技巧？`,
  (kp: string) => `「${kp}」的实际应用场景有哪些？`
];

const lastSixMonths = (): string[] => {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${d.getMonth() + 1}月`);
  }
  return labels;
};

export function buildCourseSummary(seedKey: string, chapterTree: ChapterNode[]): CourseSummaryData {
  const rand = mulberry32(hashCode(seedKey));
  const chapters = flattenChapters(chapterTree);

  // 月度总分趋势：围绕 62-80 波动，带缓慢上升/下降漂移
  const drift = (rand() - 0.45) * 3;
  let base = 62 + rand() * 14;
  const months: MonthPoint[] = lastSixMonths().map((month) => {
    base = Math.min(88, Math.max(52, base + drift + (rand() - 0.5) * 6));
    const avg = Math.round(base * 10) / 10;
    const max = Math.min(100, Math.round(avg + 10 + rand() * 12));
    const min = Math.max(0, Math.round(avg - 22 - rand() * 18));
    const completionRate = Math.round((0.72 + rand() * 0.26) * 100) / 100;
    return { month, avg, max, min, completionRate };
  });

  // 知识点掌握率：每个知识点 0.38-0.97，少数偏低制造薄弱点
  const kpList: KpMasteryItem[] = chapters.flatMap((ch) =>
    ch.knowledgePoints.map((kp) => {
      const rate =
        rand() < 0.1
          ? Math.round((0.38 + rand() * 0.2) * 100) / 100
          : Math.round((0.62 + rand() * 0.35) * 100) / 100;
      return {
        kp,
        chapterTitle: ch.title,
        rate,
        wrongCount: Math.round((1 - rate) * (30 + rand() * 60))
      };
    })
  );

  const bandDefs = ['<60%', '60-70%', '70-80%', '80-90%', '≥90%'];
  const kpBands = bandDefs.map((label) => ({ label, count: 0 }));
  kpList.forEach((k) => {
    const idx = k.rate < 0.6 ? 0 : k.rate < 0.7 ? 1 : k.rate < 0.8 ? 2 : k.rate < 0.9 ? 3 : 4;
    kpBands[idx].count += 1;
  });

  const topMissed = [...kpList].sort((a, b) => a.rate - b.rate).slice(0, 5);

  // 错因分布：池子基础上加扰动后归一
  const raw = ERROR_CAUSE_POOL.map((c) => ({ cause: c.cause, v: c.base * (0.8 + rand() * 0.5) }));
  const totalV = raw.reduce((s, r) => s + r.v, 0);
  const errorCauses: ErrorCause[] = raw
    .map((r) => ({ cause: r.cause, ratio: Math.round((r.v / totalV) * 100) / 100 }))
    .sort((a, b) => b.ratio - a.ratio);

  // 高频问题：取前几个章节的知识点套模板
  const flatKps = chapters.flatMap((ch) => ch.knowledgePoints.map((kp) => ({ kp, chapterTitle: ch.title })));
  const hotQuestions: HotQuestion[] = HOT_QUESTION_TEMPLATES.map((tpl, i) => {
    const pick = flatKps.length > 0 ? flatKps[Math.floor(rand() * flatKps.length)] : null;
    return {
      question: tpl(pick?.kp || `知识点${i + 1}`),
      chapterTitle: pick?.chapterTitle || '全书',
      count: 12 + Math.floor(rand() * 88)
    };
  }).sort((a, b) => b.count - a.count);

  const avgScore = Math.round((months.reduce((s, m) => s + m.avg, 0) / months.length) * 10) / 10;
  const avgScoreDelta = Math.round((months[months.length - 1].avg - months[months.length - 2].avg) * 10) / 10;
  const kpMasteryRate =
    kpList.length > 0
      ? Math.round((kpList.reduce((s, k) => s + k.rate, 0) / kpList.length) * 100) / 100
      : 0;
  const quizCompletionRate =
    Math.round((months.reduce((s, m) => s + m.completionRate, 0) / months.length) * 100) / 100;
  const quizCompletionDelta =
    Math.round(
      (months[months.length - 1].completionRate - months[months.length - 2].completionRate) * 100
    ) / 100;
  const dailyStudyMinutes = 28 + Math.floor(rand() * 30);
  const dailyStudyDelta = Math.round((rand() - 0.35) * 8 * 10) / 10;

  return {
    months,
    avgScore,
    avgScoreDelta,
    kpMasteryRate,
    kpMasteryDelta: Math.round((rand() - 0.3) * 6 * 10) / 10,
    quizCompletionRate,
    quizCompletionDelta,
    dailyStudyMinutes,
    dailyStudyDelta,
    kpList,
    kpBands,
    topMissed,
    errorCauses,
    hotQuestions
  };
}

// ---------- AI 学习评价摘要 ----------

export type CourseAiSummary = {
  level: string;
  levelColor: string;
  overview: string; // 课程学生学习整体情况
  findings: string[]; // 重点发现
  suggestions: string[]; // 教学建议
};

const pct = (r: number) => `${Math.round(r * 100)}%`;

export function buildCourseAiSummary(params: {
  scopeName: string; // 课程名或班级名
  isClass: boolean;
  data: CourseSummaryData;
}): CourseAiSummary {
  const { scopeName, isClass, data } = params;
  const scope = isClass ? `「${scopeName}」` : `本课程`;
  const weakKps = data.kpList.filter((k) => k.rate < 0.6);
  const first = data.months[0];
  const last = data.months[data.months.length - 1];
  const trend = last.avg - first.avg;

  const levelMeta =
    data.avgScore >= 85
      ? { level: '优秀', levelColor: '#059669' }
      : data.avgScore >= 75
        ? { level: '良好', levelColor: '#2563EB' }
        : data.avgScore >= 60
          ? { level: '中等', levelColor: '#D97706' }
          : { level: '待提升', levelColor: '#C8000B' };

  const trendText =
    trend > 2 ? '呈稳步上升趋势' : trend < -2 ? '呈下滑趋势，需引起重视' : '整体保持平稳';
  const overview = `近 6 个月${scope}学生平均总分 ${data.avgScore} 分，知识点整体掌握率 ${pct(data.kpMasteryRate)}，测验完成率 ${pct(data.quizCompletionRate)}，日均学习时长 ${data.dailyStudyMinutes} 分钟。月度平均分${trendText}，整体学习水平处于「${levelMeta.level}」区间。`;

  const findings: string[] = [];
  const bestMonth = data.months.reduce((a, b) => (a.avg >= b.avg ? a : b));
  const worstMonth = data.months.reduce((a, b) => (a.avg <= b.avg ? a : b));
  findings.push(
    `${bestMonth.month}平均分最高（${bestMonth.avg} 分），${worstMonth.month}最低（${worstMonth.avg} 分），波动 ${Math.round((bestMonth.avg - worstMonth.avg) * 10) / 10} 分。`
  );
  if (weakKps.length > 0) {
    findings.push(
      `共 ${weakKps.length} 个薄弱知识点（掌握率 <60%），其中${weakKps
        .slice(0, 2)
        .map((k) => `「${k.kp}」（${pct(k.rate)}）`)
        .join('、')}失分最为集中。`
    );
  } else {
    findings.push('各知识点掌握率均在 60% 以上，未发现系统性薄弱环节。');
  }
  const topCause = data.errorCauses[0];
  if (topCause) {
    findings.push(
      `错因分布中「${topCause.cause}」占比最高（${pct(topCause.ratio)}），是最主要的失分原因。`
    );
  }
  const lowCompletionMonths = data.months.filter((m) => m.completionRate < 0.8);
  if (lowCompletionMonths.length > 0) {
    findings.push(
      `${lowCompletionMonths.map((m) => m.month).join('、')}测验完成率低于 80%，学生任务参与度有提升空间。`
    );
  }
  if (data.hotQuestions.length > 0) {
    findings.push(
      `学生高频提问集中在「${data.hotQuestions[0].chapterTitle}」，反映出该章内容理解难度较大。`
    );
  }

  const suggestions: string[] = [];
  if (weakKps.length > 0) {
    suggestions.push(
      `针对${weakKps
        .slice(0, 3)
        .map((k) => `「${k.kp}」`)
        .join('、')}等薄弱知识点安排专题复习课，配合题库组卷强化训练。`
    );
  }
  if (topCause) {
    const causeAdvice: Record<string, string> = {
      概念理解不清: '增加概念辨析类教学活动，通过对比案例帮助学生建立清晰的知识框架。',
      审题不仔细: '加强审题方法训练，引导学生圈画题干关键词，养成检查习惯。',
      公式运用错误: '梳理核心公式的适用条件与变形，配套阶梯式练习巩固运用能力。',
      知识点记忆模糊: '推行间隔复习策略，利用课前小测强化记忆保持。',
      答题表达不完整: '示范标准答题模板，强调分点作答与步骤完整性。'
    };
    suggestions.push(causeAdvice[topCause.cause] || '针对主要错因设计专项讲评。');
  }
  if (trend < -2) {
    suggestions.push('近期平均分出现下滑，建议及时开展学情访谈，排查学习困难并调整教学节奏。');
  }
  if (lowCompletionMonths.length > 0) {
    suggestions.push('对完成率偏低的月份分析任务难度与布置节奏，必要时拆小任务粒度并加强督促提醒。');
  }
  if (data.hotQuestions.length > 0) {
    suggestions.push(
      `将高频提问整理成 FAQ 或微课推送至班级，主动消解共性疑惑（如「${data.hotQuestions[0].question}」）。`
    );
  }
  if (suggestions.length === 0) {
    suggestions.push('整体学情良好，保持当前教学节奏并持续关注月度数据变化。');
  }

  return {
    ...levelMeta,
    overview,
    findings: findings.slice(0, 5),
    suggestions: suggestions.slice(0, 4)
  };
}
