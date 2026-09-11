import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  AddTeachingTaskResponse,
  DeleteTeachingTaskResponse,
  TeachingTaskDetailResponse,
  TeachingTaskIdRequest,
  TeachingTaskPageResponse,
  TeachingTaskQueryRequest,
  TeachingTaskRequest,
  TeachingTaskStatusRequest,
  UpdateTeachingTaskResponse,
  UpdateTeachingTaskStatusResponse
} from '@/types/api/admin/teaching/tasks';

const baseURL = getProxyUrl('/ai-university');

/**
 * 新增教学任务
 * @param data 教学任务信息
 * @returns 新增结果
 */
export const postTeachingTaskAdd = (data: TeachingTaskRequest) =>
  POST<AddTeachingTaskResponse>('/client/teachingTask/add', data, { baseURL });

/**
 * 编辑教学任务（仅未开始状态可编辑）
 * @param data 教学任务信息
 * @returns 编辑结果
 */
export const postTeachingTaskUpdate = (data: TeachingTaskRequest) =>
  POST<UpdateTeachingTaskResponse>('/client/teachingTask/update', data, { baseURL });

/**
 * 删除教学任务（仅未开始状态可删除）
 * @param data 教学任务ID
 * @returns 删除结果
 */
export const postTeachingTaskDelete = (data: TeachingTaskIdRequest) =>
  POST<DeleteTeachingTaskResponse>('/client/teachingTask/delete', data, { baseURL });

/**
 * 分页查询教学任务列表
 * @param data 查询参数
 * @returns 分页列表
 */
export const postTeachingTaskPage = (data: TeachingTaskQueryRequest) =>
  POST<TeachingTaskPageResponse>('/client/teachingTask/page', data, { baseURL });

/**
 * 获取教学任务详情
 * @param data 任务ID
 * @returns 教学任务详情
 */
export const postTeachingTaskDetail = (data: TeachingTaskIdRequest) =>
  POST<TeachingTaskDetailResponse>('/client/teachingTask/detail', data, { baseURL });

/**
 * 更新任务状态（未开始→进行中→已完成）
 * @param data 状态更新参数
 * @returns 更新结果
 */
export const postTeachingTaskUpdateStatus = (data: TeachingTaskStatusRequest) =>
  POST<UpdateTeachingTaskStatusResponse>('/client/teachingTask/updateStatus', data, { baseURL });
