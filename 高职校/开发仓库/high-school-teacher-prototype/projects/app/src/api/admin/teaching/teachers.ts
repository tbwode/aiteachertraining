import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  TeacherPageRequest,
  TeacherPageData,
  TeacherDetailRequest,
  TeacherDetailResponse,
  TeacherCreateRequest,
  TeacherUpdateRequest,
  TeacherDeleteRequest,
  TeacherListRequest,
  TeacherListItem,
  TeacherImportData
} from '@/types/api/admin/teaching/teachers';

const baseURL = getProxyUrl('/ai-university');

/**
 * 分页查询教师列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postTeacherPageList = (data: TeacherPageRequest) =>
  POST<TeacherPageData>('/client/teacher/pageList', data, { baseURL });

/**
 * 查询教师详情
 * @param data 查询参数
 * @returns 教师详情
 */
export const postTeacherDetail = (data: TeacherDetailRequest) =>
  POST<TeacherDetailResponse>('/client/teacher/detail', data, { baseURL });

/**
 * 创建教师
 * @param data 教师信息
 * @returns 创建结果
 */
export const postTeacherCreate = (data: TeacherCreateRequest) =>
  POST<null>('/client/teacher/create', data, { baseURL });

/**
 * 更新教师
 * @param data 教师信息
 * @returns 更新结果
 */
export const postTeacherUpdate = (data: TeacherUpdateRequest) =>
  POST<null>('/client/teacher/update', data, { baseURL });

/**
 * 删除教师
 * @param data 删除参数
 * @returns 删除结果
 */
export const postTeacherDelete = (data: TeacherDeleteRequest) =>
  POST<null>('/client/teacher/delete', data, { baseURL });

/**
 * 下载导入模板
 * @returns 文件流
 */
export const getTeacherDownloadTemplate = () =>
  POST<Blob>('/client/teacher/downloadTemplate', {}, { baseURL, responseType: 'blob' });

/**
 * 批量导入教师
 * @param file 导入文件
 * @returns 导入结果
 */
export const postTeacherImport = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return POST<TeacherImportData>('/client/teacher/import', formData, {
    baseURL,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/**
 * 查询教师列表（不分页）
 * @param data 查询参数
 * @returns 教师列表
 */
export const postTeacherList = (data: TeacherListRequest = {}) =>
  POST<TeacherListItem[]>('/client/teacher/list', data, { baseURL });
