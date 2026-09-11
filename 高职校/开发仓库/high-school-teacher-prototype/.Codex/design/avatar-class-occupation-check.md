# AI分身班级占用检查优化文档

## 概述

优化了新建AI分身时的班级占用检查逻辑，只统计 `status === 1`（运行中）的AI分身，并从后端API获取实时数据。

## 实现日期

2026-04-15

## 问题背景

### 原有问题

1. **统计所有状态的AI分身**：无论AI分身是"未开始"、"运行中"还是"已截止"，都会占用班级
2. **只使用localStorage**：数据不同步，无法获取其他教师创建的AI分身
3. **数据不准确**：清除浏览器缓存后数据丢失

### 业务需求

根据接口文档说明：
> `/client/aiTeacher/avatars/list` 的返回值 `status` 为 1 的情况下，才在新建AI分身中算入已创建的分身

即：**只有运行中（status === 1）的AI分身才占用班级**

## 实现方案

### 1. 修改localStorage逻辑

**文件**: `avatarStorage.ts`

**修改前**:
```typescript
export function getUnavailableClasses(courseId: string) {
  const records = getStoredAvatarRecords();
  const dynamicOccupied = records
    .filter((record) => record.courseId === courseId) // ❌ 统计所有状态
    .flatMap((record) => record.coverageClasses);

  return Array.from(new Set([...(STATIC_OCCUPIED_CLASSES[courseId] ?? []), ...dynamicOccupied]));
}
```

**修改后**:
```typescript
export function getUnavailableClasses(courseId: string) {
  const records = getStoredAvatarRecords();
  const dynamicOccupied = records
    .filter((record) => record.courseId === courseId && record.status === 'running') // ✅ 只统计运行中的
    .flatMap((record) => record.coverageClasses);

  return Array.from(new Set([...(STATIC_OCCUPIED_CLASSES[courseId] ?? []), ...dynamicOccupied]));
}
```

### 2. 从API加载已创建的AI分身

**文件**: `useAvatarWizard.ts`

#### 添加状态

```typescript
const [createdAvatars, setCreatedAvatars] = useState<
  Array<{ courseName: string; classes: string[] }>
>([]); // 已创建的AI分身列表（只包含运行中的）
```

#### 加载数据

```typescript
// 加载已创建的AI分身列表（只统计运行中的）
useEffect(() => {
  const loadCreatedAvatars = async () => {
    const teacherId = 1;

    try {
      console.log('useAvatarWizard - 加载已创建的AI分身列表');
      const avatarList = await getAiAvatarList({ teacherId });

      // 只统计 status === 1（运行中）的AI分身
      const runningAvatars = avatarList
        .filter((avatar) => avatar.status === 1)
        .map((avatar) => ({
          courseName: avatar.courseName, // 使用课程名称作为标识
          classes: avatar.classNameList || []
        }));

      console.log('useAvatarWizard - 运行中的AI分身:', runningAvatars);
      setCreatedAvatars(runningAvatars);
    } catch (error) {
      console.error('useAvatarWizard - 加载已创建的AI分身失败:', error);
      setCreatedAvatars([]);
    }
  };

  loadCreatedAvatars();
}, []);
```

### 3. 更新班级占用计算逻辑

```typescript
// 计算不可用的班级（从API加载的运行中的AI分身）
const unavailableClasses = useMemo(() => {
  if (!draft.courseId || !selectedCourse) {
    return [];
  }

  // 从API加载的已创建AI分身中提取班级（通过课程名称匹配）
  const apiOccupiedClasses = createdAvatars
    .filter((avatar) => avatar.courseName === selectedCourse.title)
    .flatMap((avatar) => avatar.classes);

  // 从localStorage中提取运行中的AI分身的班级（作为备用）
  const localOccupiedClasses = getUnavailableClasses(draft.courseId);

  // 合并并去重
  const allOccupied = Array.from(new Set([...apiOccupiedClasses, ...localOccupiedClasses]));

  console.log('unavailableClasses - 计算结果:', {
    courseId: draft.courseId,
    courseName: selectedCourse.title,
    apiOccupiedClasses,
    localOccupiedClasses,
    allOccupied
  });

  return allOccupied;
}, [draft.courseId, selectedCourse, createdAvatars]);
```

## 数据流

```
1. 页面加载
   ↓
2. 并行加载课程列表和已创建的AI分身列表
   ↓
3. 过滤出 status === 1 的AI分身
   ↓
4. 提取每个AI分身的课程名称和班级列表
   ↓
5. 用户选择课程
   ↓
6. 通过课程名称匹配，找出该课程下运行中的AI分身
   ↓
7. 提取所有已占用的班级
   ↓
8. 从课程的所有班级中过滤掉已占用的班级
   ↓
9. 显示可选班级列表
```

## 关键设计决策

### 为什么使用课程名称而不是教学任务ID？

**原因**：API返回的 `AiAvatarVO` 中没有 `teachingTaskId` 字段

**API返回的字段**：
```typescript
{
  id: number;
  status: number;
  courseName: string;  // ✅ 有课程名称
  classNameList: string[];
  // ❌ 没有 teachingTaskId
}
```

**解决方案**：使用 `courseName` 进行匹配

**潜在问题**：
- 如果同一课程有多个教学任务，可能会误判
- 建议后端API增加 `teachingTaskId` 字段

### 为什么同时使用API数据和localStorage？

**双重保障策略**：

1. **API数据（主要）**：
   - 实时、准确
   - 包含所有教师创建的AI分身
   - 多设备同步

2. **localStorage（备用）**：
   - 离线可用
   - API失败时的降级方案
   - 快速响应

**合并逻辑**：
```typescript
const allOccupied = Array.from(new Set([
  ...apiOccupiedClasses,      // API数据优先
  ...localOccupiedClasses     // localStorage作为补充
]));
```

## 状态映射

| status值 | 状态名称 | 是否占用班级 | 说明 |
|---------|---------|------------|------|
| 0 | 未开始 | ❌ 否 | 草稿状态，未发布 |
| 1 | 运行中 | ✅ 是 | 已发布，正在使用 |
| 2 | 已截止 | ❌ 否 | 已过期，不再占用 |

## 测试场景

### 场景1：正常创建

1. 教师A创建了"数据结构"课程的AI分身，覆盖"计算机1班"，状态为"运行中"
2. 教师B新建"数据结构"课程的AI分身
3. **预期**：班级列表中不显示"计算机1班"

### 场景2：取消发布后

1. 教师A取消发布"数据结构"课程的AI分身（状态变为"未开始"）
2. 教师B刷新页面
3. **预期**：班级列表中重新显示"计算机1班"

### 场景3：课程截止后

1. "数据结构"课程的AI分身到期（状态变为"已截止"）
2. 教师新建同一课程的AI分身
3. **预期**：班级列表中显示所有班级（包括之前被占用的）

### 场景4：API失败

1. 网络断开或API返回错误
2. 用户新建AI分身
3. **预期**：使用localStorage数据作为降级方案

## 日志输出

为了方便调试，添加了详细的日志：

```typescript
console.log('useAvatarWizard - 加载已创建的AI分身列表');
console.log('useAvatarWizard - 运行中的AI分身:', runningAvatars);
console.log('unavailableClasses - 计算结果:', {
  courseId,
  courseName,
  apiOccupiedClasses,
  localOccupiedClasses,
  allOccupied
});
```

## 待优化事项

### 1. 后端API增加teachingTaskId

**建议**：在 `AiAvatarVO` 中增加 `teachingTaskId` 字段

```typescript
export type AiAvatarVO = {
  id: number;
  teachingTaskId: number; // 新增：教学任务ID
  status: number;
  courseName: string;
  // ...
};
```

**优点**：
- 更精确的匹配（避免课程名称重复）
- 支持同一课程的多个教学任务

### 2. 实时刷新

**当前**：只在页面加载时获取一次数据

**优化**：
- 定时刷新（如每30秒）
- WebSocket实时推送
- 发布/取消发布后自动刷新

```typescript
// 定时刷新示例
useEffect(() => {
  const interval = setInterval(() => {
    loadCreatedAvatars();
  }, 30000); // 30秒

  return () => clearInterval(interval);
}, []);
```

### 3. 缓存优化

**当前**：每次都重新请求API

**优化**：
- 使用SWR或React Query进行缓存
- 设置合理的缓存时间
- 支持手动刷新

```typescript
import useSWR from 'swr';

const { data: createdAvatars, mutate } = useSWR(
  `/api/avatars/${teacherId}`,
  () => getAiAvatarList({ teacherId }),
  {
    revalidateOnFocus: true,
    refreshInterval: 30000
  }
);
```

### 4. 编辑模式特殊处理

**问题**：编辑AI分身时，当前AI分身占用的班级应该可选

**解决方案**：
```typescript
const unavailableClasses = useMemo(() => {
  // ...

  // 如果是编辑模式，排除当前AI分身占用的班级
  if (isEditMode && currentAvatarId) {
    return allOccupied.filter(className =>
      !currentAvatarClasses.includes(className)
    );
  }

  return allOccupied;
}, [/* ... */]);
```

## 总结

✅ **已完成**:
- 只统计 `status === 1` 的AI分身
- 从API获取实时数据
- localStorage作为降级方案
- 详细的日志输出

✅ **核心改进**:
- 数据准确性提升（只统计运行中的）
- 多用户协作支持（API数据同步）
- 容错性增强（双重数据源）

📝 **待优化**:
- 后端API增加 `teachingTaskId` 字段
- 实时刷新机制
- 缓存优化
- 编辑模式特殊处理
