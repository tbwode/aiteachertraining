# AI分身编辑页面 - API集成设计文档

## 概述

本文档描述了AI分身编辑页面如何从 `/client/aiTeacher/avatars/detail` 接口获取数据，并在三个tab中展示。

## API接口定义

### 请求参数
```typescript
type AiAvatarDetailRequest = {
  avatarId: number; // AI分身ID
}
```

### 响应数据
```typescript
type AiAvatarDetailVO = {
  // 基本信息
  id: number;
  status: number; // 状态：0-未开始，1-运行中，2-已截止
  coverUrl: string; // 课程封面
  courseName: string; // 课程名称
  semesterName: string; // 学期名称
  startTime: string; // 开始时间
  endTime: string; // 结束时间

  // 统计信息
  studentCount: number; // 学生数量
  todayInteractionCount: number; // 今日互动次数

  // 覆盖范围
  classNameList: string[]; // 覆盖班级列表（必修）
  majorNameList: string[]; // 覆盖专业列表（选修）

  // 配置信息
  description: string; // 课程介绍
  teachingConfig: TeachingConfigVO; // 教学配置
  knowledgeGraph: string; // 知识图谱JSON
  chapterList: AiAvatarChapterVO[]; // 章节列表
}
```

### 教学配置
```typescript
type TeachingConfigVO = {
  // 教学目标权重
  knowledgeWeight: number; // 知识掌握权重
  skillWeight: number; // 技能应用权重
  innovationWeight: number; // 创新素质权重

  // 教学功能开关
  enableAfterClassQuiz: boolean; // 课后习题
  enableChapterTest: boolean; // 章节测试
  enableRandomQuiz: boolean; // 随堂测验
  enableAIEvaluation: boolean; // AI评估
  enableProgressTracking: boolean; // 进度追踪
  enableKnowledgeAnalysis: boolean; // 知识点分析
  enableAbilityGrowth: boolean; // 能力提升分析
  enableBehaviorAnalysis: boolean; // 学习行为分析
  enablePeerComparison: boolean; // 同学对比
}
```

### 章节结构
```typescript
type AiAvatarChapterVO = {
  id: number;
  title: string; // 章节标题
  sortOrder: number; // 排序号
  knowledgePoints: string[]; // 知识点列表
  children: AiAvatarChapterVO[]; // 子节点（节列表）
  materialList: AiAvatarMaterialVO[]; // 课件列表
}

type AiAvatarMaterialVO = {
  id: number;
  fileName: string; // 文件名
  fileUrl: string; // 文件URL
  fileType: string; // 文件类型：video/document/image/audio
  fileFormat: string; // 文件格式
  duration?: number; // 时长（音视频）
  coverUrl?: string; // 封面URL
  coverageStatus: number; // 覆盖状态：0-未分析，1-已覆盖，2-部分覆盖，3-完全缺失
}
```

## 三个Tab的数据映射

### Tab 1: 基础信息 (TabBasicInfo)

**数据来源：**
- `courseName` → 课程名称（只读）
- `coverUrl` → 课程图片
- `classNameList` / `majorNameList` → 覆盖班级/专业
- `startTime` / `endTime` → 起止时间
- `description` → 课程介绍（只读）
- `teachingConfig` → 教学配置（权重和功能开关）

**功能：**
- 显示课程基本信息
- 允许修改课程图片
- 允许修改覆盖班级/专业
- 允许修改起止时间
- 显示课程介绍（只读）

### Tab 2: 课程目录 (TabChapters)

**数据来源：**
- `chapterList` → 章节树结构
  - 每个章节包含：`title`, `sortOrder`, `knowledgePoints`, `children`, `materialList`
  - 课件包含：`fileName`, `fileUrl`, `fileType`, `coverageStatus` 等

**数据转换：**
```typescript
function convertApiChaptersToChapterData(apiChapters: AiAvatarChapterVO[]): ChapterData[] {
  return apiChapters.map((chapter) => ({
    id: String(chapter.id),
    title: chapter.title,
    sections: chapter.children.map((section) => ({
      id: String(section.id),
      title: section.title,
      knowledgeCount: section.knowledgePoints?.length || 0,
      coursewareCount: section.materialList?.length || 0,
      hasStudents: false // 需要从其他接口获取
    }))
  }));
}
```

**功能：**
- 显示章节树结构
- 显示每个小节的知识点数量
- 显示每个小节的课件数量
- 支持选择小节查看详情
- 支持添加/编辑章节和课件

### Tab 3: 知识图谱 (TabMindmap)

**数据来源：**
- `knowledgeGraph` → 知识图谱JSON字符串

**数据转换：**
```typescript
function convertApiKnowledgeGraphToMindmap(knowledgeGraphJson: string): MindmapNode {
  try {
    if (!knowledgeGraphJson) {
      return initialMindmapData;
    }
    const parsed = JSON.parse(knowledgeGraphJson);
    return parsed as MindmapNode;
  } catch (error) {
    console.error('解析知识图谱失败:', error);
    return initialMindmapData;
  }
}
```

**功能：**
- 以思维导图形式展示知识图谱
- 支持展开/收起节点
- 支持展开/收起全部节点

## 实现细节

### 1. 数据加载

在 `useAvatarEdit` hook中使用 `useEffect` 加载数据：

```typescript
useEffect(() => {
  if (!avatarId) return;

  const loadAvatarDetail = async () => {
    setIsLoading(true);
    try {
      const detail = await getAiAvatarDetail({ avatarId: Number(avatarId) });
      setAvatarDetail(detail);

      // 更新基础信息表单
      setFormData({
        name: detail.courseName,
        coverageClasses: detail.classNameList || detail.majorNameList || [],
        startDate: detail.startTime ? detail.startTime.split(' ')[0] : '',
        endDate: detail.endTime ? detail.endTime.split(' ')[0] : ''
      });

      // 更新章节数据
      if (detail.chapterList && detail.chapterList.length > 0) {
        const convertedChapters = convertApiChaptersToChapterData(detail.chapterList);
        setChapters(convertedChapters);
      }

      // 更新知识图谱数据
      if (detail.knowledgeGraph) {
        const convertedMindmap = convertApiKnowledgeGraphToMindmap(detail.knowledgeGraph);
        setMindmapData(convertedMindmap);
      }
    } catch (error) {
      console.error('加载AI分身详情失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载AI分身详情，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  loadAvatarDetail();
}, [avatarId, toast]);
```

### 2. 加载状态处理

在编辑页面中显示加载状态：

```typescript
if (isLoading) {
  return (
    <Box maxW="1280px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <Text>加载中...</Text>
    </Box>
  );
}
```

### 3. 数据展示

#### 基础信息Tab
- 使用 `avatarDetail` 中的数据填充表单
- 课程名称设为只读
- 课程图片显示 `coverUrl`，如果没有则显示默认渐变背景
- 覆盖班级/专业根据 `classNameList` 或 `majorNameList` 动态显示
- 起止时间从 `startTime` 和 `endTime` 中提取日期部分
- 课程介绍显示 `description`（只读）

#### 课程目录Tab
- 将 `chapterList` 转换为前端的 `ChapterData` 格式
- 显示章节树结构
- 显示每个小节的知识点数量和课件数量
- 支持选择小节查看详情

#### 知识图谱Tab
- 将 `knowledgeGraph` JSON字符串解析为 `MindmapNode` 格式
- 以思维导图形式展示
- 支持交互操作（展开/收起）

## 文件修改清单

### 1. API接口文件
- ✅ `src/teacher/api/aiTeacher.ts` - 已有 `getAiAvatarDetail` 接口

### 2. 类型定义文件
- ✅ `src/teacher/types/aiTeacher.ts` - 已有完整的类型定义

### 3. Hook文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/edit/hooks/useAvatarEdit.ts`
  - 添加数据加载逻辑
  - 添加数据转换函数
  - 添加加载状态管理

### 4. 页面文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/edit/page.tsx`
  - 添加加载状态显示
  - 传递 `avatarDetail` 给子组件

### 5. 组件文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/edit/components/TabBasicInfo.tsx`
  - 接收 `avatarDetail` 参数
  - 使用API数据显示课程信息
  - 显示课程介绍

- ⏳ `src/app/teacher/(layoutPage)/aiTeacher/avatar/edit/components/TabChapters.tsx`
  - 已使用转换后的章节数据
  - 后续可以添加课件详情展示

- ⏳ `src/app/teacher/(layoutPage)/aiTeacher/avatar/edit/components/TabMindmap.tsx`
  - 已使用转换后的知识图谱数据
  - 后续可以添加编辑功能

## 后续优化建议

1. **错误处理**
   - 添加更详细的错误提示
   - 添加重试机制

2. **数据缓存**
   - 使用 React Query 或 SWR 进行数据缓存
   - 避免重复请求

3. **编辑功能**
   - 实现课程图片上传
   - 实现章节和课件的增删改
   - 实现知识图谱的编辑

4. **保存功能**
   - 实现保存接口调用
   - 添加保存前的数据校验
   - 添加保存成功后的提示

5. **权限控制**
   - 根据AI分身状态控制编辑权限
   - 未开始状态可以修改所有内容
   - 运行中状态只能修改部分内容

## 总结

通过本次集成，AI分身编辑页面已经可以从API获取数据并在三个tab中展示：

1. **基础信息Tab** - 显示课程基本信息、封面、覆盖范围、起止时间和课程介绍
2. **课程目录Tab** - 显示章节树结构、知识点数量和课件数量
3. **知识图谱Tab** - 以思维导图形式展示知识图谱

所有数据都来自 `/client/aiTeacher/avatars/detail` 接口，实现了统一的数据源管理。
