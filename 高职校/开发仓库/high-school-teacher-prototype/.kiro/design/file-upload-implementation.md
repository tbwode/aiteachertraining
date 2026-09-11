# 文件上传功能实现文档

## 1. 需求说明

在 AI 分身创建流程的 Step2（教学路径）中，需要实现真实的文件上传功能：
- 上传教学大纲
- 上传课件资源（支持批量上传）
- 使用 `/huayun-ai/feign/file/upload/private` 接口
- 获取并保存返回的 `fileKey`

## 2. 实现方案

### 2.1 API 层

创建 `src/teacher/api/file.ts`，封装文件上传相关接口：

```typescript
// 单文件上传
uploadPrivateFile(formData: FormData): Promise<FileMetaType>

// 批量文件上传
uploadMultiplePrivateFiles(formData: FormData): Promise<FileMetaType[]>

// 文件下载
downloadPrivateFile(fileKey: string)

// 获取文件列表
getFileList(fileKeys: string[]): Promise<FileMetaType[]>

// 获取文件详情
getFileMeta(fileKey: string): Promise<FileMetaType>
```

**返回类型：**
```typescript
type FileMetaType = {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
};
```

### 2.2 数据结构调整

修改 `avatarStorage.ts` 中的 `StoredFileMeta` 类型：

```typescript
export type StoredFileMeta = {
  id: string;
  name: string;
  size: string;
  fileKey?: string; // 新增：上传后返回的文件key
};
```

### 2.3 业务逻辑层

修改 `useAvatarWizard.ts` 中的文件上传处理函数：

#### 教学大纲上传 (handleSyllabusUpload)

```typescript
const handleSyllabusUpload = async (file?: File) => {
  // 1. 创建 FormData
  const formData = new FormData();
  formData.append('file', file);

  // 2. 调用上传 API
  const result = await uploadPrivateFile(formData);

  // 3. 保存文件信息和 fileKey
  updateDraft((current) => ({
    ...current,
    syllabusFile: {
      ...createStoredFileMeta(file),
      fileKey: result.fileKey
    },
    analysisCompleted: false,
    updatedAt: new Date().toISOString()
  }));

  // 4. 显示成功提示
  toast({ title: '教学大纲上传成功', ... });
};
```

#### 课件资源上传 (handleCoursewareUpload)

```typescript
const handleCoursewareUpload = async (files: FileList | null) => {
  // 1. 验证：检查是否已上传大纲、文件数量限制

  // 2. 创建 FormData，支持多文件
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  // 3. 批量上传
  const results = await uploadMultiplePrivateFiles(formData);

  // 4. 合并文件信息和 fileKey
  const nextFiles = results.map((result, index) => ({
    ...createStoredFileMeta(filesArray[index]),
    fileKey: result.fileKey
  }));

  // 5. 更新草稿
  updateDraft((current) => ({
    ...current,
    coursewareFiles: [...current.coursewareFiles, ...nextFiles],
    ...
  }));
};
```

## 3. 错误处理

所有上传函数都包含 try-catch 错误处理：
- 捕获上传失败的异常
- 显示友好的错误提示
- 记录错误日志到控制台

## 4. 用户体验优化

1. **上传中状态**
   - 可以考虑添加上传进度显示（使用 `onUploadProgress` 回调）

2. **成功反馈**
   - 上传成功后显示 Toast 提示
   - 显示已上传的文件名和数量

3. **失败处理**
   - 显示具体的错误信息
   - 允许用户重试

## 5. 后续优化建议

1. **上传进度显示**
   ```typescript
   const [uploadProgress, setUploadProgress] = useState(0);

   await uploadPrivateFile(formData, {
     onUploadProgress: (progressEvent) => {
       const progress = Math.round(
         (progressEvent.loaded * 100) / progressEvent.total
       );
       setUploadProgress(progress);
     }
   });
   ```

2. **文件类型验证**
   - 在上传前验证文件类型
   - 限制文件大小

3. **取消上传**
   - 使用 AbortController 支持取消上传
   ```typescript
   const abortController = new AbortController();
   await uploadPrivateFile(formData, {
     signal: abortController.signal
   });
   ```

4. **断点续传**
   - 对于大文件，可以考虑实现分片上传和断点续传

## 6. 测试要点

- [ ] 单个文件上传成功
- [ ] 批量文件上传成功
- [ ] 文件上传失败的错误处理
- [ ] 文件数量限制验证（最多20个）
- [ ] 必须先上传大纲的验证
- [ ] fileKey 正确保存到草稿中
- [ ] 上传后的文件信息正确显示

## 7. 相关文件

- `src/teacher/api/file.ts` - 文件上传 API
- `src/app/teacher/(layoutPage)/aiTeacher/avatar/avatarStorage.ts` - 数据类型定义
- `src/app/teacher/(layoutPage)/aiTeacher/avatar/create/hooks/useAvatarWizard.ts` - 业务逻辑
- `src/app/teacher/(layoutPage)/aiTeacher/avatar/create/components/Step2TeachingPath.tsx` - UI 组件
