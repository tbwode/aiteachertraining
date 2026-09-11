---
name: teacher-api-dev
description: 指导教师业务相关代码开发。当用户需要在 projects/app/src/app/teacher/ 目录下开发 API、类型定义、Hooks 或组件时触发。适用于教师端功能开发、API接口封装、类型定义等场景。
---

# 教师业务代码开发规范

## 目录结构

```
projects/app/src/
├── teacher/              # 教师业务逻辑代码
│   ├── api/              # API 接口函数
│   ├── types/            # TypeScript 类型定义
│   ├── hooks/            # React Hooks
│   ├── constants/        # 常量和枚举
│   └── store/            # Zustand 状态管理
│
└── app/teacher/          # Next.js 页面组件 (App Router)
    ├── components/       # 教师端专用组件
    │   ├── TeacherAuthProvider.tsx
    │   ├── TeacherLayout.tsx
    │   └── ...
    ├── login/
    └── ...
```

## 代码组织原则

### 1. API 文件 (`api/*.ts`)

**导入模板：**
```typescript
import { GET, POST, PUT, DELETE } from '@/web/common/api/requestTeacher';
import type { SomeType } from '../types/xxx';
```

**重要说明：**
- 教师端使用独立的 `requestTeacher.ts`，`baseURL` 为 `/huayun-ai`
- 请求会自动代理到 `https://gpt-pre.hwzxs.com/huayun-ai/:path*`
- API 路径以 `/client` 开头（如 `/client/auth/login`）

**命名规范：**
- 使用小驼峰命名
- 以 `get`、`post`、`put`、`delete` 开头表示 HTTP 方法
- 以 `Api` 结尾可选

**示例：**
```typescript
// 教师登录
export const postTeacherLogin = (data: LoginParams) =>
  POST<AuthInfo>('/client/auth/login', data);

// 获取教师课程列表
export const getTeacherCourses = (params: GetCoursesParams) =>
  GET<Course[]>('/client/teacher/courses', params);

// 更新教师信息
export const updateTeacherInfo = (data: UpdateTeacherData) =>
  PUT<TeacherInfo>('/client/teacher/info', data);

// 发布作业
export const publishHomework = (data: PublishHomeworkData) =>
  POST('/client/teacher/homework/publish', data);

// 批改作业
export const gradeHomework = (data: GradeHomeworkData) =>
  PUT('/client/teacher/homework/grade', data);
```

### 2. 类型文件 (`types/*.ts`)

**命名规范：**
- 接口名使用 PascalCase
- 以 `Type` 或具体业务名词结尾
- 请求参数类型以 `Params` 结尾
- 请求体类型以 `Body` 或 `Data` 结尾
- 响应类型以 `Response` 结尾

**示例：**
```typescript
// 教师基础信息
export type TeacherInfo = {
  id: string;
  name: string;
  teacherId: string;
  subject: string;
  department: string;
};

// 请求参数
export type GetCoursesParams = {
  semester?: string;
  status?: CourseStatus;
};

// 请求体
export type UpdateTeacherData = Partial<Pick<TeacherInfo, 'name' | 'phone'>>;

// 响应类型
export type CoursesResponse = Course[];
```

### 3. Hooks 文件 (`hooks/*.ts`)

**命名规范：**
- 以 `use` 开头
- 描述功能，如 `useTeacherAuth`、`useCourseList`

**示例：**
```typescript
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getTeacherCourses } from '../api/course';

export const useCourseList = (params: GetCoursesParams) => {
  const { data, loading, refresh } = useRequest2(
    () => getTeacherCourses(params),
    {
      manual: false,
      refreshDeps: [params]
    }
  );

  return {
    courses: data || [],
    isLoading: loading,
    refresh
  };
};
```

### 4. 常量文件 (`constants/*.ts`)

**命名规范：**
- 枚举使用 PascalCase
- 常量使用 UPPER_SNAKE_CASE
- 枚举值使用小驼峰或大写

**示例：**
```typescript
// 枚举
export enum CourseStatus {
  NOT_STARTED = 'notStarted',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed'
}

// 常量
export const MAX_COURSES_PER_SEMESTER = 10;
export const DEFAULT_PAGE_SIZE = 20;
```

### 5. Store 文件 (`store/*.ts`)

使用 Zustand 进行状态管理，配合 `persist` 中间件实现数据持久化。

**命名规范：**
- 以 `use` 开头，以 `Store` 结尾
- 状态类型以 `State` 结尾

**示例：**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TeacherAuthState = {
  isAuthenticated: boolean;
  token: string | null;
  userInfo: TeacherAuthInfo | null;
  setAuth: (authInfo: TeacherAuthInfo) => void;
  clearAuth: () => void;
};

export const useTeacherAuthStore = create<TeacherAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      userInfo: null,
      setAuth: (authInfo) => set({ isAuthenticated: true, token: authInfo.accessToken, userInfo: authInfo }),
      clearAuth: () => set({ isAuthenticated: false, token: null, userInfo: null }),
    }),
    { name: 'teacher-auth-storage' }
  )
);
```

### 6. 组件文件 (`components/*.tsx`)

**命名规范：**
- 使用 PascalCase 命名组件
- 教师端专用组件以 `Teacher` 前缀

**示例：**
```typescript
'use client';

import { Box, Heading } from '@chakra-ui/react';

interface TeacherCourseCardProps {
  title: string;
  studentCount: number;
}

export function TeacherCourseCard({ title, studentCount }: TeacherCourseCardProps) {
  return (
    <Box p={4} borderWidth={1} borderRadius="md">
      <Heading size="md">{title}</Heading>
      <Box>学生数: {studentCount}</Box>
    </Box>
  );
}
```

## 认证处理

教师端使用 `TeacherAuthProvider` 进行认证管理：

```typescript
import { useTeacherAuth } from '../components/TeacherAuthProvider';

export function SomeComponent() {
  const { isAuthenticated, userInfo, login, logout } = useTeacherAuth();
  
  // 使用认证信息...
}
```

## 路由保护

使用 `TeacherRouteGuard` 组件保护需要登录的页面：

```typescript
// 在 layout.tsx 或 page.tsx 中使用
import { TeacherRouteGuard } from '../components/TeacherRouteGuard';

export default function ProtectedPage() {
  return (
    <TeacherRouteGuard>
      <YourPageContent />
    </TeacherRouteGuard>
  );
}
```

## 国际化

教师端使用 `teacher` 命名空间的翻译：

```typescript
import { useTranslation } from 'react-i18next';

export function SomeComponent() {
  const { t } = useTranslation('teacher');
  
  return <div>{t('some.key')}</div>;
}
```

## 完整示例

### 场景：开发教师作业发布功能

**Step 1: 定义类型 (`teacher/types/homework.ts`)**
```typescript
export type HomeworkStatus = 'draft' | 'published' | 'closed';

export type Homework = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: HomeworkStatus;
  classIds: string[];
};

export type PublishHomeworkData = {
  title: string;
  description: string;
  deadline: string;
  classIds: string[];
};

export type GetHomeworkListParams = {
  status?: HomeworkStatus;
  page?: number;
  pageSize?: number;
};
```

**Step 2: 定义常量 (`teacher/constants/homework.ts`)**
```typescript
export const HOMEWORK_STATUS_MAP: Record<HomeworkStatus, string> = {
  draft: '草稿',
  published: '已发布',
  closed: '已截止'
};

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
```

**Step 3: 封装 API (`teacher/api/homework.ts`)**
```typescript
import { GET, POST, PUT, DELETE } from '@/web/common/api/requestTeacher';
import type {
  Homework,
  PublishHomeworkData,
  GetHomeworkListParams
} from '../types/homework';

// 获取作业列表
export const getHomeworkList = (params?: GetHomeworkListParams) =>
  GET<Homework[]>('/client/teacher/homework/list', params);

// 发布作业
export const publishHomework = (data: PublishHomeworkData) =>
  POST('/client/teacher/homework/publish', data);

// 更新作业
export const updateHomework = (id: string, data: Partial<PublishHomeworkData>) =>
  PUT(`/client/teacher/homework/${id}`, data);

// 删除作业
export const deleteHomework = (id: string) =>
  DELETE(`/client/teacher/homework/${id}`);

// 获取作业详情
export const getHomeworkDetail = (homeworkId: string) =>
  GET<Homework>('/client/teacher/homework/detail', { homeworkId });
```

**Step 4: 封装 Hook (`teacher/hooks/homework.ts`)**
```typescript
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getHomeworkList, publishHomework, updateHomework } from '../api/homework';
import type { PublishHomeworkData, GetHomeworkListParams } from '../types/homework';

// 获取作业列表
export const useHomeworkList = (params?: GetHomeworkListParams) => {
  const { data, loading, refresh } = useRequest2(
    () => getHomeworkList(params),
    {
      manual: false,
      refreshDeps: [params?.status, params?.page]
    }
  );

  return {
    homeworkList: data || [],
    isLoading: loading,
    refresh
  };
};

// 发布作业
export const usePublishHomework = () => {
  const { runAsync, loading } = useRequest2(
    (data: PublishHomeworkData) => publishHomework(data),
    { manual: true }
  );

  return {
    publish: runAsync,
    isPublishing: loading
  };
};

// 更新作业
export const useUpdateHomework = () => {
  const { runAsync, loading } = useRequest2(
    ({ id, data }: { id: string; data: Partial<PublishHomeworkData> }) => 
      updateHomework(id, data),
    { manual: true }
  );

  return {
    update: runAsync,
    isUpdating: loading
  };
};
```

## 注意事项

1. **类型优先**：先定义类型，再写 API 和 Hooks
2. **统一导入**：API 函数统一从 `@/web/common/api/requestTeacher` 导入
3. **错误处理**：API 层的错误由 requestTeacher.ts 统一处理，Hooks 层无需额外处理
4. **命名空间**：教师端 API 路径统一以 `/client` 开头
5. **类型复用**：优先使用全局类型 `@fastgpt/global/*`，避免重复定义
6. **组件复用**：教师端组件放在 `components/` 目录，通用组件使用 `packages/web/components/`

## 参考文件

- API 请求封装：`projects/app/src/web/common/api/requestTeacher.ts`
- 登录类型定义：`projects/app/src/teacher/types/auth.ts`
- 登录 API：`projects/app/src/teacher/api/auth.ts`
- 教师认证 Provider：`projects/app/src/app/teacher/components/TeacherAuthProvider.tsx`
- 教师布局组件：`projects/app/src/app/teacher/components/TeacherLayout.tsx`
- 路由保护：`projects/app/src/app/teacher/components/TeacherRouteGuard.tsx`
- 国际化配置：`projects/app/src/app/teacher/components/TeacherI18nProvider.tsx`
