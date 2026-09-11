import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  StudentPageRequest,
  StudentPageData,
  StudentDetailRequest,
  StudentDetailResponse,
  StudentCreateRequest,
  StudentUpdateRequest,
  StudentDeleteRequest,
  StudentImportData
} from '@/types/api/admin/teaching/students';

const baseURL = getProxyUrl('/ai-university');

/**
 * 分页查询学生列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postStudentPageList = (data: StudentPageRequest) =>
  POST<StudentPageData>('/client/student/pageList', data, { baseURL });

/**
 * 查询学生详情
 * @param data 查询参数
 * @returns 学生详情
 */
export const postStudentDetail = (data: StudentDetailRequest) =>
  POST<StudentDetailResponse>('/client/student/detail', data, { baseURL });

/**
 * 创建学生
 * @param data 学生信息
 * @returns 创建结果
 */
export const postStudentCreate = (data: StudentCreateRequest) =>
  POST<null>('/client/student/create', data, { baseURL });

/**
 * 更新学生
 * @param data 学生信息
 * @returns 更新结果
 */
export const postStudentUpdate = (data: StudentUpdateRequest) =>
  POST<null>('/client/student/update', data, { baseURL });

/**
 * 删除学生
 * @param data 删除参数
 * @returns 删除结果
 */
export const postStudentDelete = (data: StudentDeleteRequest) =>
  POST<null>('/client/student/delete', data, { baseURL });

/**
 * 下载导入模板
 * @returns 文件流
 */
export const getStudentDownloadTemplate = () =>
  POST<Blob>('/client/student/downloadTemplate', {}, { baseURL, responseType: 'blob' });

/**
 * 批量导入学生
 * @param file 导入文件
 * @returns 导入结果
 */
export const postStudentImport = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return POST<StudentImportData>('/client/student/import', formData, {
    baseURL,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
