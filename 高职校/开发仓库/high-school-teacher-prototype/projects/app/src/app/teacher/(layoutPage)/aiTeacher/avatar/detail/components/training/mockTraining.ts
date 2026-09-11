import { listGraphs } from '@/app/admin/(layoutPage)/graph/ability/_mock/store';
import type { AbilityGraph, JobTask } from '@/app/admin/(layoutPage)/graph/ability/_mock/types';
import type {
  AbilityEvidence,
  AbilityResult,
  TrainingAbilityRef,
  TrainingReview,
  TrainingState,
  TrainingSubmission,
  TrainingTask
} from './types';
import { calculateAbilityResults } from './types';

export const TRAINING_STORAGE_KEY = 'high-school-prototype-training-state-v4';

const abilityRefs: Record<string, TrainingAbilityRef> = {
  B1: {
    graphId: 'g1',
    graphName: '动力电池维修技师',
    graphVersion: 'v2.3',
    taskCode: 'B',
    taskName: '电池系统检修',
    abilityCode: 'B1',
    abilityName: '绝缘检测',
    description: '高压绝缘性能检测与故障排查',
    source: 'course'
  },
  B2: {
    graphId: 'g1',
    graphName: '动力电池维修技师',
    graphVersion: 'v2.3',
    taskCode: 'B',
    taskName: '电池系统检修',
    abilityCode: 'B2',
    abilityName: '故障诊断',
    description: '基于故障码与数据流完成诊断',
    source: 'course'
  },
  B3: {
    graphId: 'g1',
    graphName: '动力电池维修技师',
    graphVersion: 'v2.3',
    taskCode: 'B',
    taskName: '电池系统检修',
    abilityCode: 'B3',
    abilityName: '热失控预警处理',
    description: '识别热失控预警信号并按流程处置',
    source: 'manual'
  },
  C1: {
    graphId: 'g1',
    graphName: '动力电池维修技师',
    graphVersion: 'v2.3',
    taskCode: 'C',
    taskName: '高压安全',
    abilityCode: 'C1',
    abilityName: '高压系统操作',
    description: '高压下电、验电与绝缘防护',
    source: 'course'
  }
};

const bmsRubrics: TrainingTask['rubrics'] = [
  {
    id: 'r1',
    name: '高压断电与防护',
    description: '规范完成下电、验电并正确穿戴防护装备',
    maxScore: 15,
    abilityWeights: [{ abilityCode: 'C1', abilityName: '高压系统操作', weight: 100 }]
  },
  {
    id: 'r2',
    name: '诊断设备连接',
    description: '正确选用工具并完成诊断设备连接',
    maxScore: 15,
    abilityWeights: [
      { abilityCode: 'B1', abilityName: '绝缘检测', weight: 30 },
      { abilityCode: 'B2', abilityName: '故障诊断', weight: 70 }
    ]
  },
  {
    id: 'r3',
    name: 'BMS 数据读取与分析',
    description: '准确读取故障码、单体电压和温度数据流',
    maxScore: 25,
    abilityWeights: [{ abilityCode: 'B2', abilityName: '故障诊断', weight: 100 }]
  },
  {
    id: 'r4',
    name: '故障定位与验证',
    description: '形成诊断假设、完成测量并验证故障根因',
    maxScore: 30,
    abilityWeights: [
      { abilityCode: 'B2', abilityName: '故障诊断', weight: 80 },
      { abilityCode: 'B1', abilityName: '绝缘检测', weight: 20 }
    ]
  },
  {
    id: 'r5',
    name: '实训报告与复盘',
    description: '记录完整、结论清晰并能说明诊断依据',
    maxScore: 15,
    abilityWeights: [
      { abilityCode: 'B2', abilityName: '故障诊断', weight: 60 },
      { abilityCode: 'C1', abilityName: '高压系统操作', weight: 40 }
    ]
  }
];

const safetyRubrics: TrainingTask['rubrics'] = [
  {
    id: 's1',
    name: '作业前风险识别',
    description: '准确识别实训环境中的高压作业风险',
    maxScore: 20,
    abilityWeights: [{ abilityCode: 'C1', abilityName: '高压系统操作', weight: 100 }]
  },
  {
    id: 's2',
    name: '断电验电操作',
    description: '严格按标准步骤完成断电与验电',
    maxScore: 40,
    abilityWeights: [{ abilityCode: 'C1', abilityName: '高压系统操作', weight: 100 }]
  },
  {
    id: 's3',
    name: '绝缘检测与记录',
    description: '正确使用绝缘检测设备并准确记录',
    maxScore: 25,
    abilityWeights: [
      { abilityCode: 'B1', abilityName: '绝缘检测', weight: 80 },
      { abilityCode: 'C1', abilityName: '高压系统操作', weight: 20 }
    ]
  },
  {
    id: 's4',
    name: '职业素养',
    description: '工位整理、团队协作与工单填写',
    maxScore: 15,
    abilityWeights: [{ abilityCode: 'C1', abilityName: '高压系统操作', weight: 100 }]
  }
];

const seedTasks: TrainingTask[] = [
  {
    id: 'training-bms-001',
    title: '动力电池 BMS 故障诊断实训',
    courseName: '动力电池管理系统检修',
    description: '以单体电压采样异常为情境，完成安全检查、数据采集、故障定位与验证。',
    requirements: [
      '按《高压实训安全操作规范》完成下电、验电和工位防护',
      '采集故障码、单体电压、温度及 SOC 数据并标记异常',
      '提交实训报告、诊断数据文件和不少于 3 张过程照片'
    ],
    classNames: ['新能源汽车 2401 班'],
    deadline: '2026-09-15T18:00',
    status: 'published',
    abilities: [abilityRefs.B1, abilityRefs.B2, abilityRefs.C1],
    rubrics: bmsRubrics,
    createdAt: '2026-09-01 09:20',
    updatedAt: '2026-09-08 16:40'
  },
  {
    id: 'training-safety-002',
    title: '新能源汽车高压安全操作实训',
    courseName: '动力电池管理系统检修',
    description: '围绕上岗前风险识别、标准下电、验电和绝缘检测开展个人技能考核。',
    requirements: [
      '独立完成防护装备检查与作业区隔离',
      '按照标准作业流程完成断电、验电和绝缘测量',
      '现场填写完整的安全检查工单'
    ],
    classNames: ['新能源汽车 2401 班'],
    deadline: '2026-09-05T17:30',
    status: 'ended',
    abilities: [abilityRefs.B1, abilityRefs.C1],
    rubrics: safetyRubrics,
    createdAt: '2026-08-25 10:10',
    updatedAt: '2026-09-06 09:15'
  },
  {
    id: 'training-soc-003',
    title: 'SOC 估算偏差标定实训',
    courseName: '动力电池管理系统检修',
    description: '利用实验数据分析 SOC 估算偏差，完成参数校准与结果复核。',
    requirements: ['完成容量学习数据清洗', '输出偏差分析图表', '记录标定参数与复核结果'],
    classNames: ['新能源汽车 2501 班'],
    deadline: '2026-09-25T18:00',
    status: 'draft',
    abilities: [abilityRefs.B2],
    rubrics: [
      {
        id: 'soc1',
        name: '数据处理',
        description: '正确清洗与对齐充放电数据',
        maxScore: 35,
        abilityWeights: [{ abilityCode: 'B2', abilityName: '故障诊断', weight: 100 }]
      },
      {
        id: 'soc2',
        name: '偏差分析与标定',
        description: '正确分析偏差来源并完成参数校准',
        maxScore: 45,
        abilityWeights: [{ abilityCode: 'B2', abilityName: '故障诊断', weight: 100 }]
      },
      {
        id: 'soc3',
        name: '结果复核与报告',
        description: '验证标定效果并输出结论',
        maxScore: 20,
        abilityWeights: [{ abilityCode: 'B2', abilityName: '故障诊断', weight: 100 }]
      }
    ],
    createdAt: '2026-09-10 14:00',
    updatedAt: '2026-09-10 14:00'
  }
];

const names = [
  '陈思远', '周雨桐', '赵子涵', '张伟', '李晓彤', '王浩然', '刘子轩', '孙悦', '吴一凡', '郑子墨',
  '徐佳慧', '黄明轩', '胡可欣', '朱家豪', '高雅琪', '林浩', '何晓晴', '罗宇辰', '宋依然', '谢子谦',
  '唐雨晨', '韩俊杰', '冯舒雅', '于鹏飞', '董思齐', '萧子恒', '程语嫣', '曹鸿宇', '袁雅楠', '邓家熙',
  '许昊天', '傅可儿', '沈一诺', '曾宇航', '彭诗涵', '吕子洋', '苏静怡', '蒋明哲', '蔡芷若', '潘俊希',
  '杜星宇', '方晨曦'
];

const makeReview = (task: TrainingTask, index: number, reviewedCount: number): TrainingReview => {
  if (index >= reviewedCount) {
    return { status: 'unreviewed', scores: [], comment: '', strengths: [], improvements: [] };
  }
  const scores = task.rubrics.map((rubric, rubricIndex) => ({
    rubricId: rubric.id,
    score: Math.max(
      0,
      Math.min(rubric.maxScore, rubric.maxScore - ((index + rubricIndex * 2) % 5))
    )
  }));
  return {
    status: 'reviewed',
    scores,
    comment:
      index % 3 === 0
        ? '诊断思路清晰，数据记录完整；建议在下次实训中加强复核测量。'
        : '操作流程基本规范，能够根据数据流定位问题并输出结论。',
    strengths: index % 2 === 0 ? ['数据分析', '操作规范'] : ['故障定位', '记录完整'],
    improvements: index % 3 === 0 ? ['复核测量'] : ['原因论证'],
    reviewedAt: `2026-09-${String(7 + (index % 3)).padStart(2, '0')} 16:${String(10 + index).padStart(2, '0')}`
  };
};

function buildSubmissions(
  task: TrainingTask,
  total: number,
  submittedCount: number,
  reviewedCount: number
): TrainingSubmission[] {
  return names.slice(0, total).map((name, index) => {
    const submitted = index < submittedCount;
    const late = submitted && index > submittedCount - 3;
    return {
      id: `${task.id}-student-${index + 1}`,
      taskId: task.id,
      studentId: String(3001 + index),
      studentCode: `2024${String(index + 1).padStart(4, '0')}`,
      studentName: name,
      className: task.classNames[0],
      submitStatus: submitted ? (late ? 'late' : 'submitted') : 'not-submitted',
      submittedAt: submitted ? `2026-09-${String(3 + (index % 7)).padStart(2, '0')} ${String(14 + (index % 5)).padStart(2, '0')}:2${index % 10}` : undefined,
      report: submitted
        ? `学生完成了「${task.title}」的环境检查、数据采集、故障定位与结果复核。报告记录了操作步骤、关键数据及异常分析结论。`
        : '',
      selfReview: submitted
        ? '本次能完成诊断流程，但在数据曲线解读和复核证据组织上还需要提升。'
        : '',
      operationSteps: submitted
        ? [
            { time: '14:08', name: '作业前安全检查', result: '通过' },
            { time: '14:18', name: '诊断仪连接与通讯', result: '通过' },
            { time: '14:32', name: 'BMS 数据流采集', result: '发现 7# 单体电压异常' },
            { time: '15:06', name: '故障定位与复核', result: '定位采样线束接触不良' }
          ]
        : [],
      processData: submitted
        ? [
            { label: '电池包总压', value: '356.4 V', status: 'normal' },
            { label: '绝缘电阻', value: '2.8 MΩ', status: 'normal' },
            { label: '单体最大压差', value: '186 mV', status: 'warning' },
            { label: '最高温度', value: '31.6 ℃', status: 'normal' }
          ]
        : [],
      attachments: submitted
        ? [
            { id: `doc-${index}`, name: `${name}-实训报告.pdf`, type: 'document', size: '2.4 MB', preview: '报告包含实训目标、工具清单、诊断过程、数据曲线、故障结论和课后复盘。' },
            { id: `img-${index}`, name: '故障测量现场照片.jpg', type: 'image', size: '1.8 MB', preview: '现场照片：学生正在使用万用表复核采样线束电压。' },
            { id: `video-${index}`, name: '诊断过程记录.mp4', type: 'video', size: '28.6 MB', preview: '03:42 实训过程视频，包含高压断电、数据读取和故障复核片段。' },
            { id: `data-${index}`, name: 'BMS-数据流.csv', type: 'data', size: '486 KB', preview: '采样数据 1,268 条，含单体电压、温度、SOC、绝缘值与故障码。' }
          ]
        : [],
      review: submitted ? makeReview(task, index, reviewedCount) : { status: 'unreviewed', scores: [], comment: '', strengths: [], improvements: [] }
    };
  });
}

export function createBlankTrainingSubmissions(
  task: TrainingTask,
  total = 42
): TrainingSubmission[] {
  return buildSubmissions(task, total, 0, 0);
}

export function createSeedTrainingState(): TrainingState {
  const tasks = JSON.parse(JSON.stringify(seedTasks)) as TrainingTask[];
  return {
    tasks,
    submissions: [
      ...buildSubmissions(tasks[0], 42, 38, 26),
      ...buildSubmissions(tasks[1], 42, 40, 38),
      ...buildSubmissions(tasks[2], 42, 0, 0)
    ]
  };
}

export function loadTrainingState(): TrainingState {
  const seed = createSeedTrainingState();
  if (typeof window === 'undefined') return seed;
  const raw = window.localStorage.getItem(TRAINING_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as TrainingState;
    return Array.isArray(parsed.tasks) && Array.isArray(parsed.submissions) ? parsed : seed;
  } catch {
    return seed;
  }
}

export function saveTrainingState(state: TrainingState) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(state));
  }
}

const publishedTasksOf = (graph: AbilityGraph): JobTask[] => {
  const current = graph.versions.find((version) => version.status === 'current');
  return current?.snapshot ?? [];
};

export function getPublishedAbilityOptions(courseName: string): TrainingAbilityRef[] {
  const graphs = listGraphs().filter((graph) => publishedTasksOf(graph).length > 0);
  const normalized = courseName.replace(/管理系统/g, '系统');
  const matchedGraphs = graphs.filter((graph) =>
    graph.linkedCourses.some((course) => {
      const linked = course.courseName.replace(/管理系统/g, '系统');
      return (
        normalized.includes(linked) ||
        linked.includes(normalized) ||
        (normalized.includes('动力电池') && linked.includes('动力电池'))
      );
    })
  );
  const scopedGraphs = matchedGraphs.length > 0 ? matchedGraphs : graphs.slice(0, 1);
  const courseAbilityCodes = new Set(['B1', 'B2', 'C1']);
  return scopedGraphs
    .flatMap((graph) => {
      return publishedTasksOf(graph).flatMap((task) =>
        task.abilities
          .filter((ability) => ability.status === 'active')
          .map((ability) => ({
            graphId: graph.id,
            graphName: graph.jobName,
            graphVersion: graph.currentVersion,
            taskCode: task.code,
            taskName: task.name,
            abilityCode: ability.code,
            abilityName: ability.name,
            description: ability.description,
            source: courseAbilityCodes.has(ability.code) ? ('course' as const) : ('manual' as const)
          }))
      );
    })
    .sort((a, b) => {
      const sourceOrder = { course: 0, manual: 1 };
      return sourceOrder[a.source] - sourceOrder[b.source] || a.abilityCode.localeCompare(b.abilityCode);
    });
}

export function buildCumulativeAbilityResults(
  state: TrainingState,
  studentId: string,
  currentTaskId?: string
): { current: AbilityResult[]; cumulative: AbilityResult[] } {
  const completed = state.submissions.filter(
    (submission) => submission.studentId === studentId && submission.review.status === 'reviewed'
  );
  const currentSubmission = completed.find((submission) => submission.taskId === currentTaskId);
  const currentTask = currentSubmission
    ? state.tasks.find((task) => task.id === currentSubmission.taskId)
    : undefined;
  const current = currentSubmission && currentTask
    ? calculateAbilityResults(currentTask, currentSubmission.review)
    : [];

  const aggregate = new Map<string, AbilityResult>();
  completed.forEach((submission) => {
    const task = state.tasks.find((item) => item.id === submission.taskId);
    if (!task) return;
    const results = calculateAbilityResults(task, submission.review);
    results.forEach((result) => {
      const existing = aggregate.get(result.abilityCode) ?? {
        abilityCode: result.abilityCode,
        abilityName: result.abilityName,
        score: 0,
        earned: 0,
        maximum: 0,
        evidences: []
      };
      const rubricNames = task.rubrics
        .filter((rubric) => rubric.abilityWeights.some((item) => item.abilityCode === result.abilityCode))
        .map((rubric) => rubric.name);
      const evidence: AbilityEvidence = {
        taskId: task.id,
        taskTitle: task.title,
        abilityCode: result.abilityCode,
        abilityName: result.abilityName,
        earned: result.earned,
        maximum: result.maximum,
        score: result.score,
        classAverage: Math.max(58, Math.min(92, result.score - 3 + Number(submission.studentId.slice(-1)) % 7)),
        rubricNames,
        feedback: submission.review.comment || '暂无教师评语'
      };
      existing.earned += result.earned;
      existing.maximum += result.maximum;
      existing.evidences.push(evidence);
      aggregate.set(result.abilityCode, existing);
    });
  });

  const cumulative = Array.from(aggregate.values()).map((item) => ({
    ...item,
    earned: Number(item.earned.toFixed(2)),
    maximum: Number(item.maximum.toFixed(2)),
    score: item.maximum > 0 ? Math.round((item.earned / item.maximum) * 100) : 0
  }));
  return { current, cumulative };
}
