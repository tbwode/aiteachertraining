import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  getAiAvatarList,
  getAiAvatarDetail,
  createAiAvatar,
  updateAiAvatarStatus
} from '@/teacher/api/aiTeacher';
import type {
  AiAvatarListRequest,
  AiAvatarDetailRequest,
  AiAvatarCreateRequest,
  AiAvatarPublishRequest,
  AiAvatarVO,
  AiAvatarDetailVO
} from '@/teacher/types/aiTeacher';

/**
 * AI分身API操作 Hook
 */
export function useAvatarApi() {
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 获取AI分身列表
   */
  const fetchAvatarList = async (params: AiAvatarListRequest): Promise<AiAvatarVO[]> => {
    setIsLoading(true);
    try {
      console.log('fetchAvatarList - 请求参数:', params);
      const result = await getAiAvatarList(params);
      console.log('fetchAvatarList - 返回结果:', result);
      return result;
    } catch (error) {
      console.error('fetchAvatarList - 请求失败:', error);
      toast({
        title: t('aiTeacher.avatar.common.toasts.fetchListFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.common.toasts.fetchListFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取AI分身详情
   */
  const fetchAvatarDetail = async (params: AiAvatarDetailRequest): Promise<AiAvatarDetailVO> => {
    setIsLoading(true);
    try {
      console.log('fetchAvatarDetail - 请求参数:', params);
      const result = await getAiAvatarDetail(params);
      console.log('fetchAvatarDetail - 返回结果:', result);
      return result;
    } catch (error) {
      console.error('fetchAvatarDetail - 请求失败:', error);
      toast({
        title: t('aiTeacher.avatar.common.toasts.fetchDetailFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.common.toasts.fetchDetailFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 创建AI分身
   */
  const createAvatar = async (params: AiAvatarCreateRequest): Promise<AiAvatarVO> => {
    setIsLoading(true);
    try {
      console.log('createAvatar - 请求参数:', params);
      const result = await createAiAvatar(params);
      console.log('createAvatar - 返回结果:', result);
      toast({
        title: t('aiTeacher.avatar.common.toasts.createSuccess'),
        description: t('aiTeacher.avatar.common.toasts.createSuccessDesc'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return result;
    } catch (error) {
      console.error('createAvatar - 请求失败:', error);
      toast({
        title: t('aiTeacher.avatar.common.toasts.createFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.common.toasts.createFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 发布/取消发布AI分身
   */
  const toggleAvatarStatus = async (params: AiAvatarPublishRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('toggleAvatarStatus - 请求参数:', params);
      const result = await updateAiAvatarStatus(params);
      console.log('toggleAvatarStatus - 返回结果:', result);
      toast({
        title: params.status === 1 ? '发布成功' : '取消发布成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return result;
    } catch (error: any) {
      console.error('toggleAvatarStatus - 请求失败:', error);
      // 优先使用后端返回的 message 字段
      const errorMessage =
        error?.message ||
        error?.msg ||
        (error instanceof Error
          ? error.message
          : t('aiTeacher.avatar.common.toasts.operationFailedDesc'));
      toast({
        title: t('aiTeacher.avatar.common.toasts.operationFailed'),
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchAvatarList,
    fetchAvatarDetail,
    createAvatar,
    toggleAvatarStatus
  };
}
