# Select

统一基础下拉选择组件，适用于需要自定义展开态样式的页面。底层基于 Chakra UI `Menu` 封装。

## 引入

```tsx
import Select from '@/app/components/ui/Select';
```

## 基础用法

```tsx
<Select
  value={value}
  onChange={setValue}
  placeholder="全部分类"
  options={[
    { label: '全部分类', value: '' },
    { label: '计算机', value: '1' }
  ]}
/>
```

## 样式规格

- 收起态：
  - 圆角：`10px`
  - 边框：`1px solid #E7E7E7`
  - 背景：`#FFF`
  - 文字：`#4E5969`
  - 字号：`14px`
- 展开态触发器背景：
  - `#F2F3F5`
- 下拉面板：
  - `padding: 8px 8px 0`
  - `gap: 6px`
  - 圆角：`12px`
  - 边框：`1px solid #E5E7EB`
  - 阴影：`0 0 15.6px 0 rgba(92, 92, 92, 0.11)`
