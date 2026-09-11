# AI视频课 P0（核心链路）设计文档

## 1. 背景与目标

教师端「AI备课」下拉菜单新增「AI视频课」入口，前端 Mock 全流程实现：

> 模式选择首页 → 文本生成视频 → 分镜脚本编辑 → 异步生成任务（进度条）→ 视频预览与下载

- P1（本期不做，入口占位提示「即将上线」）：PPT 转视频、图文转视频、模板广场
- P2（本期不做）：二次编辑工作台（字幕样式/音频/镜头替换/裁剪/片头片尾）、多分辨率导出、水印、异步转码、会员权限

## 2. 信息架构

### 2.1 菜单

`TeacherLayout.tsx` → `lessonPrep`（AI备课）children 追加：

| key | label | href | menuCode |
| --- | --- | --- | --- |
| aiVideoCourse | AI视频课 | /teacher/ai-video | 无（全员可见） |

### 2.2 路由

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| /teacher/ai-video | 首页 | 三大模式卡片 + 模板广场入口 + 我的项目列表 |
| /teacher/ai-video/create/text | 文本生成视频 | 提示词 + 高级参数表单 |
| /teacher/ai-video/project/[id] | 项目工作台 | 按 `project.status` 渲染：分镜编辑 / 生成进度 / 失败 / 预览下载 |

## 3. 数据模型（src/teacher/types/aiVideo.ts）

```ts
type AiVideoMode = 'text' | 'ppt' | 'images';
type AiVideoRatio = '16:9' | '9:16' | '1:1';
type AiVideoStyle = 'realistic' | 'anime' | 'tech' | 'simpleCourseware' | 'corporate' | 'documentary';
type AiVideoVoice = 'femaleClear' | 'femaleGentle' | 'maleDeep' | 'maleEnergetic';
type AiVideoBgm = 'none' | 'freePiano' | 'freeLight' | 'vipEpic';

type StoryboardShot = {
  id: string;
  sceneDescription: string;  // 画面描述
  narration: string;         // 台词/字幕
  duration: number;          // 单镜头时长（秒）
  imageUrl: string;          // 分镜占位图
};

type AiVideoTaskStage = 'script' | 'visuals' | 'voice' | 'subtitle' | 'render';
type AiVideoStatus = 'draft' | 'queued' | 'generating' | 'success' | 'failed';
type AiVideoFailReason = 'timeout' | 'moderation' | 'busy';

type AiVideoProject = {
  id: string;
  title: string;
  mode: AiVideoMode;
  prompt: string;
  params: { ratio: AiVideoRatio; duration: 30 | 60 | 90; style: AiVideoStyle;
            voice: AiVideoVoice; speed: number; bgm: AiVideoBgm };
  storyboard: StoryboardShot[];
  status: AiVideoStatus;
  stage: AiVideoTaskStage | null;
  progress: number;          // 0-100
  queuePosition: number;
  failReason: AiVideoFailReason | null;
  videoUrl: string | null;
  coverUrl: string | null;
  taskStartedAt: number | null;  // 任务开始时间戳（用于离线推进推导）
  createdAt: string;
  updatedAt: string;
};
```

## 4. Mock 数据层（src/teacher/api/aiVideo.ts）

### 4.1 存储

- localStorage，key：`ai_video_projects`，值为 `AiVideoProject[]`
- 读写函数参照 `avatarStorage.ts`：`canUseStorage()` 守卫 + JSON 序列化
- 所有编辑操作即写即存（自动保存），刷新不丢失
- 存储读写支持注入 `StorageLike`，便于 vitest 用内存 shim 测试

### 4.2 确定性任务推进（关键设计）

任务"后台继续跑"用**时间戳推导**而非纯定时器：

```
时间轴（相对 taskStartedAt，毫秒）：
0–3000        queued（queuePosition 2→0）
3000–6000     script    脚本解析
6000–16000    visuals   生成画面素材
16000–21000   voice     合成配音
21000–24000   subtitle  生成字幕
24000–30000   render    视频渲染
30000+        success（写入 videoUrl/coverUrl）
```

- 纯函数 `deriveTaskState(taskStartedAt, now, failReason)` 输出 `{status, stage, progress, queuePosition}`
- 页面打开时用 `setInterval` 每秒物化最新状态并写回存储；页面关闭后重进，按经过时间直接推导出当前状态——刷新/关闭均不丢失
- 失败分支（演示兜底话术）：prompt 含关键词「测试失败」→ visuals 阶段 timeout 失败；「测试拦截」→ moderation 失败；「测试繁忙」→ busy 失败
- 失败保留已编辑分镜，状态可回退 draft 直接重新发起

### 4.3 内容安全与校验（6.1）

- `findSensitiveWord(text)`：内置敏感词表（暴力/色情/赌博/毒品/枪支/恐怖 等），命中返回该词
- `isPromptTooShort(text)`：< 10 字视为过短
- 创建提交与生成提交两处校验；命中提示「内容不符合平台规范，请调整描述后重新生成」，过短弹窗建议补充主题/时长/风格

### 4.4 分镜脚本生成

`buildStoryboardFromPrompt(prompt, duration)`：按目标时长确定分镜数（30s→4 / 60s→6 / 90s→8），用内置场景模板（开场引入→知识讲解→案例演示→要点总结→…）与 prompt 拼装画面描述和台词，单镜头时长均分，占位图轮换。

### 4.5 Mock API（Promise + 模拟延迟，形状对齐未来真实接口）

`listProjects / getProject / createTextProject / duplicateProject / deleteProject / updateStoryboard / regenerateShotImage / regenerateStoryboard / submitGenerateTask / cancelToDraft / exportVideo`

## 5. 页面设计

### 5.1 首页（模块1）

- 顶部：标题 + 副标题
- 模式卡片 ×3：文本（可点击进创建页）；PPT / 图文带「即将上线」标签，点击 toast 提示
- 模板广场横幅卡片：占位，点击 toast「即将上线」
- 我的项目：卡片网格（封面/标题/状态徽章/更新时间/模式），操作：继续编辑、复制、删除（二次确认 Modal）；空列表 Empty 态

### 5.2 文本创建页（模块2）

- 提示词 Textarea + 示例 chips（点击填入）
- 高级参数：比例（16:9/9:16/1:1 卡片单选）、目标时长（30/60/90s 单选）、视频风格（6 选 1）、配音音色 + 语速 Slider（0.7–1.3 步进 0.1）、背景音乐（无/免费×2/会员×1 置灰）
- 提交 → 校验 → 创建项目（status=draft，含分镜）→ 跳转工作台

### 5.3 项目工作台

- **draft → 分镜编辑器（模块5）**：每条分镜：序号、占位图、画面描述（Textarea）、台词（Textarea）、时长（NumberInput）；操作：上移/下移、删除、重生成画面（loading 后换占位图）；底部：新增分镜、全部重生成（二次确认）、合计时长、「生成视频」按钮
- **queued/generating → 进度页（模块6）**：总进度条 + 五阶段步骤条（当前阶段高亮）；queued 显示「正在排队，当前还有 N 个任务」；generating 显示「正在渲染视频，请勿关闭页面」
- **failed → 失败页**：按 failReason 展示话术（超时/安全拦截/繁忙），按钮：返回编辑分镜、重新生成
- **success → 预览下载（模块7/9 精简版）**：<video> 播放成片、字幕列表；导出面板：720P MP4 直接下载，1080P/4K 置灰「会员专享」；「返回编辑分镜」需确认（将清除成片）

## 6. i18n

- `TeacherI18nProvider.tsx`：`TEACHER_PAGE_SECTIONS` 增加 `'aiVideo'`
- 新增 `public/locales/{zh-CN,zh-Hant,en}/teacher-aiVideo.json`；页面通过 `useTeacherPageI18n(['aiVideo'])` + `t('aiVideo.*')` 使用
- `teacher-nav.json` 三语增加 `aiVideoCourse`

## 7. Mock 媒体资源（public/media/ai-video/）

ffmpeg 生成：

| 文件 | 规格 | 用途 |
| --- | --- | --- |
| sample-16x9.mp4 | 1280×720, 6s | 成片（横屏） |
| sample-9x16.mp4 | 720×1280, 6s | 成片（竖屏） |
| sample-1x1.mp4 | 720×720, 6s | 成片（方形） |
| cover-16x9.jpg / cover-9x16.jpg / cover-1x1.jpg | 同上尺寸 | 项目封面 |
| shot-1.jpg … shot-6.jpg | 640×360 | 分镜占位图（不同渐变） |

## 8. 测试（projects/app/test/aiVideo/aiVideo.test.ts）

vitest（node 环境，存储用内存 shim 注入）：

1. 项目 CRUD：创建/读取/更新/删除/复制（复制生成新 id、标题加副本后缀、状态重置 draft）
2. 分镜操作：新增/删除/编辑字段/上移下移排序/时长校验
3. 任务状态机：queued→generating→success 时间推导；三个失败关键词分别触发 timeout/moderation/busy
4. 内容安全：敏感词命中返回词条；过短提示词判定
5. 分镜生成：按时长产出 4/6/8 条分镜且时长合计≈目标时长

另补仓库缺失的 `test/setup.ts`、`test/globalSetup.ts` 最小文件使 vitest 可运行。

## 11. 创建页结构化输入与风格模板（2026-08-18 第三轮）

### 创建页（模块2 重构）

- **视频主题**：单行输入（必填）；**补充说明**：Textarea 选填，≤1200 字符，带字数统计（`NOTES_MAX_LENGTH`）
- **时长预设 5 档**（替代原 30/60/90s）：

| 预设 | 含义 | Mock 目标秒数 / 分镜数 |
| --- | --- | --- |
| smart 智能匹配（推荐） | 按主题+说明文本量推导：<50 字→紧凑，<150 字→均衡，否则从容 | 推导 |
| compact 紧凑 | 约 30 秒-1 分钟 | 45s / 4 镜 |
| balanced 均衡 | 约 1-3 分钟 | 120s / 6 镜 |
| relaxed 从容 | 约 3-5 分钟 | 240s / 8 镜 |
| special 专题 | 5 分钟以上 | 320s / 10 镜 |

- **视频比例**：仅横屏（16:9）/ 竖屏（9:16），移除 1:1（`ratioToVideoUrl` 保留 1:1 映射兜底旧数据）
- **主题风格模板按比例分组**：横屏→简约课件/写实/企业宣传片/纪录片；竖屏→知识口播/动漫/科技风/快闪卡点；切换比例时若当前风格不在新组内则重置为该组首个；模板卡带 ffmpeg 生成的缩略图（`style-{style}-{ratio}.jpg`）
- **配音音色/语速/背景音乐移出创建页**，在工作台音频 Tab 设置（`AudioConfig` 扩充 voice/speed/bgm/voiceVolume/bgmVolume）

### 分镜卡片字段扩展

`StoryboardShot` 新增 `title`（分镜标题）与 `productionNotes`（制作细节：素材/镜头/动效说明）；展示五要素：分镜标题、时长、画面设计、分镜讲稿、制作细节。SCENE_TEMPLATES 8 条模板补齐 title/notes（开场引入/理论讲解/实操演示/安全规范/要点拆解/常见错误/总结回顾/课后任务）。

### 旧数据迁移（normalizeProject）

- 数值时长 → 预设档位（≤30→compact，≤60→balanced，否则 relaxed）
- params 内嵌的 voice/speed/bgm → audio 配置
- 分镜缺 title/productionNotes → 补「分镜 N」与空串

## 12. 工作台编辑器版式（2026-08-18 第四轮，参考课件帮）

预览页重构为全屏编辑器版式（success 态脱离常规页面容器，`h=calc(100vh-64px)`）：

### 版式结构

```
┌──────────────────────────────────────────────────────────┐
│ 顶栏：← 返回 │ 项目标题 │ 返回分镜编辑 / 保存 / 导出视频    │
├──┬────────────────────────────────────┬───────┬──────────┤
│分│ 中央画布（点阵背景）                 │ 工具  │ 工具栏    │
│镜│ 播放器（无原生控制条，字幕叠加）      │ 面板  │ 📝🎙️🖼️✂️🎬│
│栏│                                    │(340px)│ (64px)   │
├──┴────────────────────────────────────┴───────┴──────────┤
│ 时间轴：时间码/播放控制 │ 刻度尺 │ 视频轨·讲稿轨·音乐轨·数字人轨 │
└──────────────────────────────────────────────────────────┘
```

### 组件拆分（components/studio/）

- `StudioTopBar`：返回/标题/返回分镜编辑/保存（toast 反馈，实际全量即时保存）/导出视频（ExportModal）
- `ShotSidebar`：分镜缩略图列表（序号徽标/标题/讲稿摘要/时长角标），可收起；点击定位播放头
- `ToolRail`：右侧图标栏——讲稿/音色/素材/裁剪/片头片尾，选中展开 340px 面板（复用既有面板组件）
- `TimelinePanel`：多轨时间轴
- `StudioPlayer`：受控播放器（无原生 controls，点击画面播放/暂停，字幕叠加）
- `ExportModal`：分辨率选择 + 720P 下载（原导出面板迁移）

### 时间轴（TimelinePanel）

- 刻度尺：`chooseTickInterval`（标签 ≤14 个）+ `buildTicks`；`formatTimecode` 支持 0.1s 精度（先四舍五入到十分位避免浮点截断）
- 视频轨：片头块（蓝渐变，2s）→ 分镜块（缩略图，宽度∝时长）→ 片尾块（紫渐变）；点击选中并 seek
- 讲稿轨：分镜讲稿文本块，与视频轨等宽对齐
- 音乐轨：已选 BGM 显示绿色条+曲名，未选显示虚线「无背景音乐」
- 数字人轨：斜纹占位 + 「即将上线」
- 播放头：红色竖线 + 圆点，随 `timeupdate` 实时移动；点击轨道任意处 seek（数学上扣除 52px 标签列宽）
- 裁剪遮罩：trim 区间外覆盖白色半透明遮罩
- 播放控制：⏮（裁剪起点）▶/⏸ ⏭（裁剪终点）；时间码 `00:07.8 / 01:12`

### 播放时间映射

业务时长（分镜合计+片头片尾）与占位视频实际时长按比例映射（`toVideoTime`/`toBusinessTime`），集中在 VideoResult 父组件管理（videoRef/videoDuration/businessTime/isPlaying），播放器与时间轴共享同一状态。

## 13. 工具栏细化、分镜管理与时间轴缩放（2026-08-18 第五轮）

### 图标体系

引入 `lucide-react`（^1.32.0），AI视频课全部 emoji 图标替换为 Lucide 线性图标（FileText/Presentation/Images/Clapperboard/Sparkles/ScrollText/Bot/Mic/Music/Images/Scissors/Play/Pause/SkipBack/SkipForward/ZoomIn/ZoomOut/Trash2/ChevronsLeft…）。

### 右侧工具栏

- 主区（按需求）：AI编辑(Sparkles) / 讲稿(ScrollText) / 数字人(Bot) / 音色(Mic) / 音乐(Music)
- 副区（保留已交付能力）：素材(Images) / 裁剪(Scissors) / 片头片尾(Clapperboard)
- 面板拆分：AudioPanel → VoicePanel（音色/语速/人声音量）+ MusicPanel（BGM/BGM音量）；新增 AiEditPanel（全部重生成脚本、重生成全部画面、AI 润色讲稿[占位]、智能断句开关）、DigitalHumanPanel（即将上线占位）

### 分镜侧栏

- 单项展开/收起：展开显示分镜讲稿全文与画面设计
- 单项删除：Trash2 按钮，删除即保存（updateStoryboard），toast 反馈

### 时间轴缩放

- 缩放档位 50/75/100/125/150/200%，ZoomIn/ZoomOut 按钮 + 百分比显示
- 布局重构：标签列固定 52px 不参与缩放；轨道内容区宽度 = zoom%（min 100%），横向滚动；播放头/裁剪遮罩/点击定位均为纯百分比计算，任意缩放下保持正确

## 14. 分镜脚本页精简与逐步生成（2026-08-19）

- **创建页比例图标**：emoji → lucide `Monitor`（横屏）/ `Smartphone`（竖屏）
- **分镜卡片去画面**：脚本页不再展示分镜图、移除「重生成画面」（画面在生成视频阶段产出；工作台素材面板仍保留素材替换）
- **分镜标题只读**：标题由模板生成，不支持修改；`画面设计/分镜讲稿/制作细节` 字段标签带 lucide 图标（Palette/ScrollText/Wrench）
- **分镜逐步生成**：`createTextProject` 创建空脚本 + `storyboardPending=true`；共享 hook `useStoryboardGenerator` 顺序调用 `appendNextShot`（600ms/条，内容幂等确定），逐条追加直至完毕；生成中显示骨架占位卡片（「正在生成第 N 个分镜…」）并禁用编辑/排序/提交/重生成；「全部重生成脚本」同样走逐步重建；工作台 AI编辑面板同机制（hook 复用）

## 15. 示例联动填充、侧栏精简、画布开关（2026-08-19 第二轮）

- **示例一键填充**：创建页示例 chips 改为 `{topic, notes}` 对象，点击同时填充视频主题与补充说明（含风格偏好/目标受众/重点要素）
- **分镜侧栏精简**：仅展示缩略图 + 序号 + 时长 + 分镜标题（移除讲稿摘要与展开收起）；删除按钮仅在选中分镜时显示
- **画布左上角开关组**（CanvasOverlayToggles）：
  - 「字幕」chip：切换字幕是否展示在视频画面（`subtitle.visible`）；开启时右侧 chevron 弹出设置层——字号（小/中/大）、颜色（4 色）、「关闭字幕」
  - 「AI 标识」chip：切换视频右上角「AI 生成」角标（`project.aiBadge`）
  - 两个状态均即时保存（updateProjectConfig 扩充 aiBadge 字段），normalizeProject 默认 true

## 9. 验收清单

## 10. 二次编辑工作台（模块7，2026-08-18 补充）

预览页升级为完整工作台，全部修改即时保存（自动保存语义）。

### 数据模型扩展

`AiVideoProject` 新增可选字段；`normalizeProject()` 在读取时补齐默认值（向后兼容旧项目）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| subtitle | { fontSize: small/medium/large, color, autoBreak } | 字幕样式与自动断句 |
| audio | { voice, voiceVolume 0-100, bgmVolume 0-100 } | 音色/人声/BGM 音量 |
| trim | { start, end } | 首尾裁剪保留区间（基于成片总时长） |
| intro / outro | none / schoolBadge / minimalText / courseTitle | 片头片尾模板，各占 2s 计入总时长 |
| shot.customMediaUrl / mediaType | string / ai、image、video | 镜头自定义素材（上传 ≤3MB 转 dataURL） |

### 关键交互

- **字幕**：播放器叠加层按播放时间实时显示当前字幕（字号/颜色即时生效）；自动断句按中英文标点拆分长句；字幕文本编辑即写回 storyboard.narration
- **音频**：音色/音量配置保存，文案提示「重新合成配音后生效」（占位视频无音轨）
- **镜头**：AI 重生成 / 上传图片视频素材（FileReader→dataURL）/ 恢复 AI 画面
- **裁剪**：RangeSlider 双滑块选区间；播放时业务时长↔占位视频实际时长按比例映射，起点 seek、终点暂停
- **片头片尾**：模板卡片单选；启用后总时长 +2s/个，字幕时间轴含片头偏移
- **导出**：维持 720P 下载 + 1080P/4K 会员置灰

### 高职校场景适配

- 分镜模板改为实训教学语境：岗位场景引入→理论原理→实操演示→安全规范→要点拆解→常见错误（考核扣分点）→总结回顾→课后实训任务
- 提示词示例：新能源汽车动力电池检测 / 数控铣床加工实训 / 电商直播实训课

## 11. 创建页结构化输入与风格模板（2026-08-18 第三轮）

### 创建页（模块2 重构）

- **视频主题**：单行输入（必填）；**补充说明**：Textarea 选填，≤1200 字符，带字数统计（`NOTES_MAX_LENGTH`）
- **时长预设 5 档**（替代原 30/60/90s）：

| 预设 | 含义 | Mock 目标秒数 / 分镜数 |
| --- | --- | --- |
| smart 智能匹配（推荐） | 按主题+说明文本量推导：<50 字→紧凑，<150 字→均衡，否则从容 | 推导 |
| compact 紧凑 | 约 30 秒-1 分钟 | 45s / 4 镜 |
| balanced 均衡 | 约 1-3 分钟 | 120s / 6 镜 |
| relaxed 从容 | 约 3-5 分钟 | 240s / 8 镜 |
| special 专题 | 5 分钟以上 | 320s / 10 镜 |

- **视频比例**：仅横屏（16:9）/ 竖屏（9:16），移除 1:1（`ratioToVideoUrl` 保留 1:1 映射兜底旧数据）
- **主题风格模板按比例分组**：横屏→简约课件/写实/企业宣传片/纪录片；竖屏→知识口播/动漫/科技风/快闪卡点；切换比例时若当前风格不在新组内则重置为该组首个；模板卡带 ffmpeg 生成的缩略图（`style-{style}-{ratio}.jpg`）
- **配音音色/语速/背景音乐移出创建页**，在工作台音频 Tab 设置（`AudioConfig` 扩充 voice/speed/bgm/voiceVolume/bgmVolume）

### 分镜卡片字段扩展

`StoryboardShot` 新增 `title`（分镜标题）与 `productionNotes`（制作细节：素材/镜头/动效说明）；展示五要素：分镜标题、时长、画面设计、分镜讲稿、制作细节。SCENE_TEMPLATES 8 条模板补齐 title/notes（开场引入/理论讲解/实操演示/安全规范/要点拆解/常见错误/总结回顾/课后任务）。

### 旧数据迁移（normalizeProject）

- 数值时长 → 预设档位（≤30→compact，≤60→balanced，否则 relaxed）
- params 内嵌的 voice/speed/bgm → audio 配置
- 分镜缺 title/productionNotes → 补「分镜 N」与空串

## 12. 工作台编辑器版式（2026-08-18 第四轮，参考课件帮）

预览页重构为全屏编辑器版式（success 态脱离常规页面容器，`h=calc(100vh-64px)`）：

### 版式结构

```
┌──────────────────────────────────────────────────────────┐
│ 顶栏：← 返回 │ 项目标题 │ 返回分镜编辑 / 保存 / 导出视频    │
├──┬────────────────────────────────────┬───────┬──────────┤
│分│ 中央画布（点阵背景）                 │ 工具  │ 工具栏    │
│镜│ 播放器（无原生控制条，字幕叠加）      │ 面板  │ 📝🎙️🖼️✂️🎬│
│栏│                                    │(340px)│ (64px)   │
├──┴────────────────────────────────────┴───────┴──────────┤
│ 时间轴：时间码/播放控制 │ 刻度尺 │ 视频轨·讲稿轨·音乐轨·数字人轨 │
└──────────────────────────────────────────────────────────┘
```

### 组件拆分（components/studio/）

- `StudioTopBar`：返回/标题/返回分镜编辑/保存（toast 反馈，实际全量即时保存）/导出视频（ExportModal）
- `ShotSidebar`：分镜缩略图列表（序号徽标/标题/讲稿摘要/时长角标），可收起；点击定位播放头
- `ToolRail`：右侧图标栏——讲稿/音色/素材/裁剪/片头片尾，选中展开 340px 面板（复用既有面板组件）
- `TimelinePanel`：多轨时间轴
- `StudioPlayer`：受控播放器（无原生 controls，点击画面播放/暂停，字幕叠加）
- `ExportModal`：分辨率选择 + 720P 下载（原导出面板迁移）

### 时间轴（TimelinePanel）

- 刻度尺：`chooseTickInterval`（标签 ≤14 个）+ `buildTicks`；`formatTimecode` 支持 0.1s 精度（先四舍五入到十分位避免浮点截断）
- 视频轨：片头块（蓝渐变，2s）→ 分镜块（缩略图，宽度∝时长）→ 片尾块（紫渐变）；点击选中并 seek
- 讲稿轨：分镜讲稿文本块，与视频轨等宽对齐
- 音乐轨：已选 BGM 显示绿色条+曲名，未选显示虚线「无背景音乐」
- 数字人轨：斜纹占位 + 「即将上线」
- 播放头：红色竖线 + 圆点，随 `timeupdate` 实时移动；点击轨道任意处 seek（数学上扣除 52px 标签列宽）
- 裁剪遮罩：trim 区间外覆盖白色半透明遮罩
- 播放控制：⏮（裁剪起点）▶/⏸ ⏭（裁剪终点）；时间码 `00:07.8 / 01:12`

### 播放时间映射

业务时长（分镜合计+片头片尾）与占位视频实际时长按比例映射（`toVideoTime`/`toBusinessTime`），集中在 VideoResult 父组件管理（videoRef/videoDuration/businessTime/isPlaying），播放器与时间轴共享同一状态。

## 13. 工具栏细化、分镜管理与时间轴缩放（2026-08-18 第五轮）

### 图标体系

引入 `lucide-react`（^1.32.0），AI视频课全部 emoji 图标替换为 Lucide 线性图标（FileText/Presentation/Images/Clapperboard/Sparkles/ScrollText/Bot/Mic/Music/Images/Scissors/Play/Pause/SkipBack/SkipForward/ZoomIn/ZoomOut/Trash2/ChevronsLeft…）。

### 右侧工具栏

- 主区（按需求）：AI编辑(Sparkles) / 讲稿(ScrollText) / 数字人(Bot) / 音色(Mic) / 音乐(Music)
- 副区（保留已交付能力）：素材(Images) / 裁剪(Scissors) / 片头片尾(Clapperboard)
- 面板拆分：AudioPanel → VoicePanel（音色/语速/人声音量）+ MusicPanel（BGM/BGM音量）；新增 AiEditPanel（全部重生成脚本、重生成全部画面、AI 润色讲稿[占位]、智能断句开关）、DigitalHumanPanel（即将上线占位）

### 分镜侧栏

- 单项展开/收起：展开显示分镜讲稿全文与画面设计
- 单项删除：Trash2 按钮，删除即保存（updateStoryboard），toast 反馈

### 时间轴缩放

- 缩放档位 50/75/100/125/150/200%，ZoomIn/ZoomOut 按钮 + 百分比显示
- 布局重构：标签列固定 52px 不参与缩放；轨道内容区宽度 = zoom%（min 100%），横向滚动；播放头/裁剪遮罩/点击定位均为纯百分比计算，任意缩放下保持正确

## 14. 分镜脚本页精简与逐步生成（2026-08-19）

- **创建页比例图标**：emoji → lucide `Monitor`（横屏）/ `Smartphone`（竖屏）
- **分镜卡片去画面**：脚本页不再展示分镜图、移除「重生成画面」（画面在生成视频阶段产出；工作台素材面板仍保留素材替换）
- **分镜标题只读**：标题由模板生成，不支持修改；`画面设计/分镜讲稿/制作细节` 字段标签带 lucide 图标（Palette/ScrollText/Wrench）
- **分镜逐步生成**：`createTextProject` 创建空脚本 + `storyboardPending=true`；共享 hook `useStoryboardGenerator` 顺序调用 `appendNextShot`（600ms/条，内容幂等确定），逐条追加直至完毕；生成中显示骨架占位卡片（「正在生成第 N 个分镜…」）并禁用编辑/排序/提交/重生成；「全部重生成脚本」同样走逐步重建；工作台 AI编辑面板同机制（hook 复用）

## 15. 示例联动填充、侧栏精简、画布开关（2026-08-19 第二轮）

- **示例一键填充**：创建页示例 chips 改为 `{topic, notes}` 对象，点击同时填充视频主题与补充说明（含风格偏好/目标受众/重点要素）
- **分镜侧栏精简**：仅展示缩略图 + 序号 + 时长 + 分镜标题（移除讲稿摘要与展开收起）；删除按钮仅在选中分镜时显示
- **画布左上角开关组**（CanvasOverlayToggles）：
  - 「字幕」chip：切换字幕是否展示在视频画面（`subtitle.visible`）；开启时右侧 chevron 弹出设置层——字号（小/中/大）、颜色（4 色）、「关闭字幕」
  - 「AI 标识」chip：切换视频右上角「AI 生成」角标（`project.aiBadge`）
  - 两个状态均即时保存（updateProjectConfig 扩充 aiBadge 字段），normalizeProject 默认 true

## 9. 验收清单

- [ ] AI备课菜单出现「AI视频课」，点击进入首页
- [ ] 创建文本项目 → 分镜编辑（增删改/排序/重生成）→ 生成视频（五阶段进度）→ 成功预览播放 → 720P 下载
- [ ] 生成中刷新页面 / 关闭重开，进度不丢失
- [ ] 「测试失败」等关键词触发三类失败话术，可返回编辑重新生成
- [ ] 敏感词/过短输入被拦截并提示
- [ ] 复制/删除项目（删除有二次确认）
- [ ] 工作台：字幕样式/断句即时生效、字幕文本可编辑保存
- [ ] 工作台：音色音量配置保存、镜头素材上传/恢复、裁剪区间播放、片头片尾计入总时长
- [ ] 高职校示例与分镜模板为实训教学语境
- [ ] `pnpm test`、`tsc`、`pnpm lint` 通过

## 16. 真实视频演示链路与数字人功能化（2026-08-19 第三轮）

### 真实视频演示（高斯消去法示例）

- 媒体资产：`public/media/ai-video/gauss-elimination.mp4`（51.4s 真实教学录播，1080P）、`cover-gauss.jpg`（片头抽帧封面）、`shot-gauss-1.jpg ~ shot-gauss-13.jpg`（每 4s 中点抽帧的分镜缩略图）
- 主题识别：`isGaussDemoTopic()`（主题含「高斯」或 /gauss/i），创建页示例 1 即该主题（适配高职数学公共基础课）
- `buildGaussStoryboard()`：13 条分镜与真实视频逐屏对齐——片头(4s)→目录(4s)→原理(2屏)→消元(4屏：增广矩阵/第一步 R₂-2R₁/第二步 R₃+2R₂)→回代(2屏：x₃=2,x₂=1,x₁=1)→例题(3屏)，各 4s、末镜 3.4s，合计 51.4s；讲稿为教师口吻逐屏适配
- `createTextProject` 命中时：`demoVideo:'gauss'`、强制 16:9、默认 BGM 钢琴曲、封面 `cover-gauss.jpg`；`materializeProject` 成功分支成片用真实视频 URL
- 效果：分镜缩略图/讲稿/字幕/音乐轨道/成片全部与真实视频内容同步

### 数字人功能化（替代原「即将上线」占位）

- 类型：`DigitalHumanConfig = { enabled, avatar }`（femaleTeacher 林老师 / maleTeacher 陈老师），头像为手写扁平插画 SVG（`avatar-*.svg`）
- DigitalHumanPanel：启用开关 + 形象选择卡片，即改即存（updateProjectConfig 扩充 digitalHuman 字段）
- StudioPlayer：启用时右下角叠加圆形头像+名字标签，播放中带 `dhPulse` 脉冲动画
- TimelinePanel 数字人轨：启用显示紫色渐变块+头像+名字，未启用显示虚线「未启用数字人」

### Bug 修复

1. **播放被立即暂停**：历史项目 localStorage 残留非法 `trim:{0,0}`，`handleTimeUpdate` 中 `t >= trim.end(0)` 恒成立导致播放 0.02s 即被 pause。修复：`normalizeProject` 增加裁剪区间自愈（end<=start 或缺失时重置为全区间 `{0,total}`，合法区间收敛到总时长内），读取旧数据自动修复并写回；VideoResult UI 层同步防御
2. **HTML hydration 错误**：ShotSidebar 分镜卡片 `Flex as="button"` 内嵌删除 IconButton（button 嵌套 button）。修复：外层改为 `role="button" + tabIndex={0}` + Enter/Space 键盘支持

### 测试

- 新增 describe「高斯消去法示例（真实视频演示）」：主题识别 / 13 镜 51.4s 且缩略图 shot-gauss-* / 创建标记 demoVideo+默认 BGM / 成功成片为真实视频 / 数字人默认值补齐
- 新增 trim 自愈用例：非法区间（{0,0}、end<start）重置全区间；合法区间保留并收敛总时长
- 共 36 用例全部通过；eslint、作用域 tsc 通过

### 浏览器验收（Playwright）

- 播放：play→playing 持续 4s 推进至 3.9s，无中断
- 字幕联动：0s 片头讲稿 / 20s 消元讲稿 / 45s 例题讲稿逐段切换
- 刷新持久化：项目 success、真实视频、13 分镜、数字人启用、trim 修复值均保留
- 导出：ExportModal（720P 免费 / 1080P·4K 会员专享）→「下载到本地」触发 `Gauss消去法原理与步骤讲解.mp4` 下载
- Console 0 错误

## 17. 播放联动、画布交互设置与 AI 编辑面板（2026-08-19 第四轮）

### 播放联动分镜

- VideoResult 新增 effect：`isPlaying` 时按 `businessTime` 匹配当前 cue，自动 `setSelectedShotId`；ShotSidebar 各项挂 ref，选中变化时 `scrollIntoView({block:'nearest'})` 平滑跟随
- 手动点击分镜 seek 后与联动选中一致，互不冲突

### 画布交互设置

- **字幕设置共享组件** `SubtitleSettings`（字号/颜色/关闭字幕）：画布左上角 chevron 弹层与「点击视频画面字幕」弹层复用；字幕叠加层改为 Popover trigger（pointerEvents auto + stopPropagation，避免触发播放切换），内部 Text 改 `as="span"` 保持 button 嵌套合法
- **AI 生成标识移动位置**：项目新增 `aiBadgePosition`（topRight/topLeft/bottomRight/bottomLeft，默认 topRight，normalizeProject 兜底）；点击画面上的标识弹出四角位置选择，选择即存（updateProjectConfig 扩充字段），DOM 按位置样式表移动

### AI 编辑面板重构

- **当前分镜卡片**：缩略图+序号+标题+时长+讲稿预览；未选中时虚线提示先选分镜
- **快捷指令**：优化动画节奏(pacing)/丰富细节(enrich)/精简内容(simplify)，点击即对当前分镜执行 `optimizeShot`（Mock 900ms），并写入对话流
- **智能体对话**：消息列表（用户/AI 气泡、思考中占位、自动滚底）+ 输入框（Enter/按钮发送）；`detectAction` 关键词意图识别（节奏→pacing、细节/丰富→enrich、精简/压缩→simplify），未命中返回能力引导话术；未选分镜提示先选择
- **全局操作**：保留全部重生成脚本与智能断句开关；移除「重生成全部画面」（避免破坏真实视频缩略图）与「AI 润色讲稿」占位（对话已覆盖）
- `optimizeShot` 确定性变换：pacing 按讲稿篇幅(8字/s)收敛时长 3-8s 并前缀节奏说明；enrich 画面/讲稿/制作细节追加特写高亮与易错提醒；simplify 讲稿保留第一句、制作细节标注精简版

### 测试（42 用例全部通过）

- optimizeShot：pacing 时长收敛与节奏说明/enrich 三字段追加/simplify 首句保留/不影响其他分镜/持久化
- aiBadgePosition：normalize 默认 topRight 与保留已有值、updateProjectConfig 保存并持久化
- node 环境 window.localStorage 桩（stubWindowStorage）支持 API 层测试

### 浏览器验收（Playwright）

- 播放联动：播放中左侧分镜自动选中当前位置分镜（22.4s→分镜 6）
- 字幕：点击画面字幕弹设置层；字号 large、颜色 #FFE58F、关闭字幕均即时生效并持久化
- AI 标识：点击弹四角位置层，选「左下」后持久化且 DOM 移动至画面左下
- AI 编辑：面板展示当前分镜；「丰富细节」快捷指令三字段生效+对话流记录；对话输入「精简一点」意图识别为 simplify，讲稿收敛首句并回复确认
- Console 0 错误

## 18. 面板交互升级：AI编辑精简、讲稿音色试听、数字人展示模式（2026-08-19 第五轮）

### AI 编辑面板精简

- 移除「全局操作」区（全部重生成脚本、智能断句开关移出面板；脚本重生成仍保留在分镜编辑页）
- 面板头部：标题 + 右上角关闭按钮（X，onClose → 收起工具面板）
- 快捷指令移至智能体对话输入框上方（消息列表 → 快捷指令 chips → 输入框），对话式编排更聚焦

### 讲稿面板（原字幕面板重构）

- **当前音色卡片**：展示配音音色名称（女声·清亮等）与语速 ×值，附音色试听按钮；提示可在音色面板修改
- **分镜讲稿列表**：13 条讲稿 textarea 即时编辑保存；每条配试听按钮（Play/Square 状态切换）
- **试听实现**：优先浏览器 SpeechSynthesis 真实朗读（zh-CN 语音包、按语速 rate、按音色性别匹配语音），无语音包/onend 不触发时按文本长度（约 5 字/秒×语速）模拟播放时长；卸载自动 cancel
- 字幕样式（字号/颜色/自动断句）保留在面板底部

### 数字人展示模式

- 类型：`DigitalHumanMode = 'halfBody' | 'fullBody' | 'floatingAvatar'`；DigitalHumanConfig 新增 `mode`（默认 floatingAvatar）
- normalizeProject 改为 `{...DEFAULT, ...project.digitalHuman}` 合并，旧项目自动补 mode
- 数字人面板：启用后展示三模式选项卡（半身出镜/全身出镜/悬浮头像，图标+文字）
- StudioPlayer 按模式渲染：悬浮头像 64px 圆形；半身 96×108 圆角矩形（objectPosition top）；全身 80×152 圆角矩形；播放脉冲动画圆角随模式匹配

### 测试（44 用例全部通过）

- 修正数字人默认值期望（含 mode）
- 新增：旧项目缺 mode 合并默认 / 已有 mode 保留 / updateProjectConfig 保存展示模式并持久化

### 浏览器验收（Playwright）

- AI编辑：全局操作已移除；快捷指令位于输入框上方（DOM 位置断言）；关闭按钮收起面板
- 讲稿：当前音色卡片（女声·清亮 ×1）渲染；13 条讲稿可编辑；音色试听按钮显示「试听中…」、分镜试听按钮图标变色（headless 无语音包走兜底模拟）
- 数字人：三模式选项渲染；悬浮头像 64px 圆 / 半身 96×108 / 全身 80×152 逐一切换并持久化
- Console 0 错误

## 19. AI编辑输入框沉底 + 讲稿面板当前分镜化（2026-08-19 第六轮）

### AI 编辑面板

- 移除「快捷指令」文字标签，仅保留 3 个指令 chips（优化动画节奏/丰富细节/精简内容）于输入框上方
- 输入框沉底：面板根容器 `Flex direction="column" flex="1" minH={0}`，对话区消息列表 flex=1 自适应滚动，chips 条与输入框 `flexShrink={0}` 固定贴底
- **关键修复**：工作台主区行补 `align="stretch"`（VideoResult），面板容器 Box 补 `display="flex" flexDirection="column"`——Chakra Flex 默认 `align="center"` 会导致面板内容不撑满高度、输入框被裁切

### 讲稿面板（当前分镜讲稿）

- 13 条讲稿列表改为**当前分镜讲稿卡**：序号徽标 + 分镜标题 + 起始时间码 + 试听按钮 + 4 行 textarea（`updateStoryboard` 即改即存）
- 新增 `selectedShotId` prop，跟随左侧分镜栏/播放联动选中项；未选中分镜时显示虚线提示（`studio.script.noShot`）
- 保留顶部当前音色卡片（音色名+语速+试听）与底部字幕样式区（字号/颜色/自动断句）
- i18n 三语新增：`studio.script.currentScript`（当前分镜讲稿）、`studio.script.noShot`

### 验证

- 单测 44/44 通过；eslint 0 问题；tsc（33 个相关文件）0 错误；Console 0 错误
- Playwright：讲稿 textarea 编辑后 localStorage `ai_video_projects` 对应分镜 narration 即时更新；试听按钮 Play→Square→Play 状态切换正常；AI 编辑面板输入框贴面板底边（截图确认）

## 20. 数字人面板重构与画布摆放交互（2026-08-19 第七轮）

### 需求来源

用户要求：数字人配置面板参考附件布局（当前数字人卡 + 形象分类选项卡 + 搜索/筛选 + 形象网格）；配置后画面上支持缩放数字人大小、调整位置、关闭；位置调整与删除均支持「同步到所有片段」与「仅此片段」两种作用域。

### 数据模型（src/teacher/types/aiVideo.ts）

- `DigitalHumanAvatarId` 扩至 11 个形象 id
- 新增 `DigitalHumanPlacement { x, y, scale }`：x/y 为画面百分比中心点坐标，scale 缩放系数
- `DigitalHumanConfig` 增加 `placement`
- 新增 `DigitalHumanShotOverride { placement?, hidden? }`；`StoryboardShot` 增加 `digitalHumanOverride?`（仅此片段覆盖）

### 形象库（constants.ts）

- `DIGITAL_HUMAN_AVATARS` 11 项，带 `category: 'realistic' | 'cartoon'`
- 新增 9 个 AI 生成 SVG 形象（/private/tmp/avatar-gen/gen.mjs 脚本生成）：写实 6（白露薇/夏悠悠/陆语茉/陈知悦/温亦澄/云舒）+ 卡通 3（白诗涵/林婉清/温言舒），保留原林老师/陈老师

### Mock API 新增（api/aiVideo.ts）

- `DEFAULT_DIGITAL_HUMAN_PLACEMENT = { x: 86, y: 78, scale: 1 }`；默认形象改为 bailuwei
- `DIGITAL_HUMAN_SCALE_MIN/MAX`（0.6/1.6）+ `clampDigitalHumanPlacement`
- normalizeProject：placement 深合并，旧项目兼容
- `updateShotDigitalHuman(projectId, shotId, override | null)`：仅此片段覆盖/清除
- `syncDigitalHumanPlacement(projectId, placement)`：写全局 placement 并清除各分镜 placement 覆盖（保留 hidden）
- `setDigitalHumanEnabled(projectId, enabled)`：关闭时清除所有 hidden 覆盖

### 数字人面板（DigitalHumanPanel.tsx 全量重写，对齐参考图）

- 标题栏 + 右上角关闭按钮（onClose）
- 「当前数字人」卡：圆头像 + 名称 + 右侧 3 个展示模式图标（全身/半身/悬浮头像）；启用时主色边框，停用时显示「重新启用」按钮
- 写实/卡通下划线选项卡切换分类
- 搜索框（实时按名称过滤）+ 筛选按钮（toast 即将上线占位）
- 3 列形象网格：选中项主色边框 + 右上角勾选徽标；点击即选中并 `enabled: true`

### 画布数字人摆放（StudioPlayer.tsx → DigitalHumanOverlay 子组件）

- 按 placement 百分比定位（left/top % + translate(-50%,-50%)），图像尺寸 = 基础尺寸 × scale
- **拖拽调位**：pointer events，位移 px 按画面容器 getBoundingClientRect 换算为百分比；4px 阈值区分点击与拖拽（suppressClickRef 防拖拽后误触选中）；图像 `draggable={false}`
- **点击选中**：显示工具条——作用域分段按钮「所有片段 / 仅此片段」+ 缩放（- / 百分比 / +，步进 0.1，clamp 0.6–1.6）+ 关闭 X；工具条控件 onPointerDown + onClick 双 stopPropagation（防触发拖拽与画面播放切换）；点击画面其他位置取消选中（document mousedown 监听）
- **作用域语义**：所有片段 → syncDigitalHumanPlacement / setDigitalHumanEnabled(false)；仅此片段 → updateShotDigitalHuman 写当前分镜（activeCue）override
- **分镜 hidden**：当前分镜 hidden 时画面显示虚线 Bot 占位按钮，点击恢复（hidden: false）
- StudioPlayer 新增 `onProjectChange` prop 透传

### i18n

- 三语 `studio.digitalHuman` 新增：current / category.realistic / category.cartoon / searchPlaceholder / filter / scope.all / scope.shot / canvas.zoomIn / canvas.zoomOut / canvas.remove / canvas.move / reEnable / emptySearch / restore + 9 个新形象名称；tip 文案更新；common.close

### 验证

- 单测 50/50 通过（新增 describe「数字人摆放与分镜覆盖」6 用例：clamp / updateShotDigitalHuman×2 / syncDigitalHumanPlacement / setDigitalHumanEnabled / normalize 保留 override）
- eslint 0 问题；tsc 0 错误；Console 0 错误
- Playwright：面板布局与参考图一致；拖拽 placement (86,78)→(45.2,34.5) 持久化；工具条控件齐全、放大 scale 1→1.1；仅此片段缩放 shot1 override.scale=1.2 全局不变；仅此片段关闭 shot1 hidden=true 且可恢复；所有片段关闭 enabled=false 数字人消失；验收后演示数据已还原

## 21. 数字人边框编辑 + 顶部同步确认条（2026-08-19 第八轮）

### 需求来源

用户要求：选中数字人后边框支持调整大小和关闭；位置/大小调整、删除后，在画面正中间靠上显示「✓ 数字人位置已调整 — 同步到其他片段？ 同步到所有片段 | 仅此片段」（参考附件深色 pill 布局）；数字人在画面上不显示名称；手柄只支持等比例缩放且必须生效。

### 交互设计

- **选中边框**：点击数字人显示主色边框 + 四角缩放手柄（nwse/nesw 光标）+ 右上角上方关闭 X；点击画面空白处取消选中；原「作用域分段 + 缩放±」工具条移除
- **等比缩放**：四角手柄向外位移换算为统一 scale（宽高同乘，clamp 0.6–1.6），即拖即显
- **确认条（DhSyncPrompt）**：调整完成（拖拽/缩放松手、点关闭 X）后，先写入当前分镜覆盖，再在画面顶部居中弹深色 pill（#171F38）：绿勾 + 消息（位置已调整/大小已调整/已删除）+「— 同步到其他片段？」+「同步到所有片段」（高亮蓝 #8FB8FF）/「仅此片段」；8 秒未操作按仅此片段处理
- **作用域语义**：同步到所有片段 → syncDigitalHumanPlacement（位置/大小）或 setDigitalHumanEnabled(false)（删除）；仅此片段 → 保留已写入的分镜覆盖；无命中分镜（片头/片尾时段）时直接全局生效不弹条
- **pendingPlacement 机制**：提交后保留本地摆放直至项目数据回写一致（兜底 3s），修复 mock 延迟导致画面弹回旧值的「调整不生效」问题；拖拽/缩放基准改用 effective（pending ?? placement）避免连续操作跳变
- 画面上不再显示数字人名称标签

### i18n

- 移除 `digitalHuman.scope.*`、`canvas.zoomIn/zoomOut`；新增 `canvas.adjusted.{position,size,removed}`、`canvas.syncAsk`、`canvas.syncAll`、`canvas.thisShot`（三语）

### 验证

- 单测 50/50 通过；eslint 0 问题；tsc 0 错误；Console 0 错误
- Playwright：选中边框 4 手柄+X 齐全；拖拽→确认条文案与参考图一致；同步到所有片段→全局 placement 更新且覆盖清空；缩放 64→102.4px 松手后不回弹（pending 保持 82.55px 至回写一致）；超时自动按仅此片段（覆盖保留、全局不变）；名称标签已移除；演示数据已还原

## 22. 数字人应用状态条与撤销（2026-08-19 第九轮）

### 需求来源

用户要求：删除数字人后画面不展示空占位图标；选中数字人显示「✓ 已应用所有页面 | 改为仅当前页 | 撤销」状态条（参考附件深色 pill 布局）。

### 交互设计

- **状态条两阶段**（DhBar）：
  - ask（调整后询问）：「数字人位置/大小已调整/已删除 — 同步到其他片段？ [同步到所有片段] [仅此片段]」，8s 未选按仅此片段 → 转 applied
  - applied（已应用状态，对齐附件）：「已应用所有页面 [改为仅当前页] [撤销]」或「已应用仅此片段 [改为所有片段] [撤销]」，6s 自动收起并失效撤销快照
- **选中即显示**：点击选中数字人时展示当前应用状态条（当前分镜有 placement 覆盖 → 仅此片段，否则 → 所有页面）；取消选中不重复弹出（dhPrevSelectedRef 仅在选中沿触发）
- **切换范围**：所有页面 → 改为仅当前页（全局摆放写入当前分镜覆盖）；仅此片段 → 改为所有片段（生效摆放全局同步，清 placement 覆盖）
- **撤销**（DhUndoSnapshot）：每次调整前快照 {config, 各分镜 overrides}；撤销优先 restoreDigitalHumanState 整体还原；无快照且 scope=shot 时清除当前分镜覆盖回退全局；applied 收起后快照失效（撤销仅限刚完成的调整）
- **删除无占位**：hidden 分镜画面 return null，移除虚线 Bot 恢复按钮与 restore 文案
- pendingPlacement 清除改为「updatedAt 变化即清除」（含撤销等外部更新即时响应）+ 3s 兜底

### 数据与 API

- 新增 `DigitalHumanSnapshot` 类型与 `restoreDigitalHumanState(projectId, snapshot)` mock API（整体还原全局配置与各分镜覆盖）

### i18n

- 移除 `canvas.restore`；新增 `canvas.applied.{all,shot}`、`canvas.switchToShot`、`canvas.switchToAll`、`canvas.undo`（三语）

### 验证

- 单测 51/51 通过（新增 restoreDigitalHumanState 用例：调整后快照整体还原 + 持久化一致）；eslint 0 问题；tsc 0 错误；Console 0 错误
- Playwright：选中显示「已应用所有页面 改为仅当前页」（无可撤销内容时撤销不显示）；改为仅当前页→覆盖写入且条变「已应用仅此片段」；拖拽→ask→同步所有→applied 带撤销；撤销后全局 placement 与分镜覆盖完整还原；删除→ask「数字人已删除」→仅此片段→画面舞台内无占位图标（lucide-bot=0）；演示数据已还原

## 23. 数字人状态条移至设置栏底部 + 分镜隐藏恢复入口（2026-08-20 第十轮）

### 需求来源

用户反馈：选中数字人后画面没有显示数字人（上轮验收残留的 hidden 覆盖所致，已还原）；选中数字人应显示应用状态条；状态条不要浮在画布顶部，**新增展示在数字人设置栏的底部**。

### 交互设计

- **状态条入栏**：原 StudioPlayer 画布顶部深色 pill 移除，改为新组件 `DigitalHumanStatusBar`（浅色版）渲染在数字人设置栏底部（`mt="auto"` 沉底 + borderTop 分隔），仅 `activeRail === 'digitalHuman'` 时可见
- **三种形态**：
  - ask（调整后询问）：「数字人位置/大小已调整/已删除 — 同步到其他片段？ [同步到所有片段] [仅此片段]」，8s 未选按仅此片段 → 转 applied
  - applied（已应用）：「已应用所有页面 [改为仅当前页] [撤销]」或「已应用仅此片段 [改为所有片段] [撤销]」，6s 自动收起并失效撤销快照
  - 当前分镜已删除：「当前分镜已删除数字人 [恢复]」——hidden 分镜选中数字人栏时提供恢复入口（恢复 = 清除该分镜 hidden 覆盖）
- **选中即开栏**：点击画面数字人 → 自动打开右侧数字人设置栏并显示 applied 状态（当前分镜有 placement 覆盖 → 仅此片段，否则 → 所有页面）
- **状态逻辑上移**：`dhBar` / `dhUndoRef` / `handleDhSelect` / `handleDhRequestSync` / `handleDhSyncAll` / `handleDhThisShot` / `handleDhSwitchScope` / `handleDhUndo` / `handleDhRestoreShot` 全部从 StudioPlayer 上移至 VideoResult；StudioPlayer 仅保留 `DhBar` / `DhBarAskPayload` 类型导出与 `onRequestSync` / `onSelect` 透传回调
- **时序**：ask 8s → applied 6s → 收起并失效快照；pendingPlacement 仍由 updatedAt 驱动清除（撤销即时生效）+ 3s 兜底

### 组件结构

- 新增 `studio/DigitalHumanStatusBar.tsx`（171 行）：props 接收 bar 状态、canUndo、shotHidden 与 5 个回调（同步所有/仅此片段/切换范围/撤销/恢复）
- VideoResult：数字人面板由单节点改为 `DigitalHumanPanel + DigitalHumanStatusBar` 兄弟节点（Flex column 高度 100%）

### i18n

- 新增 `canvas.removedCurrent`（当前分镜已删除数字人 / 目前分鏡已刪除數字人 / Presenter removed on this clip）、`canvas.restoreShot`（恢复 / 復原 / Restore），三语

### 验证

- 单测 51/51 通过；eslint 0 问题；tsc 0 错误；Console 0 错误
- Playwright：选中数字人 → 画面正常显示（头像+选中边框+四角手柄）、设置栏自动打开且底部显示「✓ 已应用所有页面 | 改为仅当前页 | ↺」；鼠标拖拽 → 分镜覆盖写入、ask 条出现在面板底部；hidden 分镜画面无数字人 → 设置栏底部显示恢复入口 → 点恢复 → 数字人重现；验收后演示数据已还原（全局 placement 回 (86,78,1)，分镜覆盖清零）

## 24. AI 视频课首页升级与图片转视频（2026-09-09）

### 目标

- 按 UI Styling 规范重构 AI 视频课首页的信息层级、响应式布局、焦点状态和可访问名称。
- 三类创作入口全部可用：文本生成视频、PPT/文档转视频、图片转视频。
- 三条链路最终进入统一的分镜编辑、生成进度和成片工作台。

### 首页

- 新增课程视频创作 Hero，直观说明「脚本 → 画面 → 配音 → 字幕 → 成片」流程。
- 三个模式卡采用独立识别色、三步流程提示与明确行动文案；移除图片转视频的“即将上线”状态。
- 增加 AI 智能分镜、自然讲解配音、字幕与成片三项能力说明。
- 移动端单列、桌面端三列；按钮提供可见焦点态，装饰元素不承担交互语义。

### 图片转视频交互

- 支持拖拽或点击上传 2–8 张 JPG/PNG/WebP；单图不超过 10MB，写入 Mock 存储前压缩到最长边 960px。
- 支持一键载入 4 张职教示例素材，便于直接体验完整流程。
- 图片卡支持选中、前移、后移与删除；选中镜头同步展示在右侧预览画布。
- 每个镜头可设置 180 字旁白、3/5/8 秒停留时长，以及静态、推进、左移、右移四种动效。
- 全局支持横屏/竖屏、4 种配音音色和视频名称设置；实时显示镜头数量与预计成片时长。
- 生成时调用 `createImageProject`，将图片顺序、旁白、时长和动效转换为 `StoryboardShot[]`，以 `mode=images` 持久化并进入统一分镜工作台。

### Mock 数据与验证

- 新增 `ImageVideoSourceItem`、`CreateImageProjectInput` 类型与图片项目创建 Mock API。
- 图片项目封面取首张素材，分镜保留图片 dataURL/示例路径和 `mediaType=image`。
- 新增单测覆盖图片顺序、旁白、时长、动效、音色、持久化与最少图片数校验。

## 25. Leadde 参考流程与模板视频（2026-09-09）

### 参考结论

- Leadde 首页先提供明确的创作起点，再将模板、数字人、媒体、语言与时长收拢到后续创作过程。
- 模板视频入口采用大尺寸选择器，包含「我的模板 / 公共模板」、分类筛选、从空白开始和模板网格。
- 本原型借鉴其任务分流和模板选择逻辑，保留教师端红色品牌、教学语义和现有分镜工作台，不复制其视觉品牌。

### 创作方式调整

- 首页三种创作方式调整为：文本生成视频、PPT/文档转视频、模板视频。
- 文本与 PPT/文档继续进入已有完整创建流程。
- 模板视频不再进入图片上传页，而是在当前页弹出模板选择器，减少跳转并保留上下文。

### 模板选择器

- 支持「我的模板 / 公共模板」键盘可访问选项卡。
- 支持全部、推荐、通用教育、实训教学、知识讲解、校园宣传分类筛选。
- 第一个固定入口为「从空白开始」；公共模板提供现代课程讲解、技能操作示范、科技原理解析、工匠人物故事、知识点口播、校园资讯简报。
- 我的模板提供机器人实训复盘、实训安全微课等 Mock 数据。
- 点击空白或模板会创建本地 Mock 项目并进入统一分镜工作台；创建期间锁定重复操作并展示加载状态。

### 数据

- `AiVideoMode` 新增 `template`，历史 `images` 项目继续兼容展示。
- 项目新增 `templateId`；null 表示空白画布，非空表示模板副本。
- `createTemplateProject`：模板生成 4 个可编辑教学镜头，空白创建 1 个初始场景，均保留音频、字幕、封面和本地持久化能力。

## 26. 三种创作方式统一全流程（2026-09-09）

### 统一流程

- 三种方式统一遵循「素材输入 → 分镜脚本 → 视频合成 → 预览导出」四阶段心智模型。
- 文本与 PPT/文档入口共用创作页头、输入类型切换、紧凑配置栏和模板推荐区；入口页即可设置数字人、模板、语言、时长、配音与高级选项。
- 模板视频继续通过「从空白开始 / 我的模板 / 公共模板」选择起点，选择后与另外两类项目汇入同一编辑器。

### 文本生成视频

- 大输入区支持主题、完整讲稿/补充要求、灵感示例和字数反馈。
- 高级设置支持横屏 16:9 / 竖屏 9:16；切换画幅时自动匹配对应模板组。
- 创建时把选中的配音、数字人和画面参数写入 Mock 项目；AI 分镜逐条完成后自动进入可视化编辑器。

### PPT/文档转视频

- 上传、格式/完整性校验、解析结果与生成配置合并到一个页面，减少旧版多步向导的上下文切换。
- 支持示例课件全流程体验；解析完成后可设置模板、数字人、时长、配音和精简/详细/正式/极简四种讲解脚本模式。
- 生成后按原页面映射为分镜，在统一编辑器内逐页修改口播稿与画面。

### 统一编辑器与合成

- 文本、PPT/文档和模板项目均使用「左侧片段列表 + 中间画布 + 右侧工具栏 + 底部口播稿」编辑器。
- 编辑器统一支持模板、布局、数字人、声音、文字、素材、背景、背景音、字幕、AI 标识、试听、预览和自动保存。
- 非 PPT 项目会在首次使用布局/背景/智能进度条时补齐编辑器默认配置，保证三条链路的工具行为一致。
- 点击生成视频进入同一合成设置与任务进度，完成后进入成片预览、精修和导出。

### 验证

- 浏览器实测：文本示例生成 13 个高斯消去法分镜后进入统一编辑器；PPT 示例完成上传、解析、讲解模式配置和逐页编辑器；历史模板项目直接进入统一编辑器。
- 修复高斯示例分镜生成进度总数不匹配问题（13 镜按真实分镜数展示）。
- AI 视频 Vitest 65/65 通过；相关文件 ESLint 通过；Next.js 生产构建通过；浏览器无新增运行错误。
