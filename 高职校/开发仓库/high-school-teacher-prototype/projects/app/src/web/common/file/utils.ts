/**
 * file download by text
 */
export const fileDownload = ({
  text,
  type,
  filename
}: {
  text: string;
  type: string;
  filename: string;
}) => {
  // 导出为文件
  const blob = new Blob([`\uFEFF${text}`], { type: `${type};charset=utf-8;` });

  // 创建下载链接
  const downloadLink = document.createElement('a');
  downloadLink.href = window.URL.createObjectURL(blob);
  downloadLink.download = filename;

  // 添加链接到页面并触发下载
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body?.removeChild(downloadLink);
};

/**
 * download file from url (force download, not open)
 */
export const downloadFileFromUrl = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const fileToBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

type FileCategory = 'document' | 'video' | 'audio' | 'image';

// 上传文件大小、格式限制
// 视频最大 2GB，文档最大 500MB，图片最大 50MB，音频最大 200MB
export const FILE_CONFIG: Record<string, { category: FileCategory; maxSize: number }> = {
  // 文档
  pdf: { category: 'document', maxSize: 500 * 1024 * 1024 },
  doc: { category: 'document', maxSize: 500 * 1024 * 1024 },
  docx: { category: 'document', maxSize: 500 * 1024 * 1024 },
  ppt: { category: 'document', maxSize: 500 * 1024 * 1024 },
  pptx: { category: 'document', maxSize: 500 * 1024 * 1024 },
  xls: { category: 'document', maxSize: 500 * 1024 * 1024 },
  xlsx: { category: 'document', maxSize: 500 * 1024 * 1024 },
  txt: { category: 'document', maxSize: 500 * 1024 * 1024 },
  // 视频
  mp4: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  avi: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  mov: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  wmv: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  flv: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  mkv: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  // 音频
  mp3: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  wav: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  wma: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  aac: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  ogg: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  flac: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  // 图片
  jpg: { category: 'image', maxSize: 50 * 1024 * 1024 },
  jpeg: { category: 'image', maxSize: 50 * 1024 * 1024 },
  png: { category: 'image', maxSize: 50 * 1024 * 1024 },
  gif: { category: 'image', maxSize: 50 * 1024 * 1024 },
  bmp: { category: 'image', maxSize: 50 * 1024 * 1024 },
  webp: { category: 'image', maxSize: 50 * 1024 * 1024 },
  svg: { category: 'image', maxSize: 50 * 1024 * 1024 }
};

export function getFileConfig(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_CONFIG[ext];
}

export function isAllowedFile(fileName: string): boolean {
  return !!getFileConfig(fileName);
}

export function isVideoFile(fileName: string): boolean {
  return getFileConfig(fileName)?.category === 'video';
}

export function isAudioFile(fileName: string): boolean {
  return getFileConfig(fileName)?.category === 'audio';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
