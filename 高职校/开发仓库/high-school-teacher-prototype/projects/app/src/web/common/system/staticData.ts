import { getSystemInitData } from '@/web/common/system/api';
import { delay } from '@fastgpt/global/common/system/utils';
import type { FastGPTFeConfigsType } from '@fastgpt/global/common/system/types/index.d';

import { useSystemStore } from './useSystemStore';
import { getChatSetting } from '@/web/core/chat/api';

export const clientInitData = async (
  retry = 3
): Promise<{
  feConfigs: FastGPTFeConfigsType;
}> => {
  try {
    const res = await getSystemInitData(useSystemStore.getState().initDataBufferId);
    useSystemStore.getState().initStaticData(res);

    // 获取 chat setting 并设置 logo（全局初始化）
    if (res.feConfigs?.isPlus) {
      try {
        const chatSetting = await getChatSetting();
        if (chatSetting) {
          useSystemStore.getState().setChatLogos({
            wideLogoUrl: chatSetting.wideLogoUrl,
            squareLogoUrl: chatSetting.squareLogoUrl
          });
        }
      } catch (e) {
        // 忽略错误，不影响其他初始化
      }
    }

    return {
      feConfigs: res.feConfigs || useSystemStore.getState().feConfigs || {}
    };
  } catch (error) {
    if (retry > 0) {
      await delay(500);
      return clientInitData(retry - 1);
    }
    return Promise.reject(error);
  }
};
