# AI教师模块国际化总结

## 当前状态

### ✅ 已完成
1. **翻译文件准备完毕**
   - 英文：`public/locales/en/teacher-aiTeacher.json`
   - 中文：`public/locales/zh-CN/teacher-aiTeacher.json`
   - 覆盖所有AI教师模块的文本内容

2. **文档准备完毕**
   - 国际化实施指南：`.Codex/design/i18n-implementation-guide.md`
   - 示例代码：`.Codex/design/i18n-example-StudentDetailModal.md`
   - 本总结文档

### ⏳ 待实施
需要更新以下组件以使用翻译：

#### 首页模块 (`/teacher/(layoutPage)/home`)
- [ ] `page.tsx` - 首页主组件
- [ ] `components/MetricCard.tsx` - 统计卡片
- [ ] `components/AISuggestions.tsx` - AI建议
- [ ] `components/StudentTodoList.tsx` - 待办列表
- [ ] `components/StudentDetailModal.tsx` - 学生详情弹窗
- [ ] `components/AvatarCardList.tsx` - AI分身卡片列表

#### AI分身详情 (`/teacher/(layoutPage)/aiTeacher/avatar/detail`)
- [ ] `page.tsx` - 详情页主组件
- [ ] `components/AvatarHeader.tsx` - 头部组件
- [ ] `components/TabIntroduction.tsx` - 课程介绍Tab
- [ ] `components/TabCatalog.tsx` - 课程目录Tab
- [ ] `components/TabStudents.tsx` - 学生管理Tab

#### AI分身编辑 (`/teacher/(layoutPage)/aiTeacher/avatar/edit`)
- [ ] `page.tsx` - 编辑页主组件
- [ ] 相关子组件

#### AI分身创建 (`/teacher/(layoutPage)/aiTeacher/avatar/create`)
- [ ] `page.tsx` - 创建页主组件
- [ ] 步骤组件

## 实施步骤

### 第一步：导入翻译Hook
在每个组件顶部添加：
```typescript
import { useTranslation } from 'react-i18next';
```

### 第二步：使用Hook
在组件函数内添加：
```typescript
const { t } = useTranslation('teacher-aiTeacher');
```

### 第三步：替换硬编码文本
将所有硬编码的中文文本替换为翻译函数调用：
```typescript
// 之前
<Text>我的课程</Text>

// 之后
<Text>{t('home.metrics.myCourses')}</Text>
```

### 第四步：处理带参数的文本
```typescript
// 之前
<Text>欢迎回来，{name}</Text>

// 之后
<Text>{t('home.header.welcome', { name })}</Text>
```

### 第五步：测试
- 切换到中文，验证显示
- 切换到英文，验证显示
- 检查所有参数是否正确传递

## 翻译文件结构

```
teacher-aiTeacher.json
├── home                    # 首页模块
│   ├── header             # 头部
│   ├── metrics            # 统计指标
│   ├── suggestions        # AI建议
│   ├── todos              # 待办事项
│   └── avatars            # AI分身列表
└── avatar                 # AI分身模块
    ├── common             # 通用内容
    ├── create             # 创建
    ├── detail             # 详情
    └── edit               # 编辑
```

## 快速参考

### 常用翻译键

#### 通用操作
```typescript
t('avatar.common.actions.cancel')      // 取消
t('avatar.common.actions.confirm')     // 确认
t('avatar.common.actions.close')       // 关闭
t('avatar.common.actions.save')        // 保存
t('avatar.common.actions.delete')      // 删除
```

#### 通用单位
```typescript
t('avatar.common.units.students', { count: 45 })    // 45人 / 45 students
t('avatar.common.units.hours', { count: 2 })        // 2学时 / 2 hours
t('avatar.common.units.days', { count: 5 })         // 5天 / 5 days
```

#### 状态
```typescript
t('avatar.common.status.running')      // AI教师运行中 / AI Teacher Running
t('avatar.common.status.pending')      // 未开始 / Not Started
t('avatar.common.status.expired')      // 已截止 / Ended
```

### 带参数的翻译示例

```typescript
// 欢迎语
t('home.header.welcome', { name: '王老师' })
// 中文：欢迎回来，王老师
// 英文：Welcome back, Teacher Wang

// 学生数量
t('home.todos.needsAttention', { count: 3 })
// 中文：3位学生需关注
// 英文：3 students need attention

// 课程信息
t('avatar.detail.studentDetailModal.course', { title: '数据结构' })
// 中文：课程：数据结构
// 英文：Course: Data Structures
```

## 注意事项

### 1. 命名空间
所有AI教师模块统一使用 `'teacher-aiTeacher'` 命名空间：
```typescript
const { t } = useTranslation('teacher-aiTeacher');
```

### 2. 不要硬编码
❌ 错误：
```typescript
<Text>我的课程</Text>
<Button>保存</Button>
```

✅ 正确：
```typescript
<Text>{t('home.metrics.myCourses')}</Text>
<Button>{t('avatar.common.actions.save')}</Button>
```

### 3. 参数命名要清晰
❌ 错误：
```typescript
t('home.header.welcome', { n: name })
```

✅ 正确：
```typescript
t('home.header.welcome', { name: name })
```

### 4. 复用通用翻译
对于常用的操作和单位，使用 `avatar.common.*` 下的翻译键，避免重复定义。

### 5. Toast消息也要翻译
```typescript
toast({
  title: t('home.todos.toasts.remindStudent', { name: '张三' }),
  status: 'success'
});
```

## 测试清单

实施完成后，需要测试以下内容：

- [ ] 首页所有文本中英文切换正常
- [ ] AI分身详情页所有文本中英文切换正常
- [ ] AI分身编辑页所有文本中英文切换正常
- [ ] AI分身创建页所有文本中英文切换正常
- [ ] 所有Toast消息中英文切换正常
- [ ] 所有表单验证消息中英文切换正常
- [ ] 带参数的翻译显示正确
- [ ] 单位显示正确（人、小时、天等）
- [ ] 日期时间格式正确

## 相关资源

### 文档
- 实施指南：`.Codex/design/i18n-implementation-guide.md`
- 示例代码：`.Codex/design/i18n-example-StudentDetailModal.md`

### 翻译文件
- 英文：`public/locales/en/teacher-aiTeacher.json`
- 中文：`public/locales/zh-CN/teacher-aiTeacher.json`

### 代码
- Hook：`packages/web/hooks/useI18n.ts`
- 配置：`next-i18next.config.js`

## 下一步行动

1. **优先级1**：首页模块
   - 用户最常访问
   - 影响面最大

2. **优先级2**：AI分身详情
   - 核心功能
   - 使用频率高

3. **优先级3**：AI分身编辑和创建
   - 相对使用频率较低
   - 但同样重要

建议按照优先级顺序逐步实施，每完成一个模块就进行测试，确保质量。
