# 清理假数据文档

## 概述

清理了AI教师主页的所有假数据，确保所有数据都从后端API获取。

## 实施日期

2026-04-15

## 清理内容

### 文件：`home/constants.ts`

#### 修改前

包含大量硬编码的假数据：

```typescript
export const initialSuggestions: SuggestionItem[] = [
  {
    id: 'news-1',
    type: 'news',
    title: '《人工智能在教育领域的最新应用》',
    // ... 更多假数据
  },
  // ... 4条假数据
];

export const initialStudents: StudentTodo[] = [
  {
    id: 'student-1',
    name: '张三',
    className: '计应2401',
    // ... 更多假数据
  },
  // ... 3条假数据
];

export const initialAvatars: AvatarCard[] = [
  {
    id: 'avatar-1',
    title: '数据结构与算法',
    status: 'running',
    // ... 更多假数据
  },
  // ... 4条假数据
];
```

#### 修改后

全部清空为空数组：

```typescript
// 初始数据（空数组，实际数据从API加载）
export const initialSuggestions: SuggestionItem[] = [];

export const initialStudents: StudentTodo[] = [];

export const initialAvatars: AvatarCard[] = [];
```

## 数据来源

现在所有数据都从以下API获取：

### 1. AI智能建议

**API**: `/client/aiTeacher/suggestions`

**Hook**: `useTeacherHome.ts`

```typescript
const suggestionList = await getAiTeacherSuggestions({ teacherId });
setSuggestions(convertSuggestions(suggestionList));
```

### 2. 今日待办（滞后学生）

**API**: `/client/aiTeacher/todos`

**Hook**: `useTeacherHome.ts`

```typescript
const todoList = await getAiTeacherTodos({ teacherId });
setStudents(convertTodoStudents(todoList.list));
```

### 3. AI分身列表

**API**: `/client/aiTeacher/avatars/list`

**Hook**: `useTeacherHome.ts`

```typescript
const avatarList = await getAiAvatarList({ teacherId });
setAvatars(convertAvatars(avatarList));
```

### 4. 统计数据

**API**: `/client/aiTeacher/stats`

**Hook**: `useTeacherHome.ts`

```typescript
const stats = await getAiTeacherStats({ teacherId });
setStatsData(stats);
```

## 数据加载流程

```
1. 页面加载
   ↓
2. useTeacherHome hook 初始化
   ↓
3. useEffect 触发
   ↓
4. 并行请求4个API
   - getAiTeacherStats
   - getAiTeacherSuggestions
   - getAiTeacherTodos
   - getAiAvatarList
   ↓
5. 数据转换
   - convertSuggestions()
   - convertTodoStudents()
   - convertAvatars()
   ↓
6. 更新状态
   - setStatsData()
   - setSuggestions()
   - setStudents()
   - setAvatars()
   ↓
7. UI渲染真实数据
```

## 空状态处理

### 建议列表为空

```typescript
{newsSuggestions.length === 0 && (
  <Box textAlign="center" py={4}>
    <Text fontSize="sm" color="gray.500">
      暂无前沿资讯
    </Text>
  </Box>
)}
```

### 待办学生为空

```typescript
{students.length === 0 && (
  <Box textAlign="center" py={8}>
    <Text fontSize="sm" color="gray.500">
      暂无需要关注的学生
    </Text>
  </Box>
)}
```

### AI分身列表为空

```typescript
{avatars.length === 0 && (
  <Flex direction="column" gap={3} bg="white" borderRadius="20px" py={12}>
    <SmallCloseIcon boxSize={6} color="gray.400" />
    <Text color="gray.500">当前筛选条件下暂无 AI 分身</Text>
  </Flex>
)}
```

## 加载状态

### 全局加载状态

```typescript
const [isLoading, setIsLoading] = useState(false);

// 加载时显示骨架屏或加载提示
{isLoading && <Spinner />}
```

### 错误处理

```typescript
try {
  // API调用
} catch (error) {
  console.error('加载数据失败:', error);
  toast({
    title: '加载数据失败',
    description: '请刷新页面重试',
    status: 'error'
  });
}
```

## 影响范围

### 受影响的组件

1. **SuggestionList** - AI智能建议列表
2. **StudentTodoList** - 今日待办学生列表
3. **AvatarCardList** - AI分身卡片列表
4. **MetricCard** - 统计数据卡片

### 不受影响的部分

- 类型定义（保持不变）
- 组件结构（保持不变）
- 样式和布局（保持不变）

## 测试建议

### 正常场景

1. **有数据**：
   - 验证数据正确显示
   - 验证交互功能正常

2. **无数据**：
   - 验证空状态提示显示
   - 验证UI不崩溃

3. **部分数据**：
   - 有建议但无待办
   - 有待办但无AI分身
   - 各种组合

### 异常场景

1. **API失败**：
   - 网络错误
   - 服务器错误
   - 超时

2. **数据格式错误**：
   - 字段缺失
   - 类型不匹配
   - 空值处理

3. **权限问题**：
   - 未登录
   - 无权限访问

## 优点

✅ **数据真实性**：
- 显示真实的业务数据
- 反映实际使用情况

✅ **数据一致性**：
- 多用户看到相同数据
- 数据实时更新

✅ **可维护性**：
- 减少硬编码
- 便于调试和测试

✅ **用户体验**：
- 数据准确可靠
- 操作结果实时反馈

## 注意事项

### 1. 首次加载

用户首次使用时，如果没有任何数据，会看到空状态。这是正常的，需要：
- 引导用户创建AI分身
- 提供快速入门指南

### 2. 加载时间

API请求需要时间，建议：
- 显示加载状态
- 使用骨架屏提升体验
- 考虑数据缓存

### 3. 错误恢复

API失败时，建议：
- 显示友好的错误提示
- 提供重试按钮
- 记录错误日志

## 后续优化

### 1. 数据缓存

使用SWR或React Query：

```typescript
import useSWR from 'swr';

const { data, error, mutate } = useSWR(
  `/api/teacher/${teacherId}/home`,
  fetchHomeData,
  {
    revalidateOnFocus: true,
    refreshInterval: 60000 // 1分钟刷新
  }
);
```

### 2. 骨架屏

加载时显示骨架屏：

```typescript
{isLoading ? (
  <SkeletonCard />
) : (
  <AvatarCard data={avatar} />
)}
```

### 3. 乐观更新

操作后立即更新UI，不等待API响应：

```typescript
// 立即更新UI
setAvatars(optimisticUpdate);

// 后台同步
await updateAvatarStatus();

// 失败时回滚
if (error) {
  setAvatars(previousState);
}
```

### 4. 分页加载

数据量大时使用分页：

```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const newData = await fetchPage(page + 1);
  setData([...data, ...newData]);
  setPage(page + 1);
};
```

## 总结

✅ **已完成**：
- 清空所有假数据
- 确保数据从API加载
- 保持类型定义不变

✅ **数据流**：
- API → 数据转换 → 状态更新 → UI渲染

📝 **待优化**：
- 数据缓存
- 骨架屏
- 乐观更新
- 分页加载
