import type { QuestionType } from '../questionBank/types';
import { QUESTION_TYPE_ORDER } from '../questionBank/types';
import type { Quiz } from './types';
import { totalScoreOf } from './types';

// ---------- 数据模型 ----------

export type StudentAnswer = {
  questionId: string;
  earned: number; // 得分（简答可部分得分，其余题型 0 或满分）
};

export type StudentQuizResult = {
  studentId: string;
  studentName: string;
  className: string;
  totalScore: number;
  fullCorrectCount: number; // 得满分的题数
  submitTime: string; // 'YYYY-MM-DD HH:mm'
  durationMin: number;
  answers: StudentAnswer[];
};

export type QuizReport = {
  quizId: string;
  results: StudentQuizResult[]; // 已提交
  unsubmitted: { studentName: string; className: string }[];
  totalStudents: number;
};

// ---------- 确定性伪随机（同一测验多次打开数据一致） ----------

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

const NAME_POOL = [
  '张伟', '王芳', '李娜', '刘洋', '陈杰', '杨静', '赵磊', '黄敏', '周涛', '吴倩',
  '徐浩', '孙丽', '马超', '朱婷', '胡军', '郭涛', '何欢', '罗成', '高翔', '林悦',
  '郑凯', '梁思', '宋雨', '唐晓', '韩梅', '冯远', '曹阳', '彭亮', '董鹏', '袁梦'
];

// 难度影响得分率：简单 1.0 / 中等 0.8 / 困难 0.6
const DIFFICULTY_FACTOR = { easy: 1.0, medium: 0.8, hard: 0.6 } as const;

// ---------- 生成报表 ----------

export function buildQuizReport(quiz: Quiz): QuizReport {
  const rand = mulberry32(hashCode(quiz.id));
  const total = totalScoreOf(quiz);
  const results: StudentQuizResult[] = [];
  const unsubmitted: QuizReport['unsubmitted'] = [];
  let nameIdx = 0;
  const nextName = () => {
    const name = NAME_POOL[nameIdx % NAME_POOL.length];
    const suffix = nameIdx >= NAME_POOL.length ? `${Math.floor(nameIdx / NAME_POOL.length) + 1}` : '';
    nameIdx += 1;
    return name + suffix;
  };

  quiz.classNames.forEach((className) => {
    const size = 8 + Math.floor(rand() * 5); // 每班 8-12 人
    for (let i = 0; i < size; i++) {
      const studentName = nextName();
      // 约 15% 未提交
      if (rand() < 0.15) {
        unsubmitted.push({ studentName, className });
        continue;
      }
      // 学生能力值 0.35-0.95，同一名学生对各题稳定
      const ability = 0.35 + rand() * 0.6;
      const answers: StudentAnswer[] = quiz.questions.map((item) => {
        const q = item.question;
        const p = Math.min(0.98, Math.max(0.05, ability * DIFFICULTY_FACTOR[q.difficulty]));
        if (q.type === 'essay') {
          // 简答部分得分：围绕能力值浮动
          const ratio = Math.min(1, Math.max(0, ability + (rand() - 0.5) * 0.5));
          return { questionId: q.id, earned: Math.round(item.score * ratio) };
        }
        return { questionId: q.id, earned: rand() < p ? item.score : 0 };
      });
      const totalScore = answers.reduce((sum, a) => sum + a.earned, 0);
      const fullCorrectCount = answers.filter(
        (a) => a.earned >= (quiz.questions.find((it) => it.question.id === a.questionId)?.score || 0)
      ).length;
      // 提交时间：截止前 1-72 小时随机
      const deadlineTs = new Date(quiz.deadline).getTime();
      const submitTs = Number.isFinite(deadlineTs)
        ? deadlineTs - (1 + rand() * 71) * 3600 * 1000
        : Date.now() - rand() * 24 * 3600 * 1000;
      const d = new Date(submitTs);
      const pad = (n: number) => String(n).padStart(2, '0');
      results.push({
        studentId: `${quiz.id}-stu-${results.length}`,
        studentName,
        className,
        totalScore,
        fullCorrectCount,
        submitTime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
        durationMin: 5 + Math.floor(rand() * 35),
        answers
      });
    }
  });

  return { quizId: quiz.id, results, unsubmitted, totalStudents: results.length + unsubmitted.length };
}

// ---------- 聚合统计 ----------

export type OverallStats = {
  submitted: number;
  totalStudents: number;
  submitRate: number;
  avg: number;
  max: number;
  min: number;
  passRate: number; // >=60% 总分
  excellentRate: number; // >=90% 总分
};

export function computeOverallStats(report: QuizReport, quiz: Quiz): OverallStats {
  const total = totalScoreOf(quiz);
  const scores = report.results.map((r) => r.totalScore);
  const submitted = scores.length;
  const sum = scores.reduce((s, v) => s + v, 0);
  return {
    submitted,
    totalStudents: report.totalStudents,
    submitRate: report.totalStudents > 0 ? submitted / report.totalStudents : 0,
    avg: submitted > 0 ? Math.round((sum / submitted) * 10) / 10 : 0,
    max: submitted > 0 ? Math.max(...scores) : 0,
    min: submitted > 0 ? Math.min(...scores) : 0,
    passRate: submitted > 0 ? scores.filter((s) => s >= total * 0.6).length / submitted : 0,
    excellentRate: submitted > 0 ? scores.filter((s) => s >= total * 0.9).length / submitted : 0
  };
}

export type ScoreBand = { label: string; count: number };

// 按得分占总分比例分 5 段
export function computeScoreBands(report: QuizReport, quiz: Quiz): ScoreBand[] {
  const total = totalScoreOf(quiz);
  const bands: ScoreBand[] = [
    { label: '<60%', count: 0 },
    { label: '60-70%', count: 0 },
    { label: '70-80%', count: 0 },
    { label: '80-90%', count: 0 },
    { label: '≥90%', count: 0 }
  ];
  report.results.forEach((r) => {
    const ratio = total > 0 ? r.totalScore / total : 0;
    const idx = ratio < 0.6 ? 0 : ratio < 0.7 ? 1 : ratio < 0.8 ? 2 : ratio < 0.9 ? 3 : 4;
    bands[idx].count += 1;
  });
  return bands;
}

export type TypeStat = { type: QuestionType; count: number; rate: number };

// 各题型得分率（实际得分 / 可得满分）
export function computeTypeStats(report: QuizReport, quiz: Quiz): TypeStat[] {
  return QUESTION_TYPE_ORDER.map((type) => {
    const items = quiz.questions.filter((it) => it.question.type === type);
    if (items.length === 0 || report.results.length === 0) {
      return { type, count: items.length, rate: -1 }; // -1 = 无数据
    }
    const possible = items.reduce((s, it) => s + it.score, 0) * report.results.length;
    const earned = report.results.reduce(
      (s, r) =>
        s +
        r.answers
          .filter((a) => items.some((it) => it.question.id === a.questionId))
          .reduce((x, a) => x + a.earned, 0),
      0
    );
    return { type, count: items.length, rate: possible > 0 ? earned / possible : 0 };
  }).filter((t) => t.count > 0);
}

export type KpMastery = {
  kp: string;
  questionCount: number;
  rate: number; // 掌握率
  wrongCount: number; // 未得满分人次
  weak: boolean;
};

// 知识点掌握率：按题目关联知识点聚合所有提交学生的得分
export function computeKpMastery(report: QuizReport, quiz: Quiz): KpMastery[] {
  const map = new Map<string, { questionIds: Set<string>; possible: number; earned: number; wrong: number }>();
  quiz.questions.forEach((item) => {
    item.question.knowledgePoints.forEach((kp) => {
      if (!map.has(kp)) {
        map.set(kp, { questionIds: new Set(), possible: 0, earned: 0, wrong: 0 });
      }
      const entry = map.get(kp)!;
      entry.questionIds.add(item.question.id);
      report.results.forEach((r) => {
        const ans = r.answers.find((a) => a.questionId === item.question.id);
        if (!ans) return;
        entry.possible += item.score;
        entry.earned += ans.earned;
        if (ans.earned < item.score) entry.wrong += 1;
      });
    });
  });
  return [...map.entries()]
    .map(([kp, v]) => ({
      kp,
      questionCount: v.questionIds.size,
      rate: v.possible > 0 ? v.earned / v.possible : 0,
      wrongCount: v.wrong,
      weak: v.possible > 0 && v.earned / v.possible < 0.6
    }))
    .sort((a, b) => a.rate - b.rate);
}

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

// ---------- AI 测验总结（基于统计数据的规则化生成，原型阶段模拟 AI 输出） ----------

export type AiSummary = {
  level: string; // 总体水平标签
  levelColor: string;
  levelText: string; // 学生总体测验水平描述
  findings: string[]; // 重点发现
  suggestions: string[]; // 教学建议
};

const TYPE_LABEL: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  blank: '填空题',
  essay: '简答题'
};

export function buildAiSummary(params: {
  quiz: Quiz;
  overall: OverallStats;
  bands: ScoreBand[];
  typeStats: TypeStat[];
  kpList: KpMastery[];
  unsubmittedCount: number;
}): AiSummary {
  const { quiz, overall, bands, typeStats, kpList, unsubmittedCount } = params;
  const total = totalScoreOf(quiz);
  const avgRatio = total > 0 ? overall.avg / total : 0;

  // 总体水平
  const levelMeta =
    avgRatio >= 0.85
      ? { level: '优秀', levelColor: '#059669' }
      : avgRatio >= 0.7
        ? { level: '良好', levelColor: '#2563EB' }
        : avgRatio >= 0.6
          ? { level: '中等', levelColor: '#D97706' }
          : { level: '待提升', levelColor: '#C8000B' };
  const levelText = `本次测验共 ${overall.totalStudents} 名学生，提交 ${overall.submitted} 人（${formatPercent(overall.submitRate)}）。班级平均得分 ${overall.avg} 分（满分 ${total} 分），及格率 ${formatPercent(overall.passRate)}、优秀率 ${formatPercent(overall.excellentRate)}，整体掌握水平处于「${levelMeta.level}」区间。`;

  // 重点发现
  const findings: string[] = [];
  const topBand = bands.reduce((best, b) => (b.count > best.count ? b : best), bands[0]);
  if (overall.submitted > 0 && topBand.count > 0) {
    findings.push(
      `成绩主要集中在「${topBand.label}」分数段（${topBand.count} 人，占 ${formatPercent(topBand.count / overall.submitted)}）。`
    );
  }
  if (overall.max - overall.min >= total * 0.4) {
    findings.push(
      `最高分 ${overall.max} 与最低分 ${overall.min} 相差 ${overall.max - overall.min} 分，学生学习效果存在明显分化。`
    );
  } else if (overall.submitted > 0) {
    findings.push(`成绩分布较为均衡，最高分与最低分相差 ${overall.max - overall.min} 分。`);
  }
  const validTypes = typeStats.filter((t) => t.rate >= 0);
  if (validTypes.length > 1) {
    const weakest = validTypes.reduce((a, b) => (a.rate <= b.rate ? a : b));
    const strongest = validTypes.reduce((a, b) => (a.rate >= b.rate ? a : b));
    findings.push(
      `「${TYPE_LABEL[strongest.type]}」得分率最高（${formatPercent(strongest.rate)}），「${TYPE_LABEL[weakest.type]}」得分率最低（${formatPercent(weakest.rate)}）。`
    );
  }
  const weakKps = kpList.filter((k) => k.weak);
  if (weakKps.length > 0) {
    findings.push(
      `发现 ${weakKps.length} 个薄弱知识点：${weakKps
        .slice(0, 3)
        .map((k) => `「${k.kp}」（${formatPercent(k.rate)}）`)
        .join('、')}，掌握率均低于 60%。`
    );
  } else if (kpList.length > 0) {
    findings.push('各知识点掌握率均在 60% 以上，未发现明显薄弱知识点。');
  }
  if (unsubmittedCount > 0) {
    findings.push(`仍有 ${unsubmittedCount} 名学生未提交测验，需及时跟进提醒。`);
  }

  // 教学建议
  const suggestions: string[] = [];
  if (weakKps.length > 0) {
    suggestions.push(
      `针对薄弱知识点${weakKps
        .slice(0, 3)
        .map((k) => `「${k.kp}」`)
        .join('、')}安排专项讲解与补充练习，可从题库组卷进行二次测验巩固。`
    );
  }
  if (validTypes.length > 0) {
    const weakest = validTypes.reduce((a, b) => (a.rate <= b.rate ? a : b));
    if (weakest.rate < 0.7) {
      suggestions.push(
        `加强「${TYPE_LABEL[weakest.type]}」的答题方法指导，结合典型错题进行课堂讲评。`
      );
    }
  }
  const failCount = Math.round(overall.submitted * (1 - overall.passRate));
  if (failCount > 0 && overall.passRate < 0.9) {
    suggestions.push(`对得分未达及格的 ${failCount} 名学生开展个别辅导，帮助查漏补缺。`);
  }
  if (overall.excellentRate >= 0.2) {
    suggestions.push('为成绩优秀的学生提供拓展性学习任务，保持学习挑战度与积极性。');
  }
  if (unsubmittedCount > 0) {
    suggestions.push('督促未提交学生尽快完成测验，必要时适当延长截止时间。');
  }
  if (suggestions.length === 0) {
    suggestions.push('整体掌握情况良好，保持当前教学节奏并持续关注学生练习反馈。');
  }

  return { ...levelMeta, levelText, findings: findings.slice(0, 5), suggestions: suggestions.slice(0, 4) };
}
