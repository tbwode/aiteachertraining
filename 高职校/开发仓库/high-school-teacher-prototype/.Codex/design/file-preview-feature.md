# 文件预览功能设计文档

## 概述

为课程目录Tab实现了完整的文件预览功能，支持多种文件类型的在线预览。

## 功能特性

### 支持的文件类型

1. **Office 文档**
   - Word: `.doc`, `.docx`
   - Excel: `.xls`, `.xlsx`
   - PowerPoint: `.ppt`, `.pptx`
   - 使用微软在线预览服务

2. **PDF 文档**
   - `.pdf`
   - 使用浏览器内置 PDF 查看器

3. **图片文件**
   - `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`
   - 直接显示图片

4. **视频文件**
   - `.mp4`, `.webm`, `.ogg`, `.mov`
   - 使用 HTML5 video 播放器

5. **音频文件**
   - `.mp3`, `.wav`, `.ogg`, `.aac`
   - 使用 HTML5 audio 播放器

## 组件架构

### 1. FilePreview 组件
**路径**: `src/components/FilePreview/index.tsx`

**功能**:
- 根据文件类型自动选择合适的预览方式
- 处理预览失败的情况
- 提供友好的错误提示

**Props**:
```typescript
type FilePreviewProps = {
  url: string;           // 文件URL
  type: string;          // 文件类型（扩展名）
  name?: string;         // 文件名称
  width?: string | number;  // 预览区域宽度
  height?: string | number; // 预览区域高度
};
```

### 2. FilePreviewModal 组件
**路径**: `src/components/FilePreview/FilePreviewModal.tsx`

**功能**:
- 提供全屏预览弹窗
- 显示文件名和文件类型图标
- 支持关闭操作

**Props**:
```typescript
type FilePreviewModalProps = {
  isOpen: boolean;       // 是否打开
  onClose: () => void;   // 关闭回调
  fileUrl: string;       // 文件URL
  fileType: string;      // 文件类型
  fileName?: string;     // 文件名称
};
```

### 3. TabCatalog 组件更新
**路径**: `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/TabCatalog.tsx`

**更新内容**:
- 集成 `FilePreviewModal` 组件
- 添加预览状态管理（使用 `useDisclosure` hook）
- 将预览按钮从 `window.open` 改为打开预览弹窗
- 传递文件信息（URL、类型、名称）到预览组件

## 实现细节

### Office 文档预览

使用微软在线预览服务：
```typescript
const generateOfficePreviewUrl = (fileUrl: string): string => {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
};
```

**注意事项**:
- 文件URL必须是公网可访问的
- 微软服务可能有访问限制
- 预览失败时提供"在新窗口中打开"选项

### 图片预览

直接使用 Chakra UI 的 `Image` 组件：
- 自动适应容器大小
- 保持图片比例
- 处理加载失败情况

### 视频/音频预览

使用 HTML5 原生播放器：
- 提供播放控制
- 支持常见格式
- 自适应容器大小

### 错误处理

1. **不支持的文件类型**
   - 显示友好提示
   - 提供下载链接

2. **预览加载失败**
   - 显示错误信息
   - 提供"在新窗口中打开"选项

3. **无效的文件URL**
   - 显示"无法生成预览链接"提示

## 用户体验

### 预览流程

1. 用户点击课件的"预览"按钮
2. 打开全屏预览弹窗（90vw x 90vh）
3. 根据文件类型自动选择预览方式
4. 用户可以关闭弹窗返回课程目录

### 视觉设计

- **弹窗大小**: 90% 视口宽度和高度
- **背景遮罩**: 半透明黑色
- **头部**: 显示文件图标和文件名
- **内容区**: 全屏显示预览内容
- **关闭按钮**: 右上角 X 按钮

## 技术栈

- **React**: 组件开发
- **Chakra UI**: UI 组件库
- **TypeScript**: 类型安全
- **HTML5**: 原生媒体播放器

## 未来优化方向

1. **性能优化**
   - 添加预览内容缓存
   - 懒加载大文件

2. **功能增强**
   - 支持更多文件类型（如 Markdown、代码文件）
   - 添加下载按钮
   - 添加全屏切换按钮
   - 支持文件列表导航（上一个/下一个）

3. **用户体验**
   - 添加加载进度条
   - 支持键盘快捷键（ESC 关闭、方向键导航）
   - 添加缩放功能（针对图片和PDF）

4. **私有化部署**
   - 考虑自建 Office 文档预览服务（如 OnlyOffice）
   - 避免依赖外部服务

## 测试建议

1. **功能测试**
   - 测试各种文件类型的预览
   - 测试预览失败的情况
   - 测试无效URL的处理

2. **兼容性测试**
   - 测试不同浏览器的兼容性
   - 测试移动端的显示效果

3. **性能测试**
   - 测试大文件的加载性能
   - 测试多次打开/关闭预览的性能

## 相关文件

- `src/components/FilePreview/index.tsx` - 文件预览组件
- `src/components/FilePreview/FilePreviewModal.tsx` - 预览弹窗组件
- `src/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/TabCatalog.tsx` - 课程目录组件
