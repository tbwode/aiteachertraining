import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  ResourcePageRequest,
  ResourcePageData,
  BatchUpdateStatusRequest,
  BatchDeleteRequest,
  ResourceUploadRequest,
  ResourceUpdateRequest,
  ResourcePreviewData,
  ResourceDetailRequest,
  ResourceTypeRequest,
  ResourceTypeQueryRequest,
  ResourceTypeVO,
  DraftItem,
  TeacherNameRequest,
  TeacherNameVO,
  TenantMajorNameRequest,
  TenantMajorNameVO,
  TenantCourseNameRequest,
  TenantCourseNameVO,
  ResourceFileUploadData,
  DeleteResourceTypeData
} from '@/types/api/admin/resource-center/teaching-resource';

const baseURL = getProxyUrl('/ai-university');

/**
 * 获取教学资源列表（分页）
 * @param data 查询参数
 * @returns 资源分页列表
 */
export const getResourcePage = (data: ResourcePageRequest) => {
  const payload: Record<string, any> = {
    current: data.current ?? 1,
    size: data.size ?? 10
  };

  if (data.majorId !== undefined) payload.majorId = data.majorId;
  if (data.courseId !== undefined) payload.courseId = data.courseId;
  if (data.uploaderId !== undefined) payload.uploaderId = data.uploaderId;
  if (data.ownerType !== undefined) payload.ownerType = data.ownerType;
  if (data.status !== undefined) payload.status = data.status;
  if (data.resourceType !== undefined) payload.resourceType = data.resourceType;
  if (data.dateStart) payload.dateStart = data.dateStart;
  if (data.dateEnd) payload.dateEnd = data.dateEnd;
  if (data.sourceType !== undefined) payload.sourceType = data.sourceType;
  if (data.formatType !== undefined) payload.formatType = data.formatType;
  if (data.searchKey) payload.searchKey = data.searchKey;

  return POST<ResourcePageData>('/client/teaching-resource/page', payload, { baseURL });
};

/**
 * 上传单个文件到私有存储（仅落盘，不写入 resource_center）
 * @param data FormData（含 file 字段）
 * @returns 上传成功后的文件信息
 */
export const uploadResourceFile = (
  data: FormData,
  config?: {
    signal?: AbortSignal;
    onUploadProgress?: (progressEvent: any) => void;
  }
) =>
  POST<ResourceFileUploadData>('/client/teaching-resource/uploadFile', data, {
    baseURL,
    timeout: 480000,
    ...config
  });

/**
 * 上传教学资源
 * @param data 上传参数
 * @returns 上传结果
 */
export const uploadResource = (data: ResourceUploadRequest) =>
  POST<boolean>('/client/teaching-resource/upload', data, { baseURL });

/**
 * 保存教学资源至草稿箱
 * @param data 保存参数（同上传参数）
 * @returns 保存结果
 */
export const saveDraftResource = (data: ResourceUploadRequest) =>
  POST<boolean>('/client/teaching-resource/saveDraft', data, { baseURL });

/**
 * 删除教学资源
 * @param id 资源 ID
 * @returns 删除结果
 */
export const deleteResource = (id: number) =>
  POST<null>('/client/teaching-resource/delete', { id }, { baseURL });

/**
 * 批量更新资源状态（上架/下架）
 * @param data 批量更新参数
 * @returns 更新结果
 */
export const batchUpdateResourceStatus = (data: BatchUpdateStatusRequest) =>
  POST<null>('/client/teaching-resource/updateStatus', data, { baseURL });

/**
 * 批量上架资源
 * @param ids 资源ID数组
 * @returns 更新结果
 */
export const batchPublishResource = (ids: number[]) =>
  POST<null>('/client/teaching-resource/batchPublish', { ids, isDeleted: 1 }, { baseURL });

/**
 * 批量下架资源
 * @param ids 资源ID数组
 * @returns 更新结果
 */
export const batchUnpublishResource = (ids: number[]) =>
  POST<null>('/client/teaching-resource/batchUnpublish', { ids, isDeleted: 2 }, { baseURL });

/**
 * 单个下架资源
 * @param data 资源详情查询参数
 * @returns 下架结果
 */
export const unpublishResource = (data: ResourceDetailRequest) =>
  POST<boolean>('/client/teaching-resource/unpublish', data, { baseURL });

/**
 * 批量删除教学资源
 * @param data 批量删除参数
 * @returns 删除结果
 */
export const batchDeleteResource = (data: BatchDeleteRequest) =>
  POST<null>('/client/teaching-resource/batchDelete', data, { baseURL });

/**
 * 更新教学资源
 * @param data 更新参数
 * @returns 更新结果
 */
export const updateResource = (data: ResourceUpdateRequest) =>
  POST<null>('/client/teaching-resource/update', data, { baseURL });

/**
 * 获取教学资源详情
 * @param id 资源ID
 * @returns 资源详情
 */
export const getResourceDetail = (id: number) =>
  POST<ResourceVO>('/client/teaching-resource/detail', { id }, { baseURL });

/**
 * 预览教学资源
 * @param id 资源ID
 * @returns 资源预览数据
 */
export const previewResource = (id: number) =>
  POST<ResourcePreviewData>('/client/teaching-resource/preview', { id }, { baseURL });

/**
 * 下载教学资源
 * @param id 资源ID
 * @returns 文件下载链接
 */
export const downloadResource = (id: number) =>
  POST<{ fileUrl: string; fileName: string }>('/client/teaching-resource/download', { id }, { baseURL });

/**
 * 新增资源类型
 * @param data 资源类型参数
 * @returns 新增结果
 */
export const addResourceType = (data: ResourceTypeRequest) =>
  POST<boolean>('/client/teaching-resource/resourceType/add', data, { baseURL });

/**
 * 修改资源类型
 * @param data 资源类型参数（修改时 id 必填）
 * @returns 修改结果
 */
export const updateResourceType = (data: ResourceTypeRequest) =>
  POST<boolean>('/client/teaching-resource/resourceType/update', data, { baseURL });

/**
 * 删除资源类型
 * @param id 资源类型ID
 * @returns 删除结果
 */
export const deleteResourceType = (id: number) =>
  POST<DeleteResourceTypeData>(
    '/client/teaching-resource/resourceType/delete',
    { id },
    { baseURL }
  );

/**
 * 获取草稿箱列表
 * @returns 草稿箱资源列表
 */
export const getDraftList = () =>
  POST<DraftItem[]>('/client/teaching-resource/drafts', {}, { baseURL });

/**
 * 删除草稿箱资源
 * @param id 草稿资源ID
 * @returns 删除结果
 */
export const deleteDraftResource = (id: number) =>
  POST<null>('/client/teaching-resource/delete', { id }, { baseURL });

/**
 * 获取资源类型列表
 * @param data 查询参数
 * @returns 资源类型列表
 */
export const getResourceTypeList = (data?: ResourceTypeQueryRequest) => {
  const payload: Record<string, any> = {};
  if (data?.searchKey !== undefined) payload.searchKey = data.searchKey;
  if (data?.status !== undefined) payload.status = data.status;
  return POST<ResourceTypeVO[]>('/client/teaching-resource/resourceType/list', payload, {
    baseURL
  });
};

/**
 * 获取教师名称列表（上传人下拉框）
 * @param data 查询参数
 * @returns 教师名称列表
 */
export const getTeacherNames = (data?: TeacherNameRequest) => {
  const payload: Record<string, any> = {};
  if (data?.searchKey !== undefined) payload.searchKey = data.searchKey;
  return POST<TeacherNameVO[]>('/client/teaching-resource/teacherNames', payload, { baseURL });
};

/**
 * 获取专业名称列表（专业下拉框）
 * @param data 查询参数
 * @returns 专业名称列表
 */
export const getMajorNames = (data?: TenantMajorNameRequest) => {
  const payload: Record<string, any> = {};
  if (data?.searchKey !== undefined) payload.searchKey = data.searchKey;
  return POST<TenantMajorNameVO[]>('/client/teaching-resource/majorNames', payload, { baseURL });
};

/**
 * 获取课程名称列表（课程下拉框）
 * @param data 查询参数
 * @returns 课程名称列表
 */
export const getCourseNames = (data?: TenantCourseNameRequest) => {
  const payload: Record<string, any> = {};
  if (data?.majorId !== undefined) payload.majorId = data.majorId;
  if (data?.searchKey !== undefined) payload.searchKey = data.searchKey;
  return POST<TenantCourseNameVO[]>('/client/teaching-resource/courseNames', payload, { baseURL });
};
