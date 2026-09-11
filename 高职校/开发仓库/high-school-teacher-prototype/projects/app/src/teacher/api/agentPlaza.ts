/**
 * 智能体广场相关 API
 */
import { POST } from '@/web/common/api/requestTeacher';
import type {
  GetTenantSceneNavbarRequest,
  TenantSceneResp,
  GetAgentFilterListRequest,
  TenantAppResp
} from '../types/agentPlaza';

/**
 * 获取租户场景导航栏（场景和子场景）
 */
export const postTenantSceneNavbar = (data: GetTenantSceneNavbarRequest) =>
  POST<TenantSceneResp[]>('/client/tenant/scene/sceneLabelList', data);

/**
 * 获取智能体筛选列表
 */
export const postAgentFilterList = (data: GetAgentFilterListRequest) =>
  POST<TenantAppResp[]>('/client/app/center/filter/list', data);
