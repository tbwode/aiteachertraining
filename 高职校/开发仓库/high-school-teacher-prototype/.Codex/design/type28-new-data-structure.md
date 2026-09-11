# type:28 新数据结构适配

## 修改日期
2026-04-15

## 背景
type:28（知识匹配分析）返回的数据结构已更新，新增了更详细的知识点覆盖信息。

## 新的数据结构

### type:28 返回结果
```json
{
  "course_name": "人工智能教程",
  "chapters": [
    {
      "chapter_name": "第一阶段：基础入门",
      "sections": [
        {
          "section_name": "1. AI发展历史与现状",
          "status": "部分覆盖",
          "covered_topics": [
            "当前主流技术方向",
            "行业应用场景概览"
          ],
          "uncovered_topics": [
            "人工智能的起源与演变"
          ]
        },
        {
          "section_name": "2. 数学基础",
          "status": "未覆盖",
          "covered_topics": [],
          "uncovered_topics": [
            "线性代数基础",
            "概率论与统计学",
            "微积分入门"
          ]
        }
      ]
    }
  ]
}
```

### 字段说明
- `course_name`: 课程名称
- `chapters`: 章节数组
  - `chapter_name`: 章节名称
  - `sections`: 小节数组
    - `section_name`: 小节名称
    - `status`: 覆盖状态（"已覆盖" | "部分覆盖" | "未覆盖"）
    - `covered_topics`: 已覆盖的知识点数组
    - `uncovered_topics`: 未覆盖的知识点数组

## 修改内容

### 1. 更新类型定义

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/avatarStorage.ts`

```typescript
matchAnalysisResult?: {
  // AI type:28 返回的数据结构（知识匹配分析）
  course_name?: string;
  chapters?: Array<{
    chapter_name: string;
    sections: Array<{
      section_name: string;
      status: '已覆盖' | '部分覆盖' | '未覆盖';
      covered_topics: string[];
      uncovered_topics: string[];
    }>;
  }>;
  // 旧的数据结构（兼容）
  data?: Array<{...}>;
  missingChapters?: MissingChapterInfo[];
  recommendedResources?: RecommendedResource[];
};
```

### 2. 更新匹配度计算逻辑

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`

**修改前**（基于 resources 数量）:
```typescript
let totalSections = 0;
let coveredSections = 0;

matchResult.data.forEach((chapter) => {
  chapter.sections.forEach((section) => {
    totalSections++;
    if (section.resources && section.resources.length > 0) {
      coveredSections++;
    }
  });
});

const matchScore = Math.round((coveredSections / totalSections) * 100);
```

**修改后**（基于 status 字段）:
```typescript
let totalSections = 0;
let coveredSections = 0; // 已覆盖
let partialSections = 0; // 部分覆盖

matchResult.chapters.forEach((chapter) => {
  chapter.sections.forEach((section) => {
    totalSections++;
    if (section.status === '已覆盖') {
      coveredSections++;
    } else if (section.status === '部分覆盖') {
      partialSections++;
    }
  });
});

// 匹配度计算：已覆盖 100%，部分覆盖 50%
const matchScore = Math.round(
  ((coveredSections + partialSections * 0.5) / totalSections) * 100
);
```

**计算规则**:
- 已覆盖：计入 100% 权重
- 部分覆盖：计入 50% 权重
- 未覆盖：计入 0% 权重

### 3. 更新 Step2 渲染逻辑

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/components/Step2TeachingPath.tsx`

**主要修改**:

1. **统计信息显示**:
```typescript
draft.matchAnalysisResult.chapters.forEach((chapter) => {
  chapter.sections.forEach((section) => {
    total++;
    const status = section.status;
    if (status === '已覆盖') {
      covered++;
    } else if (status === '部分覆盖') {
      partial++;
    } else {
      missing++;
    }
  });
});

// 显示：共识别 X 个知识模块，Y 个已覆盖，Z 个部分覆盖，W 个未覆盖
```

2. **章节和小节渲染**:
```tsx
{draft.matchAnalysisResult?.chapters?.map((chapter, chapterIndex) => (
  <Box key={chapterIndex}>
    {/* 章标题 */}
    <Box bg="orange.100" borderRadius="lg" fontWeight={600}>
      {chapter.chapter_name}
    </Box>

    {/* 节列表 */}
    <VStack>
      {chapter.sections?.map((section, sectionIndex) => {
        const status = section.status;
        const coveredTopics = section.covered_topics || [];
        const uncoveredTopics = section.uncovered_topics || [];

        return (
          <Box
            key={sectionIndex}
            borderLeft="4px solid"
            borderColor={
              status === '已覆盖' ? 'green.500' :
              status === '部分覆盖' ? 'yellow.400' :
              'red.500'
            }
            bg={
              status === '已覆盖' ? 'transparent' :
              status === '部分覆盖' ? 'yellow.50' :
              'red.50'
            }
          >
            {/* 小节标题和状态 */}
            <Flex justify="space-between">
              <Text>{section.section_name}</Text>
              <Badge>{status}</Badge>
            </Flex>

            {/* 已覆盖的知识点 */}
            {coveredTopics.length > 0 && (
              <Box>
                <Text color="green.700">✓ 已覆盖知识点：</Text>
                <Text>{coveredTopics.join('、')}</Text>
              </Box>
            )}

            {/* 未覆盖的知识点 */}
            {uncoveredTopics.length > 0 && (
              <Box>
                <Text color="red.500">✗ 未覆盖知识点：</Text>
                <Text>{uncoveredTopics.join('、')}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  </Box>
))}
```

3. **视觉样式**:
- **已覆盖**: 绿色左边框，透明背景，绿色徽章
- **部分覆盖**: 黄色左边框，黄色背景，黄色徽章
- **未覆盖**: 红色左边框，红色背景，红色徽章

## UI 展示效果

### 匹配度圆环
- 显示整体匹配度百分比
- 基于新的计算规则（已覆盖 100% + 部分覆盖 50%）

### 统计信息
```
共识别 11 个知识模块，2 个已覆盖，3 个部分覆盖，6 个未覆盖
```

### 章节列表
每个章节显示：
- 章节标题（橙色背景）
- 小节列表：
  - 小节名称 + 状态徽章
  - ✓ 已覆盖知识点（绿色）
  - ✗ 未覆盖知识点（红色）

## 数据流程

1. 用户点击"开始匹配"按钮
2. 调用 AI type:28，传入 `tree` 和 `content`
3. AI 返回新的数据结构（包含 `status`、`covered_topics`、`uncovered_topics`）
4. 计算匹配度（基于 `status` 字段）
5. 保存结果到 `draft.matchAnalysisResult`
6. Step2 组件根据新数据结构渲染章节和知识点

## 兼容性

类型定义中保留了旧的 `data` 字段，以兼容旧版本的数据结构：
```typescript
matchAnalysisResult?: {
  // 新的数据结构
  course_name?: string;
  chapters?: Array<{...}>;

  // 旧的数据结构（兼容）
  data?: Array<{...}>;
  missingChapters?: MissingChapterInfo[];
  recommendedResources?: RecommendedResource[];
};
```

## 测试建议

1. 测试匹配度计算是否正确（已覆盖 100%，部分覆盖 50%）
2. 测试章节和小节的渲染是否正确
3. 测试已覆盖和未覆盖知识点的显示
4. 测试不同状态的视觉样式（颜色、边框、背景）
5. 测试统计信息的准确性

## 相关文件

- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/avatarStorage.ts`
- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`
- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/components/Step2TeachingPath.tsx`
