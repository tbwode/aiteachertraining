import { POST } from '@/web/common/api/requestTeacher';
import type {
  GetAgentDetailByAppointedTypeRequest,
  GetAgentDetailByAppointedTypeResponse
} from '../types/agent';

/**
 * 按指定类型获取官方智能体详情
 * 不按当前用户 tenantId 过滤；仅返回官方且已上线的智能体
 * @param data 请求参数
 * @returns 智能体详情
 */
export const getAgentDetailByAppointedType = (data: GetAgentDetailByAppointedTypeRequest) =>
  POST<GetAgentDetailByAppointedTypeResponse>('/client/agent/detailByAppointedType', data);
