export type ProgramStatus = '编制中' | '待论证' | '已通过' | '执行中';

export type TrainingProgram = {
  id: string;
  name: string;
  major: string;
  college: string;
  grade: string;
  version: string;
  owner: string;
  status: ProgramStatus;
  progress: number;
  credits: number;
  hours: number;
  practiceRate: number;
  risk: string;
  updatedAt: string;
};

export const programs: TrainingProgram[] = [
  {
    id: 'TP-2026-001',
    name: '智慧健康养老服务与管理专业人才培养方案',
    major: '智慧健康养老服务与管理',
    college: '健康养老学院',
    grade: '2026 级',
    version: 'V3.2',
    owner: '陈静',
    status: '编制中',
    progress: 78,
    credits: 142,
    hours: 2640,
    practiceRate: 56,
    risk: '2 项待处理',
    updatedAt: '今天 09:42'
  },
  {
    id: 'TP-2026-002',
    name: '新能源汽车技术专业人才培养方案',
    major: '新能源汽车技术',
    college: '交通工程学院',
    grade: '2026 级',
    version: 'V2.8',
    owner: '王海峰',
    status: '待论证',
    progress: 92,
    credits: 146,
    hours: 2712,
    practiceRate: 58,
    risk: '无风险',
    updatedAt: '昨天 16:18'
  },
  {
    id: 'TP-2025-013',
    name: '机电一体化技术专业人才培养方案',
    major: '机电一体化技术',
    college: '智能制造学院',
    grade: '2025 级',
    version: 'V4.0',
    owner: '周斌',
    status: '执行中',
    progress: 100,
    credits: 145,
    hours: 2688,
    practiceRate: 60,
    risk: '1 项预警',
    updatedAt: '09-08 11:06'
  },
  {
    id: 'TP-2025-009',
    name: '计算机应用技术专业人才培养方案',
    major: '计算机应用技术',
    college: '信息工程学院',
    grade: '2025 级',
    version: 'V2.5',
    owner: '徐颖',
    status: '已通过',
    progress: 100,
    credits: 140,
    hours: 2560,
    practiceRate: 52,
    risk: '无风险',
    updatedAt: '09-05 14:30'
  },
  {
    id: 'TP-2024-006',
    name: '电子商务专业人才培养方案',
    major: '电子商务',
    college: '商贸管理学院',
    grade: '2024 级',
    version: 'V3.6',
    owner: '刘倩',
    status: '执行中',
    progress: 100,
    credits: 138,
    hours: 2512,
    practiceRate: 50,
    risk: '3 项预警',
    updatedAt: '09-03 09:15'
  }
];

export const chapters = [
  ['01', '专业名称及代码', '完成'],
  ['02', '入学要求与修业年限', '完成'],
  ['03', '职业面向', '完成'],
  ['04', '培养目标与培养规格', '编辑中'],
  ['05', '课程设置及要求', '待完善'],
  ['06', '教学进程总体安排', '待完善'],
  ['07', '实施保障', '待完善'],
  ['08', '毕业要求', '待完善'],
  ['09', '附录', '未开始'],
  ['10', '变更记录', '未开始']
] as const;

export const courseRows = [
  ['老年生活照护', '专业核心课', '4', '64', '生活照护 L3、沟通礼仪 L3', '已对齐'],
  ['老年健康评估', '专业核心课', '4', '72', '健康评估 L3、风险识别 L2', '已对齐'],
  ['智慧养老平台实务', '专业拓展课', '3', '48', '智慧平台操作 L2', '待补强'],
  ['老年活动策划与组织', '专业核心课', '3', '56', '活动策划 L3、协同沟通 L2', '已对齐'],
  ['失智老年人照护', '专业核心课', '4', '72', '认知障碍照护 L3、应急处置 L2', '待复核']
] as const;

export const goals = [
  { code: 'G1', title: '职业素养', detail: '具有敬老爱老情怀、职业伦理与服务意识', score: 96 },
  { code: 'G2', title: '专业照护', detail: '能够实施老年人生活照护、基础护理与风险防护', score: 91 },
  { code: 'G3', title: '健康管理', detail: '能够开展老年人能力评估、健康监测与照护计划制定', score: 84 },
  { code: 'G4', title: '智慧服务', detail: '能够运用智慧养老平台开展数据记录与服务协同', score: 72 }
] as const;

export const abilityGaps = [
  { name: '智慧平台操作', level: 'L2', target: 'L3', coverage: 63, severity: '高' },
  { name: '老年人吞咽风险评估', level: 'L1', target: 'L2', coverage: 58, severity: '高' },
  { name: '跨专业服务协同', level: 'L2', target: 'L3', coverage: 71, severity: '中' },
  { name: '养老服务质量改进', level: 'L2', target: 'L2', coverage: 86, severity: '低' }
] as const;

export const warnings = [
  {
    id: 'WR-061',
    level: '高',
    title: '智慧平台操作能力支撑不足',
    scope: '2025 级 · 2 门课程',
    owner: '张文涛',
    deadline: '09-18',
    status: '待整改',
    evidence: '企业岗位标准要求 L3，当前课程矩阵最高仅覆盖至 L2。',
    action: '提升《智慧养老平台实务》实践学时，并补充真实工单数据实训。'
  },
  {
    id: 'WR-058',
    level: '中',
    title: '第二学期实践学时偏低',
    scope: '2025 级 · 第 2 学期',
    owner: '陈静',
    deadline: '09-25',
    status: '整改中',
    evidence: '实践教学占比 42%，低于专业群设定的 50% 下限。',
    action: '将健康评估课程 12 学时调整为任务式实训。'
  },
  {
    id: 'WR-044',
    level: '低',
    title: '课程目标表述可测量性不足',
    scope: '3 门专业基础课',
    owner: '李晴',
    deadline: '10-08',
    status: '待验证',
    evidence: '课程目标使用“熟悉、理解”等不可直接评价表述。',
    action: '按行为动词库重写目标，并补充评价方式。'
  }
] as const;

export const matrixRows = [
  ['老年生活照护', 'H', 'M', 'L', '-', 'M'],
  ['老年健康评估', 'M', 'H', 'H', '-', 'L'],
  ['智慧养老平台实务', '-', 'L', 'M', 'H', 'M'],
  ['失智老年人照护', 'H', 'M', 'M', '-', 'H'],
  ['岗位实习', 'H', 'H', 'H', 'H', 'H']
] as const;
