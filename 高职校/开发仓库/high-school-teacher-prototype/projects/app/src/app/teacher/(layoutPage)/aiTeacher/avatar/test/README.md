# AI分身接口测试指南

## 测试组件说明

`AvatarApiTest.tsx` 是一个用于测试AI分身相关接口的测试组件，提供了可视化的接口测试界面。

## 使用方法

### 1. 添加路由（如果还没有）

在路由配置中添加测试页面路由：

```typescript
// 在 projects/app/src/app/teacher/(layoutPage)/aiTeacher/avatar/test/page.tsx
import { AvatarApiTest } from './AvatarApiTest';

export default function AvatarApiTestPage() {
  return <AvatarApiTest />;
}
```

### 2. 访问测试页面

启动开发服务器后，访问：
```
http://localhost:3000/teacher/aiTeacher/avatar/test
```

### 3. 测试流程

#### 基础测试流程
1. 点击"1. 获取全部分身列表" - 获取所有AI分身
2. 点击"3. 获取分身详情（第一个）" - 查看第一个分身的详细信息
3. 点击"5. 发布分身" - 发布第一个分身
4. 点击"6. 取消发布分身" - 取消发布

#### 创建测试流程
1. 点击"4. 创建AI分身" - 创建一个测试分身
2. 查看返回的分身信息
3. 点击"5. 发布分身" - 发布新创建的分身

#### 筛选测试流程
1. 点击"2. 获取运行中分身列表" - 只获取运行中的分身
2. 对比与全部列表的差异

## 测试数据说明

### 测试教师ID
当前使用固定的测试教师ID: `1`

### 创建分身的测试数据
```typescript
{
  teacherId: 1,
  teachingTaskId: 1,
  coverUrl: "https://huayun-ai-tos-public-pre.zhique.me/fbb9559eb984b28ec5f0e971089fc82f.png",
  description: "测试创建的AI分身",
  startTime: "2026-04-13 00:00:00",
  endTime: "2026-05-13 23:59:59",
  teachingConfig: {
    knowledgeLevel: 1,
    skillLevel: 1,
    innovationLevel: 1,
    enableAfterClassQuiz: true,
    enableChapterTest: true,
    enableRandomQuiz: false,
    enableAIEvaluation: true,
    enableProgressTracking: true,
    enableKnowledgeAnalysis: true,
    enableAbilityGrowth: false,
    enableBehaviorAnalysis: false,
    enablePeerComparison: true
  },
  classIds: [1],
  knowledgeGraph: {},
  chapterList: [
    {
      title: "第一章：测试章节",
      sortOrder: 1,
      knowledgePoints: ["知识点1", "知识点2"],
      materials: [],
      children: []
    }
  ]
}
```

## 预期结果

### 1. 获取分身列表
- 返回数组格式的分身列表
- 每个分身包含：id, status, coverUrl, courseName, semesterName等字段
- 状态值：0-未开始，1-运行中，2-已截止

### 2. 获取分身详情
- 返回完整的分身信息
- 包含教学配置、章节列表、课件列表等
- 知识图谱以JSON字符串形式返回

### 3. 创建分身
- 返回新创建的分身基本信息
- 包含系统生成的分身ID
- 初始状态为"未开始"(0)

### 4. 发布/取消发布
- 返回布尔值表示操作是否成功
- 成功时显示成功提示
- 失败时显示错误信息

## 常见问题

### Q1: 请求失败，返回401错误
**原因**: 未登录或Token过期
**解决**: 确保已登录教师账号，检查Token是否有效

### Q2: 获取分身列表为空
**原因**: 该教师还没有创建任何AI分身
**解决**: 先使用"创建AI分身"功能创建一个测试分身

### Q3: 创建分身失败
**原因**: 可能是teachingTaskId不存在或参数验证失败
**解决**:
- 检查teachingTaskId是否有效
- 确认所有必填字段都已填写
- 查看控制台错误信息

### Q4: 发布/取消发布没有反应
**原因**: 需要先获取或创建分身
**解决**: 先执行"获取分身列表"或"创建AI分身"

## 调试技巧

### 1. 查看控制台日志
所有API请求和响应都会在控制台输出：
```
fetchAvatarList - 请求参数: {...}
fetchAvatarList - 返回结果: {...}
```

### 2. 查看网络请求
打开浏览器开发者工具的Network标签，查看实际的HTTP请求和响应

### 3. 检查返回数据
测试组件会将返回的数据以JSON格式展示在页面上，方便查看数据结构

## 集成到实际页面

测试通过后，可以在实际页面中使用 `useAvatarApi` Hook：

```typescript
import { useAvatarApi } from '../hooks/useAvatarApi';

function MyComponent() {
  const { isLoading, fetchAvatarList, createAvatar } = useAvatarApi();

  const handleLoadAvatars = async () => {
    const avatars = await fetchAvatarList({ teacherId: 1 });
    // 处理返回的数据
  };

  return (
    <Button onClick={handleLoadAvatars} isLoading={isLoading}>
      加载分身列表
    </Button>
  );
}
```

## 相关文档

- [API集成总结](../../../../../../.claude/design/ai-avatar-api-integration-summary.md)
- [接口测试文档](../../../../../../.claude/design/ai-avatar-api-integration-test.md)
- [类型定义](../../../../../../teacher/types/aiTeacher.ts)
- [API封装](../../../../../../teacher/api/aiTeacher.ts)
