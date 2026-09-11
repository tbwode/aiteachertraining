export type WorkspaceToolKey =
  | 'outline'
  | 'lesson'
  | 'practice'
  | 'graph'
  | 'school-affairs'
  | 'procurement'
  | 'logistics'
  | 'meeting';

export type WorkspaceSkillKey =
  | 'lesson'
  | 'slides'
  | 'interactive'
  | 'video'
  | 'quiz'
  | 'practice'
  | 'standards'
  | 'school-affairs'
  | 'procurement'
  | 'logistics'
  | 'meeting';

export type WorkspaceModeKey = 'plan' | 'qa';

export type WorkspaceExpertKey =
  | 'vocational'
  | 'industry'
  | 'assessment'
  | 'courseware'
  | 'school-governance'
  | 'procurement-compliance'
  | 'campus-operations'
  | 'meeting-coordination';

export type WorkspaceTool = {
  key: WorkspaceToolKey;
  title: string;
  description: string;
  color: string;
  background: string;
  prompt: string;
  skill: WorkspaceSkillKey;
};

export type WorkspaceScene = 'work-order' | 'daily' | 'campus';

export type WorkspaceSkillOption = {
  key: WorkspaceSkillKey;
  label: string;
  description: string;
  scene: WorkspaceScene;
  prompt: string;
};

export const DEFAULT_WORKSPACE_SKILL: WorkspaceSkillKey = 'lesson';

export const WORKSPACE_SKILLS: WorkspaceSkillOption[] = [
  {
    key: 'lesson',
    label: '教案生成',
    description: '教学目标、课堂流程与板书设计',
    scene: 'daily',
    prompt:
      '围绕工业机器人 TCP 标定生成一份 45 分钟结构化教案，包含学情分析、三维教学目标、教学重难点、课堂活动时间轴、板书设计与课后评价。'
  },
  {
    key: 'slides',
    label: 'PPT 制作',
    description: '生成可预览的课堂演示课件',
    scene: 'daily',
    prompt:
      '围绕工业机器人 TCP 标定制作一套课堂 PPT，包含情境导入、核心原理、六点法流程、安全规范、课堂练习与总结页，并突出关键步骤的可视化表达。'
  },
  {
    key: 'interactive',
    label: '互动课件',
    description: '热点探索、步骤演示与即时反馈',
    scene: 'daily',
    prompt:
      '围绕工业机器人 TCP 标定生成一份 H5 互动课件，包含设备热点探索、六点法拖拽排序、误差判断和即时反馈，可用于课堂大屏互动。'
  },
  {
    key: 'video',
    label: '视频课件',
    description: '微课脚本、分镜、旁白与字幕',
    scene: 'daily',
    prompt:
      '围绕工业机器人 TCP 标定生成一套 5 分钟视频课件方案，包含封面、分镜时间轴、画面说明、教师旁白、重点字幕和片尾练习。'
  },
  {
    key: 'quiz',
    label: '随堂诊断与测验',
    description: '诊断题、参考答案与逐题解析',
    scene: 'daily',
    prompt:
      '围绕工业机器人 TCP 标定生成一套随堂诊断与测验，覆盖原理理解、操作顺序、安全规范和误差分析，并提供答案与逐题解析。'
  },
  {
    key: 'practice',
    label: '互动实训设计',
    description: '实训工单、安全规范与评价量规',
    scene: 'work-order',
    prompt:
      '围绕工业机器人 TCP 标定设计一份互动实训工单，包含工位安全检查、六点法操作步骤、过程记录、异常处置、完成进度与评价量规。'
  },
  {
    key: 'standards',
    label: '技能标准对齐',
    description: '岗位能力、标准条款与达成证据',
    scene: 'work-order',
    prompt:
      '解析工业机器人 TCP 标定实训任务并对齐国家职业技能标准，输出标准编码、岗位能力点、操作证据、评价等级和标准覆盖率。'
  },
  {
    key: 'school-affairs',
    label: '校务管理智能体',
    description: '教务、学生、师资、制度、公文与办学数据',
    scene: 'campus',
    prompt:
      '梳理 2026 年秋季学期开学前校务工作：汇总教务、学生与师资待办，解读相关制度，生成通知公告草稿和办理流程，并形成校务数据统计与办学资料归集清单。'
  },
  {
    key: 'procurement',
    label: '采购管理智能体',
    description: '采购政策、申报审批、预算核算与合规自查',
    scene: 'campus',
    prompt:
      '审查新能源汽车实训设备采购申请：核对采购政策与审批流程，辅助核算预算，优化申报材料，整理采购台账，并输出合规风险与资料归档清单。'
  },
  {
    key: 'logistics',
    label: '后勤管理智能体',
    description: '宿舍、报修、安防、资产与能耗精细化运维',
    scene: 'campus',
    prompt:
      '分析本周校园后勤运行情况：汇总宿舍与实训楼报修，智能分派工单，梳理安防和环境问题，记录资产变动，并生成能耗趋势与异常处置建议。'
  },
  {
    key: 'meeting',
    label: '会议管理智能体',
    description: '预约、通知、纪要、资料、待办与复盘全流程',
    scene: 'campus',
    prompt:
      '组织下周教学工作例会：推荐会议时间与会场，生成会议通知和议程，模拟形成会议纪要，归集会议资料，提取责任人、截止时间与会后复盘要点。'
  }
];

export const WORKSPACE_SCENE_SKILLS: Record<WorkspaceScene, WorkspaceSkillKey[]> = {
  daily: ['lesson', 'slides', 'interactive', 'video', 'quiz'],
  'work-order': ['practice', 'standards'],
  campus: ['school-affairs', 'procurement', 'logistics', 'meeting']
};

export const WORKSPACE_SCENE_META: Record<
  WorkspaceScene,
  {
    label: string;
    skillMenuLabel: string;
    assistantTitle: string;
    assistantDescription: string;
    inputPlaceholder: string;
  }
> = {
  daily: {
    label: '日程备课',
    skillMenuLabel: '日程备课技能',
    assistantTitle: '备课智能体',
    assistantDescription: '单技能专注 · 教学标准知识库 v4.2',
    inputPlaceholder: '继续描述课程主题、教学目标或需要生成的产物……'
  },
  'work-order': {
    label: '实训工单',
    skillMenuLabel: '实训工单技能',
    assistantTitle: '实训智能体',
    assistantDescription: '单技能专注 · 岗位标准与安全规范库',
    inputPlaceholder: '继续描述实训任务、设备条件或评价要求……'
  },
  campus: {
    label: '校园管理',
    skillMenuLabel: '校园管理技能',
    assistantTitle: '校园管理智能体',
    assistantDescription: '单技能专注 · 校务制度与校园运行知识库',
    inputPlaceholder: '继续描述校务、采购、后勤或会议管理需求……'
  }
};

export const getWorkspaceSkill = (skill: WorkspaceSkillKey) =>
  WORKSPACE_SKILLS.find((item) => item.key === skill);

export const getWorkspaceSkillPrompt = (skill: WorkspaceSkillKey) =>
  getWorkspaceSkill(skill)?.prompt ?? DEFAULT_PREP_PROMPT;

export const getWorkspaceSkillScene = (skill: WorkspaceSkillKey): WorkspaceScene =>
  getWorkspaceSkill(skill)?.scene ?? 'daily';

export const getWorkspaceSkillsForScene = (scene: WorkspaceScene) => {
  const allowed = new Set(WORKSPACE_SCENE_SKILLS[scene]);
  return WORKSPACE_SKILLS.filter((item) => allowed.has(item.key));
};

export const getWorkspaceSceneMeta = (scene: WorkspaceScene) => WORKSPACE_SCENE_META[scene];

export const WORKSPACE_MODES: Array<{
  key: WorkspaceModeKey;
  label: string;
  description: string;
}> = [
  { key: 'plan', label: '计划', description: '先规划步骤，再生成完整结果' },
  { key: 'qa', label: '仅问答', description: '直接回答问题，不扩展任务流程' }
];

export type WorkspaceExpertOption = {
  key: WorkspaceExpertKey;
  label: string;
  description: string;
};

export const WORKSPACE_EXPERTS: WorkspaceExpertOption[] = [
  { key: 'vocational', label: '职教课程专家', description: '课程标准与教学设计' },
  { key: 'industry', label: '行业实践专家', description: '岗位流程与企业 SOP' },
  { key: 'assessment', label: '教学评价专家', description: '测验、量规与学习诊断' },
  { key: 'courseware', label: '课件视觉专家', description: '课件结构与视觉表达' },
  { key: 'school-governance', label: '校务治理专家', description: '制度、公文与行政流程' },
  {
    key: 'procurement-compliance',
    label: '采购合规专家',
    description: '采购政策、预算与风险控制'
  },
  {
    key: 'campus-operations',
    label: '校园运维专家',
    description: '后勤工单、资产与能耗管理'
  },
  {
    key: 'meeting-coordination',
    label: '会议协同专家',
    description: '会务组织、纪要与任务闭环'
  }
];

const WORKSPACE_SCENE_EXPERTS: Record<WorkspaceScene, WorkspaceExpertKey[]> = {
  daily: ['vocational', 'assessment', 'courseware', 'industry'],
  'work-order': ['industry', 'vocational', 'assessment'],
  campus: [
    'school-governance',
    'procurement-compliance',
    'campus-operations',
    'meeting-coordination'
  ]
};

export const getWorkspaceExpertsForScene = (scene: WorkspaceScene) => {
  const allowed = new Set(WORKSPACE_SCENE_EXPERTS[scene]);
  return WORKSPACE_EXPERTS.filter((item) => allowed.has(item.key));
};

export type WorkspaceChatContext = {
  skill?: WorkspaceSkillKey | null;
  mode?: WorkspaceModeKey | null;
  expert?: WorkspaceExpertKey | null;
  scene?: WorkspaceScene | null;
};

export const DEFAULT_PREP_PROMPT =
  '研究近十年工业机器人工具坐标系 TCP 标定教学重难点与典型行业 SOP，并基于国家职业技能等级标准自动生成包含结构化教案、16 页精美 PPT 课件、示教器急停 H5 交互沙箱及随堂诊断题的完整 45 分钟课包。';

export const WORKSPACE_TOOLS: WorkspaceTool[] = [
  {
    key: 'outline',
    title: '课纲智能解析',
    description: '对齐国标 SOP 规范',
    color: '#D97706',
    background: '#FFFBEB',
    prompt: '解析课程标准与教材目录，提取教学目标、重点难点，并对齐国家职业技能等级标准。',
    skill: 'standards'
  },
  {
    key: 'lesson',
    title: '教案自动编写',
    description: '结构化板书与学案',
    color: '#2563EB',
    background: '#EFF6FF',
    prompt: '生成一份 45 分钟结构化教案，包含教学目标、教学过程、板书设计与学生学习任务单。',
    skill: 'lesson'
  },
  {
    key: 'practice',
    title: '课堂实训互动',
    description: '沙盘推演与分组提问',
    color: '#4F46E5',
    background: '#EEF2FF',
    prompt: '围绕本节课设计课堂实训工单、分组协作任务、关键操作风险点与即时提问。',
    skill: 'practice'
  },
  {
    key: 'graph',
    title: '专业图谱乐享',
    description: '企业案例库同步',
    color: '#059669',
    background: '#ECFDF5',
    prompt: '把课程知识点映射到岗位能力图谱，并补充真实企业案例、典型工作任务和评价标准。',
    skill: 'interactive'
  }
];

export const CAMPUS_WORKSPACE_TOOLS: WorkspaceTool[] = [
  {
    key: 'school-affairs',
    title: '校务管理智能体',
    description: '制度解读与事务办理',
    color: '#C83E3E',
    background: '#FEF2F2',
    prompt: getWorkspaceSkillPrompt('school-affairs'),
    skill: 'school-affairs'
  },
  {
    key: 'procurement',
    title: '采购管理智能体',
    description: '预算核算与合规自查',
    color: '#7C3AED',
    background: '#F5F3FF',
    prompt: getWorkspaceSkillPrompt('procurement'),
    skill: 'procurement'
  },
  {
    key: 'logistics',
    title: '后勤管理智能体',
    description: '报修工单与精细运维',
    color: '#0F766E',
    background: '#F0FDFA',
    prompt: getWorkspaceSkillPrompt('logistics'),
    skill: 'logistics'
  },
  {
    key: 'meeting',
    title: '会议管理智能体',
    description: '会前会中会后全流程',
    color: '#2563EB',
    background: '#EFF6FF',
    prompt: getWorkspaceSkillPrompt('meeting'),
    skill: 'meeting'
  }
];

export const getWorkspaceToolsForScene = (scene: WorkspaceScene) =>
  scene === 'campus' ? CAMPUS_WORKSPACE_TOOLS : WORKSPACE_TOOLS;

export const QUICK_TAGS: Array<{ icon: string; label: string; skill: WorkspaceSkillKey }> = [
  { icon: '📄', label: '文档处理', skill: 'lesson' },
  { icon: '📊', label: '技能标准对齐', skill: 'standards' },
  { icon: '🌐', label: '互动数据演示', skill: 'interactive' },
  { icon: '🎬', label: '视频微课', skill: 'video' },
  { icon: '📁', label: '课件工程管理', skill: 'lesson' },
  { icon: '🖥️', label: 'PPT 制作', skill: 'slides' },
  { icon: '🎨', label: '互动实训设计', skill: 'practice' },
  { icon: '✉️', label: '随堂诊断与试题', skill: 'quiz' }
];

export const CAMPUS_QUICK_TAGS: Array<{
  icon: string;
  label: string;
  skill: WorkspaceSkillKey;
}> = [
  { icon: '🏫', label: '校务事项梳理', skill: 'school-affairs' },
  { icon: '🧾', label: '采购合规自查', skill: 'procurement' },
  { icon: '🛠️', label: '后勤工单分派', skill: 'logistics' },
  { icon: '📅', label: '会议全流程协同', skill: 'meeting' }
];

export const getWorkspaceQuickTagsForScene = (scene: WorkspaceScene) =>
  scene === 'campus'
    ? CAMPUS_QUICK_TAGS
    : QUICK_TAGS.filter((item) => WORKSPACE_SCENE_SKILLS[scene].includes(item.skill));

export const createPrepChatUrl = (prompt: string, context: WorkspaceChatContext = {}) => {
  const text = prompt.trim();
  if (!text) return '/teacher/workspace/chat';

  const contextQuery = [
    context.skill ? `skill=${encodeURIComponent(context.skill)}` : '',
    context.mode ? `mode=${encodeURIComponent(context.mode)}` : '',
    context.expert ? `expert=${encodeURIComponent(context.expert)}` : '',
    context.scene ? `scene=${encodeURIComponent(context.scene)}` : ''
  ]
    .filter(Boolean)
    .join('&');
  return `/teacher/workspace/chat?text=${encodeURIComponent(text)}${contextQuery ? `&${contextQuery}` : ''}`;
};
