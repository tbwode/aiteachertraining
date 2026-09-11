# Repository Guidelines

## 项目结构与模块组织
该包是一个基于 Next.js 14 和 TypeScript 的前端应用，位于更大的 workspace 中。路由入口同时存在于 `src/pages` 和 `src/app`，新增页面时请沿用对应目录的路由方式。通用 UI 组件放在 `src/components`，页面级功能模块放在 `src/pageComponents`，接口与领域逻辑主要位于 `src/web`、`src/service`、`src/global`，静态资源位于 `public/`。

## 构建、测试与开发命令
以下命令默认在当前包目录执行；如需安装依赖，通常应在 workspace 根目录完成。

- `npm run dev`：启动本地 Next.js 开发环境。
- `npm run build`：执行生产构建，并导出到 `dist/`。
- `npm run start`：本地启动生产构建结果。
- `npm run lint`：运行 Next.js 内置 ESLint 检查。
- `npm run build:workers`：通过 `scripts/build-workers.ts` 构建 worker 脚本。
- `npm run build:workers:watch`：开发时监听并自动重建 worker。

## 代码风格与命名约定
使用 TypeScript，保持 2 空格缩进、分号和现有文件一致的尾随逗号风格。优先使用 `@/` 别名导入，而不是过深的相对路径。React 组件使用 `PascalCase`，函数、变量和 hooks 使用 `camelCase`。路由文件遵循 Next.js 习惯，命名为 `index.tsx`、`page.tsx`、`layout.tsx` 等。样式以 SCSS 模块为主，例如 `index.module.scss`。

## 测试约定
当前包已安装 `vitest`，但没有本地 `test` 脚本，且 `tsconfig.json` 排除了 `**/*.test.ts`。在正式测试方案补齐前，请至少执行 `npm run lint` 和 `npm run build` 作为提交前检查。若新增测试，建议将 `*.test.ts`、`*.spec.tsx` 放在功能附近或单独的 `tests/` 目录，并在文档或脚本中补充运行方式。

## 提交与 Pull Request 规范
最近提交记录采用 Conventional Commits，例如 `feat: init-project`、`fix: 改为next14写法`。后续请继续使用 `feat:`、`fix:`、`refactor:`、`docs:` 等前缀，并在冒号后写简洁明确的说明。提交 PR 时应说明改动目的、列出验证步骤、关联任务或 issue；若涉及 `src/pages` 或 `src/app` 下的界面变更，附上截图。

## 配置说明
`next.config.mjs` 当前使用 `output: 'export'`，构建产物输出到 `dist/`，并在生产构建时忽略类型检查和 ESLint 报错。不要把构建成功当作唯一质量信号，提交前仍需自行完成本地验证。
