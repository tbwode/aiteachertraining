// 岗位能力图谱 · 原型 mock 类型
// 层级：岗位(图谱) → 任务 → 能力 → 知识点（仅知识点挂权重，同能力下非废弃兄弟之和 = 100）

export type Mastery = '了解' | '掌握' | '精通';
export type NodeStatus = 'active' | 'deprecated' | 'new';
export type GraphStatus = 'draft' | 'published';
export type VersionStatus = 'draft' | 'current' | 'archived';
export type DeprecationStatus = 'pending' | 'handled' | 'ignored';

export type AbilityKnowledge = {
  id: string;
  code: string;
  name: string;
  weight: number;
  mastery: Mastery;
  status: NodeStatus;
};

export type Ability = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: NodeStatus;
  knowledges: AbilityKnowledge[];
};

export type JobTask = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: NodeStatus;
  abilities: Ability[];
};

export type NodeCounts = { tasks: number; abilities: number; knowledges: number };

export type VersionDiff = { added: string[]; modified: string[]; deprecated: string[] };

export type AffectedCourse = { courseId: string; courseName: string; mappingCount: number };

export type Deprecation = {
  code: string;
  name: string;
  suggestion: string;
  affectedCourses: AffectedCourse[];
  status: DeprecationStatus;
};

export type GraphVersion = {
  version: string;
  status: VersionStatus;
  nodeCounts: NodeCounts;
  publishedAt?: string;
  changeSummary: string;
  diff: VersionDiff;
  deprecations: Deprecation[];
  snapshot: JobTask[];
};

export type AbilityGraph = {
  id: string;
  jobName: string;
  majorDirection: string;
  status: GraphStatus;
  currentVersion: string;
  tasks: JobTask[];
  versions: GraphVersion[];
  linkedCourses: AffectedCourse[];
  sourceDocs: { name: string; size: string }[];
  updatedAt: string;
};

export type Confidence = 'high' | 'mid' | 'low';

export type ParsedKnowledge = {
  code: string;
  name: string;
  weight: number;
  mastery: Mastery;
  confidence: Confidence;
  reason: string;
  excluded: boolean;
};

export type ParsedAbility = {
  code: string;
  name: string;
  description: string;
  confidence: Confidence;
  reason: string;
  excluded: boolean;
  knowledges: ParsedKnowledge[];
};

export type ParsedTask = {
  code: string;
  name: string;
  description: string;
  confidence: Confidence;
  reason: string;
  excluded: boolean;
  abilities: ParsedAbility[];
};

export type WeightIssue = { abilityCode: string; abilityName: string; sum: number };
