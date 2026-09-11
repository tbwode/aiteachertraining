// 岗位能力图谱 · 原型内存 store（刷新还原为种子数据）
// 所有 withX 变换为纯函数：graph in → graph out（不可变更新），组件负责 setGraph + saveGraph

import type {
  Ability,
  AbilityGraph,
  Deprecation,
  GraphVersion,
  JobTask,
  NodeCounts,
  ParsedTask,
  VersionDiff,
  WeightIssue
} from './types';
import { seedGraphs } from './data';

let graphs: AbilityGraph[] = seedGraphs();
let idSeq = 100;

export function listGraphs(): AbilityGraph[] {
  return graphs;
}

export function getGraph(id: string): AbilityGraph | null {
  return graphs.find((g) => g.id === id) ?? null;
}

export function saveGraph(next: AbilityGraph): void {
  graphs = graphs.map((g) => (g.id === next.id ? next : g));
}

export function registerGraph(g: AbilityGraph): void {
  graphs = [g, ...graphs];
}

export function resetStore(): void {
  graphs = seedGraphs();
  idSeq = 100;
}

export function newGraphId(): string {
  idSeq += 1;
  return `g${idSeq}`;
}

export function createDraftGraph(input: {
  jobName: string;
  majorDirection: string;
  sourceDocs: { name: string; size: string }[];
  buildTasks: (graphId: string) => JobTask[];
}): AbilityGraph {
  const id = newGraphId();
  const graph: AbilityGraph = {
    id,
    jobName: input.jobName,
    majorDirection: input.majorDirection,
    status: 'draft',
    currentVersion: '',
    tasks: input.buildTasks(id),
    versions: [],
    linkedCourses: [],
    sourceDocs: input.sourceDocs,
    updatedAt: now()
  };
  registerGraph(graph);
  return graph;
}

// ---------- 内部工具 ----------

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function touch(g: AbilityGraph): void {
  g.updatedAt = now();
}

type NodeRef =
  | { level: 'task'; task: JobTask }
  | { level: 'ability'; task: JobTask; ability: Ability }
  | { level: 'knowledge'; task: JobTask; ability: Ability; knowledge: Ability['knowledges'][number] };

function findNode(tasks: JobTask[], code: string): NodeRef | null {
  for (const task of tasks) {
    if (task.code === code) return { level: 'task', task };
    for (const ability of task.abilities) {
      if (ability.code === code) return { level: 'ability', task, ability };
      for (const knowledge of ability.knowledges) {
        if (knowledge.code === code) return { level: 'knowledge', task, ability, knowledge };
      }
    }
  }
  return null;
}

function markDeprecatedDeep(node: JobTask | Ability | Ability['knowledges'][number]): void {
  node.status = 'deprecated';
  if ('abilities' in node) node.abilities.forEach(markDeprecatedDeep);
  if ('knowledges' in node) node.knowledges.forEach(markDeprecatedDeep);
}

function ensureDraftVersion(g: AbilityGraph): GraphVersion {
  const existing = g.versions.find((v) => v.status === 'draft');
  if (existing) return existing;
  const draft: GraphVersion = {
    version: nextVersion(g.currentVersion),
    status: 'draft',
    nodeCounts: countNodes(g.tasks),
    changeSummary: '',
    diff: { added: [], modified: [], deprecated: [] },
    deprecations: [],
    snapshot: clone(g.tasks)
  };
  g.versions.unshift(draft);
  return draft;
}

function suggestionFor(tasks: JobTask[], ref: NodeRef): string {
  const siblings =
    ref.level === 'task'
      ? tasks.filter((t) => t.code !== ref.task.code && t.status === 'active')
      : ref.level === 'ability'
        ? ref.task.abilities.filter((a) => a.code !== (ref as { ability: Ability }).ability.code && a.status === 'active')
        : (ref as { ability: Ability }).ability.knowledges.filter(
            (k) => k.code !== (ref as { knowledge: { code: string } }).knowledge.code && k.status === 'active'
          );
  const sibling = siblings[0];
  return sibling
    ? `建议由 ${sibling.code}「${sibling.name}」承接，或联系课程负责人调整映射`
    : '建议新增替代节点，或联系课程负责人调整映射';
}

// ---------- 查询 ----------

export function countNodes(tasks: JobTask[]): NodeCounts {
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

export function validateWeights(tasks: JobTask[]): WeightIssue[] {
  const issues: WeightIssue[] = [];
  tasks.forEach((t) => {
    if (t.status === 'deprecated') return;
    t.abilities.forEach((a) => {
      if (a.status === 'deprecated') return;
      const sum = a.knowledges
        .filter((k) => k.status !== 'deprecated')
        .reduce((acc, k) => acc + k.weight, 0);
      if (sum !== 100) issues.push({ abilityCode: a.code, abilityName: a.name, sum });
    });
  });
  return issues;
}

export type PublishGate = {
  ok: boolean;
  reasons: { kind: 'empty' | 'weight' | 'deprecation'; message: string; abilityCode?: string }[];
};

export function getPublishGate(g: AbilityGraph): PublishGate {
  const reasons: PublishGate['reasons'] = [];
  if (countNodes(g.tasks).tasks === 0) {
    reasons.push({ kind: 'empty', message: '图谱为空：请至少创建一个任务' });
  }
  validateWeights(g.tasks).forEach((issue) => {
    reasons.push({
      kind: 'weight',
      message: `能力 ${issue.abilityCode}「${issue.abilityName}」知识点权重之和为 ${issue.sum}%（需 100%）`,
      abilityCode: issue.abilityCode
    });
  });
  const draft = g.versions.find((v) => v.status === 'draft');
  (draft?.deprecations ?? [])
    .filter((d) => d.status === 'pending')
    .forEach((d) => {
      reasons.push({
        kind: 'deprecation',
        message: `废弃项 ${d.code}「${d.name}」的课程影响尚未处理`
      });
    });
  return { ok: reasons.length === 0, reasons };
}

export function nextVersion(current: string): string {
  const m = /^v(\d+)\.(\d+)$/.exec(current);
  if (!m) return 'v1.0';
  return `v${m[1]}.${Number(m[2]) + 1}`;
}

export function nextTaskCode(tasks: JobTask[]): string {
  const max = tasks.reduce((acc, t) => Math.max(acc, t.code.charCodeAt(0)), 64);
  return String.fromCharCode(max + 1);
}

export function nextAbilityCode(task: JobTask): string {
  const max = task.abilities.reduce((acc, a) => {
    const n = Number(a.code.slice(task.code.length));
    return Number.isFinite(n) && a.code.startsWith(task.code) ? Math.max(acc, n) : acc;
  }, 0);
  return `${task.code}${max + 1}`;
}

export function nextKnowledgeCode(ability: Ability): string {
  const max = ability.knowledges.reduce((acc, k) => {
    const n = Number(k.code.slice(ability.code.length + 1));
    return Number.isFinite(n) && k.code.startsWith(`${ability.code}-`) ? Math.max(acc, n) : acc;
  }, 0);
  return `${ability.code}-${max + 1}`;
}

export function computeDiff(oldTasks: JobTask[], newTasks: JobTask[]): VersionDiff {
  const flatten = (tasks: JobTask[]) => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      map.set(t.code, JSON.stringify({ name: t.name, description: t.description }));
      t.abilities.forEach((a) => {
        map.set(a.code, JSON.stringify({ name: a.name, description: a.description }));
        a.knowledges.forEach((k) => {
          map.set(k.code, JSON.stringify({ name: k.name, weight: k.weight, mastery: k.mastery }));
        });
      });
    });
    return map;
  };
  const oldMap = flatten(oldTasks);
  const newMap = flatten(newTasks);
  const added: string[] = [];
  const modified: string[] = [];
  const deprecated: string[] = [];
  newMap.forEach((value, code) => {
    if (!oldMap.has(code)) added.push(code);
    else if (oldMap.get(code) !== value) modified.push(code);
  });
  oldMap.forEach((_, code) => {
    if (!newMap.has(code)) deprecated.push(code);
  });
  return { added, modified, deprecated };
}

export function cleanTree(tasks: JobTask[]): JobTask[] {
  return tasks
    .filter((t) => t.status !== 'deprecated')
    .map((t) => ({
      ...t,
      status: 'active',
      abilities: t.abilities
        .filter((a) => a.status !== 'deprecated')
        .map((a) => ({
          ...a,
          status: 'active' as const,
          knowledges: a.knowledges
            .filter((k) => k.status !== 'deprecated')
            .map((k) => ({ ...k, status: 'active' as const }))
        }))
    }));
}

// ---------- 纯变换 ----------

export function withTaskAdded(g: AbilityGraph, name: string): AbilityGraph {
  const next = clone(g);
  const code = nextTaskCode(next.tasks);
  next.tasks.push({
    id: `${next.id}-${code}`,
    code,
    name,
    description: '',
    status: 'new',
    abilities: []
  });
  touch(next);
  return next;
}

export function withAbilityAdded(g: AbilityGraph, taskCode: string, name: string): AbilityGraph {
  const next = clone(g);
  const task = next.tasks.find((t) => t.code === taskCode);
  if (!task) return g;
  const code = nextAbilityCode(task);
  task.abilities.push({
    id: `${next.id}-${code}`,
    code,
    name,
    description: '',
    status: 'new',
    knowledges: []
  });
  touch(next);
  return next;
}

export function withKnowledgeAdded(g: AbilityGraph, abilityCode: string, name: string): AbilityGraph {
  const next = clone(g);
  const ref = findNode(next.tasks, abilityCode);
  if (!ref || ref.level === 'task') return g;
  const code = nextKnowledgeCode(ref.ability);
  ref.ability.knowledges.push({
    id: `${next.id}-${code}`,
    code,
    name,
    weight: 0,
    mastery: '了解',
    status: 'new'
  });
  touch(next);
  return next;
}

export function withNodeUpdated(
  g: AbilityGraph,
  code: string,
  patch: { name?: string; description?: string; weight?: number; mastery?: '了解' | '掌握' | '精通' }
): AbilityGraph {
  const next = clone(g);
  const ref = findNode(next.tasks, code);
  if (!ref) return g;
  const node = ref.level === 'task' ? ref.task : ref.level === 'ability' ? ref.ability : ref.knowledge;
  if (patch.name !== undefined) node.name = patch.name;
  if (patch.description !== undefined && ref.level !== 'knowledge') {
    (node as JobTask | Ability).description = patch.description;
  }
  if (ref.level === 'knowledge') {
    if (patch.weight !== undefined) ref.knowledge.weight = patch.weight;
    if (patch.mastery !== undefined) ref.knowledge.mastery = patch.mastery;
  }
  touch(next);
  return next;
}

export function withNodeMoved(g: AbilityGraph, code: string, dir: 'up' | 'down'): AbilityGraph {
  const next = clone(g);
  const ref = findNode(next.tasks, code);
  if (!ref) return g;
  const swap = <T>(arr: T[], index: number) => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
  };
  if (ref.level === 'task') {
    swap(next.tasks, next.tasks.findIndex((t) => t.code === code));
  } else if (ref.level === 'ability') {
    swap(ref.task.abilities, ref.task.abilities.findIndex((a) => a.code === code));
  } else {
    swap(ref.ability.knowledges, ref.ability.knowledges.findIndex((k) => k.code === code));
  }
  touch(next);
  return next;
}

export function withNodeRemoved(g: AbilityGraph, code: string): AbilityGraph {
  const next = clone(g);
  const ref = findNode(next.tasks, code);
  if (!ref) return g;

  if (ref.level === 'task' && ref.task.status === 'new') {
    next.tasks = next.tasks.filter((t) => t.code !== code);
  } else if (ref.level === 'ability' && ref.ability.status === 'new') {
    ref.task.abilities = ref.task.abilities.filter((a) => a.code !== code);
  } else if (ref.level === 'knowledge' && ref.knowledge.status === 'new') {
    ref.ability.knowledges = ref.ability.knowledges.filter((k) => k.code !== code);
  } else {
    const node = ref.level === 'task' ? ref.task : ref.level === 'ability' ? ref.ability : ref.knowledge;
    markDeprecatedDeep(node);
    const draft = ensureDraftVersion(next);
    draft.deprecations.push({
      code: node.code,
      name: node.name,
      suggestion: suggestionFor(g.tasks, findNode(g.tasks, code)!),
      affectedCourses: clone(next.linkedCourses),
      status: 'pending'
    });
    draft.nodeCounts = countNodes(next.tasks);
    draft.snapshot = clone(next.tasks);
  }
  touch(next);
  return next;
}

export function withDeprecationResolved(
  g: AbilityGraph,
  code: string,
  resolution: 'handled' | 'ignored'
): AbilityGraph {
  const next = clone(g);
  const draft = next.versions.find((v) => v.status === 'draft');
  const dep = draft?.deprecations.find((d) => d.code === code);
  if (dep) dep.status = resolution;
  touch(next);
  return next;
}

export function withAiRegenerated(g: AbilityGraph): AbilityGraph {
  const next = clone(g);
  next.tasks = parsedTreeToTasks(mockParseJobDocs(next.sourceDocs, next.jobName), next.id);
  const draft = next.versions.find((v) => v.status === 'draft');
  if (draft) {
    draft.nodeCounts = countNodes(next.tasks);
    draft.snapshot = clone(next.tasks);
  }
  touch(next);
  return next;
}

export function publishGraph(g: AbilityGraph, changeSummary: string): AbilityGraph | null {
  const gate = getPublishGate(g);
  if (!gate.ok) return null;

  const next = clone(g);
  const draft = next.versions.find((v) => v.status === 'draft');
  const current = next.versions.find((v) => v.status === 'current');
  const cleaned = cleanTree(next.tasks);

  const record: GraphVersion = {
    version: draft?.version ?? nextVersion(next.currentVersion),
    status: 'current',
    nodeCounts: countNodes(cleaned),
    publishedAt: now(),
    changeSummary: changeSummary || '版本发布',
    diff: computeDiff(current?.snapshot ?? [], cleaned),
    deprecations: draft?.deprecations ?? [],
    snapshot: clone(cleaned)
  };

  const rest = next.versions.filter((v) => v !== draft && v !== current);
  const archivedCurrent = current ? { ...current, status: 'archived' as const } : null;
  next.versions = [record, ...(archivedCurrent ? [archivedCurrent] : []), ...rest];
  next.tasks = cleaned;
  next.status = 'published';
  next.currentVersion = record.version;
  touch(next);
  return next;
}

// ---------- AI 解析 mock ----------

export function mockParseJobDocs(
  _files: { name: string }[],
  jobName = '储能电站运维技师'
): ParsedTask[] {
  if (!jobName.includes('储能')) {
    return genericParsedTree(jobName);
  }
  return [
    {
      code: 'A',
      name: '电站认知',
      description: '储能电站系统构成与安全规程的基础认知',
      confidence: 'high',
      reason: '说明书第 1、2 章多次出现系统构成与安全规程描述，岗位职责明确提及。',
      excluded: false,
      abilities: [
        {
          code: 'A1',
          name: '电站系统构成',
          description: '电池舱、PCS、BMS、EMS 等系统组成与功能',
          confidence: 'high',
          reason: '「系统组成」章节结构化描述完整，实体识别置信度高。',
          excluded: false,
          knowledges: [
            { code: 'A1-1', name: '电池舱与电池簇结构', weight: 60, mastery: '掌握', confidence: 'high', reason: '原文明确列出电池舱/电池簇层级结构。', excluded: false },
            { code: 'A1-2', name: 'PCS 与 EMS 功能', weight: 40, mastery: '了解', confidence: 'mid', reason: 'PCS/EMS 仅在系统图中标注，描述较简略。', excluded: false }
          ]
        },
        {
          code: 'A2',
          name: '安全规程',
          description: '电站作业安全规范与防护要求',
          confidence: 'high',
          reason: '安全规程为独立章节且条款化，抽取稳定。',
          excluded: false,
          knowledges: [
            { code: 'A2-1', name: '作业票与许可流程', weight: 50, mastery: '掌握', confidence: 'high', reason: '条款 3.1-3.4 明确两票三制要求。', excluded: false },
            { code: 'A2-2', name: '消防与防爆要求', weight: 50, mastery: '掌握', confidence: 'high', reason: '条款 5.2 明确消防设施配置与检查周期。', excluded: false }
          ]
        }
      ]
    },
    {
      code: 'B',
      name: '运行监控',
      description: '电站运行数据采集、监视与告警处理',
      confidence: 'high',
      reason: '岗位职责第 2 条「负责电站运行监控与值班」直接对应。',
      excluded: false,
      abilities: [
        {
          code: 'B1',
          name: '数据采集与监视',
          description: 'SCADA 数据监视与运行报表编制',
          confidence: 'high',
          reason: '监控系统章节描述完整，包含监视点位与报表要求。',
          excluded: false,
          knowledges: [
            { code: 'B1-1', name: 'SCADA 监视要点', weight: 50, mastery: '掌握', confidence: 'high', reason: '原文列出电压/电流/温度/SOC 等关键监视量。', excluded: false },
            { code: 'B1-2', name: '运行报表编制', weight: 50, mastery: '了解', confidence: 'mid', reason: '报表要求仅在附录提及，模板细节缺失。', excluded: false }
          ]
        },
        {
          code: 'B2',
          name: '告警处理',
          description: '告警识别、分级与响应',
          confidence: 'mid',
          reason: '告警处理流程存在但分级标准描述不完整。',
          excluded: false,
          knowledges: [
            { code: 'B2-1', name: '常见告警识别', weight: 60, mastery: '掌握', confidence: 'mid', reason: '告警清单可从故障表推断，但未逐条定义。', excluded: false },
            { code: 'B2-2', name: '告警分级处理', weight: 40, mastery: '掌握', confidence: 'low', reason: '说明书未给出告警分级标准，由相似岗位说明书迁移推断，需人工确认。', excluded: false }
          ]
        }
      ]
    },
    {
      code: 'C',
      name: '检修维护',
      description: '电站设备巡检、维护与故障处置',
      confidence: 'high',
      reason: '岗位职责第 3 条与检修规程章节直接对应。',
      excluded: false,
      abilities: [
        {
          code: 'C1',
          name: '巡检作业',
          description: '日常与专项巡检的内容与周期',
          confidence: 'high',
          reason: '巡检规程条款化，内容与周期明确。',
          excluded: false,
          knowledges: [
            { code: 'C1-1', name: '日常巡检路线与点位', weight: 50, mastery: '掌握', confidence: 'high', reason: '附巡检路线图与点位表。', excluded: false },
            { code: 'C1-2', name: '红外测温与局放检测', weight: 50, mastery: '掌握', confidence: 'mid', reason: '检测手段有提及但仪器型号未明确。', excluded: false }
          ]
        },
        {
          code: 'C2',
          name: '故障处置',
          description: '常见故障的隔离与应急处置',
          confidence: 'mid',
          reason: '故障处置流程存在，隔离步骤依赖现场规程补充。',
          excluded: false,
          knowledges: [
            { code: 'C2-1', name: '故障隔离流程', weight: 50, mastery: '精通', confidence: 'low', reason: '隔离流程在多份文档间表述不一致，需人工确认口径。', excluded: false },
            { code: 'C2-2', name: '常见故障案例处置', weight: 50, mastery: '掌握', confidence: 'mid', reason: '案例库较完整但覆盖故障类型有限。', excluded: false }
          ]
        }
      ]
    }
  ];
}

function genericParsedTree(jobName: string): ParsedTask[] {
  const make = (code: string, name: string, weight: number, mastery: '了解' | '掌握' | '精通') => ({
    code,
    name,
    weight,
    mastery,
    confidence: 'mid' as const,
    reason: '依据岗位说明书职责描述归纳，建议人工确认。',
    excluded: false
  });
  return [
    {
      code: 'A',
      name: `${jobName}岗位认知`,
      description: '岗位基础理论与安全规范',
      confidence: 'high',
      reason: '说明书岗位职责章节直接对应。',
      excluded: false,
      abilities: [
        {
          code: 'A1',
          name: '岗位理论认知',
          description: '岗位相关基础理论',
          confidence: 'high',
          reason: '职责描述明确。',
          excluded: false,
          knowledges: [make('A1-1', '岗位核心概念', 60, '掌握'), make('A1-2', '行业标准与规范', 40, '了解')]
        },
        {
          code: 'A2',
          name: '安全作业规范',
          description: '安全操作规程与防护要求',
          confidence: 'high',
          reason: '安全规程条款化，抽取稳定。',
          excluded: false,
          knowledges: [make('A2-1', '安全操作规程', 60, '掌握'), make('A2-2', '防护用品使用', 40, '了解')]
        }
      ]
    },
    {
      code: 'B',
      name: `${jobName}现场作业`,
      description: '现场作业流程与质量要求',
      confidence: 'mid',
      reason: '作业流程描述较概括，建议人工细化。',
      excluded: false,
      abilities: [
        {
          code: 'B1',
          name: '作业流程执行',
          description: '标准作业流程的执行',
          confidence: 'mid',
          reason: '流程步骤可从作业指导书归纳。',
          excluded: false,
          knowledges: [make('B1-1', '作业准备与检查', 50, '掌握'), make('B1-2', '标准作业步骤', 50, '精通')]
        },
        {
          code: 'B2',
          name: '质量检查与记录',
          description: '作业质量检查与台账记录',
          confidence: 'mid',
          reason: '质量要求有提及但检查表未附。',
          excluded: false,
          knowledges: [make('B2-1', '质量检查要点', 50, '掌握'), make('B2-2', '台账记录规范', 50, '了解')]
        }
      ]
    }
  ];
}

export function parsedTreeToTasks(parsed: ParsedTask[], graphId: string): JobTask[] {
  return parsed
    .filter((t) => !t.excluded)
    .map((t) => ({
      id: `${graphId}-${t.code}`,
      code: t.code,
      name: t.name,
      description: t.description,
      status: 'new' as const,
      abilities: t.abilities
        .filter((a) => !a.excluded)
        .map((a) => ({
          id: `${graphId}-${a.code}`,
          code: a.code,
          name: a.name,
          description: a.description,
          status: 'new' as const,
          knowledges: a.knowledges
            .filter((k) => !k.excluded)
            .map((k) => ({
              id: `${graphId}-${k.code}`,
              code: k.code,
              name: k.name,
              weight: k.weight,
              mastery: k.mastery,
              status: 'new' as const
            }))
        }))
    }));
}
