# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 输出要求

- 使用中文与用户沟通。
- 设计文档写到 `.claude/design/`。
- Plan 写到 `.claude/plan/`。

## 仓库概览

这是一个 pnpm workspace monorepo。核心业务在 `projects/app`，共享逻辑按职责拆到 `packages/*`。

### Workspaces

- `projects/app`：主 Web 应用，基于 Next.js 14；同时存在 `src/pages` 和 `src/app` 两套路由。
- `packages/global`：跨端共享的类型、常量、API 契约、OpenAPI 定义。
- `packages/service`：服务端领域逻辑与基础设施封装，包括 MongoDB、Redis、BullMQ、向量库、工作流、权限等。
- `packages/web`：共享前端能力，包括 Chakra 主题、通用组件、hooks、i18n、zustand/context 封装。
- `test`：Vitest 根测试入口、setup 与全局初始化。
- `scripts/icon`、根脚本：图标初始化、i18n 生成等仓库级辅助脚本。

## 常用命令

### 安装依赖

在仓库根目录执行：

```bash high-school-teacher
pnpm i
```

如果 Node >= 20 安装阶段遇到 snapshot 问题，可按 `dev.md` 使用：

```bash high-school-teacher
NODE_OPTIONS=--no-node-snapshot pnpm i
```

### 开发

主应用开发：

```bash high-school-teacher/projects/app
pnpm dev
```

等价的 Make 用法：

```bash high-school-teacher
make dev name=app
```

### 构建

仓库根目录没有统一 `build` script，通常构建主应用：

```bash high-school-teacher/projects/app
pnpm build
```

启动生产构建：

```bash high-school-teacher/projects/app
pnpm start
```

构建 worker：

```bash high-school-teacher/projects/app
pnpm build:workers
```

监听 worker 构建：

```bash high-school-teacher/projects/app
pnpm build:workers:watch
```

Docker / 镜像构建走 Makefile：

```bash high-school-teacher
make build name=app image=<image>
```

### Lint / 格式化

仓库级：

```bash high-school-teacher
pnpm lint
pnpm format-code
```

应用级：

```bash high-school-teacher/projects/app
pnpm lint
```

### 测试

根测试使用 Vitest，配置在 `vitest.config.mts`。

运行全部测试：

```bash high-school-teacher
pnpm test
```

运行工作流相关测试：

```bash high-school-teacher
pnpm test:workflow
```

运行单个测试文件：

```bash high-school-teacher
pnpm test -- test/cases/<file>.test.ts
```

按测试名过滤：

```bash high-school-teacher
pnpm test -- -t "<test name>"
```

同时指定文件和测试名：

```bash high-school-teacher
pnpm test -- test/cases/<file>.test.ts -t "<test name>"
```

### 生成类脚本

在仓库根目录执行：

```bash high-school-teacher
pnpm create:i18n
pnpm initIcon
pnpm gen:theme-typings
```

## 架构要点

### 1. 主应用是“壳”，共享包承载大部分复用逻辑

`projects/app` 不是一个纯前端工程，它同时消费：

- `@fastgpt/global`：共享类型、错误码、API 类型、OpenAPI 定义。
- `@fastgpt/service`：服务端能力，供 `projects/app/src/service/*` 和服务端页面/API 调用。
- `@fastgpt/web`：共享前端组件、状态管理、i18n、主题。

路径别名见 `tsconfig.json:17`，Vitest 也在 `vitest.config.mts:5` 做了相同映射。

### 2. 路由层同时存在 Pages Router 和 App Router

`projects/app` 目前是混合路由：

- `src/pages/*`：传统 Next.js Pages Router。`src/pages/_app.tsx:1` 负责全局 Layout、Chakra、React Query、i18n 等上下文装配。
- `src/app/*`：新 App Router 页面，仓库里教师端/管理端已有大量页面放在这里。

改页面前先确认目标功能属于哪套路由，不要混用页面约定。

### 3. 前端分层不是只有 components

在 `projects/app` 中通常按下面方式理解：

- `src/components`：通用组件与跨页面 UI。
- `src/pageComponents`：页面级组合模块。
- `src/web`：前端基础设施与领域 hook / client API / context（实际运行的代码）。
- `src/service`：FastGPT 时代的服务端适配层；本仓库静态导出，**不会被执行**。
- `src/global`：当前应用补充的类型定义与 API 类型。

看到 `projects/app/src/service/**/*.ts` 时，按"FastGPT 遗留服务端代码"理解，**不要当作正在运行的后端**。

### 4. `packages/service` 是 FastGPT 遗留服务层，本仓库下不实际运行

`packages/service` 保留了 FastGPT 上游的后端能力（mongo / redis / bullmq / vectorDB / core/* / support/*），但本仓库走 Next.js `output: 'export'` 静态导出（见 `projects/app/next.config.mjs:20`）：

- 没有 `projects/app/src/pages/api` 目录，构建产物只是 SPA。
- `projects/app/src/instrumentation.ts:10` 显式 `if (FRONTEND_ONLY === 'true') return;` 跳过初始化。
- `packages/service/*` 与 `projects/app/src/service/*` 中的 mongoose schema、bullmq 队列、向量库代码 **完全不会跑**。

真正的"业务后端"在仓库外：

- `high-school-01.huayungpt.com`：Java 业务服务（教务、用户、AI 分身等）。
- `ai-course-fast.huayuntiantu.com`：FastGPT 部署（聊天、知识库）。

排查 API、权限、工作流问题时，**不要在 packages/service 里改代码**——前端只是消费外部 API。

### 5. API 契约在 `packages/global/openapi`，但本仓库不挂这些路由

OpenAPI 文档聚合入口在 `packages/global/openapi/index.ts:1`，定义了 app/chat/dataset/plugin/support 等 path。

注意：这些 OpenAPI 定义在本仓库不会变成实际的 `/api` 路由（静态导出无 API 路由）。它们只用于：

1. 给前端 client 提供 TS 类型与请求/响应 schema。
2. 给上游 FastGPT 服务版本作为契约参考。

理解一个 API 时：

1. 先看 `packages/global/openapi/*` 的类型契约。
2. 再看 `projects/app` 中前端调用方（`src/web/**/api.ts` 等）。
3. 实际后端实现已经不在本仓库——是外部 Java / FastGPT 服务。

### 6. `src/service/common/system/index.ts` 是 FastGPT 时代的初始化逻辑

文件存在但**不会执行**：`instrumentation.ts` 在 FRONTEND_ONLY 模式下提前 return，且静态导出没有 Node runtime 加载它。

`projects/app/data/config.json` 同理：保留为 FastGPT 历史，本仓库实际通过外部 API 拉 `feConfigs`，本地这个文件无人读取。改前端可见配置请从外部接口或 `useSystemStore` 入手，不要改 config.json。

### 7. i18n 是一等公民

仓库使用 `next-i18next` / `react-i18next`，同时存在共享工具 `i18nT`。涉及文案改动时，通常需要同步检查：

- 页面/组件中的 `useTranslation`
- 静态配置或模板中的 `i18nT`
- 生成脚本 `pnpm create:i18n`

## 测试体系

Vitest 配置位于 `vitest.config.mts:1`，关键特征：

- alias：`@ -> projects/app/src`，`@fastgpt -> packages`，`@test -> test`
- setup：`test/setup.ts`
- globalSetup：`test/globalSetup.ts`
- include：根测试、`projects/app/test`、`projects/sandbox/test`、`projects/marketplace/test`
- `fileParallelism: false`：文件级串行，避免 MongoDB 冲突
- coverage 默认开启，报告输出到 `coverage/`

如果测试依赖数据库或全局初始化，优先复用现有测试目录和 setup，不要单独造一套测试启动方式。

## 代码约定

- 优先使用 `type`，不是 `interface`。
- 输出语言使用中文。
- 对于功能实现和复杂问题修复，先产出设计文档并让用户确认，再实施。
- 工作节奏遵循“设计文档 → 测试示例 → 代码编写 → 测试运行 → 修正代码/文档”。

## 关键提醒

- 根目录没有 `pnpm build` 通用脚本；构建以 `projects/app` 为主。
- 当前仓库要求 Node `>=20`。
- 仓库内 Pages Router 与 App Router 混用，定位页面入口前要先确认。
- 测试的真实入口、include 范围、并行策略以 `vitest.config.mts` 为准。
- **`packages/service` 与 `src/service` 是 FastGPT 上游遗留的服务层，本仓库静态导出模式下不实际运行；改业务功能只能改前端调用或外部 Java/FastGPT 服务。**

## 提交规范（强约束）

格式：`<type>(<scope>): <description>`

- `<type>` 限定：`feat / fix / refactor / docs / style / test / chore / perf / ci / build / revert`
- `<scope>` **必填**，使用 kebab-case，建议从以下取值：
  - 业务侧：`<domain>`、`<agent>`（按实际领域/agent 名填写）
  - infrastructure 模块：`checkpointer`、`skill-store`、`agent-registry`、`agent-stream`、`tools`
  - core 模块：`config`、`logging`、`model`
  - API/Schema/工程化：`api`、`schema`、`deps`、`env`、`readme`、`docker`、`ci`
- `<description>` 长度 **≥ 15 字**，禁用中文冒号（用半角 `:`）
