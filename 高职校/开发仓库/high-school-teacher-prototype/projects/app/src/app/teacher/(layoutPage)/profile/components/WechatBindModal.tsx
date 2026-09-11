'use client';

import WechatBindModalShared from '@/app/components/WechatBindModal';
import { getWechatBindQR, getWechatBindResult, postWechatBind } from '@/teacher/api/profile';

type WechatBindModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function WechatBindModal(props: WechatBindModalProps) {
  return (
    <WechatBindModalShared
      {...props}
      ns="teacher"
      getWechatBindQR={getWechatBindQR}
      getWechatBindResult={getWechatBindResult}
      postWechatBind={postWechatBind}
    />
  );
}
