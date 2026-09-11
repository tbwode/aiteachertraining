# 管理端岗位能力图谱治理原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理端「图谱中心 / 岗位能力图谱」构建可交互治理原型：AI 生成/手工搭建 → 四级树编辑（岗位-任务-能力-知识点，知识点权重和=100%）→ 版本发布 → 废弃影响处理，全部 mock 内存态。

**Architecture:** 方案二（列表 + 独立工作台多路由）。mock 层为 `_mock/` 下纯函数模块（types/data/store），store 为模块级内存态（会话内跨页面共享，刷新还原为种子数据）；UI 为 ChakraUI 客户端组件，复用管理端红主题与 mapping-review 的树面板模式。纯逻辑（权重校验、diff、发布闸门）配 vitest 单测，测试模式仿照 `projects/app/test/aiVideo/aiVideo.test.ts`。

**Tech Stack:** Next.js 14 App Router, React 18, ChakraUI 2.10 + @chakra-ui/icons 2.1, TypeScript, Vitest（仓库根 `pnpm vitest run`）。

**设计文档:** `.Codex/design/2026-08-28-ability-graph-governance-prototype.md`（已逐节确认）

## Global Constraints

- 全部 UI 文案为中文；设计文档/计划已落盘，不再改动设计，如需变更先改设计文档。
- 管理端主题色：`ACCENT = '#C8000B'`，`ACCENT_SOFT = '#FFF1F0'`（与教师端 `#C83E3E` 不同，禁止混用）。
- 不调用真实后端、不新增 API 路由；不改动教师端任何文件；不改动 `adminConfig.ts` 与 i18n 文件（导航入口已存在）。
- 层级模型固定：岗位(图谱) → 任务 `JobTask`(code "A") → 能力 `Ability`(code "A1") → 知识点 `AbilityKnowledge`(code "A1-2", 带 weight)；仅知识点层挂权重，同能力下非废弃兄弟节点权重之和必须 = 100。
- 废弃语义：删除 `status: 'new'` 的节点 = 直接移除；删除已发布节点 = 置 `status: 'deprecated'`（仍留在树中展示）并向当前草稿版本追加一条 `status: 'pending'` 的 Deprecation。权重校验与发布 diff 均跳过 deprecated 节点。
- 发布闸门三条件：树非空、无权重问题、草稿废弃项全部非 pending。
- 所有 store 变换函数为纯函数：接收 graph 返回新 graph（不可变更新），由组件负责 `setGraph` + `saveGraph`。
- 持久化约定：模块级 `let graphs` + `saveGraph/registerGraph`；页面组件 `useEffect` 内读取 store（避免 SSR 水合不一致），初始渲染为加载/骨架态。
- 图标：管理端语义图标用 `AdminIcon`（仅限 `adminConfig.ts` 中 `AdminIconName` 已有值）；通用图标用 `@chakra-ui/icons`。
- 提交约束：按环境约定不自动 `git commit`；全部完成后由用户确认是否统一提交。
- 测试命令（仓库根目录执行）：`pnpm vitest run projects/app/test/abilityGraph/abilityGraph.test.ts --coverage.enabled=false`
- 开发服务器：`cd projects/app && pnpm dev`（端口 3388）；管理端页面需 localStorage 登录态（键 `course-auth-user` / `system_access_token` / `course-selected-role=admin`）。

## File Structure

```
projects/app/src/app/admin/(layoutPage)/graph/ability/
  _mock/types.ts            新建：全部类型
  _mock/data.ts             新建：确定性种子数据（6 个图谱，g1 含草稿/废弃项）
  _mock/store.ts            新建：模块级 store + 全部纯函数变换
  AbilityGraphPageClient.tsx 修改：列表页增强（整文件替换）
  create/ai/page.tsx        新建：向导页壳
  create/ai/AiWizardClient.tsx 新建：3 步向导演示
  new/page.tsx              新建：手工搭建（空态工作台）
  [id]/page.tsx             新建：工作台页壳（Suspense 包裹）
  [id]/WorkbenchClient.tsx  新建：工作台主组件（header + tabs + 状态中枢）
  [id]/components/WorkbenchHeader.tsx 新建
  [id]/components/StructureTab.tsx    新建：树导航 + 节点编辑器 + 上下文面板
  [id]/components/VersionsTab.tsx     新建：版本时间线 + 快照弹窗
  [id]/components/ImpactTab.tsx       新建：废弃影响清单
  [id]/components/PublishModal.tsx    新建：发布闸门弹窗
projects/app/test/abilityGraph/abilityGraph.test.ts 新建
```

---

### Task 1: Mock 类型与种子数据

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/_mock/types.ts`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/_mock/data.ts`

**Interfaces:**
- Produces: `Mastery, NodeStatus, GraphStatus, VersionStatus, DeprecationStatus, AbilityKnowledge, Ability, JobTask, NodeCounts, VersionDiff, AffectedCourse, Deprecation, GraphVersion, AbilityGraph, Confidence, ParsedKnowledge, ParsedAbility, ParsedTask, WeightIssue` 类型；`seedGraphs(): AbilityGraph[]`（每次调用返回全新深对象，保证 SSR 与水合一致）。

- [ ] **Step 1: 创建 types.ts**

```ts
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
```

- [ ] **Step 2: 创建 data.ts 种子数据**

```ts
import type { AbilityGraph, JobTask, Mastery } from './types';

// g1 草稿树：B3 已标记废弃（v2.4 草稿待处理），B5 为新增
const g1DraftTasks: JobTask[] = [
  {
    id: 'g1-A', code: 'A', name: '动力电池认知', description: '电池体系与结构的基础认知',
    status: 'active',
    abilities: [
      {
        id: 'g1-A1', code: 'A1', name: '电池化学体系认知', description: '掌握主流电池化学体系特性与选型依据', status: 'active',
        knowledges: [
          { id: 'g1-A1-1', code: 'A1-1', name: '三元锂电池特性', weight: 40, mastery: '了解', status: 'active' },
          { id: 'g1-A1-2', code: 'A1-2', name: '磷酸铁锂电池特性', weight: 30, mastery: '了解', status: 'active' },
          { id: 'g1-A1-3', code: 'A1-3', name: '电芯充放电原理', weight: 30, mastery: '掌握', status: 'active' }
        ]
      },
      {
        id: 'g1-A2', code: 'A2', name: '电池结构认知', description: '电芯、模组与电池包结构', status: 'active',
        knowledges: [
          { id: 'g1-A2-1', code: 'A2-1', name: '电芯形态与选型', weight: 50, mastery: '了解', status: 'active' },
          { id: 'g1-A2-2', code: 'A2-2', name: '模组结构设计', weight: 50, mastery: '掌握', status: 'active' }
        ]
      }
    ]
  },
  {
    id: 'g1-B', code: 'B', name: '电池系统检修', description: '故障诊断、检修与应急处置',
    status: 'active',
    abilities: [
      {
        id: 'g1-B1', code: 'B1', name: '绝缘检测', description: '高压绝缘性能检测与故障排查', status: 'active',
        knowledges: [
          { id: 'g1-B1-1', code: 'B1-1', name: '绝缘电阻测量', weight: 60, mastery: '掌握', status: 'active' },
          { id: 'g1-B1-2', code: 'B1-2', name: '绝缘故障排查', weight: 40, mastery: '精通', status: 'active' }
        ]
      },
      {
        id: 'g1-B2', code: 'B2', name: '故障诊断', description: '基于故障码与数据流的诊断', status: 'active',
        knowledges: [
          { id: 'g1-B2-1', code: 'B2-1', name: '故障码读取分析', weight: 50, mastery: '掌握', status: 'active' },
          { id: 'g1-B2-2', code: 'B2-2', name: '数据流分析', weight: 50, mastery: '精通', status: 'active' }
        ]
      },
      {
        id: 'g1-B3', code: 'B3', name: '热失控预警处理', description: '热失控预警信号识别与处置', status: 'deprecated',
        knowledges: [
          { id: 'g1-B3-1', code: 'B3-1', name: '预警信号识别', weight: 50, mastery: '掌握', status: 'deprecated' },
          { id: 'g1-B3-2', code: 'B3-2', name: '预警处置流程', weight: 50, mastery: '掌握', status: 'deprecated' }
        ]
      },
      {
        id: 'g1-B5', code: 'B5', name: '热失控应急处置', description: '热失控事故发生后的应急处置', status: 'new',
        knowledges: [
          { id: 'g1-B5-1', code: 'B5-1', name: '应急断电流程', weight: 60, mastery: '精通', status: 'new' },
          { id: 'g1-B5-2', code: 'B5-2', name: '热失控扑救与隔离', weight: 40, mastery: '掌握', status: 'new' }
        ]
      }
    ]
  },
  {
    id: 'g1-C', code: 'C', name: '高压安全', description: '高压系统安全作业规范',
    status: 'active',
    abilities: [
      {
        id: 'g1-C1', code: 'C1', name: '高压系统操作', description: '高压下电、验电与防护', status: 'active',
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
    g1DraftTasks
      .filter((t) => t.code !== 'B' || true)
      .map((t) =>
        t.code !== 'B'
          ? t
          : { ...t, abilities: t.abilities.filter((a) => a.code !== 'B5') }
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

> 注意：g1V23Snapshot 推导中的 `.filter((t) => t.code !== 'B' || true)` 是恒真占位写法，实现时直接 `.map` 即可，不要保留这段死代码。

```ts
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
      version: 'v2.4', status: 'draft', nodeCounts: countNodesLocal(g1DraftTasks),
      changeSummary: 'AI 依据 12 份企业岗位说明书生成：新增 B5 热失控应急处置，建议废弃 B3 热失控预警处理。',
      diff: { added: ['B5', 'B5-1', 'B5-2'], modified: [], deprecated: ['B3', 'B3-1', 'B3-2'] },
      deprecations: [
        {
          code: 'B3', name: '热失控预警处理',
          suggestion: '建议由 B5 热失控应急处置替代',
          affectedCourses: g1LinkedCourses,
          status: 'pending'
        }
      ],
      snapshot: g1V24DraftSnapshot
    },
    {
      version: 'v2.3', status: 'current', nodeCounts: countNodesLocal(g1V23Snapshot),
      publishedAt: '2026-03-18 10:12',
      changeSummary: '人工审核后发布：调整 A2、C1 能力等级描述。',
      diff: { added: [], modified: ['A2', 'C1'], deprecated: [] },
      deprecations: [], snapshot: g1V23Snapshot
    },
    {
      version: 'v2.2', status: 'archived', nodeCounts: countNodesLocal(g1V22Snapshot),
      publishedAt: '2025-11-02 09:40',
      changeSummary: '首版 AI 生成 + 教研组审定。',
      diff: { added: ['C1-2'], modified: [], deprecated: [] },
      deprecations: [], snapshot: g1V22Snapshot
    }
  ],
  linkedCourses: g1LinkedCourses,
  sourceDocs: [{ name: '动力电池维修技师岗位说明书.pdf', size: '1.2 MB' }],
  updatedAt: '2026-08-26 14:32'
};

// g2-g6：已发布简易图谱（2 任务 × 2 能力 × 2 知识点，权重 50/50，单 current 版本含快照）
function simpleGraph(input: {
  id: string; jobName: string; majorDirection: string; version: string;
  publishedAt: string; changeSummary: string; updatedAt: string;
  courses: [string, string][]; // [courseId, courseName]
}): AbilityGraph {
  const taskDefs: [string, string, string, string][] = [
    ['A', '岗位认知与安全规范', '基础理论认知', '安全作业规范'],
    ['B', '现场作业执行', '作业流程执行', '质量检查与记录']
  ];
  const tasks: JobTask[] = taskDefs.map(([tCode, tName, a1Name, a2Name]) => ({
    id: `${input.id}-${tCode}`, code: tCode, name: tName,
    description: `${input.jobName}岗位的${tName}任务域`, status: 'active',
    abilities: [a1Name, a2Name].map((aName, ai) => {
      const aCode = `${tCode}${ai + 1}`;
      return {
        id: `${input.id}-${aCode}`, code: aCode, name: aName,
        description: `${aName}相关能力要求`, status: 'active',
        knowledges: [1, 2].map((ki) => ({
          id: `${input.id}-${aCode}-${ki}`, code: `${aCode}-${ki}`,
          name: `${aName}要点${ki}`, weight: 50,
          mastery: (ki === 1 ? '掌握' : '了解') as Mastery, status: 'active' as const
        }))
      };
    })
  }));
  const snapshot = JSON.parse(JSON.stringify(tasks)) as JobTask[];
  return {
    id: input.id, jobName: input.jobName, majorDirection: input.majorDirection,
    status: 'published', currentVersion: input.version, tasks,
    versions: [{
      version: input.version, status: 'current', nodeCounts: countNodesLocal(snapshot),
      publishedAt: input.publishedAt, changeSummary: input.changeSummary,
      diff: { added: [], modified: [], deprecated: [] }, deprecations: [], snapshot
    }],
    linkedCourses: input.courses.map(([courseId, courseName], i) => ({ courseId, courseName, mappingCount: (i % 3) + 1 })),
    sourceDocs: [],
    updatedAt: input.updatedAt
  };
}

const g2 = simpleGraph({ id: 'g2', jobName: '新能源汽车装调技师', majorDirection: '新能源汽车技术', version: 'v1.6', publishedAt: '2026-08-20 09:15', changeSummary: '补充高压安全作业细分能力点。', updatedAt: '2026-08-20 09:15', courses: [['c4', '新能源汽车装调工艺'], ['c5', '底盘线控技术'], ['c6', '整车装配实训'], ['c7', '汽车电工电子']] });
const g3 = simpleGraph({ id: 'g3', jobName: '充电桩运维工程师', majorDirection: '新能源汽车技术', version: 'v1.2', publishedAt: '2026-07-30 16:48', changeSummary: '新增直流快充模块检修能力域。', updatedAt: '2026-07-30 16:48', courses: [['c8', '充电桩安装与运维'], ['c9', '电力电子基础']] });
const g4 = simpleGraph({ id: 'g4', jobName: '智能网联汽车测试员', majorDirection: '智能网联汽车技术', version: 'v1.0', publishedAt: '2026-06-12 11:05', changeSummary: '首版发布。', updatedAt: '2026-06-12 11:05', courses: [['c10', '智能网联汽车概论'], ['c11', '传感器与感知技术']] });
const g5 = simpleGraph({ id: 'g5', jobName: '汽车营销顾问', majorDirection: '汽车技术服务与营销', version: 'v2.0', publishedAt: '2026-05-21 15:26', changeSummary: '按新能源车型销售流程重构能力域。', updatedAt: '2026-05-21 15:26', courses: [['c12', '汽车营销实务'], ['c13', '客户关系管理'], ['c14', '新能源车型产品知识']] });
const g6 = simpleGraph({ id: 'g6', jobName: '机电设备维修工', majorDirection: '机电一体化技术', version: 'v3.1', publishedAt: '2026-04-08 10:02', changeSummary: '合并重复能力点，等级描述对齐国家职业标准。', updatedAt: '2026-04-08 10:02', courses: [['c15', '机电设备装调'], ['c16', 'PLC 控制技术'], ['c17', '液压与气动'], ['c18', '设备点检实务'], ['c19', '机械制图']] });

// 每次调用返回全新深对象（保证 SSR 与水合一致、resetStore 可还原）
export function seedGraphs(): AbilityGraph[] {
  return JSON.parse(JSON.stringify([g1, g2, g3, g4, g5, g6])) as AbilityGraph[];
}
```

- [ ] **Step 3: 类型检查通过**

Run: `cd projects/app && pnpm exec tsc --noEmit --pretty false 2>&1 | grep -F "graph/ability" || echo "ability 目录无类型错误"`
Expected: 输出 `ability 目录无类型错误`（仓库存量错误不归本任务处理）。

---

### Task 2: Mock store 纯函数变换 + 单元测试（TDD）

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/_mock/store.ts`
- Create: `projects/app/test/abilityGraph/abilityGraph.test.ts`
- Test: `projects/app/test/abilityGraph/abilityGraph.test.ts`

**Interfaces:**
- Consumes: types.ts 全部类型 + data.ts 的 `seedGraphs()`。
- Produces:
  - 状态：`listGraphs() / getGraph(id) / saveGraph(g) / registerGraph(g) / resetStore() / newGraphId()`（idSeq 从 100 起，首个新 id 为 `g101`；resetStore 时重置）
  - 创建：`createDraftGraph(input: { jobName; majorDirection; sourceDocs: {name,size}[]; buildTasks: (graphId: string) => JobTask[] }): AbilityGraph`（内部 newGraphId → buildTasks(id) → registerGraph；树节点 id 与图谱 id 同源，禁止组件层先取 id）
  - 纯变换（graph in → graph out，不可变）：`cleanTree(tasks): JobTask[]`（剔除 deprecated 子树、new→active，发布与发布预览共用）/ `withTaskAdded(g,name) / withAbilityAdded(g,taskCode,name) / withKnowledgeAdded(g,abilityCode,name) / withNodeUpdated(g,code,patch:{name?,description?,weight?,mastery?}) / withNodeMoved(g,code,'up'|'down') / withNodeRemoved(g,code) / withDeprecationResolved(g,code,'handled'|'ignored') / withAiRegenerated(g) / publishGraph(g,changeSummary): AbilityGraph | null`
  - 查询：`countNodes(tasks): NodeCounts / validateWeights(tasks): WeightIssue[] / getPublishGate(g): PublishGate / computeDiff(oldTasks,newTasks): VersionDiff / nextVersion('v2.3')→'v2.4'、('')→'v1.0' / nextTaskCode(tasks) / nextAbilityCode(task) / nextKnowledgeCode(ability)`
  - AI：`mockParseJobDocs(files:{name:string}[], jobName?: string): ParsedTask[]`（确定性）/ `parsedTreeToTasks(parsed, graphId): JobTask[]`（过滤 excluded，status 全 'new'，id 为 `${graphId}-${code}`）
  - 类型 `PublishGate = { ok: boolean; reasons: { kind: 'empty'|'weight'|'deprecation'; message: string; abilityCode?: string }[] }`

**关键实现约定（实现者照此写，勿自由发挥）：**

- 所有 withX 变换统一模式：`const next = clone(g)`（clone = JSON 深拷贝）→ 在 `next.tasks` 上查找并修改 → `touch(next)`（刷新 updatedAt）→ return next。输入 g 不被修改。
- 节点查找：`findNode(tasks, code)` 返回 `{ level: 'task'|'ability'|'knowledge', task?, ability?, knowledge? } | null`，三层循环。
- `validateWeights`：跳过 `status === 'deprecated'` 的任务/能力/知识点；能力下剩余知识点权重和 ≠ 100（含空能力 sum=0）即产生 WeightIssue。
- `getPublishGate`：树空（tasks.length===0）→ kind 'empty'；weight issue 逐条 → kind 'weight'（带 abilityCode）；草稿版本 deprecations 中 status==='pending' 逐条 → kind 'deprecation'。ok = reasons 为空。
- `withNodeRemoved`：`status==='new'` 节点从父数组硬删；否则级联置 deprecated（子树全部），调用 `ensureDraftVersion(next)` 拿草稿版本（无则以 `nextVersion(currentVersion)` 创建并 unshift 到 versions 头部，diff 空、snapshot 为当前 tasks 深拷贝），向其 deprecations 追加 `{ code, name, suggestion: suggestionFor(...), affectedCourses: clone(next.linkedCourses), status: 'pending' }`，并刷新草稿 snapshot。`suggestionFor` 为确定性文案：同父数组存在其他 active 兄弟时 `建议由 ${sibling.code}「${sibling.name}」承接，或联系课程负责人调整映射`，否则 `建议新增替代节点，或联系课程负责人调整映射`。
- `publishGraph`：gate 不过返回 null。通过后：`cleaned = cleanTree(tasks)`（剔除 deprecated 子树、new→active）；`record = { version: draft?.version ?? nextVersion(currentVersion), status: 'current', nodeCounts: countNodes(cleaned), publishedAt: now(), changeSummary, diff: computeDiff(current?.snapshot ?? [], cleaned), deprecations: draft?.deprecations ?? [], snapshot: clone(cleaned) }`；versions 重排为 `[record, ...(旧 current 置 archived), ...其余]`；`tasks = cleaned; status='published'; currentVersion = record.version; touch`。
- `computeDiff`：old/new 各自扁平化为 `Map<code, {name, description?, weight?, mastery?}>`；added = 新有旧无；deprecated = 旧有新无；modified = 共有但字段不同。
- `nextTaskCode`：现有 code 首字母取最大 charCode +1（空树从 'A' 起）。`nextAbilityCode(task)`：解析 `code.slice(task.code.length)` 的数字后缀 max+1（兼容 g1 的 B5 缺 B4 → 返回 B6）。`nextKnowledgeCode(ability)`：`${ability.code}-${max+1}`。
- `mockParseJobDocs`：默认输出「储能电站运维技师」确定性 ParsedTask 树——A 电站认知（A1 电站系统构成 60/40、A2 安全规程 50/50）、B 运行监控（B1 数据采集与监视 50/50、B2 告警处理 60/40，其中 **B2-2 告警分级处理 confidence: 'low'**）、C 检修维护（C1 巡检作业 50/50、C2 故障处置 50/50，其中 **C2-1 故障隔离流程 confidence: 'low'**）；其余节点 high/mid 混合，每节点带 reason。`jobName` 参数不含「储能」时输出通用 2 任务树（任务 A 命名为 `${jobName}岗位认知`），供 AI 重新生成非储能图谱使用。
- `createDraftGraph`：`const id = newGraphId(); const g = { id, status: 'draft', currentVersion: '', versions: [], linkedCourses: [], updatedAt: now(), jobName: input.jobName, majorDirection: input.majorDirection, sourceDocs: input.sourceDocs, tasks: input.buildTasks(id) }; registerGraph(g); return g`。

- [ ] **Step 1: 先写失败测试（TDD）**

```ts
// projects/app/test/abilityGraph/abilityGraph.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeDiff, countNodes, createDraftGraph, getGraph, getPublishGate, listGraphs,
  mockParseJobDocs, nextAbilityCode, nextKnowledgeCode, nextTaskCode, nextVersion,
  parsedTreeToTasks, publishGraph, registerGraph, resetStore, validateWeights,
  withDeprecationResolved, withKnowledgeAdded, withNodeMoved, withNodeRemoved
} from '@/app/admin/(layoutPage)/graph/ability/_mock/store';

beforeEach(() => resetStore());

// 12 个用例：
// 1. validateWeights：g1 草稿无问题（B3 废弃子树被跳过）；把 B1-1 改为 70 后报 1 条 sum=110
// 2. getPublishGate：g1 因 pending 废弃项不 ok（kind='deprecation'）；g2 ok
// 3. publishGraph：g1 有 pending 时返回 null，listGraphs 不变
// 4. withDeprecationResolved(g1,'B3','handled') 后 publishGraph 成功：currentVersion='v2.4'；v2.3 置 archived；B3 子树从 tasks 移除；B5 变 active；v2.4.deprecations[0].status='handled'；diff.added 含 'B5'、diff.deprecated 含 'B3'
// 5. withNodeRemoved 删 new 节点（B5）→ 树中不存在 B5，草稿 deprecations 不新增
// 6. withNodeRemoved 删 active 节点（B2）→ B2 及知识点级联 deprecated；草稿 deprecations 变为 2 条 pending（B3、B2）
// 7. nextTaskCode(g1.tasks)='D'；nextAbilityCode(g1 任务 B)='B6'；nextKnowledgeCode(g1 A1)='A1-4'；nextVersion('v2.3')='v2.4'、nextVersion('')='v1.0'
// 8. computeDiff(g1 v2.3 snapshot, cleanedV2.4)：added 含 B5/B5-1/B5-2，deprecated 含 B3/B3-1/B3-2，modified 为空
// 9. mockParseJobDocs([])：低置信节点为 B2-2、C2-1；parsedTreeToTasks 剔除 excluded 后 status 全 'new'，id 形如 'gx-A'
// 10. withNodeMoved(g1,'A2','up') 后任务 A 的能力顺序为 A1,A2 → 不变（已在边界）；withNodeMoved(g1,'A1','down') 后顺序 A2,A1
// 11. createDraftGraph({ jobName:'测试岗位', majorDirection:'新能源汽车技术', sourceDocs:[], buildTasks:(id)=>[] }) 后 listGraphs 长度 7、新 id 'g101'；resetStore 后回到 6
// 12. resetStore 隔离：先 withDeprecationResolved 处理 g1，再 resetStore，getGraph('g1') 的草稿废弃项恢复 pending
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run projects/app/test/abilityGraph/abilityGraph.test.ts --coverage.enabled=false`（仓库根目录）
Expected: FAIL（store.ts 尚不存在，模块解析错误）

- [ ] **Step 3: 实现 store.ts**

按上方「关键实现约定」完整实现全部导出。不写任何 UI 代码。

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run projects/app/test/abilityGraph/abilityGraph.test.ts --coverage.enabled=false`
Expected: 12/12 PASS

---

### Task 3: 列表页增强（整文件替换）

**Files:**
- Modify: `projects/app/src/app/admin/(layoutPage)/graph/ability/AbilityGraphPageClient.tsx`

- [ ] **Step 1: 重写列表页**

- 保留现有页面头部与统计卡视觉风格（ACCENT/ACCENT_SOFT、圆角 20px 卡片）。
- 数据来自 store：`const [mounted, setMounted] = useState(false); const [graphs, setGraphs] = useState<AbilityGraph[]>([])`，`useEffect(() => { setGraphs(listGraphs()); setMounted(true); }, [])`；未 mounted 渲染骨架（Skeleton 卡片）。
- 头部右侧「新建能力图谱」改为分裂按钮：`ButtonGroup isAttached` 主按钮文案「AI 生成图谱」点击 `router.push('/admin/graph/ability/create/ai')`；右侧 `Menu` 触发 `ChevronDownIcon`，菜单项「AI 生成（推荐）」→ 同上、「手工搭建」→ `/admin/graph/ability/new`。
- 统计卡 4 项：图谱总数 / 已发布图谱 / 草稿待审核 / 治理待办（全部图谱草稿版本 pending deprecations 计数）。
- 图谱卡片：岗位名 + 专业方向 + 状态徽标（已发布 green / 有草稿待审 orange）；`status==='draft' && sourceDocs.length>0` 时额外显示「AI 生成待审定」角标（purple）；三级计数 `countNodes(tasks)` → `x 任务 · y 能力 · z 知识点`；关联课程数；更新时间。
- 卡片操作：主按钮「进入工作台」→ `/admin/graph/ability/${id}`；版本号以文本按钮展示 → `/admin/graph/ability/${id}?tab=versions`。
- 删除旧代码中的版本 Drawer、openVersions、versionStatusMeta、本地 mockGraphs 类型与数据（已迁移到 _mock/）。
- 搜索保留（按岗位名/专业方向过滤），空结果显示空态。

- [ ] **Step 2: 类型检查 + 手动验证**

Run: `cd projects/app && pnpm exec tsc --noEmit --pretty false 2>&1 | grep -F "graph/ability" || echo OK`
浏览器验证（dev server 3388 + localStorage 登录态）：列表页渲染 6 张卡、g1 显示「AI 生成待审定」角标与治理待办 1。

---

### Task 4: AI 生成向导（3 步）

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/create/ai/page.tsx`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/create/ai/AiWizardClient.tsx`

- [ ] **Step 1: 页面壳**

`page.tsx` 为服务端组件，导出 `<AiWizardClient />`（metadata title「AI 生成岗位能力图谱」）。

- [ ] **Step 2: 向导客户端组件**

- 顶部：返回列表链接 + 自定义步骤条（圆圈 + 连线，3 步：上传岗位说明书 → 解析预览 → 完善信息），当前步 ACCENT 高亮。
- `step` state（0/1/2）、`files` state、`parsed` state（`ParsedTask[] | null`）、`parsing` state。
- **第 1 步上传**：虚线 dropzone（仅演示，点击或拖拽均把文件名加入 files，不真的读内容）；下方「使用示例文件」3 个快捷卡片：`储能电站运维技师岗位说明书.pdf`、`储能电站安全规程.docx`、`运维作业指导手册.pdf`，点击即加入；「开始解析」按钮（files 非空才可点）→ `parsing=true`，分阶段进度动画（读取文档 → 抽取任务 → 归纳能力 → 生成知识点与权重，每阶段约 800ms，setInterval 驱动）→ 结束 `setParsed(mockParseJobDocs(files))` 并进第 2 步。
- **第 2 步解析预览**：顶部统计条「共识别 x 任务 / y 能力 / z 知识点，其中低置信 n 项」（从 parsed 实时计算，excluded 不计入）；左列树（任务→能力→知识点，复用 mapping-review 树面板视觉：白卡 + 搜索框可选），每节点前置置信度色点（high green / mid orange / low red）+ Checkbox 控制 excluded（父节点取消勾选级联子节点）；右列选中节点详情：名称 Input（就地改名）、AI 理由（reason，灰底引用块）、知识点额外显示权重 NumberInput 与 mastery Select；低置信节点显示 WarningIcon + 「建议人工确认」提示。
- **第 3 步元信息**：岗位名称 Input（预填「储能电站运维技师」）、专业方向 Select（新能源汽车技术 / 智能网联汽车技术 / 汽车技术服务与营销 / 机电一体化技术）、备注 Textarea；「生成草稿图谱」→ `createDraftGraph({ jobName, majorDirection, sourceDocs: files.map((f) => ({ name: f.name, size: f.size })), buildTasks: (id) => parsedTreeToTasks(parsed, id) })` → toast 成功 → `router.push('/admin/graph/ability/' + graph.id)`。


- [ ] **Step 3: 验证**

tsc 检查 + 浏览器走通：上传示例 → 解析动画 → 预览树剔除 1 个低置信节点并改名 → 元信息 → 生成草稿跳工作台（Task 5 完成前先跳列表也可，路由存在后改为工作台）。

---

### Task 5: 治理工作台骨架 + 能力结构 Tab

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/page.tsx`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/WorkbenchClient.tsx`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/components/WorkbenchHeader.tsx`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/components/StructureTab.tsx`

- [ ] **Step 1: 页壳与状态中枢**

- `[id]/page.tsx`：`export default function Page({ params }: { params: { id: string } })` → `<Suspense fallback={骨架}><WorkbenchClient graphId={params.id} /></Suspense>`（useSearchParams 需 Suspense 边界）。
- `WorkbenchClient`：`mounted` + `graph` state；`useEffect` 内 `getGraph(graphId)`，不存在则渲染空态（「图谱不存在或已被移除」+ 返回列表按钮）。所有编辑操作统一入口：`const mutate = (fn: (g: AbilityGraph) => AbilityGraph) => { const next = fn(graph); setGraph(next); saveGraph(next); }`。
- Tab 由 `useSearchParams().get('tab')` 驱动（structure 默认 / versions / impact），切 Tab 用 `router.replace` 写 query。Tabs 组件受控（index + onChange），样式：白卡容器、选中 Tab ACCENT 下划线。
- `WorkbenchHeader`：返回列表、AdminIcon `layers` 图标块、岗位名 + 专业方向 + 当前版本徽标（`currentVersion` 空时显示「未发布」）+ 状态徽标；右侧「发布新版本」主按钮（ACCENT，点击打开 PublishModal——Task 7 实现，本任务先放占位 onOpen 透传）+「AI 重新生成」次按钮（Confirm 弹窗「将用 AI 结果覆盖当前草稿树」→ `mutate(withAiRegenerated)` + toast）。
- 发布按钮旁用小字展示闸门状态：`getPublishGate(graph).ok ? '校验通过' : `${reasons.length} 项待处理``（橙色）。

- [ ] **Step 2: 能力结构 Tab（StructureTab）**

- 布局：`Grid templateColumns="280px 1fr 300px" gap={4}`，三栏均白卡。
- **左栏 TreeNav**：搜索框 + 状态过滤 Select（全部/新增/已废弃）+ 四层树（图谱根 → 任务 → 能力 → 知识点），ChevronDown/Right 折叠；节点行显示 code（mono 小字灰）+ 名称 + 状态 Tag（new=green「新」、deprecated=gray 删除线）；知识点行尾显权重 `40%`；搜索时按 `code+name` 过滤并自动展开；状态过滤「已废弃」只显示 deprecated 子树。
- 树底部/任务行 hover 出现「+」：任务级 → `mutate(withAbilityAdded(g, taskCode, '新能力'))`；能力级 → `mutate(withKnowledgeAdded(g, abilityCode, '新知识点'))`；树顶部按钮「+ 任务」→ `mutate(withTaskAdded(g, '新任务'))`。新增后自动选中该节点。
- **中栏 NodeEditor**：按选中节点层级渲染表单——任务/能力：名称 Input、描述 Textarea、code 只读展示；知识点：名称、权重 NumberInput（0-100）、mastery Select（了解/掌握/精通）。onBlur 或 onChange 防抖提交 `mutate(withNodeUpdated(g, code, patch))`。底部操作行：上移/下移（`withNodeMoved`，边界禁用）、删除按钮（status==='new' 直接删 + toast；否则弹 Confirm：「该内容已发布，删除后将进入下次发布的废弃清单，并标记待处理影响」→ `mutate(withNodeRemoved)`）。未选中时显示引导空态（「从左侧选择节点进行编辑」）。
- **右栏 ContextPanel**：选中知识点 → 「同能力权重分配」：进度条（已分配 x%，=100 green、否则 orange）+ 兄弟知识点列表（名称 + 权重 + 占比条）+ 权重和 ≠100 时 WarningIcon 提示「发布前需调整至 100%」；选中能力 → 「关联课程」列表（`graph.linkedCourses`：courseName + mappingCount 条映射，空则「暂无课程引用」）；选中任务 → 任务统计（能力数/知识点数/权重异常能力数）。
- 权重编辑后校验提示实时更新（validateWeights(graph.tasks) 结果传给 ContextPanel）。

- [ ] **Step 3: 验证**

tsc 检查 + 浏览器走通 g1 工作台：树正确渲染（含 B3 废弃删除线、B5「新」标签）、编辑 A1-1 权重改 70 出现校验提示、删除 B2 弹出废弃确认。

---

### Task 6: 版本记录 Tab + 快照只读弹窗

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/components/VersionsTab.tsx`

- [ ] **Step 1: 版本时间线**

- 竖向时间线（左侧竖线 + 圆点）：草稿版本置顶（orange 圆点 + 「草稿待审」Tag + 浅橙底卡片）、current（green + 「当前发布」）、archived（gray + 「历史版本」）。
- 每条：版本号（大字）+ publishedAt（草稿显示「未发布」）+ changeSummary + diff 统计行（`+${diff.added.length} 新增 / ~${diff.modified.length} 修改 / −${diff.deprecated.length} 废弃`，分别 green/blue/red 小 Tag）+ nodeCounts 摘要 + 草稿版本若有 pending deprecations 显示 WarningIcon「n 项废弃影响待处理」。
- 「查看快照」按钮 → Modal（size="3xl"）：只读树（任务→能力→知识点，知识点带权重与 mastery Tag，deprecated 灰显删除线），Modal 头部显示版本号 + nodeCounts；快照为空数组时回退展示当前 `graph.tasks` 并标注「草稿快照为当前编辑树」。

- [ ] **Step 2: 验证**

tsc 检查 + 浏览器：g1 版本记录显示 v2.4 草稿置顶（含 1 项待处理提示）、v2.3 当前、v2.2 历史；打开 v2.3 快照弹窗为只读树且无 B5。

---

### Task 7: 影响分析 Tab + 发布弹窗

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/components/ImpactTab.tsx`
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/[id]/components/PublishModal.tsx`

- [ ] **Step 1: 影响分析 Tab**

- 数据：草稿版本的 deprecations；为空显示空态（CheckCircleIcon +「当前草稿无废弃影响」）。
- 每条废弃项卡片：code + 名称 + 状态 Tag（pending orange「待处理」/ handled green「已处理」/ ignored gray「已忽略」）、AI 替代建议（引用块）、受影响课程列表（courseName + `${mappingCount} 条映射`）、说明小字「发布后相关课程映射将标记失效，需课程负责人重新绑定」。
- 操作（仅 pending 可点）：「标记已处理」→ `mutate(withDeprecationResolved(g, code, 'handled'))`（toast 提示「已记录，视为已线下通知课程负责人」）；「忽略」→ 二次确认后 resolved 'ignored'。
- 顶部 Alert：存在 pending 时 orange「还有 n 项废弃影响未处理，全部处理后才能发布」；全部非 pending 时 green「废弃影响已全部处理，可发布新版本」。

- [ ] **Step 2: 发布弹窗 PublishModal**

- Props：`isOpen, onClose, graph, onLocate: (abilityCode: string) => void, onGoImpact: () => void, onPublished: (next: AbilityGraph) => void`。
- 内容：目标版本号（`草稿版本?.version ?? nextVersion(currentVersion)`）、变更摘要 Textarea（预填草稿 changeSummary 或空，必填校验）、diff 预览统计（`computeDiff(currentSnapshot, cleanTree 预览)`——预览剔除 deprecated 后的 added/deprecated 计数；cleanTree 需在 store 导出供复用，加入 store 导出清单：cleanTree）、发布闸门清单：三项逐行 ✓/✗（树非空 / 权重全部达标 / 废弃影响已处理），权重问题行带「定位」按钮（关闭弹窗 + onLocate(abilityCode) → WorkbenchClient 切 structure Tab 并选中该能力）、废弃 pending 行带「前往处理」（关闭弹窗 + onGoImpact → 切 impact Tab）。
- 「确认发布」按钮：gate.ok 且摘要非空才可点 → `publishGraph(graph, summary)` → onPublished(next)（WorkbenchClient setGraph + saveGraph + toast「v2.4 发布成功」+ 切到 versions Tab）。

- [ ] **Step 3: 验证**

tsc + vitest 全绿；浏览器走通设计 §5 故事 4 完整链路（g1：发布弹窗 → 前往处理 → 标记已处理 → 再发布成功 → versions 出现 v2.4）。

---

### Task 8: 手工搭建（/new 空态工作台）

**Files:**
- Create: `projects/app/src/app/admin/(layoutPage)/graph/ability/new/page.tsx`

- [ ] **Step 1: create 模式**

- `new/page.tsx` → `<WorkbenchClient createMode />`（WorkbenchClient 增加可选 prop，同文件修改）。
- createMode 下：不读 store，本地初始化为空草稿 `{ id: '', jobName: '', majorDirection: '', status: 'draft', currentVersion: '', tasks: [], versions: [], linkedCourses: [], sourceDocs: [], updatedAt: '' }`。
- WorkbenchHeader createMode 变体：岗位名显示为 Input（placeholder「请输入岗位名称，如：动力电池维修技师」）、专业方向 Select；隐藏版本徽标、发布按钮、AI 重新生成与 Tab 栏（仅能力结构）。
- StructureTab 空树时显示引导卡片（AdminIcon sparkles +「先创建第一个任务」+ 任务名 Input + 创建按钮）。
- 首次创建任务时：jobName 为空则阻断并 toast「请先填写岗位名称」；否则 `createDraftGraph({ jobName, majorDirection, sourceDocs: [], buildTasks: (id) => [{ id: \`${id}-A\`, code: 'A', name: 任务名, description: '', status: 'new', abilities: [] }] })` → `router.replace('/admin/graph/ability/' + graph.id)`（后续编辑由 [id] 路由接管，退出 createMode）。

- [ ] **Step 2: 验证**

tsc + 浏览器：/new → 引导卡片 → 填岗位名 → 创建首个任务 → 路由替换为 /admin/graph/ability/g10x → 继续添加能力/知识点正常。

---

### Task 9: 全链路验收

**Files:**
- 无新增（仅验证，发现问题回对应 Task 修）

- [ ] **Step 1: 单测全绿**

Run: `pnpm vitest run projects/app/test/abilityGraph/abilityGraph.test.ts --coverage.enabled=false`
Expected: 12/12 PASS

- [ ] **Step 2: 类型与 lint**

Run: `cd projects/app && pnpm exec tsc --noEmit --pretty false 2>&1 | grep -F "graph/ability" || echo "ability OK"`
Run: `cd projects/app && pnpm exec next lint --file "src/app/admin/(layoutPage)/graph/ability/**" 2>&1 | tail -5`
Expected: ability 相关无错误（存量问题不处理）

- [ ] **Step 3: 按设计 §5 五步演示故事线走查（dev server 3388）**

1. 建图谱：列表 → AI 生成 → 示例文件 → 解析动画 → 预览（剔除 B2-2、改 A1 名、调 A1-1 权重 70→校验提示出现在工作台）→ 元信息 → 生成草稿进工作台
2. 管能力：新图谱新增能力 → 知识点权重先凑 80% 看右栏提示 → 调满 100%
3. 发版本：发布弹窗权重项 ✗ → 定位跳转选中问题能力 → 修复 → 发布成功 → versions 出现 v1.0 含 diff 统计
4. 废弃影响：进 g1 → 发布弹窗废弃项 ✗ → 前往处理 → 标记已处理 → 发布 v2.4 成功 → 树中 B3 消失
5. 对照已发布：g2 工作台 → 版本记录查看 v1.6 快照（只读）→ 删除某能力弹「将进入废弃清单」提示 → 取消
