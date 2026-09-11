import type { AiAvatarChapterVO } from '@/teacher/types/aiTeacher';
import type {
  AiSourceFile,
  ChapterNode,
  KpSelection,
  Question,
  QuestionDifficulty,
  QuestionImage,
  QuestionType
} from './types';

// ---------- 章节树工具 ----------

const normalizeKps = (kps: AiAvatarChapterVO['knowledgePoints']): string[] =>
  (kps || []).map((kp) => (typeof kp === 'string' ? kp : kp.name)).filter(Boolean) as string[];

// 去掉「第一章 / 第二节 / 第一编」等序号前缀，提取主题词
const stripOrderPrefix = (title: string): string =>
  title.replace(/^第[一二三四五六七八九十百零\d]+[编章节]\s*/, '').trim();

// mock 知识点：章节数据缺知识点时按标题派生 3 个，保证关联知识点可选
const mockKnowledgePoints = (title: string): string[] => {
  const base = stripOrderPrefix(title) || title;
  return [`${base}基本概念`, `${base}核心要点`, `${base}实践应用`];
};

export function buildChapterTree(chapterList: AiAvatarChapterVO[]): ChapterNode[] {
  return (chapterList || []).map((ch) => ({
    id: String(ch.id),
    title: ch.title || '未命名章节',
    knowledgePoints: (() => {
      const real = normalizeKps(ch.knowledgePoints);
      return real.length > 0 ? real : mockKnowledgePoints(ch.title || '未命名章节');
    })(),
    children: buildChapterTree(ch.children || [])
  }));
}

export function flattenChapters(nodes: ChapterNode[]): ChapterNode[] {
  return nodes.flatMap((n) => [n, ...flattenChapters(n.children)]);
}

// 带层级的扁平化（下拉缩进用）
export function flattenChaptersWithDepth(
  nodes: ChapterNode[],
  depth = 0
): { node: ChapterNode; depth: number }[] {
  return nodes.flatMap((n) => [
    { node: n, depth },
    ...flattenChaptersWithDepth(n.children, depth + 1)
  ]);
}

export function findChapter(nodes: ChapterNode[], id: string): ChapterNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findChapter(node.children, id);
    if (hit) return hit;
  }
  return null;
}

// 自身 + 所有后代的 id 集合（选中章时包含其小节题目）
export function collectChapterIds(node: ChapterNode): Set<string> {
  const ids = new Set<string>([node.id]);
  node.children.forEach((child) => {
    collectChapterIds(child).forEach((id) => ids.add(id));
  });
  return ids;
}

// ---------- 题目模板（种子数据与 AI 模拟共用） ----------

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function buildTypedQuestion(
  type: QuestionType,
  kp: string,
  chapter: ChapterNode,
  difficulty: QuestionDifficulty,
  source: Question['source']
): Question {
  const base = {
    id: nextId(source === 'ai' ? 'ai' : 'q'),
    type,
    difficulty,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    knowledgePoints: kp ? [kp] : [],
    source,
    analysis: '',
    createdAt: new Date().toISOString().slice(0, 10)
  };
  const topic = kp || chapter.title;

  switch (type) {
    case 'single':
      return {
        ...base,
        stem: `关于「${topic}」，下列说法正确的是？`,
        options: [
          { key: 'A', text: `${topic}是本章节需要重点掌握的核心内容` },
          { key: 'B', text: `${topic}与本课程学习目标无关` },
          { key: 'C', text: `${topic}只需了解，不需要应用` },
          { key: 'D', text: `${topic}属于其他课程的考核范围` }
        ],
        answer: ['A'],
        analysis:
          topic === chapter.title
            ? `「${topic}」是本课程的核心内容，需重点掌握。`
            : `${topic} 是「${chapter.title}」的核心知识点，需重点掌握。`
      };
    case 'multiple':
      return {
        ...base,
        stem: `「${topic}」的学习要点包括哪些？（多选）`,
        options: [
          { key: 'A', text: '基本概念与定义' },
          { key: 'B', text: '典型应用场景' },
          { key: 'C', text: '常见误区辨析' },
          { key: 'D', text: '与本课程无关的课外拓展' }
        ],
        answer: ['A', 'B', 'C'],
        analysis: '课外拓展不属于本知识点的考核要点。'
      };
    case 'judge':
      return {
        ...base,
        stem:
          topic === chapter.title
            ? `「${topic}」是本课程需要掌握的核心内容之一。`
            : `「${topic}」是「${chapter.title}」的核心内容之一。`,
        options: [],
        answer: ['正确'],
        analysis: ''
      };
    case 'blank':
      return {
        ...base,
        stem: `请写出「${topic}」的两个关键特征：【1】、【2】。`,
        options: [],
        answer: ['概念定义', '应用场景'],
        analysis: '围绕概念与应用两个维度作答即可。'
      };
    case 'essay':
      return {
        ...base,
        stem: `结合实际案例，简述「${topic}」在本专业岗位中的应用价值。`,
        options: [],
        answer: [`能结合岗位任务说明「${topic}」的作用，条理清晰、案例贴切即可得分。`],
        gradingCriteria: `评分维度：概念准确性 40%、案例应用 40%、表达条理 20%；要求紧扣「${topic}」，观点明确、论据充分。`,
        analysis: ''
      };
  }
}

// ---------- 公式 + 图片演示题 ----------

const DEMO_FORMULA_IMAGE: QuestionImage = {
  id: 'img-demo-bell',
  name: '评分分布示意图',
  url:
    ['data:', 'image/svg+xml;charset=utf-8,'].join('') +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140" viewBox="0 0 360 140">` +
        `<rect width="360" height="140" rx="8" fill="#F7F8FA"/>` +
        `<line x1="30" y1="110" x2="340" y2="110" stroke="#CBD5E1" stroke-width="1.5"/>` +
        `<line x1="185" y1="20" x2="185" y2="110" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 3"/>` +
        `<path d="M40,110 C100,110 130,30 185,30 C240,30 270,110 330,110" fill="rgba(200,62,62,0.10)" stroke="#C83E3E" stroke-width="2"/>` +
        `<text x="180" y="128" font-size="11" fill="#64748B" text-anchor="middle">μ</text>` +
        `<text x="322" y="128" font-size="11" fill="#64748B" text-anchor="middle">x</text>` +
        `<text x="185" y="18" font-size="11" fill="#64748B" text-anchor="middle">满意度评分分布</text>` +
        `</svg>`
    )
};

function buildShowcaseQuestion(chapter: ChapterNode): Question {
  const kp = chapter.knowledgePoints[0] || chapter.title;
  return {
    id: nextId('q'),
    type: 'single',
    stem: `在对「${stripOrderPrefix(chapter.title)}」的学习效果进行数据分析时，满意度评分近似服从正态分布，其概率密度函数为 $f(x)=\\dfrac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$，观察下图分布，其中 $\\mu$ 表示：\n\n![评分分布示意图](img-demo-bell)`,
    options: [
      { key: 'A', text: '评分的平均水平（均值）' },
      { key: 'B', text: '评分的波动程度（方差）' },
      { key: 'C', text: '参与评分的学生人数' },
      { key: 'D', text: '评分的最高分值' }
    ],
    answer: ['A'],
    analysis: '正态分布中 $\\mu$ 为均值、$\\sigma$ 为标准差，曲线关于 $x=\\mu$ 对称。',
    difficulty: 'medium',
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    knowledgePoints: [kp],
    source: 'manual',
    images: [DEMO_FORMULA_IMAGE],
    createdAt: new Date().toISOString().slice(0, 10)
  };
}

// ---------- 种子题目：基于真实章节树生成，保证列表开箱有数据 ----------

export function buildSeedQuestions(tree: ChapterNode[]): Question[] {
  const sections = flattenChapters(tree).filter((n) => n.children.length === 0);
  const picked = sections.slice(0, 4);
  const plan: QuestionType[] = ['single', 'multiple', 'judge', 'blank', 'essay'];
  const questions: Question[] = [];

  picked.forEach((chapter, idx) => {
    // 轮转章节知识点，让题目关联的知识点更丰富（报表分析更有层次）
    const kps = chapter.knowledgePoints.length > 0 ? chapter.knowledgePoints : [chapter.title];
    const kp = kps[idx % kps.length];
    // 每个小节 1-2 题，覆盖不同题型
    questions.push(buildTypedQuestion(plan[idx % plan.length], kp, chapter, 'medium', 'manual'));
    if (idx % 2 === 0) {
      questions.push(buildTypedQuestion(plan[(idx + 2) % plan.length], kps[(idx + 1) % kps.length], chapter, 'easy', 'ai'));
    }
  });

  if (sections.length > 0) {
    questions.unshift(buildShowcaseQuestion(sections[0]));
  }

  return questions;
}

// ---------- AI 出题（模板化模拟） ----------

// 方式一：按知识点出题（章节-知识点树多选，题目挂到知识点所属章节）
export function mockGenerateByKpSelections(params: {
  selections: KpSelection[];
  tree: ChapterNode[];
  counts: Partial<Record<QuestionType, number>>;
  difficulty: QuestionDifficulty;
}): Question[] {
  const { selections, tree, counts, difficulty } = params;
  const pool = selections
    .map((sel) => ({ kp: sel.kp, chapter: findChapter(tree, sel.chapterId) }))
    .filter((item): item is { kp: string; chapter: ChapterNode } => !!item.chapter);
  if (pool.length === 0) return [];

  const questions: Question[] = [];
  (Object.keys(counts) as QuestionType[]).forEach((type) => {
    const count = counts[type] || 0;
    for (let i = 0; i < count; i++) {
      const pick = pool[questions.length % pool.length];
      questions.push(buildTypedQuestion(type, pick.kp, pick.chapter, difficulty, 'ai'));
    }
  });
  return questions;
}

// 从文件名提取主题词（去扩展名与序号前缀）
export const topicFromFileName = (name: string): string =>
  stripOrderPrefix(name.replace(/\.[a-zA-Z0-9]+$/, '')).slice(0, 20) || '课程资料';

// 方式二：上传文件出题（题目挂到所选章节，解析中标注来源文件）
export function mockGenerateByFiles(params: {
  files: AiSourceFile[];
  chapter: ChapterNode;
  counts: Partial<Record<QuestionType, number>>;
  difficulty: QuestionDifficulty;
}): Question[] {
  const { files, chapter, counts, difficulty } = params;
  if (files.length === 0) return [];
  const kps = chapter.knowledgePoints.length > 0 ? chapter.knowledgePoints : [chapter.title];

  const questions: Question[] = [];
  (Object.keys(counts) as QuestionType[]).forEach((type) => {
    const count = counts[type] || 0;
    for (let i = 0; i < count; i++) {
      const kp = kps[questions.length % kps.length];
      const file = files[questions.length % files.length];
      const q = buildTypedQuestion(type, kp, chapter, difficulty, 'ai');
      const fileTopic = topicFromFileName(file.name);
      q.analysis = q.analysis
        ? `${q.analysis}（依据资料《${fileTopic}》生成）`
        : `依据资料《${fileTopic}》生成。`;
      questions.push(q);
    }
  });
  return questions;
}
