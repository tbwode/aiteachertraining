# AI 调用逻辑修改：type:28 和 type:30 的分离

## 修改日期
2026-04-15

## 修改目标
将 AI 调用逻辑进行分离，并修正入参格式：
- **type:28**（知识匹配分析）：在 Step2 点击"开始匹配"按钮时调用
  - 入参：`tree`（type:29 的返回结果）+ `content`（文件解析结果）
- **type:30**（资源推荐）：在 Step2 点击"下一步"进入 Step3 时调用
  - 入参：`data`（从大纲转换的结构化数据）+ `knowledgeBase`（用户数据集ID）

## 修改内容

### 1. 修改 `startMatching` 函数（Step2 的"开始匹配"按钮）

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`

**入参格式**:
```typescript
{
  type: 28,
  input: '请进行知识匹配分析',
  variables: {
    tree: syllabusTree,      // type:29 的返回结果（大纲分析）
    content: [               // 文件解析结果数组
      {
        content: string,     // 文件内容
        fileKey: string,     // 文件key
        fileName: string     // 文件名
      },
      ...
    ]
  }
}
```

**数据来源**:
- `tree`: `draft.syllabusTree`（type:29 AI 分析教学大纲的返回结果）
- `content`: `draft.coursewareParseResult`（`/ai-university/client/fileParse/upload` 接口返回的解析结果）

**代码逻辑**:
```typescript
const startMatching = async () => {
  // 1. 解析大纲数据（type:29 的返回结果）
  const syllabusTree = typeof draft.syllabusTree === 'string'
    ? JSON.parse(draft.syllabusTree)
    : draft.syllabusTree;

  // 2. 构建 content 数组（文件解析结果）
  const content = draft.coursewareParseResult.map((item) => ({
    content: item.content,
    fileKey: item.fileKey,
    fileName: item.fileName
  }));

  // 3. 调用 AI type:28
  const analysisResult = await analyzeSyllabus({
    type: 28,
    input: '请进行知识匹配分析',
    variables: { tree: syllabusTree, content },
    jsonFormat: true,
    stream: false
  });

  // 4. 保存结果
  updateDraft((current) => ({
    ...current,
    analysisCompleted: true,
    matchScore,
    matchAnalysisResult: analysisResult.responseJson,
    updatedAt: new Date().toISOString()
  }));
};
```

### 2. 修改 `loadResourceRecommendations` 函数（进入 Step3 时调用）

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`

**入参格式**:
```typescript
{
  type: 30,
  input: '请进行资源推荐',
  variables: {
    data: [                  // 从大纲转换的结构化数据
      {
        chapterId: string,
        chapterName: string,
        sections: [
          {
            sectionId: string,
            sectionName: string,
            knowledgePoints: string[]
          }
        ]
      },
      ...
    ],
    knowledgeBase: [         // 用户数据集ID
      { datasetId: string },
      ...
    ]
  }
}
```

**数据来源**:
- `data`: 从 `draft.syllabusTree` 转换而来（将 type:29 的返回结果转换为结构化的章节数据）
- `knowledgeBase`: 用户的 `officialIntroDatasetId` 和 `introDatasetId`

**代码逻辑**:
```typescript
const loadResourceRecommendations = async () => {
  // 1. 解析大纲数据
  const syllabusTree = typeof draft.syllabusTree === 'string'
    ? JSON.parse(draft.syllabusTree)
    : draft.syllabusTree;

  // 2. 将大纲数据转换为 data 格式
  const dataForAI = syllabusTree.chapters.map((chapter, chapterIndex) => ({
    chapterId: `C${String(chapterIndex + 1).padStart(2, '0')}`,
    chapterName: chapter.chapter_name,
    sections: chapter.sections.map((section, sectionIndex) => ({
      sectionId: `C${String(chapterIndex + 1).padStart(2, '0')}_S${String(sectionIndex + 1).padStart(2, '0')}`,
      sectionName: section.section_name,
      knowledgePoints: section.topics
    }))
  }));

  // 3. 构建知识库数据
  const knowledgeBase = [];
  if (user?.officialIntroDatasetId) {
    knowledgeBase.push({ datasetId: user.officialIntroDatasetId });
  }
  if (user?.introDatasetId) {
    knowledgeBase.push({ datasetId: user.introDatasetId });
  }

  // 4. 调用 AI type:30
  const recommendResult = await analyzeSyllabus({
    type: 30,
    input: '请进行资源推荐',
    variables: { knowledgeBase, data: dataForAI },
    jsonFormat: true,
    stream: false
  });

  // 5. 保存结果
  updateDraft((current) => ({
    ...current,
    resourceRecommendations: recommendResult.responseJson,
    updatedAt: new Date().toISOString()
  }));
};
```

### 3. `proceedToNextStep` 函数保持不变

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`

在从 Step2 进入 Step3 时，先调用 `loadResourceRecommendations()`，再切换步骤。

## 数据流程

### Step2: 知识匹配分析（type:28）

1. 用户点击"开始匹配"按钮
2. 调用 `startMatching()` 函数
3. 构建输入数据：
   - `tree`: `draft.syllabusTree`（type:29 的返回结果）
   - `content`: `draft.coursewareParseResult`（文件解析结果）
4. 调用 AI type:28
5. 返回结果保存到 `draft.matchAnalysisResult`
6. 计算匹配度并显示在 Step2 界面

### Step2 → Step3: 资源推荐（type:30）

1. 用户点击"下一步"按钮
2. 调用 `proceedToNextStep()` 函数
3. 调用 `loadResourceRecommendations()` 函数
4. 构建输入数据：
   - `data`: 从 `draft.syllabusTree` 转换而来（结构化的章节数据）
   - `knowledgeBase`: 用户的 `officialIntroDatasetId` 和 `introDatasetId`
5. 调用 AI type:30
6. 返回结果保存到 `draft.resourceRecommendations`
7. 切换到 Step3

## 入参对比

### type:28（知识匹配分析）

**输入**:
```json
{
  "tree": {
    "chapters": [
      {
        "chapter_name": "第一章",
        "sections": [
          {
            "section_name": "1.1 节",
            "topics": ["知识点1", "知识点2"]
          }
        ]
      }
    ]
  },
  "content": [
    {
      "content": "文件内容...",
      "fileKey": "xxx.pdf",
      "fileName": "课件1.pdf"
    }
  ]
}
```

**数据来源**:
- `tree`: type:29 AI 分析教学大纲的返回结果
- `content`: `/ai-university/client/fileParse/upload` 接口返回的解析结果

### type:30（资源推荐）

**输入**:
```json
{
  "data": [
    {
      "chapterId": "C01",
      "chapterName": "第一章",
      "sections": [
        {
          "sectionId": "C01_S01",
          "sectionName": "1.1 节",
          "knowledgePoints": ["知识点1", "知识点2"]
        }
      ]
    }
  ],
  "knowledgeBase": [
    { "datasetId": "official-dataset-id" },
    { "datasetId": "intro-dataset-id" }
  ]
}
```

**数据来源**:
- `data`: 从 type:29 的返回结果（`tree`）转换而来
- `knowledgeBase`: 用户登录接口返回的 `officialIntroDatasetId` 和 `introDatasetId`

## 注意事项

1. **数据依赖**:
   - type:28 依赖 type:29 的返回结果（`syllabusTree`）和文件解析结果（`coursewareParseResult`）
   - type:30 依赖 type:29 的返回结果（`syllabusTree`）和用户数据集ID
2. **错误处理**: 如果 type:30 调用失败，不会阻止用户进入 Step3，只会显示错误提示
3. **数据格式**:
   - type:28 使用原始的 `tree` 结构和 `content` 数组
   - type:30 使用转换后的 `data` 结构和 `knowledgeBase` 数组

## 测试建议

1. 测试 Step2 的"开始匹配"按钮，确认调用的是 type:28，入参包含 `tree` 和 `content`
2. 测试 Step2 的"下一步"按钮，确认调用的是 type:30，入参包含 `data` 和 `knowledgeBase`
3. 检查 console.log 输出，确认两次 AI 调用的参数格式正确
4. 测试错误场景：
   - type:28 失败时，不能进入 Step3
   - type:30 失败时，可以进入 Step3，但显示错误提示

## 相关文件

- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`
- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/avatarStorage.ts`
- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/components/Step2TeachingPath.tsx`
