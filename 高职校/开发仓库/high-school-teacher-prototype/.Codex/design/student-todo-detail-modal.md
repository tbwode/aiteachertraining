# 学生待办详情弹窗功能设计文档

## 概述

为首页"今日待办"模块实现了学生详情查看功能，通过弹窗展示学生的学习情况详细信息。设计参考了 `教师20260408/ai-teacher-home.html` 中的弹窗效果。

## 设计参考

参考HTML文件中的学生详情弹窗设计：
- 简洁的卡片式布局
- 圆形头像显示学生姓名首字
- 清晰的数据展示
- 滞后原因用黄色背景高亮显示
- 底部操作按钮布局

## 功能特性

### 1. 学生详情弹窗

**组件**: `StudentDetailModal`
**路径**: `src/app/teacher/(layoutPage)/home/components/StudentDetailModal.tsx`

#### 显示内容

1. **学生头像和基本信息**
   - 圆形头像（显示姓名首字）
   - 学生姓名
   - 所属班级

2. **学习数据**
   - 课程名称
   - 当前进度（百分比，颜色根据进度变化）
   - 学习时长（小时）
   - 最后学习时间描述

3. **滞后原因分析**
   - 黄色背景高亮显示
   - 以列表形式展示所有滞后原因
   - 使用 • 符号标记每条原因

#### 操作按钮

1. **发送提醒** - 仅对未提醒的学生显示，点击后发送提醒并关闭弹窗
2. **关闭** - 关闭弹窗
3. **已提醒提示** - 对已提醒的学生显示"该学生已提醒"文本

### 2. 视觉设计

#### 弹窗样式
- **尺寸**: 384px 宽度（md size）
- **位置**: 居中显示
- **背景遮罩**: 半透明黑色（blackAlpha.600）

#### 头像设计
- **尺寸**: 48px x 48px
- **背景**: `rgba(200,62,62,0.1)` (主色的10%透明度)
- **文字颜色**: `#C83E3E` (PRIMARY_COLOR)
- **形状**: 圆形
- **内容**: 学生姓名首字

#### 进度颜色
根据进度百分比动态变化：
- **0-39%**: `#F5222D` (红色 - error)
- **40-69%**: `#FAAD14` (橙色 - warning)
- **70-100%**: `#52C41A` (绿色 - success)

#### 滞后原因区域
- **背景**: `rgba(250,173,20,0.1)` (黄色半透明)
- **文字颜色**: `#B7791F` (深黄色)
- **标题**: "滞后原因分析："
- **列表项**: 使用 • 符号前缀

### 3. 布局结构

```
┌─────────────────────────────────┐
│ 学生学情详情              [X]   │ ← Header
├─────────────────────────────────┤
│                                 │
│  [头像] 张三                    │ ← 学生信息
│         计应2401班              │
│                                 │
│ ─────────────────────────────── │
│                                 │
│  课程：Python基础               │ ← 学习数据
│  当前进度          35%          │
│  学习时长          5小时        │
│  最后学习          3天前        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 滞后原因分析：              │ │ ← 滞后原因
│ │ • 第2章学习进度较慢         │ │
│ │ • 连续3天未学习             │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  [发送提醒]  [关闭]             │ ← Footer
│  该学生已提醒 (如果已提醒)      │
└─────────────────────────────────┘
```

### 4. 数据结构

#### StudentTodo 类型

```typescript
export type StudentTodo = {
  id: string;
  name: string;
  className: string;
  course: string;
  avatarId: number;        // AI分身ID
  progress: number;
  delayDays: number;
  reminded: boolean;
  studyHours: number;      // 学习时长
  lastStudyTimeDesc: string; // 最后学习时间描述
  lagReasonList: string[];  // 滞后原因列表
};
```

#### API 数据映射

API 返回字段 → 前端字段：
- `studentId` → `id`
- `studentName` → `name`
- `className` → `className`
- `avatarName` / `courseName` → `course`
- `avatarId` → `avatarId`
- `progress` → `progress`
- `lagDays` → `delayDays`
- `isReminded` → `reminded`
- `studyHours` → `studyHours`
- `lastStudyTimeDesc` → `lastStudyTimeDesc`
- `lagReasonList` → `lagReasonList`

### 5. 组件交互流程

```
用户点击"查看"按钮
    ↓
调用 handleViewStudent(student)
    ↓
设置 selectedStudent 和 isStudentDetailOpen
    ↓
打开 StudentDetailModal 弹窗
    ↓
用户可以：
  - 查看详细信息
  - 点击"发送提醒"（未提醒的学生）
  - 点击"关闭"或 X 按钮关闭弹窗
```

### 6. 技术实现

#### 状态管理

在 `useTeacherHome` hook 中添加：
```typescript
const [selectedStudent, setSelectedStudent] = useState<StudentTodo | null>(null);
const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
```

#### 事件处理

```typescript
const handleViewStudent = (student: StudentTodo) => {
  setSelectedStudent(student);
  setIsStudentDetailOpen(true);
};

const handleCloseStudentDetail = () => {
  setIsStudentDetailOpen(false);
  setSelectedStudent(null);
};
```

#### 组件集成

1. **StudentTodoList** 组件
   - 将 `onShowPlaceholder` 改为 `onViewStudent`
   - 点击"查看"按钮调用 `onViewStudent(student)`

2. **首页** 组件
   - 导入 `StudentDetailModal` 组件
   - 传递必要的 props（isOpen, onClose, student, onRemind）

## 与参考设计的对应关系

| HTML 元素 | React 组件 | 说明 |
|----------|-----------|------|
| `<div class="w-12 h-12 bg-primary/10 rounded-full">` | `<Flex w="48px" h="48px" bg="rgba(200,62,62,0.1)" borderRadius="full">` | 学生头像 |
| `<div class="border-t border-gray-100 pt-4">` | `<Box borderTop="1px solid" borderColor="gray.100" pt={4}>` | 分割线 |
| `<div class="bg-amber-50 p-3 rounded-lg">` | `<Box bg="rgba(250,173,20,0.1)" p={3} borderRadius="lg">` | 滞后原因区域 |
| `<button class="flex-1 bg-primary text-white">` | `<Button flex="1" bg={PRIMARY_COLOR} color="white">` | 发送提醒按钮 |
| `<p class="text-xs text-gray-400">该学生已提醒</p>` | `<Text fontSize="xs" color="gray.400">该学生已提醒</Text>` | 已提醒提示 |

## 用户体验优化

1. **快速查看**
   - 弹窗展示关键信息，无需跳转页面
   - 简洁的布局，信息一目了然

2. **操作便捷**
   - 可直接在弹窗中发送提醒
   - 已提醒的学生自动隐藏提醒按钮，显示提示文本

3. **信息清晰**
   - 进度百分比颜色编码（红/橙/绿）
   - 滞后原因用黄色背景高亮显示
   - 圆形头像显示学生姓名首字，易于识别

4. **响应式设计**
   - 固定宽度（384px），适配各种屏幕
   - 内容自适应布局

## 测试建议

1. **功能测试**
   - 测试弹窗打开/关闭
   - 测试"发送提醒"按钮功能
   - 测试已提醒学生的显示状态

2. **数据测试**
   - 测试不同进度的学生显示（颜色变化）
   - 测试有/无滞后原因的情况
   - 测试学习时长的显示

3. **边界测试**
   - 测试滞后原因列表为空的情况
   - 测试学习时长为0的情况
   - 测试最后学习时间为"未学习"的情况

## 相关文件

- `src/app/teacher/(layoutPage)/home/components/StudentDetailModal.tsx` - 学生详情弹窗组件
- `src/app/teacher/(layoutPage)/home/components/StudentTodoList.tsx` - 学生待办列表组件
- `src/app/teacher/(layoutPage)/home/hooks/useTeacherHome.ts` - 首页状态管理 hook
- `src/app/teacher/(layoutPage)/home/page.tsx` - 首页主组件
- `src/app/teacher/(layoutPage)/home/constants.ts` - 类型定义和常量
- `src/teacher/types/aiTeacher.ts` - API 类型定义
- `教师20260408/ai-teacher-home.html` - 参考设计文件
