# AI教师模块国际化更新清单

## 已完成 ✅

### 1. StudentDetailModal.tsx
- ✅ 导入 `useTranslation`
- ✅ 使用 `t()` 函数
- ✅ 所有硬编码文本已替换

## 待更新组件

由于组件数量较多，建议按以下优先级逐步更新：

### 优先级 1 - 首页核心组件

#### 1. `page.tsx` (首页主组件)
```typescript
// 需要添加
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('teacher-aiTeacher');

// 需要替换的文本
"AI赋能教学 让教育更智能" → t('home.header.title')
"欢迎回来，王老师" → t('home.header.welcome', { name: '王老师' })
```

#### 2. `components/MetricCard.tsx`
```typescript
// 需要替换
"我的课程" → t('home.metrics.myCourses')
"AI分身" → t('home.metrics.avatars')
"今日互动" → t('home.metrics.todayInteractions')
"门" → t('home.metrics.unitCourse')
"位" → t('home.metrics.unitAvatar')
"次" → t('home.metrics.unitInteraction')
```

#### 3. `components/StudentTodoList.tsx`
```typescript
// 需要替换
"今日待办" → t('home.todos.title')
"批量处理" → t('home.todos.batchAction')
"全部已提醒" → t('home.todos.allReminded')
"{{count}}位学生需关注" → t('home.todos.needsAttention', { count })
"学生姓名" → t('home.todos.table.studentName')
"班级" → t('home.todos.table.className')
"课程" → t('home.todos.table.course')
"进度" → t('home.todos.table.progress')
"滞后天数" → t('home.todos.table.delayDays')
"操作" → t('home.todos.table.actions')
"查看" → t('home.todos.actions.view')
"提醒" → t('home.todos.actions.remind')
"已提醒" → t('home.todos.actions.reminded')
```

#### 4. `components/AvatarCardList.tsx`
```typescript
// 需要替换
"我的课程与AI分身" → t('home.avatars.title')
"新建AI分身" → t('home.avatars.create')
"全部" → t('home.avatars.tabs.all')
"运行中" → t('home.avatars.tabs.running')
"未开始" → t('home.avatars.tabs.pending')
"已截止" → t('home.avatars.tabs.expired')
"学生规模" → t('home.avatars.fields.studentScale')
"今日互动" → t('home.avatars.fields.todayInteractions')
"进入课堂" → t('home.avatars.actions.enterClass')
```

### 优先级 2 - AI分身详情

#### 5. `detail/page.tsx`
```typescript
// 需要替换
"返回AI教师" → t('avatar.detail.back')
"课程介绍" → t('avatar.detail.tabs.intro')
"课程目录" → t('avatar.detail.tabs.catalog')
"学生管理" → t('avatar.detail.tabs.students')
```

#### 6. `detail/components/TabCatalog.tsx`
```typescript
// 需要替换
"课程目录" → t('avatar.detail.catalog.title')
"预览" → t('avatar.detail.catalog.preview')
"暂无课程目录" → // 需要添加到翻译文件
```

#### 7. `detail/components/TabStudents.tsx`
```typescript
// 需要替换
"学生总数" → t('avatar.detail.students.stats.total')
"学习中" → t('avatar.detail.students.stats.studying')
"已完成" → t('avatar.detail.students.stats.completed')
"需要关注" → t('avatar.detail.students.stats.attention')
"学生列表" → t('avatar.detail.students.listTitle')
"搜索学生姓名..." → t('avatar.detail.students.searchPlaceholder')
"全部班级" → t('avatar.detail.students.allClasses')
```

### 优先级 3 - 其他模块

#### 8. `edit/page.tsx` (编辑页)
#### 9. `create/page.tsx` (创建页)
#### 10. 其他子组件

## 批量更新脚本

由于组件较多，建议创建一个脚本来辅助更新。以下是更新步骤：

### 步骤 1: 在组件顶部添加导入
```typescript
import { useTranslation } from 'react-i18next';
```

### 步骤 2: 在组件函数内添加 hook
```typescript
const { t } = useTranslation('teacher-aiTeacher');
```

### 步骤 3: 替换所有硬编码文本
使用查找替换功能，将中文文本替换为 `t()` 调用

### 步骤 4: 测试
- 切换到中文，验证显示
- 切换到英文，验证显示

## 注意事项

1. **保持一致性**
   - 所有组件使用相同的命名空间 `'teacher-aiTeacher'`
   - 相同含义的文本使用相同的翻译键

2. **参数传递**
   - 确保所有参数正确传递
   - 参数名要有意义

3. **测试覆盖**
   - 每更新一个组件就测试一次
   - 确保中英文都能正常显示

4. **翻译文件同步**
   - 如果发现缺少翻译键，及时添加到翻译文件
   - 保持中英文翻译文件同步

## 快速测试命令

```bash
# 启动开发服务器
cd projects/app
pnpm dev

# 在浏览器中测试
# 1. 打开首页
# 2. 切换语言（如果有语言切换器）
# 3. 验证所有文本显示正确
```

## 完成标准

- [ ] 所有组件都导入了 `useTranslation`
- [ ] 所有硬编码中文文本都替换为 `t()` 调用
- [ ] 中文显示正常
- [ ] 英文显示正常
- [ ] 带参数的翻译正确显示
- [ ] Toast消息正确翻译
- [ ] 无TypeScript错误
- [ ] 无运行时错误

## 预计工作量

- 优先级1组件：2-3小时
- 优先级2组件：2-3小时
- 优先级3组件：3-4小时
- 总计：7-10小时

建议分批完成，每完成一批就提交代码，避免一次性改动过大。
