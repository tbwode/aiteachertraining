# AI分身详情页面 - API集成设计文档

## 概述

本文档描述了AI分身详情页面 (`/teacher/aiTeacher/avatar/detail`) 如何使用三个API接口获取和展示数据。

## 页面结构

详情页面包含三个Tab：
1. **课程介绍** - 显示课程基本信息和描述
2. **课程目录** - 显示章节树结构和课件列表
3. **学生管理** - 显示学生统计和学生列表

## API接口定义

### 1. AI分身详情接口

**路径**: `/client/aiTeacher/avatars/detail`

**请求参数**:
```typescript
{
  id: number; // AI分身ID
}
```

**响应数据**:
```typescript
{
  id: number;
  status: number; // 状态：0-未开始，1-运行中，2-已截止
  coverUrl: string; // 课程封面
  courseName: string; // 课程名称
  semesterName: string; // 学期名称
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  studentCount: number; // 学生数量
  todayInteractionCount: number; // 今日互动次数
  classNameList: string[]; // 覆盖班级列表（必修）
  majorNameList: string[]; // 覆盖专业列表（选修）
  description: string; // 课程介绍
  teachingConfig: TeachingConfigVO; // 教学配置
  knowledgeGraph: string; // 知识图谱JSON
  chapterList: AiAvatarChapterVO[]; // 章节列表
}
```

**用途**:
- Tab 1（课程介绍）：使用 `description`, `courseName`, `coverUrl` 等字段
- Tab 2（课程目录）：使用 `chapterList` 字段

### 2. 学生统计接口

**路径**: `/client/aiTeacher/avatars/students/stats`

**请求参数**:
```typescript
{
  avatarId: number; // AI分身ID
}
```

**响应数据**:
```typescript
{
  totalCount: number; // 学生总数
  studyingCount: number; // 学习中人数
  completedCount: number; // 已完成人数
  needAttentionCount: number; // 需要关注人数
}
```

**用途**: Tab 3（学生管理）- 显示四个统计卡片

### 3. 学生列表分页接口

**路径**: `/client/aiTeacher/avatars/students/page`

**请求参数**:
```typescript
{
  avatarId: number; // AI分身ID
  pageNum: number; // 页码，从1开始
  pageSize: number; // 每页数量
  keyword?: string; // 搜索关键词（学生姓名）
  classId?: number; // 班级ID筛选
  status?: number; // 学习状态筛选：0-未开始，1-学习中，2-已完成，3-需要关注
}
```

**响应数据**:
```typescript
{
  total: number; // 总记录数
  list: [
    {
      studentId: number; // 学生ID
      studentName: string; // 学生姓名
      className: string; // 班级名称
      progress: number; // 学习进度（百分比）
      studyHours: number; // 学习时长（小时）
      lastStudyTime: string; // 最后学习时间
      status: number; // 学习状态：0-未开始，1-学习中，2-已完成，3-需要关注
      isRemindedToday: number; // 今日是否已提醒：0-未提醒，1-已提醒
    }
  ]
}
```

**用途**: Tab 3（学生管理）- 显示学生列表表格

## 数据流程

### 页面加载流程

1. **进入详情页面**
   - URL: `/teacher/aiTeacher/avatar/detail?id=123`
   - 从URL获取 `avatarId`

2. **并行加载三个接口**
   ```typescript
   useEffect(() => {
     // 1. 加载AI分身详情（用于Tab 1和Tab 2）
     getAiAvatarDetail({ id: avatarId });

     // 2. 加载学生统计（用于Tab 3的统计卡片）
     getAvatarStudentsStats({ avatarId });

     // 3. 加载学生列表（用于Tab 3的表格）
     getAvatarStudentsPage({
       avatarId,
       pageNum: 1,
       pageSize: 10
     });
   }, [avatarId]);
   ```

3. **数据更新触发**
   - 搜索学生：重新调用 `getAvatarStudentsPage`，传入 `keyword`
   - 切换页码：重新调用 `getAvatarStudentsPage`，传入新的 `pageNum`
   - 筛选班级：前端过滤（或者传入 `classId` 到接口）

## 三个Tab的数据映射

### Tab 1: 课程介绍

**数据来源**: `/client/aiTeacher/avatars/detail`

**使用字段**:
- `courseName` → 课程名称
- `description` → 课程介绍内容
- `coverUrl` → 课程封面图片
- `semesterName` → 学期名称
- `startTime` / `endTime` → 起止时间
- `classNameList` / `majorNameList` → 覆盖范围
- `teachingConfig` → 教学配置（权重和功能开关）

### Tab 2: 课程目录

**数据来源**: `/client/aiTeacher/avatars/detail`

**使用字段**:
- `chapterList` → 章节树结构
  - 每个章节包含：`title`, `sortOrder`, `knowledgePoints`, `children`, `materialList`
  - 课件包含：`fileName`, `fileUrl`, `fileType`, `coverageStatus` 等

**数据转换**:
```typescript
// 将API的章节数据转换为前端格式
chapterList.map(chapter => ({
  id: String(chapter.id),
  title: chapter.title,
  sections: chapter.children.map(section => ({
    id: String(section.id),
    title: section.title,
    knowledgeCount: section.knowledgePoints?.length || 0,
    coursewareCount: section.materialList?.length || 0
  }))
}))
```

### Tab 3: 学生管理

**数据来源**:
- 统计卡片：`/client/aiTeacher/avatars/students/stats`
- 学生列表：`/client/aiTeacher/avatars/students/page`

**统计卡片映射**:
- `totalCount` → 学生总数
- `studyingCount` → 学习中人数
- `completedCount` → 已完成人数
- `needAttentionCount` → 需要关注人数

**学生列表映射**:
```typescript
// 将API的学生数据转换为前端格式
list.map(student => ({
  id: String(student.studentId),
  name: student.studentName,
  className: student.className,
  progress: student.progress,
  studyHours: student.studyHours,
  lastStudy: student.lastStudyTime,
  status: student.status === 3 ? 'lagging' :
          student.status === 2 ? 'completed' :
          student.status === 1 ? 'learning' : 'not-started'
}))
```

## 实现细节

### 1. Hook实现 (`useAvatarDetail.ts`)

```typescript
export function useAvatarDetail() {
  const [avatarDetail, setAvatarDetail] = useState<AiAvatarDetailVO | null>(null);
  const [studentsStats, setStudentsStats] = useState<AvatarStudentsStatsResponse | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载AI分身详情
  useEffect(() => {
    if (!avatarId) return;
    const detail = await getAiAvatarDetail({ id: Number(avatarId) });
    setAvatarDetail(detail);
  }, [avatarId]);

  // 加载学生统计
  useEffect(() => {
    if (!avatarId) return;
    const stats = await getAvatarStudentsStats({ avatarId: Number(avatarId) });
    setStudentsStats(stats);
  }, [avatarId]);

  // 加载学生列表（支持搜索和分页）
  useEffect(() => {
    if (!avatarId) return;
    const response = await getAvatarStudentsPage({
      avatarId: Number(avatarId),
      pageNum: currentPage,
      pageSize: 10,
      keyword: searchText || undefined
    });
    setStudents(response.list.map(convertApiStudentToStudentData));
    setTotal(response.total);
  }, [avatarId, currentPage, searchText]);

  return {
    avatarDetail,
    studentsStats,
    students,
    currentPage,
    setCurrentPage,
    total,
    // ...
  };
}
```

### 2. 组件更新

#### AvatarHeader
- 接收 `avatarDetail` 参数
- 显示课程封面、名称、学期、起止时间等

#### TabIntroduction
- 接收 `avatarDetail` 参数
- 显示课程介绍 `description`

#### TabCatalog
- 接收 `avatarDetail` 参数
- 显示章节树 `chapterList`

#### TabStudents
- 接收 `studentsStats` 参数 - 显示统计卡片
- 接收 `students` 参数 - 显示学生列表
- 接收 `currentPage`, `setCurrentPage`, `total` - 实现分页
- 接收 `isLoading` - 显示加载状态

### 3. 分页实现

```typescript
// 计算总页数
const totalPages = Math.ceil(total / pageSize);

// 上一页
<Button
  isDisabled={currentPage === 1}
  onClick={() => setCurrentPage(currentPage - 1)}
>
  上一页
</Button>

// 页码按钮
{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
  const page = i + 1;
  return (
    <Button
      bg={currentPage === page ? PRIMARY_COLOR : 'white'}
      onClick={() => setCurrentPage(page)}
    >
      {page}
    </Button>
  );
})}

// 下一页
<Button
  isDisabled={currentPage === totalPages}
  onClick={() => setCurrentPage(currentPage + 1)}
>
  下一页
</Button>
```

### 4. 搜索实现

```typescript
// 搜索输入框
<Input
  placeholder="搜索学生姓名..."
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
/>

// 搜索触发（在useEffect中）
useEffect(() => {
  // 当searchText变化时，重新加载学生列表
  const response = await getAvatarStudentsPage({
    avatarId: Number(avatarId),
    pageNum: 1, // 搜索时重置到第一页
    pageSize: 10,
    keyword: searchText || undefined
  });
  setStudents(response.list.map(convertApiStudentToStudentData));
  setTotal(response.total);
}, [searchText]);
```

## 文件修改清单

### 1. 类型定义文件
- ✅ `src/teacher/types/aiTeacher.ts`
  - 添加 `AvatarStudentsPageRequest`
  - 添加 `AvatarStudentVO`
  - 添加 `AvatarStudentsPageResponse`
  - 添加 `AvatarStudentsStatsRequest`
  - 添加 `AvatarStudentsStatsResponse`

### 2. API接口文件
- ✅ `src/teacher/api/aiTeacher.ts`
  - 添加 `getAvatarStudentsPage` 接口
  - 添加 `getAvatarStudentsStats` 接口

### 3. Hook文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/hooks/useAvatarDetail.ts`
  - 添加API数据加载逻辑
  - 添加学生数据转换函数
  - 添加分页状态管理
  - 添加搜索功能

### 4. 页面文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/page.tsx`
  - 传递 `avatarDetail` 给各个组件
  - 传递 `studentsStats` 给学生管理tab
  - 传递分页相关状态

### 5. 组件文件
- ✅ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/TabStudents.tsx`
  - 接收 `studentsStats` 显示统计卡片
  - 接收分页参数实现分页
  - 添加加载状态显示

- ⏳ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/AvatarHeader.tsx`
  - 需要接收 `avatarDetail` 参数
  - 使用API数据显示头部信息

- ⏳ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/TabIntroduction.tsx`
  - 需要接收 `avatarDetail` 参数
  - 显示课程介绍

- ⏳ `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/TabCatalog.tsx`
  - 需要接收 `avatarDetail` 参数
  - 显示章节树结构

## 后续优化建议

1. **错误处理**
   - 添加更详细的错误提示
   - 添加重试机制
   - 添加空状态展示

2. **性能优化**
   - 使用 React Query 或 SWR 进行数据缓存
   - 避免重复请求
   - 实现虚拟滚动（学生列表很长时）

3. **用户体验**
   - 添加骨架屏加载效果
   - 添加搜索防抖
   - 添加筛选条件持久化

4. **功能增强**
   - 实现班级筛选（调用API的classId参数）
   - 实现状态筛选（调用API的status参数）
   - 实现导出功能
   - 实现批量提醒功能

## 总结

通过本次集成，AI分身详情页面已经可以从三个API接口获取数据并展示：

1. **课程介绍Tab** - 使用 `/client/aiTeacher/avatars/detail` 接口的基本信息和描述
2. **课程目录Tab** - 使用 `/client/aiTeacher/avatars/detail` 接口的章节列表
3. **学生管理Tab** - 使用 `/client/aiTeacher/avatars/students/stats` 和 `/client/aiTeacher/avatars/students/page` 接口

所有数据都来自真实的API接口，实现了统一的数据源管理，并支持搜索、分页等功能。
