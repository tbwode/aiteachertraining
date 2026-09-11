# 高职校全量 Mock 原型仓库设计

## 1. 目标

在当前仓库旁边创建独立的 `high-school-teacher-prototype` 目录，用于产品原型迭代。

- 保留当前 Next.js/TypeScript/Chakra UI 页面与交互代码。
- 不请求 Java、FastGPT、通知、资源库及其他外部后端。
- 管理员、普通教师、学生均可用演示身份进入。
- 页面查询、增删改、发布、生成、上传等交互由本地 Mock 数据驱动。
- 原仓库 `high-school-teacher-develop` 不做业务代码改动。

## 2. 新仓库复制范围

复制源码、锁文件、静态资源、测试和项目文档，排除：

- `.git/`
- `node_modules/`
- `.next/`
- `dist/`
- 覆盖率、日志和 Playwright 临时产物
- `归档.zip` 及其他大型归档包
- `.DS_Store`

新目录不复制 Git 历史，避免与原仓库远程和未提交改动发生混淆。依赖由 pnpm 共享 store 重建。

## 3. Mock 架构

### 3.1 开关与防误连

- 新仓库默认 `NEXT_PUBLIC_MOCK_MODE=true`。
- `next.config.mjs` 在 Mock 模式下不注册任何外部 API rewrite。
- 请求层在 Mock 模式下禁止发出 HTTP 业务请求；未注册接口抛出包含 method/url 的本地错误，不会透传到后端。

### 3.2 集中 Mock 网关

新增 `projects/app/src/mocks/`：

```text
mocks/
├── accounts.ts          # 三种演示身份与菜单权限
├── engine.ts            # method + url 路由、延迟、错误和分页处理
├── store.ts             # localStorage 持久化的页面可变状态
├── handlers/
│   ├── auth.ts
│   ├── common.ts
│   ├── admin.ts
│   ├── teacher.ts
│   └── student.ts
└── fixtures/
    ├── admin.ts
    ├── teacher.ts
    └── student.ts
```

`request.ts`、`requestTeacher.ts`、`requestStudent.ts` 统一接入 Mock 网关。直接使用 `axios`/`fetch` 的对话与 AI 生成功能改为本地流式文本、进度和结果模拟。

### 3.3 演示账号

Mock 登录仅在新原型仓库内生效：

| 身份 | 账号 | 登录后入口 |
| --- | --- | --- |
| 管理员 | `15815678976` | `/admin` |
| 普通教师 | `15815501001` | `/teacher` |
| 学生 | `20250101` | `/student` |

密码按用户提供的测试密码校验，但不发送到任何服务器。验证码在 Mock 模式下禁用。

## 4. 数据与交互策略

- 列表：支持搜索、筛选、分页和空状态。
- 表单：创建/编辑后立即回写本地 Mock store。
- 删除/发布/状态变更：实时更新本地数据，刷新后保留。
- AI 生成：使用固定阶段进度和可重现的演示结果。
- 文件上传：仅在浏览器内读取文件名/大小和预览 URL，不上传。
- 聊天：使用本地脚本回复与流式打字效果。
- 重置：提供“重置演示数据”入口，便于反复评审。

## 5. 实施顺序

1. 建立轻量源码副本，安装依赖，更改项目名和开发端口。
2. 增加 Mock 开关、出站请求阻断和模拟登录。
3. 接入管理端基础数据与 CRUD。
4. 接入教师端课程、AI 教师、AI 视频、学生、资源与图谱数据。
5. 接入学生端课程、学习、画像、通知与智能体数据。
6. 替换直连 AI/聊天/文件类请求。
7. 运行类型检查、构建和三身份冒烟测试。
8. 打开新原型仓库预览页交付。

## 6. 验收标准

- 断网后仍可登录三种身份并浏览主要页面。
- 浏览器 Network 中无业务后端请求，仅允许 localhost 静态资源。
- 三种身份首页、主导航及核心列表页无白屏、无登录回跳。
- 典型新增、编辑、删除、发布与 AI 生成交互可完成。
- `pnpm build` 通过。

## 7. 假设

- 新目录名默认为 `high-school-teacher-prototype`。
- 保留三种身份和现有全量页面，但优先保证主导航可达的页面。
- 原型数据用于界面评审，不模拟真实后端的并发、权限安全与业务事务。
