/**
 * 文件上传相关 API
 */
import type { AxiosProgressEvent } from 'axios';
import { POST } from '@/web/common/api/requestTeacher';

export type FileMetaType = {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
};

/**
 * 上传私有文件
 * 使用 /system/file/upload 接口
 */
export const uploadPrivateFile = (
  data: FormData,
  config?: {
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }
): Promise<FileMetaType> =>
  POST<FileMetaType>('/system/file/upload', data, {
    timeout: 480000,
    ...config
  });

/**
 * 批量上传公开文件（用于课件资源等）
 * 使用 /system/file/upload 接口
 */
export const uploadMultiplePrivateFiles = (
  data: FormData,
  config?: {
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }
): Promise<FileMetaType[]> =>
  POST<FileMetaType[]>('/system/file/upload', data, {
    timeout: 480000,
    ...config
  });

/**
 * 上传公开文件（用于课程图片等公开资源）
 * 使用 /system/file/public/upload 接口
 */
export const uploadFilePublic = (
  data: FormData,
  config?: {
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }
): Promise<FileMetaType> =>
  POST<FileMetaType>('/system/file/public/upload', data, {
    timeout: 480000,
    ...config
  });

/**
 * 创建 MinerU 文件解析任务
 * 使用 /client/mineru/parse 接口
 */
export const createMineruParseTask = (data: { fileKey: string; fileUrl: string }): Promise<any> =>
  POST('/client/mineru/parse', data);

/**
 * 通过 URL 转存文件到公共桶
 * 将外部文件（如 AI 生成的限时图片）转存到公共桶
 */
export const uploadFileByUrl = (fileUrl: string): Promise<{ fileUrl: string }> =>
  POST<{ fileUrl: string }>(
    `/client/sharing/app/chat/file/public/uploadByUrl?fileUrl=${encodeURIComponent(fileUrl)}`,
    {}
  );

/**
 * 解压文件接口
 * @param fileKey 文件云存储 Key
 * @returns 解压后的文件列表
 */
export interface DecompressionFileItem {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export const decompressionFile = (objectKey: string): Promise<DecompressionFileItem[]> =>
  POST<DecompressionFileItem[]>('/system/file/decompression', { objectKey });
