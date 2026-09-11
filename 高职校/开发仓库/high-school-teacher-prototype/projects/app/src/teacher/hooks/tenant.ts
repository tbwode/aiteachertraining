/**
 * 租户管理相关 Hooks
 */
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postZhiqueRedirectUrl, postZhihuiSpaceRedirectUrl } from '../api/tenant';

/**
 * 获取知雀跳转链接
 */
export const useZhiqueRedirectUrl = () => {
  const { runAsync, loading, data } = useRequest2(() => postZhiqueRedirectUrl(), { manual: true });

  return {
    getRedirectUrl: runAsync,
    isLoading: loading,
    redirectUrl: data
  };
};

/**
 * 获取智汇空间跳转链接
 */
export const useZhihuiSpaceRedirectUrl = () => {
  const { runAsync, loading, data } = useRequest2(() => postZhihuiSpaceRedirectUrl(), {
    manual: true
  });

  return {
    getRedirectUrl: runAsync,
    isLoading: loading,
    redirectUrl: data
  };
};
