'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import SmallChatContainer from '@/pageComponents/chat/ChatWindow/SmallChatContainer';

// 动态导入 SmallChat 组件，避免 SSR 问题
const SmallChat = dynamic(() => import('@/pageComponents/chat/ChatWindow/SmallChat'), {
  ssr: false
});

export default function SmallChatPage() {
  return (
    <SmallChatContainer>
      <SmallChat />
    </SmallChatContainer>
  );
}
