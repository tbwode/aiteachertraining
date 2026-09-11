# 管理端岗位能力图谱治理 · 产品原型设计

- 日期：2026-08-28
- 范围：高职校教学平台 · 管理端 · 图谱中心 / 岗位能力图谱
- 形态：可交互产品原型（mock 数据 + 内存态，无后端接口）
- 状态：设计已与需求方逐节确认（§1–§4 均通过）

## 1. 背景与目标

高职校教学平台存在两类图谱资产：**岗位能力图谱**（管理端治理，描述岗位的能力要求）与**课程知识图谱**（教师端建设，描述课程内容）。两者的关联（映射审核）已在教师端有原型（`/teacher/graph/mapping-review`）。

本期聚焦**管理端岗位能力图谱治理**的产品原型，覆盖四件事：

1. 图谱创建（AI 从岗位说明书生成 / 手工搭建）
2. 能力结构编辑（任务-能力-知识点的增删改）
3. 版本发布与留痕
4. 废弃内容对已关联课程的影响处理

现有雏形：`/admin/graph/ability` 列表页 + 版本抽屉（`AbilityGraphPageClient.tsx`），本期在其基础上扩展为完整工作台。

## 2. 核心领域模型

层级结构（已与需求方确认）：

```
岗位（= 图谱本身）
└── 任务 JobTask            code: "A"
    └── 能力 Ability        code: "A1"
        └── 知识点 AbilityKnowledge   code: "A1-2"，带权重
```

### 2.1 权重规则

- 权重仅挂在**知识点层**；同一能力下所有兄弟知识点的权重之和必须 = 100%。
- 任务、能力层不挂权重（需求方已确认此边界）。
- 编辑态：每个能力节点显示权重分配进度（如「已分配 85%」），未满/超出醒目标记。
- 发布闸门：发布新版本时全树校验，存在权重之和 ≠100% 的能力则阻断发布并定位问题节点。

### 2.2 TypeScript 类型（mock 层）

```ts
type Mastery = '了解' | '掌握' | '精通';
type NodeStatus = 'active' | 'deprecated' | 'new';

// 第 4 层：知识点（叶子，挂权重）
type AbilityKnowledge = {
  id: string;
  code: string;            // "A1-2"
  name: string;
  weight: number;          // 0–100，同能力下兄弟之和 = 100
  mastery: Mastery;
  status: NodeStatus;
};

// 第 3 层：能力
type Ability = {
  id: string;
  code: string;            // "A1"
  name: string;
  description: string;
  knowledges: AbilityKnowledge[];
};

// 第 2 层：任务
type JobTask = {
  id: string;
  code: string;            // "A"
  name: string;
  description: string;
  abilities: Ability[];
};

// 版本快照
type GraphVersion = {
  version: string;         // "v2.4"
  status: 'draft' | 'current' | 'archived';
  nodeCounts: { tasks: number; abilities: number; knowledges: number };
  publishedAt?: string;
  changeSummary: string;
  diff: { added: string[]; modified: string[]; deprecated: string[] };  // 按 code 引用
  deprecations: {
    code: string;
    name: string;
    suggestion: string;                  // AI 替代建议
    affectedCourses: { courseId: string; courseName: string; mappingCount: number }[];
    status: 'pending' | 'handled';
  }[];
};

// 第 1 层：岗位 = 图谱主体
type AbilityGraph = {
  id: string;
  jobName: string;
  majorDirection: string;
  status: 'draft' | 'published';
  currentVersion: string;
  tasks: JobTask[];          // 草稿态可编辑树
  versions: GraphVersion[];
  linkedCourses: { courseId: string; courseName: string; mappingCount: number }[];
  sourceDocs: { name: string; size: string }[];
  updatedAt: string;
};
```

### 2.3 设计要点

- **树与版本分离**：`tasks` 为当前草稿树，可编辑；发布后快照进 `versions`，历史版本只读。发布、快照查看、废弃影响均有干净载体。
- **废弃影响挂版本**：`deprecations` 在版本上而非节点上——「废弃」只在发布新版本时产生影响事件；`status: pending/handled` 支撑影响分析 Tab 的待办形态。
- **与教师端对齐**：`mastery` 复用映射审核工作台的「了解/掌握/精通」；能力图谱自带知识点后，后续两图谱关联将落在「课程知识点 ↔ 岗位图谱知识点」（叶子对叶子），本期不改教师端，但编码结构已兼容。
- **既有 mock 迁移**：现有列表页 mock 的类型迁移到上述结构，`linkedCourses` 从数字升级为对象数组以支撑影响分析。

## 3. 路由与信息架构（方案二：列表 + 独立工作台）

```
/admin/graph/ability                      列表页（现有，增强）
/admin/graph/ability/new                 手工搭建（空态工作台，首个节点创建后分配草稿 id）
/admin/graph/ability/create/ai            AI 生成向导（3 步）
/admin/graph/ability/[id]                 治理工作台（单图谱，默认 Tab：能力结构）
/admin/graph/ability/[id]?tab=versions    工作台 · 版本记录
/admin/graph/ability/[id]?tab=impact      工作台 · 影响分析
```

- 手工搭建走 `/admin/graph/ability/new`：与工作台同一组件，初始为空树 + 引导态，创建首个任务后生成草稿 id 并替换路由为 `/admin/graph/ability/[id]`。
- 导航沿用已有「图谱中心 → 岗位能力图谱」入口，无需新增 menuCode。

## 4. 页面交互细节

### 4.1 列表页增强

- 「新建图谱」分裂按钮：主按钮进 AI 向导，下拉含「手工搭建」。
- 卡片新增「进入工作台」主操作；补充三级计数（如 `6 任务 · 24 能力 · 96 知识点`）。
- 状态徽标保持「已发布 / 草稿」；AI 来源的草稿卡显示「AI 生成待审定」角标。
- 现有「版本抽屉」从列表页移除，点击版本号改为跳转工作台版本记录 Tab（避免两处维护）。

### 4.2 AI 生成向导（3 步）

1. **上传**：拖拽上传岗位说明书（mock 多份）；提供「使用示例文件」快捷入口（内置 3 份示例，演示不依赖真实文件）。「开始解析」展示分段进度动画（读取文档 → 抽取任务 → 归纳能力 → 生成知识点与权重），约 3 秒。
2. **解析预览**：左侧四级树（节点带 AI 置信度色点：高/中/低），右侧选中节点详情与 AI 理由；支持勾选剔除、就地改名、调权重；顶部统计「共识别 6 任务 / 24 能力 / 96 知识点，其中低置信 5 项」。
3. **元信息**：岗位名称、专业方向（下拉）、备注；「生成草稿」跳转工作台并 toast。

### 4.3 治理工作台

- **页头**：岗位名 + 专业方向 + 当前版本 + 状态徽标；右侧「发布新版本」主按钮 +「AI 重新生成」次按钮（跳转 AI 向导并预填该图谱的 sourceDocs，生成结果替换当前草稿树，原型中以 confirm 弹窗提示「将覆盖当前草稿」模拟）。
- **Tab 1 能力结构**（默认）：
  - 左侧树导航（任务→能力→知识点），支持搜索与状态过滤（全部/新增/已废弃）。
  - 中间为选中节点的编辑表单（名称、描述、权重、mastery）。
  - 右侧上下文面板：选中知识点时显示「同能力权重分配条」（100% 进度 + 兄弟占比）；选中能力时显示「关联课程列表」（mock 引用 mapping-review 的课程数据）。
  - 每层支持增删改；排序用上移/下移按钮（拖拽排序出原型范围）。
  - 删除已发布内容时弹窗提示「将进入下次发布的废弃清单」。
- **Tab 2 版本记录**：时间线（版本号、变更摘要、diff 统计 +新增/~修改/−废弃、发布人时间）；草稿版本置顶高亮；「查看快照」只读树弹窗。
- **Tab 3 影响分析**：当前草稿发布后将产生的废弃影响清单——每条含被废弃知识点、AI 替代建议、受影响课程及映射数、「标记已处理 / 忽略」——「已处理」表示已线下通知课程负责人改绑；「忽略」表示接受影响、映射将在后续版本自动清理。两者都会把该项置为非 pending，**全部项非 pending 后发布闸门才解锁**。

### 4.4 手工搭建

同一工作台空态进入，树区显示引导卡片（「先创建第一个任务」），其余交互一致。

## 5. 演示故事线（验收路径）

1. **建图谱**：列表页 → AI 生成 → 示例说明书 → 解析动画 → 预览树（剔除 1 低置信节点、改 1 名称、调 1 权重）→ 元信息 → 生成草稿进工作台。
2. **管能力**：新增 1 个能力，为其知识点分配权重——先故意凑不满 100% 看校验提示，再调满。
3. **发版本**（在新建的草稿图谱上）：「发布新版本」先被权重校验拦下并定位问题节点 → 修复后发布成功 → 版本记录出现 v1.0（含 diff 统计）。
4. **处理废弃影响**（切换到既有「动力电池维修技师」图谱，其草稿预置 B3 → B5 废弃项）：发布按钮因存在 pending 影响项而禁用 → 影响分析 Tab 逐条「标记已处理 / 忽略」→ 全部非 pending 后闸门解锁，成功发布 v2.4。
5. **对照已发布图谱**：列表页进已发布图谱工作台 → 版本记录查看历史快照（只读）→ 编辑触发「将进入下次发布废弃清单」提示。

## 6. 范围与非目标

**范围外（YAGNI）**：拖拽排序、多人协作、权限细化、真实 AI 调用、教师端改动、后端接口与持久化。

**技术形态**：全部 mock 数据 + 内存态（刷新还原）；沿用现有管理端 ChakraUI 红主题（`#C8000B`）与 `(layoutPage)` 路由结构；组件目录约定 `graph/ability/components/` + `graph/ability/_mock/`。

## 7. 后续衔接（不在本期）

- 教师端映射目标从「能力点」升级为「岗位图谱知识点」（叶子对叶子）。
- 图谱数据对教学、测评模块的开放调用方式（GraphQuery 门面 / `packages/service/graph` 领域包），属整体蓝图议题，另行立项。
