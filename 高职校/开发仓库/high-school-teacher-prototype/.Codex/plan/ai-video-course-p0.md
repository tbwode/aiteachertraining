# 教师端 AI 视频课（P0 核心链路）实施计划

> 设计细节见 `.Codex/design/ai-video-course-p0.md`

## 概要

教师端「AI备课」新增「AI视频课」菜单，前端 Mock 全流程：模式选择首页 → 文本生成 → 分镜编辑 → 异步任务进度 → 预览下载。PPT/图文/模板广场入口占位（P1），二次编辑工作台与多分辨率导出（P2）不做。

## 实施步骤

1. **菜单 & 路由**：TeacherLayout lessonPrep 加子菜单（无 menuCode）；新增 `(layoutPage)/ai-video/` 路由组（page / create/text / project/[id]）
2. **Mock 数据层**：`src/teacher/types/aiVideo.ts` + `src/teacher/api/aiVideo.ts`；localStorage `ai_video_projects`；时间戳推导任务状态（刷新不丢失）；敏感词/过短校验
3. **页面**：首页（模式卡片+项目列表+复制/删除二次确认）、文本创建页（提示词+高级参数）、工作台（分镜编辑/五阶段进度/失败话术/预览+720P 下载，1080P/4K 置灰会员）
4. **i18n**：TEACHER_PAGE_SECTIONS 加 `aiVideo`；三语 `teacher-aiVideo.json`；`teacher-nav.json` 加 `aiVideoCourse`
5. **Mock 媒体**：ffmpeg 生成 3 比例占位 MP4 + 封面 + 6 张分镜占位图至 `public/media/ai-video/`
6. **测试**：`projects/app/test/aiVideo/aiVideo.test.ts`（CRUD/排序/状态机/安全校验/分镜生成）；补 `test/setup.ts`、`test/globalSetup.ts` 最小文件
7. **验证**：`pnpm test`、`tsc --noEmit`、`pnpm lint`

## 默认决策

- 分镜排序用上移/下移按钮（不引入拖拽依赖）
- Mock 默认成功；prompt 含「测试失败/测试拦截/测试繁忙」触发三类失败话术
- 水印/转码/会员仅 UI 标注；未完成项目禁止导出

## 执行记录（2026-08-19 第三轮：真实视频 + 数字人 + 播放修复）

- [x] 真实视频演示链路：`gauss-elimination.mp4`（51.4s）+ 封面 + 13 张抽帧缩略图；`isGaussDemoTopic` 主题识别；13 条分镜与视频逐屏对齐（讲稿教师口吻）；成功成片用真实视频
- [x] 数字人功能化：启用开关 + 双形象选择（SVG 插画头像）；播放器右下角叠加（播放中脉冲动画）；时间轴数字人轨道联动；配置即改即存
- [x] 修复播放被立即暂停（历史坏数据 trim:{0,0} → normalizeProject 自愈 + UI 防御）
- [x] 修复 ShotSidebar button 嵌套 button 的 hydration 错误（role="button" + 键盘支持）
- [x] 测试 36/36 通过（新增高斯示例 5 用例 + trim 自愈 2 用例）；eslint、tsc 通过
- [x] 浏览器验收：播放推进、字幕逐段切换、刷新持久化（数字人/trim 均保留）、导出下载真实 MP4、console 0 错误

## 执行记录（2026-08-19 第六轮：AI编辑沉底 + 讲稿当前分镜化）

- [x] AI编辑：移除「快捷指令」文字标签（chips 保留）；输入框沉底（面板三层 flex 链 + VideoResult 主区行 `align="stretch"` 修复 Chakra 默认居中导致的高度塌陷）
- [x] 讲稿面板：13 条列表改为当前分镜讲稿卡（序号+标题+时间码+试听+textarea 即改即存），跟随 selectedShotId；未选中显示提示；i18n 三语补 `currentScript`/`noShot`
- [x] 测试 44/44 通过；eslint 0 问题；tsc 0 错误
- [x] 浏览器验收：讲稿编辑即时落 localStorage、试听 Play↔Square 切换、AI编辑输入框贴底（截图确认）、Console 0 错误

## 执行记录（2026-08-19 第七轮：数字人面板重构 + 画布摆放交互）

- [x] 形象库扩充至 11 个（写实 8 / 卡通 3）：9 个新 AI 生成 SVG 形象（/private/tmp/avatar-gen/gen.mjs）入库 `public/media/ai-video/`，`DIGITAL_HUMAN_AVATARS` 增加 category 分类
- [x] 数据模型：`DigitalHumanPlacement {x,y,scale}` 入全局 config；`DigitalHumanShotOverride {placement?,hidden?}` 入分镜（仅此片段）；normalizeProject 深合并兼容旧项目
- [x] API：`clampDigitalHumanPlacement`（scale 0.6–1.6）/ `updateShotDigitalHuman` / `syncDigitalHumanPlacement`（清 placement 覆盖保留 hidden）/ `setDigitalHumanEnabled`（关闭时清 hidden 覆盖）
- [x] 面板全量重写对齐参考图：标题+关闭、当前数字人卡（3 模式图标+重新启用）、写实/卡通选项卡、搜索实过滤+筛选占位、3 列网格选中勾选
- [x] 画布摆放：DigitalHumanOverlay——百分比定位、pointer 拖拽（4px 阈值防误选）、点击选中工具条（所有片段/仅此片段作用域 + 缩放 ±/百分比 + 关闭 X）、画面空白处点击取消选中、分镜 hidden 显示占位可恢复
- [x] i18n 三语补 digitalHuman 相关 16 键 + 9 个形象名
- [x] 测试 50/50 通过（新增数字人摆放与分镜覆盖 6 用例）；eslint 0 问题；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：拖拽/缩放/仅此片段/关闭/恢复全链路 localStorage 断言通过；验收后演示数据还原

## 执行记录（2026-08-19 第八轮：数字人边框编辑 + 顶部同步确认条）

- [x] 选中边框重构：移除工具条（作用域分段/缩放±），改为四角等比缩放手柄 + 右上角关闭 X；画面名称标签移除
- [x] 顶部确认条：调整完成先写当前分镜覆盖，再弹「✓ 已调整 — 同步到其他片段？ 同步到所有片段 | 仅此片段」（深色 pill 对齐参考图，8s 超时按仅此片段）
- [x] pendingPlacement 修复缩放/移动松手后画面弹回旧值（等数据回写一致再清除，兜底 3s）；拖拽/缩放基准改用 effective 防连续操作跳变
- [x] i18n 三语：删 scope/zoom 键，新增 adjusted/syncAsk/syncAll/thisShot
- [x] 测试 50/50 通过；eslint 0 问题；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：边框手柄/关闭、等比缩放 64↔102.4px 不回弹、确认条文案与布局、同步到所有片段/超时仅此片段两路径均通过；演示数据已还原

## 执行记录（2026-08-19 第九轮：数字人应用状态条 + 撤销 + 删除无占位）

- [x] 状态条两阶段重构：ask（8s 超时按仅此片段）→ applied（对齐附件「已应用所有页面 改为仅当前页 撤销」，6s 自动收起并失效快照）；选中数字人即显示当前应用状态（选中沿触发，不重复弹）
- [x] 撤销机制：调整前 DigitalHumanSnapshot（config+各分镜覆盖）；新增 restoreDigitalHumanState API 整体还原；无快照且 scope=shot 时退化为清除当前分镜覆盖
- [x] 切换范围：改为仅当前页（全局写入分镜覆盖）/ 改为所有片段（生效摆放全局同步）
- [x] 删除数字人后画面 return null，移除虚线占位与 restore 键；pendingPlacement 改 updatedAt 驱动清除（撤销即时生效）
- [x] i18n 三语新增 applied/switchToShot/switchToAll/undo
- [x] 测试 51/51 通过；eslint 0 问题；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：选中显示、切换范围、ask→applied 流转、撤销完整还原、删除后舞台无占位图标（bot=0）；演示数据已还原

## 执行记录（2026-08-20 第十轮：状态条移至设置栏底部 + 分镜隐藏恢复入口）

- [x] 修复选中数字人画面不显示：还原上轮验收残留的 hidden 覆盖演示数据
- [x] 新增 `studio/DigitalHumanStatusBar.tsx`（浅色版状态条）：ask / applied / 当前分镜已删除（带恢复入口）三种形态
- [x] 状态逻辑上移 VideoResult（dhBar/dhUndoRef/handleDhSelect/handleDhRequestSync/SyncAll/ThisShot/SwitchScope/Undo/RestoreShot）；StudioPlayer 精简为类型导出 + onRequestSync/onSelect 透传
- [x] 状态条渲染位从画布顶部改为数字人设置栏底部（mt=auto 沉底 + borderTop），仅 digitalHuman 栏可见；选中数字人自动开栏显示 applied
- [x] i18n 三语新增 `canvas.removedCurrent` / `canvas.restoreShot`
- [x] 修复 eslint exhaustive-deps（doc-down effect 补 onSelect 依赖）
- [x] 测试 51/51 通过；eslint 0 问题；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：选中显示 applied 条（面板底部）、拖拽→ask 条面板底部、hidden→恢复→重现全链路通过；验收后演示数据还原（placement (86,78,1)、覆盖清零）

## 执行记录（2026-08-20~21 第十一轮：PPT/文档转视频全链路 + 成片预览弹框）

- [x] 首页模式卡片启用「PPT/文档转视频」（去除即将上线），路由 `/teacher/ai-video/create/ppt`；三步向导：上传解析 → 参数配置 → 预览编辑
- [x] 上传步骤（UploadStep）：格式校验（ppt/pptx/doc/docx/pdf）、大小上限（免费 100MB/会员 500MB）、文件头签名嗅探完整性（pptx/docx=ZIP、pdf=%PDF、旧版=OLE2）；解析动画 + 摘要（有效页数/自动过滤空白页）；「使用示例课件体验」快捷入口
- [x] 参数步骤（ParamsStep）：模板选择（含预览弹窗）/ 配音音色 / 讲解脚本模式（精简/详细/正式/极简字幕）
- [x] 预览编辑（PreviewEditStep 全屏编辑器）：片段栏（逐页分镜+删除+新增）+ 画布（数字人/AI标识/字幕叠加）+ 工具栏（模板/布局/数字人/声音/文字/素材/背景/背景音）+ 口播稿编辑区（字幕高亮/字数/预估时长/优化文稿）
- [x] Mock API：`isPptFileNameAccepted` / `sniffPptFileIntegrity` / `mockParsePptFile`（同名确定性解析：封面/目录/内容/图表/结尾分型，空白页标记过滤，字数过少页 aiEnrich）/ `buildPptNarration`（页型×脚本模式逐页旁白）/ `resolvePptShotDuration`（auto 按字数 3-10s，custom 3-15s）/ `createPptProject`（1 页=1 分镜直入草稿态；文件名敏感词前置拦截；智能避让图表页数字人缩小贴角；逐页关闭数字人写 hidden 覆盖）
- [x] 列表「继续编辑」直达口播稿设置页（`create/ppt?id=` 加载已有项目，跳过向导）；「查看成片」改为成片预览弹框 ProjectPreviewModal（播放 + 模式/比例/模板/音色徽标 + 分镜数/时长/时间 + 删除/复制/继续编辑）；生成中项目封面叠加进度条与百分比
- [x] 生成进度页 PPT 专属阶段文案（`task.stage.ppt.*`）
- [x] types：`PptPageInfo` / `PptPageType` / `PptScriptMode` / `CreatePptProjectInput` / `project.pptConfig` / `sourceFileName`；i18n 三语同步（592 键三方对齐）
- [x] 测试 61/61 通过（新增 PPT 12 用例：上传校验/解析/旁白/时长/建项/敏感词）；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：示例课件全链路（上传→解析 11 页过滤 1 空白页→参数→口播稿编辑器 11 片段分型旁白/AI 补充页）→ 草稿落列表顶部 → 继续编辑直达 → 查看成片弹框 → 播放在线视频可下载

## 执行记录（2026-08-21 第十二轮：工作台工具栏精简 + 播放控制重构 + 数字人形象分镜级切换）

- [x] ToolRail 精简：移除「裁剪」「片头片尾」入口并删除 TrimPanel/IntroOutroPanel；副区仅保留「素材」
- [x] 播放控制重构：移除点击画布播放/暂停，统一由时间轴控制栏操作——回到起点/上一片段/播放暂停/下一片段（片段切换联动分镜选中与定位，首尾边界正确夹取）
- [x] 数字人形象分镜级切换：`DigitalHumanShotOverride.avatar` 覆盖优先于全局；切换形象时记录快照弹应用范围条（所有片段/仅此片段/撤销），仅此片段=当前分镜写新形象覆盖且全局回退旧形象
- [x] 摆放合并修复：`{...config.placement, ...override?.placement}` 部分覆盖回退全局，拖动后数字人宽高比保持不变；DH_FIGURE_STYLES 导出复用
- [x] ShotSidebar：启用数字人时各分镜缩略图按摆放百分比同步位置标记（同一宽高比/objectPosition，分镜级形象/摆放覆盖优先，hidden 不显示）
- [x] 交互调整：选中数字人/画布调整完成不再自动展开数字人设置栏（右侧工具栏手动打开）
- [x] 测试 61/61 通过；tsc 0 错误；Console 0 错误
- [x] 浏览器验收：工作台顶栏/分镜栏/画布/精简工具栏/时间轴播放控制条渲染正常，成片播放弹框（播放/进度/倍速/音量/全屏/下载）正常
