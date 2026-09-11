# Input

统一基础输入框组件，给 `admin` 和 `teacher` 两端复用，底层基于 Chakra UI Input 封装。

## 引入

```tsx
import Input from '@/app/components/ui/Input';
```

## 基础用法

```tsx
<Input placeholder="请输入内容" />
```

## 图标用法

```tsx
import { SearchIcon } from '@chakra-ui/icons';

<Input leftIcon={<SearchIcon boxSize={4} />} placeholder="请输入关键词" />
<Input rightIcon={<SearchIcon boxSize={4} />} placeholder="右侧图标" />
```

## 常用状态

```tsx
<Input value={value} onChange={(e) => setValue(e.target.value)} />
<Input isDisabled placeholder="不可编辑" />
<Input type="password" placeholder="请输入密码" />
<Input isPassword placeholder="请输入密码" />
```

## 样式规格

- 圆角：`12px`
- 边框：`1px solid #E7E7E7`
- 背景：`#FAFAFA`
- 文字色：`#86909C`
- 字号：`14px`
- 行高：`22px`
- 内边距：`17px 12px`

## Props 扩展

除 Chakra 原生 `InputProps` 外，额外支持：

- `leftIcon`
- `rightIcon`
- `isPassword`
