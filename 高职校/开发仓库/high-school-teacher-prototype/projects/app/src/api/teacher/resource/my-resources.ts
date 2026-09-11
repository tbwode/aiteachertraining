import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';

const baseURL = getProxyUrl('/ai-university');

/**
 * 我的资源列表查询参数
 */
export interface MyResourcePageRequest {
  /** 当前页 */
  current?: number;
  /** 每页数量 */
  size?: number;
  /** 专业ID */
  majorId?: number;
  /** 课程ID */
  courseId?: number;
  /** 状态：0-草稿, 1-已上架, 2-已下架 */
  status?: number;
  /** 资源类型：1-课件, 2-教案, 3-作业, 4-试卷, 5-视频 */
  resourceType?: number;
  /** 文件格式：1-PDF, 2-Word, 3-PPT, 4-视频, 5-压缩包, 6-互动课件, 7-互动课堂 */
  formatType?: number;
  /** 上传日期起 yyyy-MM-dd */
  dateStart?: string;
  /** 上传日期止 yyyy-MM-dd */
  dateEnd?: string;
  /** 文件名关键字 */
  searchKey?: string;
}

/**
 * 我的资源列表返回项
 */
export interface MyResourceVO {
  /** 资源ID */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 上传人 */
  uploaderName: string;
  /** 归属：1-个人, 2-学校 */
  ownerType: number;
  /** 文件大小 */
  fileSize: number;
  /** 资源类型：1-课件, 2-教案, 3-作业, 4-试卷, 5-视频 */
  resourceType: number;
  /** 状态：0-草稿, 1-已上架, 2-已下架 */
  status: number;
  /** 共享范围：1-个人, 2-全校 */
  shareScope: number;
  /** 预览次数 */
  previewCount: number;
  /** 下载次数 */
  downloadCount: number;
  /** 文件格式 */
  fileFormat: string;
  /** 更新时间 */
  createTime?: string;
  /** 文件URL */
  fileUrl?: string;
}

/**
 * 我的资源列表分页数据
 */
export interface MyResourcePageData {
  records: MyResourceVO[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/**
 * 获取我的资源列表（分页）
 * @param data 查询参数
 * @returns 资源分页列表
 */
export const getMyResourcePage = (data: MyResourcePageRequest) => {
  const payload: Record<string, any> = {
    current: data.current ?? 1,
    size: data.size ?? 10
  };

  if (data.majorId !== undefined) payload.majorId = data.majorId;
  if (data.courseId !== undefined) payload.courseId = data.courseId;
  if (data.status !== undefined) payload.status = data.status;
  if (data.resourceType !== undefined) payload.resourceType = data.resourceType;
  if (data.formatType !== undefined) payload.formatType = data.formatType;
  if (data.dateStart) payload.dateStart = data.dateStart;
  if (data.dateEnd) payload.dateEnd = data.dateEnd;
  if (data.searchKey) payload.searchKey = data.searchKey;

  return POST<MyResourcePageData>('/teacher/resource/my/page', payload, { baseURL });
};

/**
 * 上传资源请求参数
 */
export interface UploadResourceRequest {
  /** 文件名 */
  fileName: string;
  /** 文件云存储 Key */
  fileKey: string;
  /** 文件 URL */
  fileUrl: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件详情 JSON（必须为合法 JSON 或留空） */
  fileJson?: string;
  /** 阿里 videoId */
  videoId?: string;
  /** 文件格式：1-PDF, 2-Word, 3-PPT, 4-视频, 5-压缩包, 6-互动课件, 7-互动课堂 */
  formatType: number;
  /** 关联专业ID */
  majorId: number;
  /** 关联课程ID */
  courseId: number;
  /** 共享范围：1-个人, 2-全校 */
  shareScope: number;
  /** 资源类型：1-课件, 2-教案, 3-作业, 4-试卷, 5-视频 */
  resourceType: number;
  /** 资源描述 */
  description?: string;
}

/**
 * 资源详情返回数据
 */
export interface ResourceDetailVO {
  /** 资源ID */
  id: number;
  /** 上传人ID */
  uploaderId: number;
  /** 上传人 */
  uploaderName: string;
  /** 租户ID */
  tenantId: number;
  /** 租户名 */
  tenantName: string;
  /** 文件名 */
  fileName: string;
  /** 文件 Key */
  fileKey: string;
  /** 文件 URL */
  fileUrl: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件详情 JSON */
  fileJson: string;
  /** 阿里 videoId */
  videoId: string;
  /** 文件格式 */
  formatType: number;
  /** 专业ID */
  majorId: number;
  /** 课程ID */
  courseId: number;
  /** 共享范围 */
  shareScope: number;
  /** 资源类型 */
  resourceType: number;
  /** 来源 */
  sourceType: number;
  /** 归属：1-个人, 2-学校 */
  ownerType: number;
  /** 描述 */
  description: string;
  /** 下载次数 */
  downloadCount: number;
  /** 预览次数 */
  previewCount: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 状态 */
  isDeleted: number;
}

/**
 * 资源预览详情
 */
export interface MyResourcePreviewVO {
  /** 资源ID */
  id: number;
  /** 上传人ID */
  uploaderId: number;
  /** 上传人 */
  uploaderName: string;
  /** 租户ID */
  tenantId: number;
  /** 租户名 */
  tenantName: string;
  /** 文件名 */
  fileName: string;
  /** 文件 Key */
  fileKey: string;
  /** 文件 URL */
  fileUrl: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件详情 JSON */
  fileJson: string;
  /** 阿里 videoId */
  videoId: string;
  /** 文件格式 */
  formatType: number;
  /** 专业ID */
  majorId: number;
  /** 课程ID */
  courseId: number;
  /** 共享范围 */
  shareScope: number;
  /** 资源类型 */
  resourceType: number;
  /** 来源 */
  sourceType: number;
  /** 归属：1-个人, 2-学校 */
  ownerType: number;
  /** 描述 */
  description: string;
  /** 下载次数 */
  downloadCount: number;
  /** 预览次数 */
  previewCount: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 状态 */
  isDeleted: number;
}

/**
 * 获取资源详情
 * @param id 资源ID
 * @returns 资源详情
 */
export const getResourceDetail = (id: number) =>
  POST<ResourceDetailVO>('/teacher/resource/my/detail', { id }, { baseURL });

/**
 * 获取资源预览详情
 * @param id 资源ID
 * @returns 资源预览详情
 */
export const getMyResourcePreviewDetail = (id: number) =>
  POST<MyResourcePreviewVO>('/teacher/resource/my/detail', { id }, { baseURL });

/**
 * 编辑资源请求参数
 */
export interface UpdateResourceRequest {
  /** 资源ID */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 文件云存储 Key */
  fileKey?: string;
  /** 文件 URL */
  fileUrl?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 阿里 videoId */
  videoId?: string;
  /** 文件格式 */
  formatType?: number;
  /** 关联专业ID */
  majorId: number;
  /** 关联课程ID */
  courseId: number;
  /** 共享范围：1-个人, 2-全校 */
  shareScope: number;
  /** 资源类型：1-课件, 2-教案, 3-作业, 4-试卷, 5-视频 */
  resourceType: number;
  /** 资源描述 */
  description?: string;
}

/**
 * 上传资源
 * @param data 上传参数
 * @returns 上传结果
 */
export const uploadResource = (data: UploadResourceRequest) =>
  POST<{ id: number }>('/teacher/resource/my/upload', data, { baseURL });

/**
 * 保存为草稿
 * @param data 保存参数（同上传参数）
 * @returns 是否保存成功
 */
export const saveDraft = (data: UploadResourceRequest) =>
  POST<boolean>('/teacher/resource/my/saveDraft', data, { baseURL });

/**
 * 编辑资源
 * @param data 编辑参数
 * @returns 编辑结果
 */
export const updateResource = (data: UpdateResourceRequest) =>
  POST<void>('/teacher/resource/my/update', data, { baseURL });

/**
 * 删除资源
 * @param id 资源ID
 * @returns 删除结果
 */
export const deleteResource = (id: number) =>
  POST<void>('/teacher/resource/my/delete', { id }, { baseURL });

/**
 * 批量删除资源
 * @param ids 资源ID列表
 * @returns 是否批量删除成功
 */
export const batchDeleteResource = (ids: number[]) =>
  POST<boolean>('/teacher/resource/my/batchDelete', { ids }, { baseURL });

/**
 * 上架资源
 * @param id 资源ID
 * @returns 上架结果
 */
export const publishResource = (id: number) =>
  POST<void>('/teacher/resource/my/publish', { id, isDeleted: 1 }, { baseURL });

/**
 * 下架资源
 * @param id 资源ID
 * @returns 下架结果
 */
export const unpublishResource = (id: number) =>
  POST<void>('/teacher/resource/my/unpublish', { id, isDeleted: 2 }, { baseURL });

/**
 * 更新资源共享范围
 * @param id 资源ID
 * @param shareScope 共享范围：1-个人, 2-全校, 3-部门
 * @returns 更新结果
 */
export const updateShareScope = (id: number, shareScope: number) =>
  POST<void>('/teacher/resource/my/updateShareScope', { id, shareScope }, { baseURL });

/**
 * 预览资源
 * @param id 资源ID
 * @returns 预览文件直链 URL
 */
export const previewMyResource = (id: number) =>
  POST<{ fileUrl: string }>('/teacher/resource/my/preview', { id }, { baseURL });

/**
 * 下载资源
 * @param id 资源ID
 * @returns 文件直链 URL
 */
export const downloadMyResource = (id: number) =>
  POST<{ fileUrl: string; fileName: string }>('/teacher/resource/my/download', { id }, { baseURL });

/**
 * 批量下载资源
 * @param ids 资源ID列表
 * @returns zip 文件 Blob
 */
export const batchDownloadResource = (ids: number[]) =>
  POST<Blob>('/teacher/resource/my/batchDownload', { ids }, { baseURL, responseType: 'blob' });

/**
 * 草稿箱列表查询参数
 */
export interface DraftPageRequest {
  /** 当前页 */
  current?: number;
  /** 每页数量 */
  size?: number;
  /** 专业ID */
  majorId?: number;
  /** 课程ID */
  courseId?: number;
  /** 资源类型 */
  resourceType?: number;
  /** 文件格式 */
  formatType?: number;
  /** 文件名关键字 */
  searchKey?: string;
}

/**
 * 获取草稿箱列表（分页）
 * @param data 查询参数
 * @returns 草稿分页列表（返回字段同我的资源查询列表）
 */
export const getDraftPage = (data: DraftPageRequest) => {
  const payload: Record<string, any> = {
    current: data.current ?? 1,
    size: data.size ?? 10
  };

  if (data.majorId !== undefined) payload.majorId = data.majorId;
  if (data.courseId !== undefined) payload.courseId = data.courseId;
  if (data.resourceType !== undefined) payload.resourceType = data.resourceType;
  if (data.formatType !== undefined) payload.formatType = data.formatType;
  if (data.searchKey) payload.searchKey = data.searchKey;

  return POST<MyResourcePageData>('/teacher/resource/my/drafts', payload, { baseURL });
};

/**
 * 专业名称 VO
 */
export interface TenantMajorNameVO {
  /** 专业 ID */
  id: string;
  /** 专业名称 */
  name: string;
}

/**
 * 获取专业名称列表（教师端我的资源）
 * @param searchKey 专业名关键字（模糊搜索）
 * @returns 专业名称列表
 */
export const getMyMajorNames = (searchKey?: string) => {
  const payload: Record<string, any> = {};
  if (searchKey !== undefined) payload.searchKey = searchKey;
  return POST<TenantMajorNameVO[]>('/teacher/resource/my/majorNames', payload, { baseURL });
};

/**
 * 课程名称 VO
 */
export interface TenantCourseNameVO {
  /** 课程 ID */
  id: number;
  /** 课程名称 */
  name: string;
}

/**
 * 获取课程名称列表（教师端我的资源）
 * @param majorId 专业ID
 * @param searchKey 课程名关键字（模糊搜索）
 * @returns 课程名称列表
 */
export const getMyCourseNames = (majorId?: number, searchKey?: string) => {
  const payload: Record<string, any> = {};
  if (majorId !== undefined) payload.majorId = majorId;
  if (searchKey !== undefined) payload.searchKey = searchKey;
  return POST<TenantCourseNameVO[]>('/teacher/resource/my/courseNames', payload, { baseURL });
};

/**
 * 资源类型 VO
 */
export interface ResourceTypeVO {
  /** 资源类型ID */
  id: number;
  /** 资源类型编码 */
  code: number;
  /** 资源类型名称 */
  name: string;
  /** 状态：0-停用，1-启用 */
  status: number;
  /** 排序 */
  sortOrder: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 资源类型查询请求参数
 */
export interface ResourceTypeQueryRequest {
  /** 名称关键字（模糊搜索） */
  searchKey?: string;
  /** 状态：0-停用，1-启用 */
  status?: number;
}

/**
 * 获取资源类型列表（我的资源）
 * @param data 查询参数
 * @returns 资源类型列表
 */
export const getMyResourceTypeList = (data?: ResourceTypeQueryRequest) => {
  const payload: Record<string, any> = {};
  if (data?.searchKey !== undefined) payload.searchKey = data.searchKey;
  if (data?.status !== undefined) payload.status = data.status;
  return POST<ResourceTypeVO[]>('/teacher/resource/my/resourceType/list', payload, { baseURL });
};

/**
 * 单文件上传返回数据（POST /teacher/resource/my/uploadFile）
 */
export interface MyResourceFileUploadData {
  /** 文件 ID */
  id: string;
  /** 原始文件名 */
  fileName: string;
  /** 文件访问 URL */
  fileUrl: string;
  /** 文件云存储 Key */
  fileKey: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 文件类型扩展名 */
  fileType?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 上传单个文件到私有存储（仅落盘，不写入 resource_center）
 * @param data FormData（含 file 字段）
 * @returns 上传成功后的文件信息
 */
export const uploadMyResourceFile = (
  data: FormData,
  config?: {
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: any) => void;
  }
) =>
  POST<MyResourceFileUploadData>('/teacher/resource/my/uploadFile', data, {
    baseURL,
    timeout: 480000,
    ...config
  });
