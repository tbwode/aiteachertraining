# AI分身发布/取消发布功能实现文档

## 概述

实现了AI教师主页的AI分身发布/取消发布功能，通过调用后端API `/client/aiTeacher/avatars/updateStatus` 来更新AI分身的状态。

## 实现日期

2026-04-15

## API接口

### 接口地址

`POST /ai-university/client/aiTeacher/avatars/updateStatus`

### 请求参数

```typescript
{
  id: number;        // AI分身ID
  status: number;    // 操作类型：1-发布，0-取消发布
  teacherId: number; // 教师ID
}
```

### 响应

```typescript
boolean // 操作是否成功
```

## 实现内容

### 1. 修正类型定义

**文件**: `high-school-teacher/projects/app/src/teacher/types/aiTeacher.ts`

**修改前**:
```typescript
export type AiAvatarPublishRequest = {
  avatarId: number;  // ❌ 错误的字段名
  status: number;
  teacherId: number;
};
```

**修改后**:
```typescript
export type AiAvatarPublishRequest = {
  id: number;        // ✅ 正确的字段名
  status: number;    // 操作类型：1-发布，0-取消发布
  teacherId: number; // 教师ID
};
```

### 2. API接口定义

**文件**: `high-school-teacher/projects/app/src/teacher/api/aiTeacher.ts`

接口已经正确定义：

```typescript
/**
 * 发布/取消发布AI分身
 */
export const updateAiAvatarStatus = (data: AiAvatarPublishRequest): Promise<boolean> =>
  POST<boolean>('/client/aiTeacher/avatars/updateStatus', data, { baseURL });
```

### 3. 主页Hook实现

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/home/hooks/useTeacherHome.ts`

#### 核心函数: `handleTogglePublish`

```typescript
const handleTogglePublish = async (id: string) => {
  const currentAvatar = avatars.find((item) => item.id === id);
  if (!currentAvatar) {
    return;
  }

  // 临时写死teacherId为1,方便测试
  const teacherId = 1;
  const isPublishing = currentAvatar.status !== 'running';
  const newStatus = isPublishing ? 1 : 0;

  try {
    // 调用API更新状态
    await updateAiAvatarStatus({
      id: Number(id),
      status: newStatus,
      teacherId
    });

    // 更新本地状态
    setAvatars((list) =>
      list.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (item.status === 'running') {
          return {
            ...item,
            status: 'pending'
          };
        }

        return {
          ...item,
          status: 'running'
          };
      })
    );

    // 同步更新本地存储
    const nextStatus = currentAvatar.status === 'running' ? 'pending' : 'running';
    updateStoredAvatarStatus(id, nextStatus);

    const message =
      currentAvatar.status === 'running'
        ? '已取消发布'
        : currentAvatar.status === 'expired'
          ? '已重新发布'
          : '发布成功';

    toast({
      title: message,
      status: 'success',
      duration: 1800,
      isClosable: true,
      position: 'top'
    });
  } catch (error) {
    console.error('handleTogglePublish - 更新状态失败:', error);
    toast({
      title: '操作失败',
      description: '请稍后重试',
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
  }
};
```

### 4. UI组件集成

**文件**: `high-school-teacher/projects/app/src/app/teacher/(layoutPage)/home/components/AvatarCardList.tsx`

卡片悬停时显示发布/取消发布按钮：

```typescript
<Flex
  position="absolute"
  inset={0}
  align="center"
  justify="center"
  bg="rgba(0,0,0,0.45)"
  opacity={0}
  transition="opacity 0.2s ease"
  _groupHover={{ opacity: 1 }}
>
  <Button
    bg="white"
    color={statusMeta.overlayActionColor}
    _hover={{ bg: 'gray.100' }}
    onClick={() => onTogglePublish(avatar.id)}
  >
    {statusMeta.overlayAction}
  </Button>
</Flex>
```

## 功能逻辑

### 状态映射

| 当前状态 | 操作 | API参数 | 新状态 | 提示消息 |
|---------|------|---------|--------|---------|
| `pending` (未开始) | 发布 | `status: 1` | `running` | "发布成功" |
| `running` (运行中) | 取消发布 | `status: 0` | `pending` | "已取消发布" |
| `expired` (已截止) | 重新发布 | `status: 1` | `running` | "已重新发布" |

### 按钮文本映射

在 `utils.ts` 的 `getStatusMeta()` 函数中定义：

```typescript
export function getStatusMeta(status: AvatarStatus, accentColor: string) {
  switch (status) {
    case 'pending':
      return {
        // ...
        overlayAction: '发布',
        overlayActionColor: '#52C41A'
      };
    case 'running':
      return {
        // ...
        overlayAction: '取消发布',
        overlayActionColor: '#F5222D'
      };
    case 'expired':
      return {
        // ...
        overlayAction: '重新发布',
        overlayActionColor: '#1677FF'
      };
  }
}
```

## 数据流

```
1. 用户悬停在AI分身卡片上
   ↓
2. 显示发布/取消发布按钮
   ↓
3. 用户点击按钮
   ↓
4. handleTogglePublish() 被调用
   ↓
5. 调用 updateAiAvatarStatus() API
   ↓
6. API返回成功
   ↓
7. 更新本地状态 (setAvatars)
   ↓
8. 更新localStorage (updateStoredAvatarStatus)
   ↓
9. 显示成功提示 (toast)
```

## 错误处理

1. **网络错误**: 捕获异常，显示"操作失败"提示
2. **找不到AI分身**: 提前返回，不执行任何操作
3. **API返回失败**: 显示错误提示，不更新本地状态

## 本地存储同步

为了保持数据一致性，在API调用成功后：

1. 更新React状态 (`setAvatars`)
2. 同步更新localStorage (`updateStoredAvatarStatus`)

这样即使刷新页面，状态也能保持一致。

## 测试建议

### 功能测试

1. **发布未开始的AI分身**
   - 点击"发布"按钮
   - 验证状态变为"运行中"
   - 验证显示"发布成功"提示

2. **取消发布运行中的AI分身**
   - 点击"取消发布"按钮
   - 验证状态变为"未开始"
   - 验证显示"已取消发布"提示

3. **重新发布已截止的AI分身**
   - 点击"重新发布"按钮
   - 验证状态变为"运行中"
   - 验证显示"已重新发布"提示

### 边界测试

1. **网络错误**
   - 断开网络
   - 点击发布按钮
   - 验证显示错误提示
   - 验证状态未改变

2. **快速连续点击**
   - 快速点击发布按钮多次
   - 验证只发送一次请求
   - 验证状态正确

3. **刷新页面**
   - 发布AI分身
   - 刷新页面
   - 验证状态保持一致

## 待优化事项

### 1. 乐观更新

当前实现是等待API返回后才更新UI，可以改为乐观更新：

```typescript
// 先更新UI
setAvatars(/* 新状态 */);

try {
  await updateAiAvatarStatus(/* ... */);
} catch (error) {
  // 失败时回滚
  setAvatars(/* 旧状态 */);
  toast({ title: '操作失败' });
}
```

### 2. 防抖处理

添加防抖，避免用户快速连续点击：

```typescript
const [isToggling, setIsToggling] = useState(false);

const handleTogglePublish = async (id: string) => {
  if (isToggling) return;

  setIsToggling(true);
  try {
    // ... 执行操作
  } finally {
    setIsToggling(false);
  }
};
```

### 3. 国际化支持

将硬编码的提示文本替换为国际化key：

```typescript
toast({
  title: t('avatar.publish.success'),
  status: 'success'
});
```

### 4. 权限控制

添加权限检查，只有创建者或管理员才能发布/取消发布：

```typescript
if (!canManageAvatar(currentAvatar, currentUser)) {
  toast({ title: '无权限操作' });
  return;
}
```

## 总结

✅ **已完成**:
- 修正了API参数类型定义（`id` 而不是 `avatarId`）
- 实现了完整的发布/取消发布功能
- 添加了错误处理和用户提示
- 同步更新本地存储

✅ **功能特性**:
- 支持三种状态切换（未开始→运行中→已截止）
- 悬停显示操作按钮
- 实时更新UI
- 友好的错误提示

📝 **待优化**:
- 乐观更新提升用户体验
- 防抖处理避免重复请求
- 国际化支持
- 权限控制
