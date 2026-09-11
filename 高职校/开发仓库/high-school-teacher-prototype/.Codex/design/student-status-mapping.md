# 学生状态映射文档

## API状态定义

根据接口文档，`status` 字段的含义：

| 值 | 含义 | 说明 |
|----|------|------|
| 0 | 未开始 | 学生还未开始学习 |
| 1 | 正常 | 学生正常学习中 |
| 2 | 滞后 | 学生学习进度滞后 |
| 3 | 已完成 | 学生已完成课程 |

## 前端状态定义

```typescript
type StudentStatus = 'not-started' | 'normal' | 'lagging' | 'completed';
```

## 状态映射关系

| API状态 | 前端状态 | 显示文本 | 颜色 | 背景色 |
|---------|---------|---------|------|--------|
| 0 | `not-started` | 未开始 | `#8C8C8C` | `rgba(0,0,0,0.04)` |
| 1 | `normal` | 正常 | `#52C41A` (绿色) | `rgba(82,196,26,0.1)` |
| 2 | `lagging` | 滞后 | `#FAAD14` (橙色) | `rgba(250,173,20,0.1)` |
| 3 | `completed` | 已完成 | `#1890FF` (蓝色) | `rgba(24,144,255,0.1)` |

## 数据转换函数

```typescript
function convertApiStudentToStudentData(apiStudent: AvatarStudentVO): StudentData {
  let status: StudentData['status'] = 'not-started';

  switch (apiStudent.status) {
    case 0:
      status = 'not-started'; // 未开始
      break;
    case 1:
      status = 'normal'; // 正常学习中
      break;
    case 2:
      status = 'lagging'; // 滞后
      break;
    case 3:
      status = 'completed'; // 已完成
      break;
    default:
      status = 'not-started';
  }

  return {
    id: String(apiStudent.studentId),
    name: apiStudent.studentName || '未命名',
    className: apiStudent.className || '未分配班级',
    progress: apiStudent.progress,
    studyHours: apiStudent.studyHours,
    lastStudy: formatLastStudy(apiStudent.lastLearnTime),
    status
  };
}
```

## 状态显示函数

```typescript
export function getStatusMeta(status: string): StatusMeta {
  switch (status) {
    case 'not-started':
      return {
        label: '未开始',
        bg: 'rgba(0,0,0,0.04)',
        color: '#8C8C8C'
      };
    case 'normal':
      return {
        label: '正常',
        bg: 'rgba(82,196,26,0.1)',
        color: SUCCESS_COLOR
      };
    case 'lagging':
      return {
        label: '滞后',
        bg: 'rgba(250,173,20,0.1)',
        color: WARNING_COLOR
      };
    case 'completed':
      return {
        label: '已完成',
        bg: 'rgba(24,144,255,0.1)',
        color: '#1890FF'
      };
    default:
      return {
        label: '未知',
        bg: 'rgba(0,0,0,0.04)',
        color: '#8C8C8C'
      };
  }
}
```

## API字段说明

### 学生信息 (AvatarStudentVO)

| 字段 | 类型 | 说明 |
|------|------|------|
| `studentId` | number | 学生ID |
| `studentName` | string | 学生姓名 |
| `studentCode` | string | 学号 |
| `classId` | number | 班级ID |
| `className` | string | 班级名称 |
| `progress` | number | 学习进度（0-100） |
| `studyHours` | number | 学习时长（小时） |
| `lastLearnTime` | string | 最后学习时间 |
| `status` | number | 学习状态：0-未开始，1-正常，2-滞后，3-已完成 |
| `lagDays` | number | 滞后天数 |
| `lagReason` | string | 滞后原因 |
| `isReminded` | number | 是否已提醒：0-否，1-是（当天是否已提醒） |
| `remindCount` | number | 提醒次数 |
| `lastRemindTime` | string | 最后提醒时间 |

### 分页响应 (AvatarStudentsPageResponse)

| 字段 | 类型 | 说明 |
|------|------|------|
| `records` | AvatarStudentVO[] | 学生列表 |
| `total` | number | 总记录数 |
| `size` | number | 每页数量 |
| `current` | number | 当前页码 |
| `pages` | number | 总页数 |

## 特殊处理

### 1. 空值处理
- `studentName` 为空时显示"未命名"
- `className` 为空时显示"未分配班级"
- `lastLearnTime` 为空时显示"从未学习"

### 2. 数据过滤
过滤掉无效的学生数据：
```typescript
const validStudents = response.records.filter(
  (student) => student.studentId && student.studentName
);
```

### 3. 提醒按钮显示
只有状态为"滞后"（`status === 'lagging'`）的学生才显示"提醒"按钮。

## 统计数据映射

根据 `/client/aiTeacher/avatars/students/stats` 接口：

| 统计项 | API字段 | 说明 |
|--------|---------|------|
| 学生总数 | `totalCount` | 所有学生数量 |
| 学习中 | `studyingCount` | 正常学习的学生数量 |
| 已完成 | `completedCount` | 已完成课程的学生数量 |
| 需要关注 | `needAttentionCount` | 滞后的学生数量 |

## 完整数据流

```
API返回
  ↓
{
  records: [
    {
      studentId: 1,
      studentName: "张三",
      status: 1,  // API状态：1-正常
      ...
    }
  ]
}
  ↓
数据转换
  ↓
{
  id: "1",
  name: "张三",
  status: "normal",  // 前端状态
  ...
}
  ↓
状态显示
  ↓
Badge: "正常" (绿色)
```
