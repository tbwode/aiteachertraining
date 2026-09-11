import { Box, Card, Flex } from '@chakra-ui/react';
import React from 'react';
import Markdown from '@/components/Markdown';
import { useContextSelector } from 'use-context-selector';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import Avatar from '@fastgpt/web/components/common/Avatar';

const WelcomeBox = ({ welcomeText: propsWelcomeText }: { welcomeText: string }) => {
  const appAvatar = useContextSelector(ChatItemContext, (v) => v.chatBoxData?.app?.avatar);
  // 优先使用 context 的 welcomeText，其次是 props 的
  const contextWelcomeText = useContextSelector(ChatItemContext, (v) => v.welcomeText);
  const welcomeText = contextWelcomeText || propsWelcomeText;

  return (
    <Box py={3}>
      {/* 左右布局：左侧头像，右侧消息 - 与 ChatItem AI 回复一致 */}
      <Flex w={'100%'} alignItems={'flex-start'} gap={3} flexDirection={'row'}>
        {/* 头像 - 与 ChatItem AI 回复一致 */}
        <Box
          w={'32px'}
          h={'32px'}
          aspectRatio={'1/1'}
          flexShrink={0}
          borderRadius={'8px'}
          bg={'#c83e3e'}
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
          className="ai-teacher-avatar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'white' }}
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </Box>

        {/* 消息内容区域 - 与 ChatItem AI 回复一致 */}
        <Flex flexDirection={'column'} gap={2} flex={'0 1 auto'} maxW={'calc(100% - 40px)'}>
          <Box textAlign={'left'} alignSelf={'flex-start'} w={'100%'}>
            <Card
              className="chat-box-card"
              bg={'#F5F5F5'}
              borderRadius={'0 16px 16px 16px'}
              boxShadow={'0 3px 13px 0 rgba(0, 0, 0, 0.05)'}
              textAlign={'left'}
              display={'inline-block'}
              p={'10px'}
            >
              <Markdown source={`~~~guide \n${welcomeText}`} forbidZhFormat />
            </Card>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default WelcomeBox;
