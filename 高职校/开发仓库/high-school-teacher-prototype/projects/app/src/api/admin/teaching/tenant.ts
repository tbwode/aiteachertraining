import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type { TenantType, UpdateTenantDetailParams } from '@/types/api/admin/teaching/tenant';

const baseURL = getProxyUrl('/huayun-ai');

/**
 * 获取租户详情
 * @param id 租户ID（可选）
 * @returns 租户详情
 */
export const getTenantDetail = (id?: number) =>
  POST<TenantType>('/client/tenant/detail', { id }, { baseURL });

/**
 * 更新租户详情
 * @param data 更新参数
 */
export const updateTenantDetail = (data: UpdateTenantDetailParams) =>
  POST('/client/tenant/update', data, { baseURL });
