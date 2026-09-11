---
name: high-school-teacher-i18n
description: "高职校教学平台前端国际化技能：当用户要求把某个页面或组件文件接入国际化、按文件路径自动选择 teacher/pages 国际化方案、抽离硬编码文案、补 locale JSON、注册新 namespace、或修复本项目 i18n 接线问题时使用。适用于 src/app/teacher/** 与 src/pages/**。"
metadata:
  short-description: Add and wire project i18n by file path
---

# High School Teacher i18n

这个 skill 用于本仓库的前端国际化改造。

目标不是泛泛地“支持 i18n”，而是让代理在收到一句类似下面的话时，能直接落地：

- “用 i18n skill 帮我把 `src/app/teacher/(layoutPage)/courses/page.tsx` 添加国际化”
- “用 i18n skill 帮我把 `../../src/pages/account/info/index.tsx` 接入国际化”
- “用 i18n skill 修复这个页面的翻译 key 和 locale 文件”

## 适用范围

本 skill 只针对这个仓库当前的 i18n 结构：

- 教师端 `app` 路由：`src/app/teacher/**`
- 老的 `pages` 路由：`src/pages/**`

不要把它当成通用的 Next.js i18n skill。

它依赖本仓库当前这些实现约定：

- 教师端独立 provider：`src/app/teacher/components/TeacherI18nProvider.tsx`
- 老页面统一 i18n 入口：`src/web/common/i18n/index.ts`
- locale 文件目录：`public/locales`

## 输入约定

用户通常会给你一个页面或组件路径，可能是：

- 仓库相对路径：`src/app/teacher/login/page.tsx`
- 带 `./` 的路径：`./src/pages/account/info/index.tsx`
- 带 `../` 的相对路径：`../../src/pages/account/info/index.tsx`
- 绝对路径

你必须先把它规范化成仓库内真实路径，再继续。

如果用户给的是组件路径而不是页面路径，也继续处理，但要先判断它服务于哪条路由链路。

## 总体流程

严格按这个顺序执行。

### Step 1: 解析目标文件

1. 解析并确认目标路径存在。
2. 读取目标文件。
3. 如有必要，读取相邻文件来判断文案来源和命名空间归属：
   - 同目录 `layout.tsx`
   - 相邻 `data.ts`
   - 相关组件文件
   - 当前文件已有的 `useTranslation(...)`

### Step 2: 识别路由体系

根据路径走不同分支。

#### 分支 A: `src/app/teacher/**`

走教师端方案。

#### 分支 B: `src/pages/**`

走老页面方案。

#### 分支 C: 共享组件

如果文件在 `src/components/**`、`src/pageComponents/**` 等共享目录：

1. 先查这个组件主要被哪一侧使用。
2. 如果只被教师端使用，按教师端方案处理。
3. 如果只被老页面使用，按老页面方案处理。
4. 如果同时被两侧使用，优先复用组件里现有的 i18n 方式，不要强行把一侧方案灌给另一侧。

如果确实无法安全判断，再向用户说明冲突点，但默认应尽量自己完成判断。

## 教师端方案

教师端只使用 `teacher` 命名空间。

### 你必须改的文件

默认只会涉及：

- 目标页面/组件文件
- `public/locales/zh-CN/teacher.json`
- `public/locales/en/teacher.json`

一般不需要改：

- `public/locales/constants.ts`
- `public/locales/i18next.d.ts`
- `src/web/common/i18n/index.ts`

因为 `teacher` 命名空间已经接好了。

### 教师端必须遵守的规则

1. 组件里统一使用：

```tsx
const { t } = useTranslation('teacher');
```

2. 文案统一写入：

- `public/locales/zh-CN/teacher.json`
- `public/locales/en/teacher.json`

3. 不要默认把教师端业务文案塞进 `common`

只有真正全站可复用的通用短词，才考虑放 `common`。默认仍然是放 `teacher`。

4. Key 按业务块组织，不要平铺

推荐：

```json
{
  "scores": {
    "title": "成绩管理",
    "export": "导出成绩"
  }
}
```

不推荐：

```json
{
  "exportScoresButtonText": "导出成绩"
}
```

5. 如果目标文件是 Server Component，不要硬塞 `useTranslation`

优先方案：

- 把需要国际化的 UI 拆成一个小的 Client Component

次优方案：

- 将当前页面改为 Client Component

优先选择改动范围最小的方式。

6. 动态文案优先用插值

推荐：

```json
{
  "summary": {
    "weeklyCourses": {
      "value": "{{value}} 节"
    }
  }
}
```

```tsx
t('dashboard.summary.weeklyCourses.value', { value: 18 });
```

不要直接在 JSX 里手拼：

```tsx
`${count} 节`
```

7. 动态 key 不要用模板字符串

不要这样：

```tsx
t(`languageSwitcher.options.${option}`);
```

要改成显式映射：

```tsx
const localeLabelMap = {
  'zh-CN': 'languageSwitcher.options.zh-CN',
  en: 'languageSwitcher.options.en'
} as const;

t(localeLabelMap[locale]);
```

8. 如果用户要求给教师端新增第三种语言，不只是加 json

还必须同步检查：

- `src/app/teacher/components/TeacherI18nProvider.tsx`

重点看：

- `teacherLocales`
- locale 归一化逻辑
- 默认语言和回退语言

## 老页面方案

老页面继续沿用当前 namespace 体系。

### 先复用，不要先新建

优先复用当前文件或相邻模块已经在用的 namespace。

高频 namespace：

- `common`
- `login`
- `app`
- `chat`
- `dataset`
- `workflow`
- `user`
- `account`
- `account_team`
- `account_bill`
- `account_apikey`
- `account_inform`
- `account_info`
- `account_model`
- `account_promotion`
- `account_setting`
- `account_thirdParty`
- `account_usage`
- `dashboard_evaluation`
- `dashboard_mcp`
- `file`
- `publish`

### 老页面默认要补三种语言

如果你改的是老页面 namespace，对应 locale 文件通常都要一起补：

- `public/locales/zh-CN/<namespace>.json`
- `public/locales/en/<namespace>.json`
- `public/locales/zh-Hant/<namespace>.json`

除非用户明确接受暂不补齐，否则不要只补 `zh-CN`。

### 组件里的调用方式

保持当前文件风格一致。

常见写法：

```tsx
const { t } = useTranslation();
t('account:profile.title');
```

或：

```tsx
const { t } = useTranslation('account');
```

如果当前文件已经采用某种写法，继续沿用，不要无意义重构。

### 什么时候允许新建 namespace

只有在下面情况同时成立时，才新建：

1. 当前业务域足够独立
2. 复用现有 namespace 会明显污染边界
3. 你愿意同时补齐注册文件和多语言文件

### 新建 namespace 的必改清单

如果新建 namespace，必须同步修改：

1. 新增 locale 文件

- `public/locales/zh-CN/<namespace>.json`
- `public/locales/en/<namespace>.json`
- `public/locales/zh-Hant/<namespace>.json`

2. 注册 namespace 常量

- `public/locales/constants.ts`

3. 注册 i18n 类型

- `public/locales/i18next.d.ts`

4. 注册运行时加载列表

- `src/web/common/i18n/index.ts`

漏任何一个都算没接完整。

## 文案抽取规则

收到“帮我把某个页面加国际化”这类请求时，你要主动做下面这些事，而不是只把标题替换掉。

### 需要抽取的内容

- 页面标题
- 副标题
- 按钮文案
- 输入框 placeholder
- 空状态文案
- Toast / Modal / Alert 文案
- 表头
- Tabs / 筛选项 / 操作菜单
- aria-label

### 不要乱抽的内容

- 后端返回的业务数据
- 用户输入内容
- 纯技术标识符
- 接口字段名

### 数据层的文案

如果一个页面的数据文件里直接写了中文展示文案，例如：

- `data.ts`
- mock 数据
- summary / todo 列表

优先改成“稳定 id + 渲染时翻译”的结构。

例如把：

```ts
{ label: '本周课程', value: '18 节' }
```

改成：

```ts
{ id: 'weeklyCourses', value: 18 }
```

然后在 UI 层：

```tsx
t('dashboard.summary.weeklyCourses.label')
t('dashboard.summary.weeklyCourses.value', { value: item.value })
```

## 输出质量要求

做完后，你的改动至少要满足：

1. 目标页面没有明显硬编码中文或英文残留
2. locale 文件已同步更新
3. 如果是老页面新增 namespace，注册链路已补齐
4. 不引入第二套 i18n 库
5. 不随意改全局 i18n 架构
6. 不把教师端方案和老页面方案混写

## 你必须避免的行为

### 不要做这些

- 不要引入 `next-intl`、`react-intl` 等第二套方案
- 不要因为一个页面国际化就改全局架构
- 不要顺手把大量无关页面一起翻译
- 不要把动态 key 到处写成模板字符串
- 不要只补中文就结束，尤其是老页面
- 不要把用户没要求的业务文案重命名得面目全非

### 不要碰这些，除非用户明确要求

- `next.config.mjs` 的整体 i18n 策略
- 教师端和老页面的架构边界
- `basePath` / export 模式
- 全站语言策略

## 验证顺序

在可以运行命令时，按下面顺序验证：

1. 对单文件或改动文件做 lint / eslint 检查
2. 能跑局部验证时先跑局部
3. 最后再跑全量 `npm run lint`
4. 如果改动影响构建链路，再跑 `npm run build`

如果仓库全量类型检查特别重，不要为了一个页面改动强行跑到内存炸掉。

## 推荐的工作输出格式

当你完成任务时，向用户汇报时至少说明：

1. 目标文件按哪套方案处理
2. 你改了哪些 locale 文件
3. 是否新增 namespace
4. 是否需要补充 `zh-Hant`
5. 做了哪些验证

## 示例任务

### 示例 1：教师端页面国际化

用户：

```text
用 i18n skill 帮我把 src/app/teacher/(layoutPage)/students/page.tsx 添加国际化
```

你应该自动执行：

1. 判断这是教师端页面
2. 使用 `teacher` namespace
3. 将硬编码文案改成 `t('students.xxx')`
4. 更新：
   - `public/locales/zh-CN/teacher.json`
   - `public/locales/en/teacher.json`
5. 如页面不是 Client Component，则做最小化改造

### 示例 2：老页面复用已有 namespace

用户：

```text
用 i18n skill 帮我把 src/pages/account/info/index.tsx 添加国际化
```

你应该自动执行：

1. 判断这是老页面
2. 优先复用 `account_info` 或当前文件已使用的 namespace
3. 补齐 `zh-CN` / `en` / `zh-Hant`
4. 保持当前文件的 `t('namespace:key')` 风格一致

### 示例 3：用户给相对路径

用户：

```text
用 i18n skill 帮我把 ../../src/pages/login/index.tsx 添加国际化
```

你应该自动执行：

1. 先把路径解析到仓库真实文件
2. 再按老页面方案处理

## 与仓库内文档的关系

如果需要更详细的背景规则，优先参考：

- `public/locales/i18n 开发说明.md`

这个 skill 是执行流程。

那份文档是项目说明。

当两者出现冲突时，以仓库当前代码结构为准，并在必要时同步更新 skill。
