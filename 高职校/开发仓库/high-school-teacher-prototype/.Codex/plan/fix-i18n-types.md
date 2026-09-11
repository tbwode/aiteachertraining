# Fix i18n Type Errors in StudyPageClient

## 问题分析
`StudyPageClient.tsx` 中存在 TypeScript 类型错误，原因是：
1. `t()` 函数被传入了 `string | undefined` 类型，而该函数在严格模式下要求传入有效的翻译 Key（非 `undefined`）。
2. `courseTitleKey` 等变量是从 API 获取的动态字符串，不属于 `i18next` 预定义的字面量类型 union。
3. `displayData` 对象中缺少 `lessonMetaKey` 属性，导致在使用时虽然类型允许（Optional）但实际值为 `undefined`。

## 解决方案
1. 在 `useMemo` 中为 `courseTitleKey` 和 `lessonTitleKey` 提供默认值（如空字符串或默认文案），确保其类型为 `string`。
2. 在调用 `t()` 时，将动态 Key 转换为 `any` 类型，以绕过严格的 Key 类型检查。
3. 实现 `lessonMetaKey` 的逻辑，计算当前的章节和课件索引，并拼接为展示文本。

## 待变动文件
- `projects/app/src/app/student/(layoutPage)/study/components/StudyPageClient.tsx`

## 验证计划
- 检查代码编译是否通过。
- 确认课程标题、课件标题及 "第X章 · 第X节" 能够正确显示。
