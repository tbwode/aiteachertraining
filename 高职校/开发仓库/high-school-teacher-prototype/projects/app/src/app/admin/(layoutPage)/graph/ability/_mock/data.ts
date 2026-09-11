import type { AbilityGraph, AffectedCourse, JobTask, Mastery } from './types';

// g1 草稿树：B3 已标记废弃（v2.4 草稿待处理），B5 为新增
const g1DraftTasks: JobTask[] = [
  {
    id: 'g1-A',
    code: 'A',
    name: '动力电池认知',
    description: '电池体系与结构的基础认知',
    status: 'active',
    abilities: [
      {
        id: 'g1-A1',
        code: 'A1',
        name: '电池化学体系认知',
        description: '掌握主流电池化学体系特性与选型依据',
        status: 'active',
        knowledges: [
          { id: 'g1-A1-1', code: 'A1-1', name: '三元锂电池特性', weight: 40, mastery: '了解', status: 'active' },
          { id: 'g1-A1-2', code: 'A1-2', name: '磷酸铁锂电池特性', weight: 30, mastery: '了解', status: 'active' },
          { id: 'g1-A1-3', code: 'A1-3', name: '电芯充放电原理', weight: 30, mastery: '掌握', status: 'active' }
        ]
      },
      {
        id: 'g1-A2',
        code: 'A2',
        name: '电池结构认知',
        description: '电芯、模组与电池包结构',
        status: 'active',
        knowledges: [
          { id: 'g1-A2-1', code: 'A2-1', name: '电芯形态与选型', weight: 50, mastery: '了解', status: 'active' },
          { id: 'g1-A2-2', code: 'A2-2', name: '模组结构设计', weight: 50, mastery: '掌握', status: 'active' }
        ]
      }
    ]
  },
  {
    id: 'g1-B',
    code: 'B',
    name: '电池系统检修',
    description: '故障诊断、检修与应急处置',
    status: 'active',
    abilities: [
      {
        id: 'g1-B1',
        code: 'B1',
        name: '绝缘检测',
        description: '高压绝缘性能检测与故障排查',
        status: 'active',
        knowledges: [
          { id: 'g1-B1-1', code: 'B1-1', name: '绝缘电阻测量', weight: 60, mastery: '掌握', status: 'active' },
          { id: 'g1-B1-2', code: 'B1-2', name: '绝缘故障排查', weight: 40, mastery: '精通', status: 'active' }
        ]
      },
      {
        id: 'g1-B2',
        code: 'B2',
        name: '故障诊断',
        description: '基于故障码与数据流的诊断',
        status: 'active',
        knowledges: [
          { id: 'g1-B2-1', code: 'B2-1', name: '故障码读取分析', weight: 50, mastery: '掌握', status: 'active' },
          { id: 'g1-B2-2', code: 'B2-2', name: '数据流分析', weight: 50, mastery: '精通', status: 'active' }
        ]
      },
      {
        id: 'g1-B3',
        code: 'B3',
        name: '热失控预警处理',
        description: '热失控预警信号识别与处置',
        status: 'deprecated',
        knowledges: [
          { id: 'g1-B3-1', code: 'B3-1', name: '预警信号识别', weight: 50, mastery: '掌握', status: 'deprecated' },
          { id: 'g1-B3-2', code: 'B3-2', name: '预警处置流程', weight: 50, mastery: '掌握', status: 'deprecated' }
        ]
      },
      {
        id: 'g1-B5',
        code: 'B5',
        name: '热失控应急处置',
        description: '热失控事故发生后的应急处置',
        status: 'new',
        knowledges: [
          { id: 'g1-B5-1', code: 'B5-1', name: '应急断电流程', weight: 60, mastery: '精通', status: 'new' },
          { id: 'g1-B5-2', code: 'B5-2', name: '热失控扑救与隔离', weight: 40, mastery: '掌握', status: 'new' }
        ]
      }
    ]
  },
  {
    id: 'g1-C',
    code: 'C',
    name: '高压安全',
    description: '高压系统安全作业规范',
    status: 'active',
    abilities: [
      {
        id: 'g1-C1',
        code: 'C1',
        name: '高压系统操作',
        description: '高压下电、验电与防护',
        status: 'active',
        knowledges: [
          { id: 'g1-C1-1', code: 'C1-1', name: '高压断电验电', weight: 60, mastery: '精通', status: 'active' },
          { id: 'g1-C1-2', code: 'C1-2', name: '绝缘防护装备使用', weight: 40, mastery: '掌握', status: 'active' }
        ]
      }
    ]
  }
];

// g1 v2.3 快照：无 B5，B3 为 active
const g1V23Snapshot: JobTask[] = JSON.parse(
  JSON.stringify(
    g1DraftTasks.map((t) =>
      t.code !== 'B' ? t : { ...t, abilities: t.abilities.filter((a) => a.code !== 'B5') }
    )
  )
) as JobTask[];
g1V23Snapshot.forEach((t) =>
  t.abilities.forEach((a) => {
    if (a.status === 'new') a.status = 'active';
    if (a.code === 'B3') {
      a.status = 'active';
      a.knowledges.forEach((k) => (k.status = 'active'));
    }
    a.knowledges.forEach((k) => {
      if (k.status === 'new') k.status = 'active';
    });
  })
);

// g1 v2.2 快照：在 v2.3 基础上去掉 C1-2
const g1V22Snapshot: JobTask[] = JSON.parse(JSON.stringify(g1V23Snapshot)) as JobTask[];
const g1V22TaskC = g1V22Snapshot.find((t) => t.code === 'C');
if (g1V22TaskC) {
  const c1 = g1V22TaskC.abilities[0];
  c1.knowledges = c1.knowledges.filter((k) => k.code !== 'C1-2');
}

// g1 v2.4 草稿快照 = 当前草稿树的深拷贝（草稿快照随编辑刷新，发布时冻结）
const g1V24DraftSnapshot: JobTask[] = JSON.parse(JSON.stringify(g1DraftTasks)) as JobTask[];

// data.ts 内置本地计数（避免与 store.ts 循环依赖；store.ts 的 countNodes 为对外版本）
function countNodesLocal(tasks: JobTask[]): { tasks: number; abilities: number; knowledges: number } {
  let abilities = 0;
  let knowledges = 0;
  tasks.forEach((t) => {
    abilities += t.abilities.length;
    t.abilities.forEach((a) => {
      knowledges += a.knowledges.length;
    });
  });
  return { tasks: tasks.length, abilities, knowledges };
}

const g1LinkedCourses: AffectedCourse[] = [
  { courseId: 'c1', courseName: '动力电池系统检修', mappingCount: 2 },
  { courseId: 'c2', courseName: '新能源汽车故障诊断', mappingCount: 2 },
  { courseId: 'c3', courseName: '高压安全与防护', mappingCount: 1 }
];

const g1: AbilityGraph = {
  id: 'g1',
  jobName: '动力电池维修技师',
  majorDirection: '新能源汽车技术',
  status: 'draft',
  currentVersion: 'v2.3',
  tasks: g1DraftTasks,
  versions: [
    {
      version: 'v2.4',
      status: 'draft',
      nodeCounts: countNodesLocal(g1DraftTasks),
      changeSummary:
        'AI 依据 12 份企业岗位说明书生成：新增 B5 热失控应急处置，建议废弃 B3 热失控预警处理。',
      diff: { added: ['B5', 'B5-1', 'B5-2'], modified: [], deprecated: ['B3', 'B3-1', 'B3-2'] },
      deprecations: [
        {
          code: 'B3',
          name: '热失控预警处理',
          suggestion: '建议由 B5 热失控应急处置替代',
          affectedCourses: g1LinkedCourses,
          status: 'pending'
        }
      ],
      snapshot: g1V24DraftSnapshot
    },
    {
      version: 'v2.3',
      status: 'current',
      nodeCounts: countNodesLocal(g1V23Snapshot),
      publishedAt: '2026-03-18 10:12',
      changeSummary: '人工审核后发布：调整 A2、C1 能力等级描述。',
      diff: { added: [], modified: ['A2', 'C1'], deprecated: [] },
      deprecations: [],
      snapshot: g1V23Snapshot
    },
    {
      version: 'v2.2',
      status: 'archived',
      nodeCounts: countNodesLocal(g1V22Snapshot),
      publishedAt: '2025-11-02 09:40',
      changeSummary: '首版 AI 生成 + 教研组审定。',
      diff: { added: ['C1-2'], modified: [], deprecated: [] },
      deprecations: [],
      snapshot: g1V22Snapshot
    }
  ],
  linkedCourses: g1LinkedCourses,
  sourceDocs: [{ name: '动力电池维修技师岗位说明书.pdf', size: '1.2 MB' }],
  updatedAt: '2026-08-26 14:32'
};

// g2-g6：已发布简易图谱（2 任务 × 2 能力 × 2 知识点，权重 50/50，单 current 版本含快照）
function simpleGraph(input: {
  id: string;
  jobName: string;
  majorDirection: string;
  version: string;
  publishedAt: string;
  changeSummary: string;
  updatedAt: string;
  courses: [string, string][];
}): AbilityGraph {
  const taskDefs: [string, string, string, string][] = [
    ['A', '岗位认知与安全规范', '基础理论认知', '安全作业规范'],
    ['B', '现场作业执行', '作业流程执行', '质量检查与记录']
  ];
  const tasks: JobTask[] = taskDefs.map(([tCode, tName, a1Name, a2Name]) => ({
    id: `${input.id}-${tCode}`,
    code: tCode,
    name: tName,
    description: `${input.jobName}岗位的${tName}任务域`,
    status: 'active',
    abilities: [a1Name, a2Name].map((aName, ai) => {
      const aCode = `${tCode}${ai + 1}`;
      return {
        id: `${input.id}-${aCode}`,
        code: aCode,
        name: aName,
        description: `${aName}相关能力要求`,
        status: 'active' as const,
        knowledges: [1, 2].map((ki) => ({
          id: `${input.id}-${aCode}-${ki}`,
          code: `${aCode}-${ki}`,
          name: `${aName}要点${ki}`,
          weight: 50,
          mastery: (ki === 1 ? '掌握' : '了解') as Mastery,
          status: 'active' as const
        }))
      };
    })
  }));
  const snapshot = JSON.parse(JSON.stringify(tasks)) as JobTask[];
  return {
    id: input.id,
    jobName: input.jobName,
    majorDirection: input.majorDirection,
    status: 'published',
    currentVersion: input.version,
    tasks,
    versions: [
      {
        version: input.version,
        status: 'current',
        nodeCounts: countNodesLocal(snapshot),
        publishedAt: input.publishedAt,
        changeSummary: input.changeSummary,
        diff: { added: [], modified: [], deprecated: [] },
        deprecations: [],
        snapshot
      }
    ],
    linkedCourses: input.courses.map(([courseId, courseName], i) => ({
      courseId,
      courseName,
      mappingCount: (i % 3) + 1
    })),
    sourceDocs: [],
    updatedAt: input.updatedAt
  };
}

const g2 = simpleGraph({
  id: 'g2',
  jobName: '新能源汽车装调技师',
  majorDirection: '新能源汽车技术',
  version: 'v1.6',
  publishedAt: '2026-08-20 09:15',
  changeSummary: '补充高压安全作业细分能力点。',
  updatedAt: '2026-08-20 09:15',
  courses: [
    ['c4', '新能源汽车装调工艺'],
    ['c5', '底盘线控技术'],
    ['c6', '整车装配实训'],
    ['c7', '汽车电工电子']
  ]
});
const g3 = simpleGraph({
  id: 'g3',
  jobName: '充电桩运维工程师',
  majorDirection: '新能源汽车技术',
  version: 'v1.2',
  publishedAt: '2026-07-30 16:48',
  changeSummary: '新增直流快充模块检修能力域。',
  updatedAt: '2026-07-30 16:48',
  courses: [
    ['c8', '充电桩安装与运维'],
    ['c9', '电力电子基础']
  ]
});
const g4 = simpleGraph({
  id: 'g4',
  jobName: '智能网联汽车测试员',
  majorDirection: '智能网联汽车技术',
  version: 'v1.0',
  publishedAt: '2026-06-12 11:05',
  changeSummary: '首版发布。',
  updatedAt: '2026-06-12 11:05',
  courses: [
    ['c10', '智能网联汽车概论'],
    ['c11', '传感器与感知技术']
  ]
});
const g5 = simpleGraph({
  id: 'g5',
  jobName: '汽车营销顾问',
  majorDirection: '汽车技术服务与营销',
  version: 'v2.0',
  publishedAt: '2026-05-21 15:26',
  changeSummary: '按新能源车型销售流程重构能力域。',
  updatedAt: '2026-05-21 15:26',
  courses: [
    ['c12', '汽车营销实务'],
    ['c13', '客户关系管理'],
    ['c14', '新能源车型产品知识']
  ]
});
const g6 = simpleGraph({
  id: 'g6',
  jobName: '机电设备维修工',
  majorDirection: '机电一体化技术',
  version: 'v3.1',
  publishedAt: '2026-04-08 10:02',
  changeSummary: '合并重复能力点，等级描述对齐国家职业标准。',
  updatedAt: '2026-04-08 10:02',
  courses: [
    ['c15', '机电设备装调'],
    ['c16', 'PLC 控制技术'],
    ['c17', '液压与气动'],
    ['c18', '设备点检实务'],
    ['c19', '机械制图']
  ]
});

const careTasks: JobTask[] = [
  {
    id: 'g7-A', code: 'A', name: '专业技能', description: '围绕老年人生活照护与健康管理的核心工作任务', status: 'active',
    abilities: [
      { id: 'g7-A1', code: 'A1', name: '生活照护', description: '掌握老年人饮食、清洁、睡眠与排泄照护知识和操作规范', status: 'active', knowledges: [
        { id: 'g7-A1-1', code: 'A1-1', name: '进食照护', weight: 35, mastery: '精通', status: 'active' },
        { id: 'g7-A1-2', code: 'A1-2', name: '清洁与排泄照护', weight: 35, mastery: '掌握', status: 'active' },
        { id: 'g7-A1-3', code: 'A1-3', name: '睡眠照护', weight: 30, mastery: '掌握', status: 'active' }
      ] },
      { id: 'g7-A2', code: 'A2', name: '健康评估', description: '开展老年人能力评估、健康监测与风险识别', status: 'active', knowledges: [
        { id: 'g7-A2-1', code: 'A2-1', name: '老年人能力评估', weight: 55, mastery: '精通', status: 'active' },
        { id: 'g7-A2-2', code: 'A2-2', name: '生命体征监测', weight: 45, mastery: '掌握', status: 'active' }
      ] },
      { id: 'g7-A3', code: 'A3', name: '智慧平台操作', description: '使用智慧养老平台完成照护记录、数据分析与服务协同', status: 'active', knowledges: [
        { id: 'g7-A3-1', code: 'A3-1', name: '照护数据采集', weight: 50, mastery: '掌握', status: 'active' },
        { id: 'g7-A3-2', code: 'A3-2', name: '隐私与数据安全', weight: 50, mastery: '掌握', status: 'active' }
      ] }
    ]
  },
  {
    id: 'g7-B', code: 'B', name: '服务规范', description: '养老照护服务过程中的沟通、记录与职业伦理', status: 'active',
    abilities: [
      { id: 'g7-B1', code: 'B1', name: '沟通礼仪', description: '与老年人、家属及服务团队开展专业沟通', status: 'active', knowledges: [
        { id: 'g7-B1-1', code: 'B1-1', name: '老年人沟通技巧', weight: 60, mastery: '精通', status: 'active' },
        { id: 'g7-B1-2', code: 'B1-2', name: '家属沟通与反馈', weight: 40, mastery: '掌握', status: 'active' }
      ] },
      { id: 'g7-B2', code: 'B2', name: '服务过程记录', description: '规范填写照护记录与交接班材料', status: 'active', knowledges: [
        { id: 'g7-B2-1', code: 'B2-1', name: '照护记录规范', weight: 50, mastery: '掌握', status: 'active' },
        { id: 'g7-B2-2', code: 'B2-2', name: '交接班管理', weight: 50, mastery: '掌握', status: 'active' }
      ] }
    ]
  },
  {
    id: 'g7-C', code: 'C', name: '安全准则', description: '照护服务场所的卫生防护与风险控制', status: 'active',
    abilities: [
      { id: 'g7-C1', code: 'C1', name: '卫生防护', description: '落实个人防护、环境清洁与感染控制要求', status: 'active', knowledges: [
        { id: 'g7-C1-1', code: 'C1-1', name: '标准防护', weight: 50, mastery: '精通', status: 'active' },
        { id: 'g7-C1-2', code: 'C1-2', name: '环境消毒', weight: 50, mastery: '掌握', status: 'active' }
      ] },
      { id: 'g7-C2', code: 'C2', name: '风险识别', description: '识别跌倒、压疮、噎食等常见照护风险', status: 'active', knowledges: [
        { id: 'g7-C2-1', code: 'C2-1', name: '跌倒与压疮风险', weight: 50, mastery: '掌握', status: 'active' },
        { id: 'g7-C2-2', code: 'C2-2', name: '吞咽风险观察', weight: 50, mastery: '掌握', status: 'active' }
      ] }
    ]
  },
  {
    id: 'g7-D', code: 'D', name: '应急处置', description: '养老照护突发事件响应与协同处置', status: 'active',
    abilities: [
      { id: 'g7-D1', code: 'D1', name: '应急响应', description: '按照预案完成突发事件报告、初步处置与转介', status: 'active', knowledges: [
        { id: 'g7-D1-1', code: 'D1-1', name: '突发事件报告', weight: 40, mastery: '掌握', status: 'active' },
        { id: 'g7-D1-2', code: 'D1-2', name: '基础急救操作', weight: 60, mastery: '精通', status: 'active' }
      ] },
      { id: 'g7-D2', code: 'D2', name: '协同处置', description: '联动医护、家属及管理人员完成应急处置', status: 'active', knowledges: [
        { id: 'g7-D2-1', code: 'D2-1', name: '多角色协同', weight: 50, mastery: '掌握', status: 'active' },
        { id: 'g7-D2-2', code: 'D2-2', name: '事件复盘改进', weight: 50, mastery: '掌握', status: 'active' }
      ] }
    ]
  }
];

const careSnapshot = JSON.parse(JSON.stringify(careTasks)) as JobTask[];
const g7: AbilityGraph = {
  id: 'g7',
  jobName: '养老护理员',
  majorDirection: '智慧健康养老服务与管理',
  status: 'published',
  currentVersion: 'v2.3',
  tasks: careTasks,
  versions: [{
    version: 'v2.3',
    status: 'current',
    nodeCounts: countNodesLocal(careSnapshot),
    publishedAt: '2026-09-06 16:30',
    changeSummary: '依据新版国家职业技能标准与 12 家合作企业岗位任务完成复核发布。',
    diff: { added: ['A3', 'A3-1', 'A3-2'], modified: ['C2'], deprecated: [] },
    deprecations: [],
    snapshot: careSnapshot
  }],
  linkedCourses: [
    { courseId: 'c20', courseName: '老年生活照护', mappingCount: 5 },
    { courseId: 'c21', courseName: '老年健康评估', mappingCount: 4 },
    { courseId: 'c22', courseName: '智慧养老平台实务', mappingCount: 2 },
    { courseId: 'c23', courseName: '老年人急救技术', mappingCount: 3 }
  ],
  sourceDocs: [
    { name: '养老护理员国家职业技能标准（2019年版）.pdf', size: '3.8 MB' },
    { name: '南通市养老服务企业典型任务调研.xlsx', size: '826 KB' },
    { name: '1+X 老年照护职业技能等级标准.pdf', size: '2.1 MB' }
  ],
  updatedAt: '2026-09-06 16:30'
};

const g8 = simpleGraph({
  id: 'g8', jobName: '健康照护师', majorDirection: '智慧健康养老服务与管理', version: 'v1.5',
  publishedAt: '2026-08-28 10:20', changeSummary: '补充慢病健康管理与跨专业服务协同能力。', updatedAt: '2026-08-28 10:20',
  courses: [['c21', '老年健康评估'], ['c24', '老年慢病管理'], ['c25', '康复辅助技术']]
});

const g9 = simpleGraph({
  id: 'g9', jobName: '养老机构运营专员', majorDirection: '智慧健康养老服务与管理', version: 'v1.1',
  publishedAt: '2026-08-16 14:08', changeSummary: '企业专家复核服务质量与机构运营任务域。', updatedAt: '2026-08-16 14:08',
  courses: [['c26', '养老机构运营管理'], ['c27', '养老服务质量管理'], ['c28', '智慧养老项目策划']]
});

// 每次调用返回全新深对象（保证 SSR 与水合一致、resetStore 可还原）
export function seedGraphs(): AbilityGraph[] {
  return JSON.parse(JSON.stringify([g7, g8, g9, g1, g2, g3, g4, g5, g6])) as AbilityGraph[];
}
