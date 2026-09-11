# Button

统一基础按钮组件，给 `admin` 和 `teacher` 两端复用，底层基于 Chakra UI Button 封装。

## 引入

```tsx
import Button from '@/app/components/ui/Button';
```

## 基础用法

```tsx
<Button>确定</Button>
<Button variant="secondary">取消</Button>
<Button variant="danger">删除</Button>
```

## 支持的物料样式

- `primary`: 品牌红实心按钮，适合确认、提交、保存。
- `primaryOutline`: 品牌红描边按钮，适合次级品牌操作。
- `secondary`: 白底描边按钮，适合取消、编辑、返回。
- `tertiary`: 透明背景按钮，适合工具栏和低优先级操作。
- `danger`: 白底红边按钮，适合删除、移除、危险操作。
- `dangerSolid`: 红色实心按钮，只用于需要强确认的危险操作。

## 图标用法

```tsx
import { AddIcon } from '@chakra-ui/icons';

<Button leftIcon={<AddIcon />}>新增</Button>
<Button variant="secondary" rightIcon={<AddIcon />}>编辑</Button>
```

## 状态用法

```tsx
<Button isLoading>提交中</Button>
<Button isDisabled>不可用</Button>
<Button w="full">整行按钮</Button>
```

## 兼容说明

为了平滑替换项目里的历史按钮，组件暂时兼容这些旧 `variant`：

- `whiteBase`
- `whitePrimary`
- `primaryOutline`
- `whiteDanger`
- `dangerFill`

其中会自动收敛到当前物料库的三种标准样式。
