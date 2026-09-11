# AI建议标记已读功能实现总结

## 完成的工作

### 1. 添加API接口 (`src/teacher/api/aiTeacher.ts`)

实现了统一的批量标记已读接口（支持单个或多个）：

**批量标记已读（支持单个或多个）**
```typescript
batchMarkSuggestionsRead(data: {
  teacherId: number;
  suggestionIds: number[]; // 建议ID数组，支持单个或多个
}): Promise<boolean>
```
- 接口：`/client/aiTeacher/suggestions/markRead`
- 参数：`suggestionIds` 为数组类型，可以传入单个或多个ID
- 用于标记单个或批量标记多个AI建议为已读

### 2. 业务逻辑实现 (`useTeacherHome.ts`)

**单个建议操作 (handleSuggestionAction)**
- 验证建议状态（是否存在、是否已读）
- 调用 `batchMarkSuggestionsRead` API，传入单个ID的数组 `[id]`
- 更新本地状态
- 显示成功/失败提示

**批量标记前沿资讯 (handleMarkAllNewsRead)**
- 筛选所有未读的前沿资讯
- 调用 `batchMarkSuggestionsRead` API，传入多个ID的数组
- 批量更新本地状态
- 显示成功/失败提示

### 3. 错误处理

- 所有函数都包含 try-catch 错误处理
- API调用失败时显示友好的错误提示
- 记录错误日志到控制台
- 失败时不更新本地状态

## 使用方式

### 单个建议标记已读
```typescript
// 用户点击建议卡片的操作按钮
// 传入单个ID的数组
await batchMarkSuggestionsRead({
  teacherId: 1,
  suggestionIds: [123]
});
```

### 批量标记前沿资讯已读
```typescript
// 用户点击"全部标记为已读"按钮
// 传入多个ID的数组
await batchMarkSuggestionsRead({
  teacherId: 1,
  suggestionIds: [123, 456, 789]
});
```

## 接口设计优势

使用统一的批量接口，参数为数组类型：
- ✅ 接口更简洁，只需维护一个接口
- ✅ 灵活支持单个或多个ID
- ✅ 减少后端接口数量
- ✅ 前端调用更统一

## 数据流

### 单个标记
1. 用户点击操作按钮
2. 验证建议状态
3. 调用批量API，传入 `[id]`
4. 更新本地状态
5. 显示提示

### 批量标记
1. 用户点击"全部标记为已读"
2. 筛选未读的前沿资讯
3. 调用批量API，传入 `[id1, id2, ...]`
4. 批量更新本地状态
5. 显示提示

## 应用场景

1. **AI教师首页 - 前沿资讯区域**
   - 用户查看单个资讯后自动标记已读（传入单个ID）
   - 用户点击"全部标记为已读"批量标记（传入多个ID）

2. **AI教师首页 - 课程优化建议**
   - 用户查看优化建议后标记已读（传入单个ID）

3. **AI教师首页 - 能力图谱建议**
   - 用户采纳图谱更新后标记已读（传入单个ID）

## 技术特点

- ✅ 使用统一的批量接口
- ✅ 参数为数组类型，灵活支持单个或多个
- ✅ 完整的错误处理
- ✅ 友好的用户提示
- ✅ 本地状态同步
- ✅ 防止重复标记
- ✅ 批量操作优化（只标记未读的）

## 后续可优化项

- [ ] 乐观更新（先更新UI，失败时回滚）
- [ ] 防抖处理（避免快速重复点击）
- [ ] 使用Zustand管理建议状态
- [ ] 离线支持（记录离线操作，网络恢复后同步）
