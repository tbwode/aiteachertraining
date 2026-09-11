# 文件上传功能实现总结

## 完成的工作

### 1. 创建文件上传 API (`src/teacher/api/file.ts`)

实现了以下接口：
- `uploadPrivateFile` - 单文件上传到 `/huayun-ai/feign/file/upload/private`
- `uploadMultiplePrivateFiles` - 批量文件上传
- `downloadPrivateFile` - 文件下载
- `getFileList` - 获取文件列表
- `getFileMeta` - 获取文件详情

### 2. 数据结构调整

修改 `StoredFileMeta` 类型，添加 `fileKey` 字段：
```typescript
export type StoredFileMeta = {
  id: string;
  name: string;
  size: string;
  fileKey?: string; // 上传后返回的文件key
};
```

### 3. 业务逻辑实现

修改 `useAvatarWizard.ts` 中的上传函数：

**教学大纲上传 (handleSyllabusUpload)**
- 创建 FormData 并上传文件
- 调用 `uploadPrivateFile` API
- 保存返回的 `fileKey`
- 显示成功/失败提示

**课件资源上传 (handleCoursewareUpload)**
- 支持批量上传（最多20个文件）
- 调用 `uploadMultiplePrivateFiles` API
- 为每个文件保存对应的 `fileKey`
- 显示上传结果

### 4. 错误处理

- 所有上传函数都包含 try-catch 错误处理
- 上传失败时显示友好的错误提示
- 记录错误日志到控制台

## 使用方式

### 教学大纲上传
```typescript
// 用户选择文件后
handleSyllabusUpload(file);
// 文件会自动上传到服务器，fileKey 保存到 draft.syllabusFile.fileKey
```

### 课件资源上传
```typescript
// 用户选择多个文件后
handleCoursewareUpload(files);
// 所有文件批量上传，每个文件的 fileKey 保存到对应的 coursewareFiles 项中
```

## 数据流

1. 用户选择文件
2. 创建 FormData
3. 调用上传 API (`/huayun-ai/feign/file/upload/private`)
4. 获取返回的 `fileKey`
5. 保存到草稿数据中
6. 显示成功提示

## 后续可优化项

- [ ] 添加上传进度显示
- [ ] 文件类型和大小验证
- [ ] 支持取消上传
- [ ] 大文件分片上传
