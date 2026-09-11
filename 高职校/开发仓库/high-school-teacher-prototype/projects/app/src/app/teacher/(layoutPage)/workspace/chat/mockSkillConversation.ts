import {
  DEFAULT_WORKSPACE_SKILL,
  type WorkspaceModeKey,
  type WorkspaceSkillKey
} from '../workbuddyConfig';

export const WORKSPACE_SKILL_KEYS: WorkspaceSkillKey[] = [
  'lesson',
  'slides',
  'interactive',
  'video',
  'quiz',
  'standards',
  'practice',
  'school-affairs',
  'procurement',
  'logistics',
  'meeting'
];

export const WORKSPACE_SKILL_META: Record<
  WorkspaceSkillKey,
  {
    title: string;
    toolName: string;
    summary: string;
    color: string;
    softBackground: string;
  }
> = {
  lesson: {
    title: '教案生成',
    toolName: 'lesson_plan.compose',
    summary: '生成 45 分钟教学流程、板书与学习任务单',
    color: '#2563EB',
    softBackground: '#EFF6FF'
  },
  slides: {
    title: 'PPT 制作',
    toolName: 'slide_deck.generate',
    summary: '完成课件结构、视觉编排与课堂展示内容',
    color: '#4F46E5',
    softBackground: '#EEF2FF'
  },
  interactive: {
    title: '互动课件',
    toolName: 'interactive_courseware.build',
    summary: '完成课堂热点、拖拽练习与即时反馈模块',
    color: '#0284C7',
    softBackground: '#F0F9FF'
  },
  video: {
    title: '视频课件',
    toolName: 'video_courseware.storyboard',
    summary: '生成微课分镜、教师旁白、重点字幕与时间轴',
    color: '#DB2777',
    softBackground: '#FDF2F8'
  },
  quiz: {
    title: '随堂诊断与测验',
    toolName: 'assessment.generate',
    summary: '生成诊断题、参考答案与逐题解析',
    color: '#9333EA',
    softBackground: '#FAF5FF'
  },
  practice: {
    title: '互动实训设计',
    toolName: 'practice_workorder.build',
    summary: '生成实训工单、安全规范与过程评价表',
    color: '#0F766E',
    softBackground: '#F0FDFA'
  },
  standards: {
    title: '技能标准对齐',
    toolName: 'skill_standard.align',
    summary: '完成岗位能力、标准条款、达成证据与覆盖率映射',
    color: '#D97706',
    softBackground: '#FFFBEB'
  },
  'school-affairs': {
    title: '校务管理智能体',
    toolName: 'campus_affairs.orchestrate',
    summary: '完成校务事项梳理、制度解读、公文草拟与办学数据汇总',
    color: '#C83E3E',
    softBackground: '#FEF2F2'
  },
  procurement: {
    title: '采购管理智能体',
    toolName: 'campus_procurement.compliance_check',
    summary: '完成采购流程引导、预算核算、材料优化与合规风险自查',
    color: '#7C3AED',
    softBackground: '#F5F3FF'
  },
  logistics: {
    title: '后勤管理智能体',
    toolName: 'campus_logistics.dispatch',
    summary: '完成报修接单、工单分派、资产记录与能耗异常分析',
    color: '#0F766E',
    softBackground: '#F0FDFA'
  },
  meeting: {
    title: '会议管理智能体',
    toolName: 'campus_meeting.coordinate',
    summary: '完成会议预约、通知、纪要、资料归集与会后待办闭环',
    color: '#2563EB',
    softBackground: '#EFF6FF'
  }
};

export type MockSkillInvocation = {
  id: string;
  skill: WorkspaceSkillKey;
  title: string;
  toolName: string;
  summary: string;
  status: 'queued' | 'running' | 'completed';
  durationMs: number;
};

export type MockSlide = {
  id: string;
  page: number;
  kicker: string;
  title: string;
  subtitle: string;
  bullets: string[];
  tone: 'red' | 'blue' | 'teal' | 'amber';
};

export type MockQuizQuestion = {
  id: string;
  stem: string;
  options: Array<{ id: string; label: string }>;
  answerId: string;
  explanation: string;
};

export type MockPracticeStep = {
  id: string;
  title: string;
  detail: string;
  duration: string;
};

export type MockPracticeRubric = {
  dimension: string;
  description: string;
  score: number;
};

export type MockCampusDomain = 'school-affairs' | 'procurement' | 'logistics' | 'meeting';

export type MockCampusMetric = {
  label: string;
  value: string;
  note: string;
  tone: 'red' | 'purple' | 'teal' | 'blue' | 'amber' | 'green';
};

export type MockCampusRecord = {
  category: string;
  title: string;
  detail: string;
  owner: string;
  status: '已完成' | '进行中' | '待补充' | '待确认';
};

export type MockCampusAction = {
  task: string;
  owner: string;
  due: string;
};

export type MockLessonTimelineItem = {
  time: string;
  stage: string;
  teacherActivity: string;
  studentActivity: string;
};

export type MockInteractiveModule = {
  id: string;
  title: string;
  interaction: string;
  feedback: string;
  duration: string;
};

export type MockVideoChapter = {
  id: string;
  time: string;
  title: string;
  visual: string;
  narration: string;
};

export type MockStandardItem = {
  code: string;
  ability: string;
  evidence: string;
  level: string;
};

type MockArtifactBase = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
};

export type MockSlidesArtifact = MockArtifactBase & {
  type: 'slides';
  slides: MockSlide[];
};

export type MockLessonArtifact = MockArtifactBase & {
  type: 'lesson';
  objectives: string[];
  keyPoints: string[];
  timeline: MockLessonTimelineItem[];
  blackboard: string[];
  assessments: string[];
};

export type MockInteractiveArtifact = MockArtifactBase & {
  type: 'interactive';
  launchMode: string;
  modules: MockInteractiveModule[];
};

export type MockVideoArtifact = MockArtifactBase & {
  type: 'video';
  duration: string;
  ratio: string;
  chapters: MockVideoChapter[];
  subtitleHighlights: string[];
};

export type MockStandardsArtifact = MockArtifactBase & {
  type: 'standards';
  standardName: string;
  coverage: number;
  items: MockStandardItem[];
};

export type MockQuizArtifact = MockArtifactBase & {
  type: 'quiz';
  questions: MockQuizQuestion[];
};

export type MockPracticeArtifact = MockArtifactBase & {
  type: 'practice';
  objective: string;
  equipment: string[];
  safetyNotes: string[];
  steps: MockPracticeStep[];
  rubrics: MockPracticeRubric[];
};

export type MockCampusArtifact = MockArtifactBase & {
  type: 'campus';
  domain: MockCampusDomain;
  domainLabel: string;
  overview: string;
  metrics: MockCampusMetric[];
  records: MockCampusRecord[];
  checklist: string[];
  nextActions: MockCampusAction[];
};

export type MockArtifact =
  | MockLessonArtifact
  | MockSlidesArtifact
  | MockInteractiveArtifact
  | MockVideoArtifact
  | MockQuizArtifact
  | MockPracticeArtifact
  | MockStandardsArtifact
  | MockCampusArtifact;

export type MockSkillRun = {
  id: string;
  prompt: string;
  topic: string;
  skills: WorkspaceSkillKey[];
  summary: string;
  invocations: MockSkillInvocation[];
  artifacts: MockArtifact[];
};

const keywordMap: Record<WorkspaceSkillKey, RegExp> = {
  lesson: /教案|备课|教学流程|板书|学案/iu,
  slides: /PPT|幻灯片/iu,
  interactive: /互动课件|H5|热点|拖拽|互动数据/iu,
  video: /视频课件|微课|分镜|旁白|字幕/iu,
  quiz: /测验|试题|诊断题|考试|题目/iu,
  practice: /实训|工单|操作|沙盘|交互/iu,
  standards: /技能标准|职业标准|标准对齐|岗位能力/iu,
  'school-affairs': /校务|教务|学生管理|师资|制度|通知公告|公文|办学资料/iu,
  procurement: /采购|设备申报|采购预算|采购台账|询价|招标|合规/iu,
  logistics: /后勤|宿舍|报修|安防|环境|能耗|资产台账|运维/iu,
  meeting: /会议|会场|议程|会议通知|会议纪要|会议待办|复盘/iu
};

export const normalizeSkillKeys = (values: readonly string[]): WorkspaceSkillKey[] => {
  const valid = new Set<string>(WORKSPACE_SKILL_KEYS);
  const result: WorkspaceSkillKey[] = [];
  values.forEach((value) => {
    if (valid.has(value) && !result.includes(value as WorkspaceSkillKey)) {
      result.push(value as WorkspaceSkillKey);
    }
  });
  return result;
};

export const inferWorkspaceSkills = (prompt: string): WorkspaceSkillKey[] =>
  WORKSPACE_SKILL_KEYS.filter((skill) => keywordMap[skill].test(prompt));

const stableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
};

const resolveTopic = (prompt: string) => {
  if (/采购|设备申报|采购预算|采购台账/iu.test(prompt)) return '实训设备采购合规办理';
  if (/后勤|宿舍|报修|安防|能耗|资产台账/iu.test(prompt)) return '校园后勤运行管理';
  if (/会议|会场|议程|纪要|会议待办/iu.test(prompt)) return '教学工作例会协同';
  if (/校务|教务|师资|制度|通知公告|公文|办学资料/iu.test(prompt)) return '秋季学期校务综合办理';
  if (/BMS|动力电池/iu.test(prompt)) return '动力电池 BMS 安全保护';
  if (/PLC|联锁/iu.test(prompt)) return 'PLC 安全联锁控制';
  if (/TCP|工具坐标系|机器人/iu.test(prompt)) return '工业机器人 TCP 标定';
  const compact = prompt.replace(/\s+/gu, ' ').trim();
  return compact.length > 22 ? `${compact.slice(0, 22)}…` : compact || '专业课程教学设计';
};

const createLesson = (id: string, topic: string): MockLessonArtifact => ({
  id: `${id}-lesson`,
  type: 'lesson',
  title: `《${topic}》45 分钟结构化教案`,
  description: '包含教学目标、重难点、课堂时间轴、板书设计和教学评价。',
  updatedAt: '刚刚生成',
  objectives: [
    '知识目标：解释 TCP 与工具坐标系的作用及六点法原理。',
    '技能目标：能够按规范完成六姿态采样与结果验证。',
    '素养目标：形成安全操作、数据记录和质量复盘意识。'
  ],
  keyPoints: ['六点法姿态采样逻辑', '工具中心点误差验证', '急停与安全站位规范'],
  timeline: [
    {
      time: '0–5 分钟',
      stage: '岗位情境导入',
      teacherActivity: '展示焊枪轨迹偏移案例，提出“为何轨迹整体偏移”的问题。',
      studentActivity: '观察案例并标注可能的误差来源。'
    },
    {
      time: '5–15 分钟',
      stage: '原理探究',
      teacherActivity: '结合坐标变换示意解释 TCP 与法兰坐标系关系。',
      studentActivity: '完成关键概念配对和六点法顺序预测。'
    },
    {
      time: '15–32 分钟',
      stage: '示范与实操',
      teacherActivity: '分步演示六姿态采样，巡回提示安全与误差控制。',
      studentActivity: '小组完成采样、记录误差并互检。'
    },
    {
      time: '32–41 分钟',
      stage: '验证与诊断',
      teacherActivity: '组织圆弧轨迹验证，展示常见失败案例。',
      studentActivity: '测量偏差、判断原因并提出修正方案。'
    },
    {
      time: '41–45 分钟',
      stage: '总结评价',
      teacherActivity: '回扣岗位标准，发布随堂诊断与课后任务。',
      studentActivity: '提交操作证据和一分钟反思。'
    }
  ],
  blackboard: [
    '任务：TCP 标定',
    '原理：同点多姿态',
    '流程：检查→采样→计算→验证',
    '标准：误差 ≤ 0.5 mm'
  ],
  assessments: ['过程操作规范 40%', '标定结果精度 30%', '记录与分析 20%', '职业素养 10%']
});

const createInteractive = (id: string, topic: string): MockInteractiveArtifact => ({
  id: `${id}-interactive`,
  type: 'interactive',
  title: `《${topic}》H5 互动课件`,
  description: '4 个互动模块，支持热点探索、拖拽排序、参数判断和即时反馈。',
  updatedAt: '刚刚生成',
  launchMode: '课堂大屏 + 学生移动端同步',
  modules: [
    {
      id: 'interactive-1',
      title: '设备热点探索',
      interaction: '点击机器人、法兰、工具和标定尖点热点查看名称与作用。',
      feedback: '找到全部 4 个热点后解锁下一关。',
      duration: '3 分钟'
    },
    {
      id: 'interactive-2',
      title: '六点法步骤排序',
      interaction: '拖拽“安全检查—姿态采样—计算写入—轨迹验证”到正确顺序。',
      feedback: '错位步骤自动高亮，并提示前置条件。',
      duration: '4 分钟'
    },
    {
      id: 'interactive-3',
      title: '误差诊断挑战',
      interaction: '根据三组轨迹偏差数据选择最可能的误差原因。',
      feedback: '即时显示判断依据和修正建议。',
      duration: '5 分钟'
    },
    {
      id: 'interactive-4',
      title: '安全红线快问快答',
      interaction: '在 20 秒内判断示教速度、人员站位与急停操作是否合规。',
      feedback: '班级正确率实时投屏，低于 80% 自动复讲。',
      duration: '3 分钟'
    }
  ]
});

const createVideo = (id: string, topic: string): MockVideoArtifact => ({
  id: `${id}-video`,
  type: 'video',
  title: `《${topic}》5 分钟微课视频`,
  description: '包含成片 Mock、4 段分镜、教师旁白和重点字幕。',
  updatedAt: '刚刚生成',
  duration: '05:20',
  ratio: '16:9 · 1080P',
  chapters: [
    {
      id: 'video-1',
      time: '00:00–00:35',
      title: '问题导入',
      visual: '焊接机器人轨迹整体偏移的企业案例对比画面。',
      narration: '同一套程序为什么换一把焊枪就出现轨迹偏差？答案藏在 TCP 标定中。'
    },
    {
      id: 'video-2',
      time: '00:35–02:00',
      title: '原理动画',
      visual: '法兰坐标系、工具坐标系和 TCP 三维动画逐层叠加。',
      narration: 'TCP 是工具真正参与作业的中心点，标定用于求出它相对法兰的位置与姿态。'
    },
    {
      id: 'video-3',
      time: '02:00–04:25',
      title: '六点法实操',
      visual: '示教器录屏与机器人六种姿态实拍左右分屏。',
      narration: '保持工具中心点指向同一基准点，改变姿态并依次记录六组数据。'
    },
    {
      id: 'video-4',
      time: '04:25–05:20',
      title: '验证与总结',
      visual: '圆弧轨迹验证、误差数据卡和安全检查清单。',
      narration: '用已知轨迹验证精度，并把误差、原因和修正结果记录进实训工单。'
    }
  ],
  subtitleHighlights: ['同一点，多姿态', '示教速度 ≤ 250 mm/s', '验证误差 ≤ 0.5 mm']
});

const createStandards = (id: string, topic: string): MockStandardsArtifact => ({
  id: `${id}-standards`,
  type: 'standards',
  title: `《${topic}》技能标准对齐表`,
  description: '对齐职业技能等级标准，展示能力点、达成证据、评价等级与覆盖率。',
  updatedAt: '刚刚生成',
  standardName: '工业机器人系统操作员国家职业技能标准（三级）',
  coverage: 92,
  items: [
    {
      code: '3.2.1',
      ability: '机器人坐标系设置与调用',
      evidence: '正确新建工具号并完成参数初始化记录',
      level: '掌握'
    },
    {
      code: '3.2.2',
      ability: '工具中心点标定',
      evidence: '完成六姿态采样且系统计算无异常提示',
      level: '熟练'
    },
    {
      code: '3.2.3',
      ability: '轨迹精度验证与误差处理',
      evidence: '圆弧轨迹验证误差不超过 0.5 mm',
      level: '熟练'
    },
    {
      code: '1.1.2',
      ability: '作业安全与异常处置',
      evidence: '急停、安全门、使能开关检查及异常停机记录',
      level: '掌握'
    }
  ]
});

const createSlides = (id: string, topic: string): MockSlidesArtifact => ({
  id: `${id}-slides`,
  type: 'slides',
  title: `《${topic}》课堂演示课件`,
  description: '6 页精品教学幻灯片，覆盖导入、原理、流程、安全与总结。',
  updatedAt: '刚刚生成',
  slides: [
    {
      id: 'slide-1',
      page: 1,
      kicker: '智能制造专业 · 项目化教学',
      title: topic,
      subtitle: '从岗位任务出发，完成“认知—示范—实操—评价”教学闭环',
      bullets: ['45 分钟课堂', '理实一体化', '岗位标准对齐'],
      tone: 'red'
    },
    {
      id: 'slide-2',
      page: 2,
      kicker: '01 · 学习目标',
      title: '本节课要达成什么？',
      subtitle: '将知识、技能与职业素养落到可观察的学习行为。',
      bullets: ['说出核心原理与关键参数', '独立完成标准操作流程', '识别风险并执行安全规范'],
      tone: 'blue'
    },
    {
      id: 'slide-3',
      page: 3,
      kicker: '02 · 核心原理',
      title: '坐标变换决定运动精度',
      subtitle: '通过基准点采样建立工具中心点与末端法兰之间的空间关系。',
      bullets: ['位置偏差影响轨迹精度', '姿态偏差影响工艺一致性', '多点采样降低偶然误差'],
      tone: 'teal'
    },
    {
      id: 'slide-4',
      page: 4,
      kicker: '03 · 操作流程',
      title: '六点法标定：四步完成',
      subtitle: '固定尖点—多姿态采样—系统计算—结果验证。',
      bullets: [
        '选择工具坐标系并清零旧数据',
        '保持 TCP 位置不变切换六种姿态',
        '保存计算结果并执行圆弧验证'
      ],
      tone: 'red'
    },
    {
      id: 'slide-5',
      page: 5,
      kicker: '04 · 安全规范',
      title: '先确认安全，再启动设备',
      subtitle: '示教速度、人员站位和急停确认是不可省略的操作前提。',
      bullets: [
        '示教速度不超过 250 mm/s',
        '进入工作区前确认急停有效',
        '异常振动或轨迹突变立即停机'
      ],
      tone: 'amber'
    },
    {
      id: 'slide-6',
      page: 6,
      kicker: '05 · 课堂总结',
      title: '用数据证明标定结果',
      subtitle: '完成操作只是起点，能够验证、解释并优化误差才是岗位能力。',
      bullets: ['复述六点法的操作逻辑', '记录并分析位置误差', '提交实训工单与反思'],
      tone: 'blue'
    }
  ]
});

const createQuiz = (id: string, topic: string): MockQuizArtifact => ({
  id: `${id}-quiz`,
  type: 'quiz',
  title: `《${topic}》随堂诊断测验`,
  description: '4 道单选题，支持即时评分和答案解析。',
  updatedAt: '刚刚生成',
  questions: [
    {
      id: 'quiz-1',
      stem: 'TCP 标定的直接目的是什么？',
      options: [
        { id: 'a', label: '提高控制柜运算速度' },
        { id: 'b', label: '确定工具中心点相对法兰的位置与姿态' },
        { id: 'c', label: '修改机器人额定负载' },
        { id: 'd', label: '降低示教器屏幕亮度' }
      ],
      answerId: 'b',
      explanation: 'TCP 标定用于建立工具坐标系与机器人末端法兰之间的空间变换关系。'
    },
    {
      id: 'quiz-2',
      stem: '六点法采样时应保持哪一项不变？',
      options: [
        { id: 'a', label: '机器人各轴角度' },
        { id: 'b', label: '工具姿态' },
        { id: 'c', label: '工具中心点的空间位置' },
        { id: 'd', label: '示教速度' }
      ],
      answerId: 'c',
      explanation: '通过不同姿态指向同一固定尖点，系统才能反算 TCP 的准确位置。'
    },
    {
      id: 'quiz-3',
      stem: '进入机器人工作区前，最先应完成哪项确认？',
      options: [
        { id: 'a', label: '急停与安全门联锁有效' },
        { id: 'b', label: '课件已经投屏' },
        { id: 'c', label: '关闭所有报警记录' },
        { id: 'd', label: '提升运行速度' }
      ],
      answerId: 'a',
      explanation: '人员安全优先，急停与安全联锁必须在进入设备工作区前确认。'
    },
    {
      id: 'quiz-4',
      stem: '标定完成后最有效的验证方式是什么？',
      options: [
        { id: 'a', label: '观察示教器颜色' },
        { id: 'b', label: '重启控制柜' },
        { id: 'c', label: '更换工具编号' },
        { id: 'd', label: '执行已知轨迹并测量位置误差' }
      ],
      answerId: 'd',
      explanation: '应通过已知轨迹验证 TCP 的运动精度，并记录可量化误差。'
    }
  ]
});

const createPractice = (id: string, topic: string): MockPracticeArtifact => ({
  id: `${id}-practice`,
  type: 'practice',
  title: `《${topic}》实训工单`,
  description: '包含任务说明、6 个操作步骤、安全规范与过程评价表。',
  updatedAt: '刚刚生成',
  objective: `在规定时间内完成${topic}，执行标准操作流程并将重复定位误差控制在 0.5 mm 内。`,
  equipment: ['六轴工业机器人工作站', '标准标定尖点', '示教器', '游标卡尺', '个人防护用品'],
  safetyNotes: [
    '进入工作区前确认急停、安全门和使能开关有效。',
    '示教模式下速度不得超过 250 mm/s，操作者始终保持安全站位。',
    '出现异响、抖动或轨迹突变时立即松开使能并按下急停。'
  ],
  steps: [
    {
      id: 'step-1',
      title: '工位安全检查',
      detail: '确认急停、安全门、工具紧固状态与作业半径。',
      duration: '3 分钟'
    },
    {
      id: 'step-2',
      title: '选择工具坐标系',
      detail: '新建工具编号，清除旧标定值并记录初始状态。',
      duration: '3 分钟'
    },
    {
      id: 'step-3',
      title: '固定标定尖点',
      detail: '选择机器人可达且姿态变化空间充足的固定基准点。',
      duration: '4 分钟'
    },
    {
      id: 'step-4',
      title: '完成六姿态采样',
      detail: '保持 TCP 指向同一点，依次保存六组差异明显的姿态。',
      duration: '12 分钟'
    },
    {
      id: 'step-5',
      title: '计算并写入结果',
      detail: '检查系统计算的误差提示，确认后写入当前工具。',
      duration: '4 分钟'
    },
    {
      id: 'step-6',
      title: '轨迹验证与复盘',
      detail: '运行圆弧轨迹，测量偏差并完成工单记录。',
      duration: '8 分钟'
    }
  ],
  rubrics: [
    { dimension: '安全规范', description: '防护、急停确认与操作站位符合规范', score: 20 },
    { dimension: '流程执行', description: '独立完成六点法全部步骤且顺序正确', score: 35 },
    { dimension: '结果精度', description: '轨迹验证误差不超过 0.5 mm', score: 30 },
    { dimension: '记录复盘', description: '数据记录完整并能解释误差来源', score: 15 }
  ]
});

const createCampusArtifact = (
  id: string,
  topic: string,
  domain: MockCampusDomain
): MockCampusArtifact => {
  const shared = {
    id: `${id}-${domain}`,
    type: 'campus' as const,
    domain,
    updatedAt: '刚刚生成'
  };

  if (domain === 'school-affairs') {
    return {
      ...shared,
      domainLabel: '校务管理',
      title: `《${topic}》智能办理看板`,
      description: '汇总校务待办、制度依据、通知草稿与办学资料归集进度。',
      overview:
        '已对教务、学生、师资和行政事项进行去重归类，形成“制度依据—办理流程—责任人—归档证据”闭环。',
      metrics: [
        { label: '校务待办', value: '12', note: '3 项今日到期', tone: 'red' },
        { label: '制度命中', value: '8', note: '已标注条款依据', tone: 'blue' },
        { label: '待发通知', value: '3', note: '2 项等待复核', tone: 'amber' },
        { label: '归集资料', value: '26', note: '完整率 92%', tone: 'green' }
      ],
      records: [
        {
          category: '教务管理',
          title: '新学期课务核对',
          detail: '发现 2 个教学班场地冲突，已生成调课建议。',
          owner: '教务处·李老师',
          status: '进行中'
        },
        {
          category: '学生管理',
          title: '新生报到数据汇总',
          detail: '已核对 486 名学生，12 人待补充家长联系信息。',
          owner: '学工处·王老师',
          status: '待补充'
        },
        {
          category: '师资管理',
          title: '企业兼职教师资料审核',
          detail: '8 份资格证明与聘用材料已完成一致性校验。',
          owner: '人事处·周老师',
          status: '已完成'
        },
        {
          category: '制度公文',
          title: '开学工作通知草拟',
          detail: '已根据校历、安全制度与部门清单形成可编辑初稿。',
          owner: '党政办·陈老师',
          status: '待确认'
        }
      ],
      checklist: [
        '通知发布前复核校历日期与对外表述。',
        '学生隐私字段仅对授权部门展示。',
        '兼职教师材料需保留审核人与审核时间。',
        '办学资料按年度、部门、业务类型三级索引归档。'
      ],
      nextActions: [
        { task: '完成课务冲突调整确认', owner: '教务处', due: '今天 16:00' },
        { task: '补齐新生缺失信息', owner: '各班班主任', due: '9月11日' },
        { task: '审定并发布开学工作通知', owner: '党政办', due: '9月12日' }
      ]
    };
  }

  if (domain === 'procurement') {
    return {
      ...shared,
      domainLabel: '采购管理',
      title: `《${topic}》合规自查报告`,
      description: '覆盖需求申报、预算核算、审批流程、采购执行与验收归档。',
      overview:
        '拟采购的新能源汽车实训设备预算与专业建设目标基本匹配，当前需补齐技术论证和比价依据。',
      metrics: [
        { label: '申报预算', value: '¥28.6万', note: '校内预算已占用', tone: 'purple' },
        { label: '流程节点', value: '6 / 8', note: '待技术与财务复核', tone: 'blue' },
        { label: '合规风险', value: '2', note: '1 项中风险', tone: 'red' },
        { label: '归档材料', value: '7 / 9', note: '缺比价与论证表', tone: 'amber' }
      ],
      records: [
        {
          category: '需求申报',
          title: '实训室建设必要性',
          detail: '已关联专业人才培养方案和 2026 年设备更新计划。',
          owner: '汽车工程系',
          status: '已完成'
        },
        {
          category: '技术论证',
          title: '核心参数与兼容性评审',
          detail: '需补充接口兼容、安全认证与三年运维成本对比。',
          owner: '项目论证组',
          status: '待补充'
        },
        {
          category: '询价比价',
          title: '供应商报价可比性',
          detail: '3 家报价中有 1 家未分项列明安装培训费用。',
          owner: '采购办',
          status: '待确认'
        },
        {
          category: '验收归档',
          title: '验收指标与资产入账',
          detail: '已生成性能验收、培训交付和资产登记清单。',
          owner: '资产管理员',
          status: '进行中'
        }
      ],
      checklist: [
        '采购需求、预算项目和审批事由保持一致。',
        '技术参数不得指向特定品牌或型号。',
        '询价资料需保留原始报价、比较口径与决策依据。',
        '合同、验收、发票与资产卡片形成完整归档链。'
      ],
      nextActions: [
        { task: '补充技术论证与全周期成本表', owner: '项目论证组', due: '9月11日' },
        { task: '统一三家供应商分项报价口径', owner: '采购办', due: '9月12日' },
        { task: '提交财务复核与会签', owner: '财务处', due: '9月13日' }
      ]
    };
  }

  if (domain === 'logistics') {
    return {
      ...shared,
      domainLabel: '后勤管理',
      title: `《${topic}》智能运维看板`,
      description: '集中展示报修派单、安防环境巡检、资产变动与能耗分析。',
      overview:
        '本周共接收 18 张后勤工单，已根据紧急程度、区域和班组负载自动分派。宿舍漏水已升级为优先事项。',
      metrics: [
        { label: '本周工单', value: '18', note: '已自动分派', tone: 'blue' },
        { label: '已办结', value: '14', note: '办结率 77.8%', tone: 'green' },
        { label: '平均响应', value: '12分钟', note: '较上周缩短 4 分钟', tone: 'teal' },
        { label: '能耗环比', value: '-6.8%', note: '1 处异常待核', tone: 'amber' }
      ],
      records: [
        {
          category: '宿舍报修',
          title: '3 号宿舍 412 管道渗水',
          detail: '已匹配水电组，需先关闭局部阀门并检查楼下墙面。',
          owner: '水电组·赵师傅',
          status: '进行中'
        },
        {
          category: '设备报修',
          title: '智能制造楼 206 空调异常',
          detail: '已完成过滤网清洁与温度传感器校准。',
          owner: '机电组·孙师傅',
          status: '已完成'
        },
        {
          category: '校园安防',
          title: '南门 2 号摄像头离线',
          detail: '交换机端口状态正常，待现场检查供电模块。',
          owner: '安防组·吴师傅',
          status: '待确认'
        },
        {
          category: '资产能耗',
          title: '新增设备入账与配电室异常',
          detail: '6 台训练终端已生成资产卡；2 号配电室夜间基础负荷偏高。',
          owner: '资产组 / 能源组',
          status: '待补充'
        }
      ],
      checklist: [
        '涉及水电和高处作业的工单必须先完成安全交底。',
        '工单转派、暂停与办结需记录原因和时间。',
        '资产变动需同步保管人、存放地点与资产状态。',
        '能耗异常连续两天超阈值时自动生成巡检任务。'
      ],
      nextActions: [
        { task: '完成 3 号宿舍渗水修复并回访', owner: '水电组', due: '今天 15:30' },
        { task: '更换南门摄像头供电模块', owner: '安防组', due: '明天 10:00' },
        { task: '复核 2 号配电室夜间负荷', owner: '能源组', due: '今天 20:00' }
      ]
    };
  }

  return {
    ...shared,
    domainLabel: '会议管理',
    title: `《${topic}》全流程协同看板`,
    description: '覆盖会议预约、通知、议程、纪要、资料归集、待办与复盘。',
    overview:
      '已根据参会人忙闲、会场容量和设备需求完成时间与场地推荐，同步生成通知、议程草案和会后任务清单。',
    metrics: [
      { label: '拟邀请', value: '16人', note: '14 人时间可用', tone: 'blue' },
      { label: '议程项', value: '6', note: '预计 55 分钟', tone: 'purple' },
      { label: '会后待办', value: '5', note: '4 项已明确责任人', tone: 'amber' },
      { label: '归集资料', value: '8', note: '缺 1 份专业方案', tone: 'green' }
    ],
    records: [
      {
        category: '会议预约',
        title: '9月14日 14:00·第二会议室',
        detail: '可容纳 24 人，具备投屏、录音和远程参会设备。',
        owner: '党政办·张老师',
        status: '待确认'
      },
      {
        category: '会前通知',
        title: '教学工作例会通知',
        detail: '已生成通知草稿，包含时间、地点、议题、参会范围和材料要求。',
        owner: '会务秘书',
        status: '进行中'
      },
      {
        category: '纪要生成',
        title: '決策与议题结论提取',
        detail: '已预置“议题—讨论要点—决策—待办—责任人”纪要结构。',
        owner: '会议纪要助手',
        status: '已完成'
      },
      {
        category: '会后闭环',
        title: '任务追踪与资料归集',
        detail: '会议结束后将自动生成任务卡并按议题归集版本化材料。',
        owner: '会务秘书',
        status: '待确认'
      }
    ],
    checklist: [
      '会议邀请中明确议题、决策目标和会前阅读材料。',
      '会场容量、无障碍、投屏与远程设备符合参会要求。',
      '纪要发布前由主持人复核决策表述和责任人。',
      '会后待办必须具备责任人、截止时间和验收标准。'
    ],
    nextActions: [
      { task: '确认会场与主要参会人时间', owner: '党政办', due: '今天 17:00' },
      { task: '补齐课程建设方案并随通知发送', owner: '教务处', due: '9月11日' },
      { task: '会后 2 小时内完成纪要复核', owner: '会议主持人', due: '会后 2 小时' }
    ]
  };
};

export const createMockSkillRun = (
  prompt: string,
  requestedSkills: readonly string[],
  mode: WorkspaceModeKey | null = 'plan'
): MockSkillRun => {
  const explicitSkills = normalizeSkillKeys(requestedSkills);
  const inferredSkills = explicitSkills.length > 0 ? explicitSkills : inferWorkspaceSkills(prompt);
  const skills: WorkspaceSkillKey[] = [inferredSkills[0] ?? DEFAULT_WORKSPACE_SKILL];
  const topic = resolveTopic(prompt);
  const id = `run-${stableHash(`${prompt}|${skills.join(',')}|${mode ?? 'auto'}`)}`;
  const invocations = skills.map((skill, index): MockSkillInvocation => {
    const meta = WORKSPACE_SKILL_META[skill];
    return {
      id: `${id}-${skill}`,
      skill,
      title: meta.title,
      toolName: meta.toolName,
      summary: meta.summary,
      status: 'completed',
      durationMs: 680 + index * 240
    };
  });

  const artifacts: MockArtifact[] = [];
  if (mode !== 'qa') {
    if (skills.includes('lesson')) artifacts.push(createLesson(id, topic));
    if (skills.includes('slides')) artifacts.push(createSlides(id, topic));
    if (skills.includes('interactive')) artifacts.push(createInteractive(id, topic));
    if (skills.includes('video')) artifacts.push(createVideo(id, topic));
    if (skills.includes('quiz')) artifacts.push(createQuiz(id, topic));
    if (skills.includes('practice')) artifacts.push(createPractice(id, topic));
    if (skills.includes('standards')) artifacts.push(createStandards(id, topic));
    if (skills.includes('school-affairs'))
      artifacts.push(createCampusArtifact(id, topic, 'school-affairs'));
    if (skills.includes('procurement'))
      artifacts.push(createCampusArtifact(id, topic, 'procurement'));
    if (skills.includes('logistics')) artifacts.push(createCampusArtifact(id, topic, 'logistics'));
    if (skills.includes('meeting')) artifacts.push(createCampusArtifact(id, topic, 'meeting'));
  }

  const isCampusSkill = ['school-affairs', 'procurement', 'logistics', 'meeting'].includes(
    skills[0]
  );

  return {
    id,
    prompt,
    topic,
    skills,
    summary:
      mode === 'qa'
        ? `已调用「${WORKSPACE_SKILL_META[skills[0]].title}」回答“${topic}”相关问题，本轮仅提供问答结论，不生成扩展产物。`
        : `已围绕“${topic}”完成「${WORKSPACE_SKILL_META[skills[0]].title}」技能调用，生成内容已按${isCampusSkill ? '校园事务办理闭环' : '课堂实施顺序'}整理。`,
    invocations,
    artifacts
  };
};
