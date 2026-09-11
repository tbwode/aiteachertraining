# SvgIcon

统一 SVG 图标组件，适合渲染 `public/` 下的 svg 资源。

## 引入

```tsx
import SvgIcon from '@/app/components/ui/SvgIcon';
```

## 基础用法

```tsx
<SvgIcon src="/imgs/teacher/login/wx.svg" alt="微信登录" size="28px" />
```

## 常用写法

```tsx
<SvgIcon src="/imgs/teacher/login/wx.svg" alt="微信" boxSize="32px" />
<SvgIcon src="/icon/logo.svg" alt="logo" width="40px" height="40px" />
```

## Props

- `src`: svg 文件路径
- `alt`: 图标描述
- `size`: 快速设置宽高
- 其余支持 Chakra `BoxProps`
