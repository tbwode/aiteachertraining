# Step3 知识聚合功能实现文档

## 概述

本文档记录了AI分身创建向导第三步"知识聚合"功能的完整实现，包括知识匹配分析结果的渲染、推荐资源选择和数字教材管理。

## 实现日期

2026-04-15

## 参考设计

- 参考HTML文件：`教师20260408/ai-avatar-create-step3.html`
- 设计要求：完全按照参考HTML的UI和交互实现

## 核心功能

### 1. 知识匹配分析结果存储

#### 类型定义（avatarStorage.ts）

```typescript
// 知识匹配分析结果 - 缺失章节信息
export type MissingChapterInfo = {
  id: string; // 章节ID
  title: string; // 章节标题
  status: 'partial' | 'missing'; // 部分缺失 | 完全缺失
  missingPoints: string[]; // 缺失的知识点列表
  defaultText: string; // AI拓展学习的默认文本
  selectedAiResourceId: string; // AI资源的ID（用于勾选状态）
};

// 推荐资源
export type RecommendedResource = {
  id: string;
  chapterId: string; // 所属章节ID
  category: 'doc' | 'video'; // 文档 | 视频
  title: string; // 资源标题
  description: string; // 资源描述（覆盖的知识点）
};
```

#### Draft数据结构扩展

```typescript
export type AvatarWizardDraft = {
  // ... 其他字段
  analysisCompleted: boolean;
  matchScore: number;
  matchAnalysisResult?: {
    // 知识匹配分析结果
    missingChapters: MissingChapterInfo[]; // 缺失章节详情
    recommendedResources: RecommendedResource[]; // 推荐资源
  };
  selectedResourceIds: string[];
  digitalTextbooks: DigitalTextbook[];
  // ...
};
```

### 2. 知识匹配分析（useAvatarWizard.ts）

#### 分析结果保存

在 `startMatching()` 函数中，AI分析完成后保存结果：

```typescript
// 当前使用模拟数据，等待真实API返回格式确认后调整
const mockMatchResult = {
  missingChapters: [
    {
      id: 'chapter-1-1',
      title: '1.1 机械设计基本概念',
      status: 'partial' as const,
      missingPoints: ['设计原则', '设计流程'],
      defaultText: '1.1 机械设计基本概念 - 机械设计概述、设计原则、设计流程、设计方法',
      selectedAiResourceId: 'ai-1-1'
    },
    // ...
  ],
  recommendedResources: [
    {
      id: 'doc-1-1',
      chapterId: 'chapter-1-1',
      category: 'doc' as const,
      title: '机械设计基础概念详解.pdf',
      description: '覆盖：机械设计概述、设计原则'
    },
    // ...
  ]
};

updateDraft((current) => ({
  ...current,
  analysisCompleted: true,
  matchScore: 75,
  matchAnalysisResult: mockMatchResult,
  // 默认选中所有推荐资源和AI资源
  selectedResourceIds: [
    ...mockMatchResult.recommendedResources.map((r) => r.id),
    ...mockMatchResult.missingChapters.map((c) => c.selectedAiResourceId)
  ],
  updatedAt: new Date().toISOString()
}));
```

### 3. 数字教材管理

#### 状态管理

```typescript
const [editingTextbookId, setEditingTextbookId] = useState<string | null>(null);
const [textbookInput, setTextbookInput] = useState('');
```

#### 核心函数

**开始创建/编辑教材**
```typescript
const handleStartCreateTextbook = (chapterId: string, currentName?: string) => {
  setEditingTextbookId(chapterId);
  setTextbookInput(currentName || '');
};
```

**提交教材**
```typescript
const handleSubmitTextbook = (chapterId: string) => {
  const name = textbookInput.trim();
  if (!name) {
    toast({ title: '请输入数字教材名称', status: 'warning' });
    return;
  }

  const existing = draft.digitalTextbooks.find((item) => item.chapterId === chapterId);

  updateDraft((current) => {
    const existingInCurrent = current.digitalTextbooks.find(
      (item) => item.chapterId === chapterId
    );

    if (existingInCurrent) {
      // 编辑现有教材
      return {
        ...current,
        digitalTextbooks: current.digitalTextbooks.map((item) =>
          item.chapterId === chapterId ? { ...item, name } : item
        ),
        updatedAt: new Date().toISOString()
      };
    } else {
      // 创建新教材
      return {
        ...current,
        digitalTextbooks: [
          ...current.digitalTextbooks,
          {
            id: `textbook-${Date.now()}`,
            chapterId,
            name,
            createdAt: new Date().toISOString().split('T')[0]
          }
        ],
        updatedAt: new Date().toISOString()
      };
    }
  });

  setEditingTextbookId(null);
  setTextbookInput('');
  toast({ title: existing ? '数字教材已更新' : '数字教材创建成功', status: 'success' });
};
```

**删除教材**
```typescript
const handleDeleteTextbook = (chapterId: string) => {
  updateDraft((current) => ({
    ...current,
    digitalTextbooks: current.digitalTextbooks.filter((item) => item.chapterId !== chapterId),
    updatedAt: new Date().toISOString()
  }));

  toast({ title: '数字教材已删除', status: 'success' });
};
```

**取消编辑**
```typescript
const handleCancelEdit = () => {
  setEditingTextbookId(null);
  setTextbookInput('');
};
```

### 4. Step3组件渲染（Step3KnowledgeAggregation.tsx）

#### 组件结构

```typescript
export function Step3KnowledgeAggregation({
  draft,
  editingTextbookId,
  textbookInput,
  onTextbookInputChange,
  onToggleResource,
  onStartCreateTextbook,
  onSubmitTextbook,
  onDeleteTextbook,
  onCancelEdit
}: Step3Props) {
  // 从draft中获取知识匹配分析结果
  const missingChapters = draft.matchAnalysisResult?.missingChapters || [];
  const recommendedResources = draft.matchAnalysisResult?.recommendedResources || [];

  // 如果没有分析结果，显示提示
  if (!draft.analysisCompleted || missingChapters.length === 0) {
    return (
      <Box bg="white" borderRadius="20px" p={{ base: 5, md: 8 }} boxShadow={CARD_SHADOW}>
        <Text fontSize="lg" fontWeight={600} color="gray.800" mb={6}>
          第三步：知识聚合
        </Text>
        <Box textAlign="center" py={12}>
          <Text fontSize="sm" color="gray.500">
            请先完成教学路径分析，才能查看知识聚合结果
          </Text>
        </Box>
      </Box>
    );
  }

  // 渲染缺失章节和推荐资源...
}
```

#### 主要渲染区域

1. **缺失资源章节详情**
   - 显示每个缺失章节的标题
   - 状态标签（部分缺失/完全缺失）
   - 缺失知识点列表

2. **系统推荐资源**
   - 按章节分组显示
   - 教学文档（复选框选择）
   - 教学视频（复选框选择）
   - AI拓展学习（复选框选择）

3. **数字教材管理**
   - 显示已创建的教材（名称、创建时间、编辑/删除按钮）
   - 创建新教材按钮（虚线边框）
   - 编辑状态下显示输入框和确认/取消按钮

#### 关键UI特性

- **条件渲染**：根据是否有教材显示不同内容
- **编辑状态**：通过 `editingTextbookId` 控制输入框显示
- **禁用状态**：未勾选AI资源时，创建教材按钮禁用
- **颜色标识**：
  - 部分缺失：黄色背景 `yellow.50`
  - 完全缺失：红色背景 `red.50`
  - 已创建教材：绿色边框 `green.200`

## 数据流

```
1. 用户点击"开始匹配分析"
   ↓
2. startMatching() 调用AI分析
   ↓
3. 保存分析结果到 draft.matchAnalysisResult
   ↓
4. Step3组件从draft读取数据并渲染
   ↓
5. 用户勾选推荐资源
   ↓
6. handleToggleResource() 更新 draft.selectedResourceIds
   ↓
7. 用户创建数字教材
   ↓
8. handleSubmitTextbook() 更新 draft.digitalTextbooks
   ↓
9. 发布时，所有数据保存到 AvatarRecord
```

## 验证规则（isStep3Valid）

```typescript
const isStep3Valid = useMemo(() => {
  return missingChapters.every((chapter) =>
    draft.selectedResourceIds.includes(chapter.selectedAiResourceId)
      ? draft.digitalTextbooks.some((item) => item.chapterId === chapter.id)
      : true
  );
}, [draft.digitalTextbooks, draft.selectedResourceIds]);
```

**规则说明**：
- 如果勾选了某章节的AI拓展学习资源
- 则必须为该章节创建数字教材
- 否则无法发布

## 待优化事项

### 1. 真实API集成

当前使用模拟数据，需要根据真实API返回格式调整：

```typescript
// TODO: 解析analysisResult，提取缺失章节和推荐资源
// 目前先使用模拟数据结构，等待真实API返回格式确认后再调整
const mockMatchResult = { ... };
```

### 2. 国际化支持

所有硬编码文本需要替换为 `t()` 调用：

```typescript
// 当前
<Text>第三步：知识聚合</Text>

// 应改为
const { t } = useTranslation('teacher-aiTeacher');
<Text>{t('avatar.create.step3.title')}</Text>
```

### 3. 错误处理

添加更完善的错误处理和边界情况处理：
- 分析结果为空
- 网络请求失败
- 数据格式不匹配

## 文件清单

### 修改的文件

1. `avatarStorage.ts` - 添加类型定义
2. `useAvatarWizard.ts` - 添加数字教材管理逻辑
3. `Step3KnowledgeAggregation.tsx` - 完全重写，使用真实数据
4. `page.tsx` - 更新props传递

### 删除的依赖

- `useDigitalTextbook` hook（功能已合并到 `useAvatarWizard`）
- `constants.ts` 中的假数据（`missingChapters`, `recommendedResources`）

## 测试建议

1. **功能测试**
   - 完成Step2分析后，Step3能正确显示结果
   - 勾选/取消勾选推荐资源
   - 创建数字教材
   - 编辑数字教材名称
   - 删除数字教材
   - 验证规则：勾选AI资源必须创建教材

2. **边界测试**
   - 未完成分析时访问Step3
   - 分析结果为空
   - 创建教材时输入为空
   - 快速连续点击创建/删除

3. **UI测试**
   - 不同状态的颜色显示正确
   - 编辑状态切换流畅
   - 按钮禁用状态正确
   - 响应式布局正常

## 总结

本次实现完全按照参考HTML设计，实现了：

✅ 知识匹配分析结果的完整存储
✅ 缺失章节详情的渲染
✅ 推荐资源的选择功能
✅ 数字教材的创建、编辑、删除
✅ 发布前的验证规则
✅ 完整的状态管理和数据流

下一步需要：
- 等待真实API返回格式，调整数据解析逻辑
- 添加国际化支持
- 完善错误处理
