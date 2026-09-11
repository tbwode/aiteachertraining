# AI教师模块国际化实施指南

## 概述

本文档说明如何为AI教师模块添加完整的国际化（i18n）支持，实现中英文切换功能。

## 翻译文件

翻译文件已经准备好：
- 英文：`public/locales/en/teacher-aiTeacher.json`
- 中文：`public/locales/zh-CN/teacher-aiTeacher.json`

## 使用方法

### 1. 导入翻译Hook

```typescript
import { useTranslation } from 'react-i18next';
```

### 2. 在组件中使用

```typescript
export function MyComponent() {
  const { t } = useTranslation('teacher-aiTeacher');

  return (
    <Text>{t('home.header.title')}</Text>
  );
}
```

### 3. 带参数的翻译

```typescript
// 翻译文件中：
// "welcome": "欢迎回来，{{name}}"

const { t } = useTranslation('teacher-aiTeacher');
<Text>{t('home.header.welcome', { name: '王老师' })}</Text>
// 输出：欢迎回来，王老师
```

## 需要更新的组件列表

### 首页模块 (`/teacher/(layoutPage)/home`)

#### 1. `page.tsx` - 首页主组件
```typescript
import { useTranslation } from 'react-i18next';

export default function TeacherHomePage() {
  const { t } = useTranslation('teacher-aiTeacher');

  return (
    <>
      <Text fontSize="2xl">{t('home.header.title')}</Text>
      <Text fontSize="sm">{t('home.header.welcome', { name: '王老师' })}</Text>
    </>
  );
}
```

#### 2. `components/MetricCard.tsx` - 统计卡片
```typescript
const { t } = useTranslation('teacher-aiTeacher');

// 使用翻译
<Text>{t('home.metrics.myCourses')}</Text>
<Text>{t('home.metrics.unitCourse')}</Text>
```

#### 3. `components/AISuggestions.tsx` - AI建议
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('home.suggestions.title')}</Text>
<Text>{t('home.suggestions.categories.news')}</Text>
<Button>{t('home.suggestions.actions.markAllRead')}</Button>
```

#### 4. `components/StudentTodoList.tsx` - 待办列表
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('home.todos.title')}</Text>
<Text>{t('home.todos.needsAttention', { count: unremindedCount })}</Text>
<Th>{t('home.todos.table.studentName')}</Th>
```

#### 5. `components/StudentDetailModal.tsx` - 学生详情弹窗
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.detail.studentDetailModal.title')}</Text>
<Text>{t('avatar.detail.studentDetailModal.course', { title: student.course })}</Text>
<Button>{t('avatar.detail.studentDetailModal.sendReminder')}</Button>
```

#### 6. `components/AvatarCardList.tsx` - AI分身卡片列表
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('home.avatars.title')}</Text>
<Button>{t('home.avatars.create')}</Button>
<Text>{t('home.avatars.tabs.all')}</Text>
```

### AI分身详情模块 (`/teacher/(layoutPage)/aiTeacher/avatar/detail`)

#### 1. `page.tsx` - 详情页主组件
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Button>{t('avatar.detail.back')}</Button>
<Text>{t('avatar.detail.tabs.intro')}</Text>
```

#### 2. `components/AvatarHeader.tsx` - 头部组件
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.detail.header.semester')}</Text>
<Text>{t('avatar.detail.header.coverageClasses', { classes: '...', count: 2 })}</Text>
```

#### 3. `components/TabIntroduction.tsx` - 课程介绍Tab
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.detail.intro.title')}</Text>
<Text>{t('avatar.detail.graph.title')}</Text>
```

#### 4. `components/TabCatalog.tsx` - 课程目录Tab
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.detail.catalog.title')}</Text>
<Button>{t('avatar.detail.catalog.preview')}</Button>
```

#### 5. `components/TabStudents.tsx` - 学生管理Tab
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.detail.students.stats.total')}</Text>
<Input placeholder={t('avatar.detail.students.searchPlaceholder')} />
<Th>{t('avatar.detail.students.table.name')}</Th>
```

### AI分身编辑模块 (`/teacher/(layoutPage)/aiTeacher/avatar/edit`)

#### 1. `page.tsx` - 编辑页主组件
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Button>{t('avatar.edit.back')}</Button>
<Text>{t('avatar.edit.tabs.base')}</Text>
```

### AI分身创建模块 (`/teacher/(layoutPage)/aiTeacher/avatar/create`)

#### 1. `page.tsx` - 创建页主组件
```typescript
const { t } = useTranslation('teacher-aiTeacher');

<Text>{t('avatar.create.title')}</Text>
<Text>{t('avatar.create.steps.classConfig')}</Text>
```

## 翻译键命名规范

### 结构层次
```
模块.子模块.组件.字段
```

### 示例
```json
{
  "home": {                    // 首页模块
    "header": {                // 头部子模块
      "title": "...",          // 标题字段
      "welcome": "..."         // 欢迎语字段
    },
    "metrics": {               // 统计指标子模块
      "myCourses": "...",
      "unitCourse": "..."
    }
  }
}
```

## 常用翻译模式

### 1. 简单文本
```typescript
t('home.header.title')
```

### 2. 带参数
```typescript
t('home.header.welcome', { name: '王老师' })
```

### 3. 复数形式
```typescript
t('home.todos.needsAttention', { count: 2 })
// 中文：2位学生需关注
// 英文：2 students need attention
```

### 4. 单位
```typescript
t('avatar.common.units.students', { count: 45 })
// 中文：45人
// 英文：45 students
```

### 5. 日期范围
```typescript
t('avatar.common.time.dateRange', {
  start: '2024-01-01',
  end: '2024-06-30'
})
// 中文：2024-01-01 至 2024-06-30
// 英文：2024-01-01 to 2024-06-30
```

## Toast消息国际化

```typescript
const { t } = useTranslation('teacher-aiTeacher');

toast({
  title: t('home.todos.toasts.remindStudent', { name: '张三' }),
  status: 'success'
});
```

## 实施步骤

### 阶段1：首页模块（优先级：高）
1. ✅ 翻译文件已准备
2. ⏳ 更新 `page.tsx`
3. ⏳ 更新 `MetricCard.tsx`
4. ⏳ 更新 `AISuggestions.tsx`
5. ⏳ 更新 `StudentTodoList.tsx`
6. ⏳ 更新 `StudentDetailModal.tsx`
7. ⏳ 更新 `AvatarCardList.tsx`

### 阶段2：AI分身详情（优先级：高）
1. ⏳ 更新 `page.tsx`
2. ⏳ 更新 `AvatarHeader.tsx`
3. ⏳ 更新 `TabIntroduction.tsx`
4. ⏳ 更新 `TabCatalog.tsx`
5. ⏳ 更新 `TabStudents.tsx`

### 阶段3：AI分身编辑（优先级：中）
1. ⏳ 更新 `page.tsx`
2. ⏳ 更新相关组件

### 阶段4：AI分身创建（优先级：中）
1. ⏳ 更新 `page.tsx`
2. ⏳ 更新步骤组件

## 测试清单

- [ ] 中文显示正常
- [ ] 英文显示正常
- [ ] 切换语言后所有文本更新
- [ ] 带参数的翻译正确显示
- [ ] Toast消息正确翻译
- [ ] 表单验证消息正确翻译
- [ ] 日期时间格式正确
- [ ] 数字单位正确显示

## 注意事项

1. **不要硬编码文本**
   - ❌ `<Text>我的课程</Text>`
   - ✅ `<Text>{t('home.metrics.myCourses')}</Text>`

2. **使用正确的命名空间**
   - AI教师模块统一使用 `'teacher-aiTeacher'`

3. **保持翻译键的一致性**
   - 相同含义的文本使用相同的翻译键

4. **参数命名要清晰**
   - ✅ `{ name: '王老师', count: 5 }`
   - ❌ `{ n: '王老师', c: 5 }`

5. **测试所有语言**
   - 每次修改后测试中英文切换

## 相关文件

- 翻译文件：`public/locales/{lang}/teacher-aiTeacher.json`
- Hook：`packages/web/hooks/useI18n.ts`
- 配置：`next-i18next.config.js`
