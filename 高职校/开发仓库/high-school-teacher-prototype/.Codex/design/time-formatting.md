# 时间格式化说明

## 相对时间格式化

将绝对时间转换为相对时间，提升用户体验。

## 格式化规则

| 时间差 | 显示格式 | 示例 |
|--------|---------|------|
| < 1分钟 | 刚刚 | 刚刚 |
| 1-59分钟 | X分钟前 | 5分钟前、30分钟前 |
| 1-23小时 | X小时前 | 2小时前、12小时前 |
| 1-6天 | X天前 | 1天前、5天前 |
| 7-29天 | X周前 | 1周前、3周前 |
| 30-364天 | X个月前 | 1个月前、6个月前 |
| ≥365天 | X年前 | 1年前、2年前 |
| 空值 | 从未学习 | 从未学习 |

## 实现代码

```typescript
const formatLastStudy = (time: string) => {
  if (!time) return '从未学习';

  try {
    const lastTime = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('时间格式化失败:', error);
    return time; // 如果格式化失败，返回原始时间
  }
};
```

## 使用场景

### 学生管理表格
- **最后学习**列：显示学生最后一次学习的相对时间
- 例如："2小时前"、"3天前"、"从未学习"

### 优势
1. **直观性**：用户可以快速了解时间距离
2. **可读性**：比绝对时间更容易理解
3. **用户体验**：符合现代应用的时间显示习惯

## 示例

### 输入输出对照

| 输入时间 | 当前时间 | 输出 |
|---------|---------|------|
| 2026-04-15 14:50:28 | 2026-04-15 14:51:00 | 刚刚 |
| 2026-04-15 14:20:00 | 2026-04-15 14:50:00 | 30分钟前 |
| 2026-04-15 12:00:00 | 2026-04-15 14:50:00 | 2小时前 |
| 2026-04-12 14:50:00 | 2026-04-15 14:50:00 | 3天前 |
| 2026-04-01 14:50:00 | 2026-04-15 14:50:00 | 2周前 |
| 2026-01-15 14:50:00 | 2026-04-15 14:50:00 | 3个月前 |
| 2025-04-15 14:50:00 | 2026-04-15 14:50:00 | 1年前 |
| "" (空字符串) | - | 从未学习 |

## 错误处理

如果时间格式化失败（例如无效的日期格式），会：
1. 在控制台输出错误日志
2. 返回原始时间字符串
3. 不会导致应用崩溃

## 注意事项

1. **时区问题**：使用本地时间进行计算，确保时区一致
2. **精度问题**：使用向下取整，例如1.9小时显示为"1小时前"
3. **性能问题**：每次渲染都会重新计算，但计算量很小，性能影响可忽略
4. **实时更新**：如果需要实时更新（例如"刚刚"变为"1分钟前"），需要添加定时器

## 未来优化

如果需要实时更新相对时间，可以添加：

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    // 重新加载数据或重新计算时间
  }, 60000); // 每分钟更新一次

  return () => clearInterval(timer);
}, []);
```

但通常情况下，用户刷新页面或切换tab时会重新加载数据，所以不需要实时更新。
