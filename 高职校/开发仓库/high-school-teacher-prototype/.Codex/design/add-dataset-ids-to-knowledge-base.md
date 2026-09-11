# 添加数据集ID到知识库配置

## 需求说明

在AI教师创建向导的"知识匹配"功能中，需要将登录接口返回的 `officialIntroDatasetId` 和 `introDatasetId` 添加到 type:30 AI调用的 `knowledgeBase` 参数中。

## 实现方案

### 1. 更新用户信息类型定义

**文件：** `high-school-teacher/projects/app/src/common/store/useUserStore.ts`

在 `UserInfo` 类型中添加两个新字段：

```typescript
export type UserInfo = {
  // ... 其他字段

  /** 官方介绍数据集ID（用于AI分析） */
  officialIntroDatasetId?: string;
  /** 介绍数据集ID（用于AI分析） */
  introDatasetId?: string;
};
```

### 2. 更新知识匹配逻辑

**文件：** `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts`

在 `startMatching` 函数中，构建 `knowledgeBase` 时添加用户的数据集ID：

```typescript
const startMatching = async () => {
  // ... 前置检查代码

  // 构建知识库数据（从课件解析结果中提取）
  const knowledgeBase = draft.coursewareParseResult.map((item) => ({
    datasetId: item.fileKey // 使用 fileKey 作为 datasetId
  }));

  // 添加用户的官方介绍数据集和介绍数据集（如果存在）
  if (userInfo?.officialIntroDatasetId) {
    knowledgeBase.push({
      datasetId: userInfo.officialIntroDatasetId
    });
  }
  if (userInfo?.introDatasetId) {
    knowledgeBase.push({
      datasetId: userInfo.introDatasetId
    });
  }

  console.log('开始匹配分析, data:', dataForAI, 'knowledgeBase:', knowledgeBase);

  // 调用AI分析
  const analysisResult = await analyzeSyllabus({
    type: 30, // 系统资源匹配
    input: '请进行资源推荐',
    variables: {
      knowledgeBase,
      data: dataForAI
    },
    // ...
  });
};
```

## 数据流程

### 1. 登录阶段

```
用户登录
  ↓
调用 /huayun-ai/client/auth/university/login
  ↓
返回用户信息（包含 officialIntroDatasetId 和 introDatasetId）
  ↓
保存到 useUserStore
```

### 2. 知识匹配阶段

```
用户上传教学大纲和课件
  ↓
点击"开始匹配"按钮
  ↓
构建 knowledgeBase 数组：
  - 课件解析结果的 fileKey
  - userInfo.officialIntroDatasetId（如果存在）
  - userInfo.introDatasetId（如果存在）
  ↓
调用 AI type:30 进行资源推荐
  ↓
返回匹配结果
```

## knowledgeBase 数据结构

```typescript
// 最终传给AI的knowledgeBase格式
const knowledgeBase = [
  // 课件解析结果
  { datasetId: "file_key_1" },
  { datasetId: "file_key_2" },
  { datasetId: "file_key_3" },
  // 用户数据集（如果存在）
  { datasetId: "official_intro_dataset_id" },
  { datasetId: "intro_dataset_id" }
];
```

## 注意事项

1. **可选字段**：`officialIntroDatasetId` 和 `introDatasetId` 都是可选字段，只有在存在时才添加到 knowledgeBase 中

2. **数据来源**：这两个字段来自登录接口 `/huayun-ai/client/auth/university/login` 的返回值

3. **使用场景**：仅在AI教师创建向导的"知识匹配"功能（type:30）中使用

4. **数据持久化**：这些字段会随用户信息一起保存在 `useUserStore` 中，并持久化到 localStorage

## 测试建议

### 1. 单元测试

- 测试 `officialIntroDatasetId` 存在时的 knowledgeBase 构建
- 测试 `introDatasetId` 存在时的 knowledgeBase 构建
- 测试两个字段都存在时的 knowledgeBase 构建
- 测试两个字段都不存在时的 knowledgeBase 构建

### 2. 集成测试

- 登录后验证用户信息中包含这两个字段
- 创建AI分身时验证 knowledgeBase 包含正确的数据集ID
- 验证AI分析返回的结果正确

### 3. 边界测试

- 测试字段为空字符串的情况
- 测试字段为 null 的情况
- 测试字段为 undefined 的情况

## 相关文件

- `high-school-teacher/projects/app/src/common/store/useUserStore.ts` - 用户信息类型定义
- `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts` - 知识匹配逻辑

## 影响范围

- ✅ 用户信息类型定义
- ✅ AI教师创建向导的知识匹配功能
- ❌ 不影响其他功能

## 版本信息

- **创建时间：** 2026-04-15
- **最后更新：** 2026-04-15
- **实现状态：** ✅ 已完成

---

## 实现总结

已成功将登录接口返回的 `officialIntroDatasetId` 和 `introDatasetId` 集成到AI教师创建向导的知识匹配功能中。这两个数据集ID会在调用 type:30 AI分析时，与课件解析结果一起传入 `knowledgeBase` 参数，用于更全面的资源推荐。
