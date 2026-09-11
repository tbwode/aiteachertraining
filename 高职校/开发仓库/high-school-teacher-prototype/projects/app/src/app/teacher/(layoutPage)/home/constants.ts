// 颜色常量
export const PRIMARY_COLOR = '#C83E3E';
export const PRIMARY_LIGHT = '#E85A5A';
export const SUCCESS_COLOR = '#52C41A';
export const WARNING_COLOR = '#FAAD14';
export const ERROR_COLOR = '#F5222D';
export const INFO_COLOR = '#1677FF';
export const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';
export const CARD_SHADOW_HOVER = '0 8px 24px rgba(0,0,0,0.12)';

// 类型定义
export type SuggestionType = 'news' | 'optimization' | 'graph';
export type SuggestionAction = 'read' | 'adopt';
export type SuggestionPriority = 'high' | 'medium' | 'low';
export type AvatarStatus = 'running' | 'pending' | 'expired';
export type TabKey = 'all' | AvatarStatus;
export type LearningRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type SuggestionItem = {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  read: boolean;
  action: SuggestionAction;
  relatedCourseName?: string; // 关联课程名称
  publishTime?: string; // 发布时间
  priority: SuggestionPriority;
  confidence: number;
  sourceLabel: string;
  evidenceList: string[];
  impactSummary: string;
  targetAudience: string;
  expectedOutcome: string;
  recommendedActions: string[];
};

export type StudentTodo = {
  id: string;
  studentId?: number; // 真实的学生ID（用于API调用）
  name: string;
  className: string;
  course: string;
  avatarId: number; // AI分身ID
  progress: number;
  delayDays: number;
  reminded: boolean;
  studyHours: number; // 学习时长
  lastStudyTimeDesc: string; // 最后学习时间描述
  lagReasonList: string[]; // 滞后原因列表
  riskLevel: LearningRiskLevel;
  riskType: string;
  riskScore: number;
  progressGap: number;
  uncompletedTaskCount: number;
  riskSignalList: string[];
  weakKnowledgePoints: string[];
  recommendedActions: string[];
};

export type AvatarCard = {
  id: string;
  title: string;
  status: AvatarStatus;
  studentScale: string;
  interactions: string;
  coverageLabel: string;
  coverageText: string;
  coverageBg: string;
  coverageColor: string;
  heroBg: string;
  heroText: string;
  accentColor: string;
};

// 原型默认数据：页面始终可演示，后续可被 Mock API 的同结构数据替换。
export const initialSuggestions: SuggestionItem[] = [
  {
    id: '101',
    type: 'news',
    title: '新能源汽车产教融合实训周启动',
    description: '省内 6 家企业将开放动力电池检测与整车故障诊断真实任务。',
    read: false,
    action: 'read',
    relatedCourseName: '新能源汽车动力电池检修',
    publishTime: '2026-09-10 09:10:00',
    priority: 'medium',
    confidence: 92,
    sourceLabel: '省职教产教融合平台',
    evidenceList: ['与第 4 章“动力电池故障诊断”匹配度 86%', '实训周报名截止时间为 9 月 15 日'],
    impactSummary: '可为 2501 班引入企业真实工单，补充当前实训案例的现场性。',
    targetAudience: '新能源汽车 2501 班·38 人',
    expectedOutcome: '企业工单型实训覆盖率预计提升 18%',
    recommendedActions: [
      '收藏至课程资源库',
      '将“绝缘检测”任务加入下周实训',
      '向授课班级发布报名通知'
    ]
  },
  {
    id: '102',
    type: 'news',
    title: '新版电动汽车高压安全操作规范发布',
    description: '新规范增加高压下电复核、绝缘防护检查与事故上报要求。',
    read: false,
    action: 'read',
    relatedCourseName: '新能源汽车综合实训',
    publishTime: '2026-09-10 08:35:00',
    priority: 'high',
    confidence: 96,
    sourceLabel: '行业标准知识库',
    evidenceList: ['现行课件引用的流程版本为 2023 版', '共识别 3 处流程差异和 2 个术语更新'],
    impactSummary: '涉及高压实训的安全性与考核合规性，建议本周内完成更新。',
    targetAudience: '汽修专业 3 个班级·106 人',
    expectedOutcome: '实训流程与新规范一致，降低高压作业安全风险',
    recommendedActions: [
      '替换课件中的高压下电流程图',
      '生成 5 道安全规范随堂测验',
      '更新实训评分检查项'
    ]
  },
  {
    id: '201',
    type: 'optimization',
    title: '建议补充 BMS 均衡策略对比实训',
    description: '近 7 天学生在均衡触发条件与数据流判读上的平均正确率仅 58%。',
    read: false,
    action: 'read',
    relatedCourseName: '新能源汽车动力电池检修',
    publishTime: '2026-09-10 08:20:00',
    priority: 'high',
    confidence: 94,
    sourceLabel: 'AI 学情分析',
    evidenceList: [
      '14/38 名学生连续两次答错均衡触发条件',
      '对话中“主动均衡”相关追问较班级均值高 37%'
    ],
    impactSummary: '若不干预，预计有 11 名学生无法独立完成单体一致性诊断。',
    targetAudience: '重点学生 14 人，全班共 38 人',
    expectedOutcome: '相关知识点正确率预计从 58% 提升至 78%',
    recommendedActions: [
      '增加“被动均衡 vs 主动均衡”数据流对比',
      '为 14 名学生推送 10 分钟微课',
      '下次课前安排 5 题诊断测验'
    ]
  },
  {
    id: '202',
    type: 'optimization',
    title: '章节测验难度梯度需要调整',
    description: '“热失控应急处置”章节高难度题占比 46%，高于建议值 20 个百分点。',
    read: true,
    action: 'read',
    relatedCourseName: '新能源汽车动力电池检修',
    publishTime: '2026-09-09 16:40:00',
    priority: 'medium',
    confidence: 89,
    sourceLabel: 'AI 测验分析',
    evidenceList: ['章节测验班级平均分 64.2 分', '第 8、10 题的区分度低于 0.2'],
    impactSummary: '题目难度过度集中，难以准确区分“概念不熟”与“迁移应用不足”。',
    targetAudience: '新能源汽车 2501 班·38 人',
    expectedOutcome: '测验难度曲线更均衡，诊断结果可解释性提升',
    recommendedActions: [
      '将 2 道高难度题调整为中等难度',
      '为错误集中选项增加分层解析',
      '保留 1 道综合迁移题用于拔高'
    ]
  },
  {
    id: '301',
    type: 'graph',
    title: '能力图谱建议新增“热失控分级响应”节点',
    description: '企业岗位标准新增二级能力要求，现有课程图谱尚未覆盖。',
    read: false,
    action: 'adopt',
    relatedCourseName: '新能源汽车动力电池检修',
    publishTime: '2026-09-10 07:50:00',
    priority: 'high',
    confidence: 91,
    sourceLabel: '产业岗位能力库',
    evidenceList: [
      '分析 12 份新版岗位说明书，9 份包含该能力',
      '当前“热失控预警”节点与新标准匹配度仅 62%'
    ],
    impactSummary: '影响课程标准、实训任务和题库的能力映射完整性。',
    targetAudience: '该课程 2 个教学班·76 人',
    expectedOutcome: '岗课匹配度预计由 81% 提升至 93%',
    recommendedActions: [
      '新增二级能力节点与 3 个知识点',
      '关联“热扩散判断”实训任务',
      '更新题库标签与考核权重'
    ]
  },
  {
    id: '302',
    type: 'graph',
    title: '“高压互锁故障诊断”岗课映射偏弱',
    description: '该能力与第 5 章资源的关联强度为 67%，缺少完整故障链路案例。',
    read: false,
    action: 'adopt',
    relatedCourseName: '新能源汽车综合实训',
    publishTime: '2026-09-09 15:20:00',
    priority: 'medium',
    confidence: 87,
    sourceLabel: 'AI 岗课匹配分析',
    evidenceList: [
      '现有 4 份资源仅 1 份包含完整诊断流程',
      '学生在线束故障定位环节的平均得分率为 61%'
    ],
    impactSummary: '学生能够识别现象，但完整诊断路径和复核能力不足。',
    targetAudience: '汽修 2502 班·36 人',
    expectedOutcome: '岗课映射完整度预计提升 16%',
    recommendedActions: [
      '补充 1 个“间歇性互锁故障”案例',
      '关联高压下电和线束检测前置技能',
      '生成分步诊断评价量表'
    ]
  }
];

export const initialStudents: StudentTodo[] = [
  {
    id: '3002-901',
    studentId: 3002,
    name: '周雨桐',
    className: '新能源汽车 2501 班',
    course: '新能源汽车动力电池检修',
    avatarId: 901,
    progress: 35,
    delayDays: 5,
    reminded: false,
    studyHours: 5.5,
    lastStudyTimeDesc: '3 天前',
    lagReasonList: ['连续 3 天未登录', '章节测验未完成', 'BMS 均衡策略答题正确率低'],
    riskLevel: 'critical',
    riskType: '进度滞后',
    riskScore: 91,
    progressGap: 28,
    uncompletedTaskCount: 3,
    riskSignalList: ['3 天未学习', '连续 2 次测验低于 60 分', '实训报告未提交'],
    weakKnowledgePoints: ['BMS 均衡策略', '单体一致性判定', 'SOC 估算'],
    recommendedActions: [
      '今日发送个性化学习提醒',
      '推送均衡策略 10 分钟微课',
      '建议教师在 2 日内进行一次学情面谈'
    ]
  },
  {
    id: '3011-901',
    studentId: 3011,
    name: '陈宇轩',
    className: '新能源汽车 2501 班',
    course: '新能源汽车动力电池检修',
    avatarId: 901,
    progress: 48,
    delayDays: 3,
    reminded: false,
    studyHours: 8.2,
    lastStudyTimeDesc: '18 小时前',
    lagReasonList: ['高压互锁故障诊断练习重复错误', '学习路径在第 4 章停留较长'],
    riskLevel: 'high',
    riskType: '知识薄弱',
    riskScore: 78,
    progressGap: 16,
    uncompletedTaskCount: 2,
    riskSignalList: ['同类故障题连续 4 次出错', '本周向 AI 教师追问 12 次'],
    weakKnowledgePoints: ['高压互锁逻辑', '线束通断检测', '故障树分析'],
    recommendedActions: [
      '指派“高压互锁故障链”分步练习',
      '开放 1 次错题针对性重测',
      '观察下一次实训操作情况'
    ]
  },
  {
    id: '3024-902',
    studentId: 3024,
    name: '许佳宁',
    className: '汽修 2502 班',
    course: '新能源汽车综合实训',
    avatarId: 902,
    progress: 57,
    delayDays: 2,
    reminded: true,
    studyHours: 10.6,
    lastStudyTimeDesc: '6 小时前',
    lagReasonList: ['实训报告反复修改', '热失控应急流程得分偏低'],
    riskLevel: 'high',
    riskType: '实训表现',
    riskScore: 72,
    progressGap: 11,
    uncompletedTaskCount: 1,
    riskSignalList: ['实训报告退回 2 次', '应急处置步骤漏项 3 处'],
    weakKnowledgePoints: ['热失控分级', '应急隔离流程'],
    recommendedActions: ['发送报告修改清单', '推送应急处置交互课件', '提醒在周五前完成重提交']
  },
  {
    id: '3030-901',
    studentId: 3030,
    name: '陆子谦',
    className: '新能源汽车 2501 班',
    course: '新能源汽车动力电池检修',
    avatarId: 901,
    progress: 62,
    delayDays: 1,
    reminded: false,
    studyHours: 12.1,
    lastStudyTimeDesc: '2 小时前',
    lagReasonList: ['随堂测验成绩连续下降', '最近学习时段过度集中在截止日前'],
    riskLevel: 'medium',
    riskType: '成绩下滑',
    riskScore: 61,
    progressGap: 7,
    uncompletedTaskCount: 1,
    riskSignalList: ['近 3 次测验成绩下降 14 分', '任务平均延迟 9 小时提交'],
    weakKnowledgePoints: ['绝缘故障分级', '检测仪表选用'],
    recommendedActions: [
      '推送 5 道定向巩固题',
      '建议将下一个任务拆分为 2 个小步骤',
      '持续观察 3 天'
    ]
  }
];

export const initialAvatars: AvatarCard[] = [];

export const tabItems: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'pending', label: '未开始' },
  { key: 'expired', label: '已截止' }
];
