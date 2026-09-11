/**
 * 智能体广场相关 Hooks
 */
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postTenantSceneNavbar, postAgentFilterList } from '../api/agentPlaza';
import type {
  GetTenantSceneNavbarRequest,
  GetAgentFilterListRequest
} from '@/teacher/types/agentPlaza';

/**
 * 获取租户场景导航栏
 */
export const useTenantSceneNavbar = () => {
  const { runAsync, loading, data } = useRequest2(
    (params: GetTenantSceneNavbarRequest) => postTenantSceneNavbar(params),
    { manual: true }
  );

  return {
    getSceneNavbar: runAsync,
    isLoading: loading,
    sceneList: data
  };
};

/**
 * 获取智能体筛选列表
 */
export const useAgentFilterList = () => {
  const { runAsync, loading, data } = useRequest2(
    (params: GetAgentFilterListRequest) => postAgentFilterList(params),
    { manual: true, debounceWait: 300 }
  );

  return {
    getAgentList: runAsync,
    isLoading: loading,
    agentList: data
  };
};
