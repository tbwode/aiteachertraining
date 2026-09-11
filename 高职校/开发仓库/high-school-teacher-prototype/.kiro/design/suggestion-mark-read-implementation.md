# AI建议标记已读功能实现文档

## 1. 需求说明

在AI教师首页中，需要实现AI建议的标记已读功能：
- 单个建议标记已读
- 批量标记前沿资讯已读（全部标记为已读）
- 调用后端API持久化已读状态

## 2. 实现方案

### 2.1 API 层

在 `src/teacher/api/aiTeacher.ts` 中添加两个接口：

#### 单个标记已读
```typescript
export const markSuggestionRead = (data: {
  teacherId: number;
  suggestionId: number;
}): Promise<boolean>
```
- 接口地址：`/client/aiTeacher/suggestions/markRead`
- 请求参数：教师ID、建议ID
- 返回：操作是否成功

#### 批量标记已读
```typescript
export const batchMarkSuggestionsRead = (data: {
  teacherId: number;
  suggestionIds: number[];
}): Promise<boolean>
```
- 接口地址：`/client/aiTeacher/suggestions/markRead`
- 请求参数：教师ID、建议ID数组
- 返回：操作是否成功

### 2.2 业务逻辑层

修改 `useTeacherHome.ts` 中的处理函数：

#### 单个建议操作 (handleSuggestionAction)

```typescript
const handleSuggestionAction = async (id: string) => {
  // 1. 验证：检查建议是否存在、是否已读
  const current = suggestions.find((item) => item.id === id);
  if (!current || current.read) return;

  // 2. 调用API标记已读
  await markSuggestionRead({
    teacherId,
    suggestionId: Number(id)
  });

  // 3. 更新本地状态
  updateSuggestion(id);

  // 4. 显示成功提示
  toast({ title: '已标记为已读', ... });
};
```

#### 批量标记前沿资讯已读 (handleMarkAllNewsRead)

```typescript
const handleMarkAllNewsRead = async () => {
  // 1. 获取所有未读的前沿资讯ID
  const unreadNewsIds = suggestions
    .filter((item) => item.type === 'news' && !item.read)
    .map((item) => Number(item.id));

  if (unreadNewsIds.length === 0) return;

  // 2. 调用批量标记已读API
  await batchMarkSuggestionsRead({
    teacherId,
    suggestionIds: unreadNewsIds
  });

  // 3. 更新本地状态
  setSuggestions((list) =>
    list.map((item) =>
      item.type === 'news' ? { ...item, read: true } : item
    )
  );

  // 4. 显示成功提示
  toast({ title: '前沿资讯已全部标记为已读', ... });
};
```

## 3. 数据流

### 单个标记已读流程
1. 用户点击建议卡片的操作按钮
2. 调用 `handleSuggestionAction(id)`
3. 验证建议状态（是否存在、是否已读）
4. 调用 `markSuggestionRead` API
5. 更新本地状态（设置 `read: true`）
6. 显示成功提示

### 批量标记已读流程
1. 用户点击"全部标记为已读"按钮
2. 调用 `handleMarkAllNewsRead()`
3. 筛选出所有未读的前沿资讯
4. 调用 `batchMarkSuggestionsRead` API
5. 批量更新本地状态
6. 显示成功提示

## 4. 错误处理

所有标记已读函数都包含 try-catch 错误处理：
- 捕获API调用失败的异常
- 显示友好的错误提示
- 记录错误日志到控制台
- 不更新本地状态（保持原状态）

## 5. 用户体验优化

1. **乐观更新**
   - 当前实现是先调用API，成功后再更新UI
   - 可以考虑乐观更新：先更新UI，失败时回滚

2. **防重复点击**
   - 已读的建议不能再次标记
   - 可以考虑添加loading状态防止重复点击

3. **批量操作优化**
   - 只标记未读的建议，避免无效请求
   - 如果没有未读建议，直接返回

## 6. 使用场景

### 场景1：查看单个建议
用户点击建议卡片上的"查看详情"或"采纳"按钮：
```typescript
// 在建议卡片组件中
<Button onClick={() => handleSuggestionAction(suggestion.id)}>
  {suggestion.action === 'adopt' ? '采纳' : '查看'}
</Button>
```

### 场景2：批量标记前沿资讯
用户点击前沿资讯区域的"全部标记为已读"按钮：
```typescript
// 在前沿资讯区域
<Button onClick={handleMarkAllNewsRead}>
  全部标记为已读
</Button>
```

## 7. 后续优化建议

1. **乐观更新**
   ```typescript
   // 先更新UI
   updateSuggestion(id);

   try {
     await markSuggestionRead(...);
   } catch (error) {
     // 失败时回滚
     updateSuggestion(id, { read: false });
   }
   ```

2. **防抖处理**
   - 对批量操作添加防抖，避免用户快速点击

3. **状态管理优化**
   - 考虑使用 Zustand 管理建议状态
   - 避免在多个组件中重复加载

4. **离线支持**
   - 记录离线时的操作
   - 网络恢复后同步到服务器

## 8. 测试要点

- [ ] 单个建议标记已读成功
- [ ] 批量标记前沿资讯已读成功
- [ ] 已读建议不能重复标记
- [ ] API调用失败的错误处理
- [ ] 没有未读建议时的处理
- [ ] 成功/失败提示正确显示
- [ ] 本地状态正确更新

## 9. 相关文件

- `src/teacher/api/aiTeacher.ts` - API接口定义
- `src/teacher/types/aiTeacher.ts` - 类型定义
- `src/app/teacher/(layoutPage)/home/hooks/useTeacherHome.ts` - 业务逻辑
- `src/app/teacher/(layoutPage)/home/page.tsx` - UI组件
