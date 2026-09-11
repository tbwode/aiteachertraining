'use client';

import type { ReactNode } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';

interface SmallChatContainerProps {
  children: ReactNode;
  showHeader?: boolean;
  embedded?: boolean;
  showCloseButton?: boolean;
}

export default function SmallChatContainer({
  children,
  showHeader = true,
  embedded = false,
  showCloseButton = true
}: SmallChatContainerProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(embedded);
  const [lang, setLang] = useState(i18n.language);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const floatButtonRef = useRef<HTMLDivElement>(null);

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLang(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;
      // 如果点击的不是聊天窗口内部，也不是浮动按钮，则关闭
      if (
        chatBoxRef.current &&
        !chatBoxRef.current.contains(target) &&
        floatButtonRef.current &&
        !floatButtonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const container = (
    <Box
      w={{ base: '300px', sm: '330px', md: '360px', lg: '380px', xl: '400px' }}
      h={{ base: '450px', sm: '500px', md: '550px', lg: '600px', xl: '700px' }}
      maxH="90vh"
      bg="#FFF"
      borderRadius="16px"
      border="1px solid var(--complementary1, #FFECED)"
      boxShadow="0 5px 8.8px 0 rgba(200, 13, 13, 0.05)"
      overflow="hidden"
      position="relative"
    >
      {/* 背景图 - 定位覆盖 */}
      <Box
        as="img"
        src="/imgs/chat/image.png"
        w="100%"
        h="auto"
        display="block"
        position="absolute"
        top="0"
        left="0"
        zIndex="0"
      />

      {/* 内容区域 */}
      <Flex position="relative" zIndex="1" h="100%" flexDirection="column">
        {/* Header */}
        {showHeader && (
          <Box pt={3} mx={4} pb={2} position="relative">
            <Flex alignItems="center" gap={2}>
              <Text
                fontSize="20px"
                fontWeight={600}
                color="#333"
                fontFamily="PingFang SC, sans-serif"
                zIndex={1}
                position="relative"
              >
                {t('common:smallchat.title')}
              </Text>
              <Text
                fontSize="14px"
                fontWeight={400}
                color="#4E5969"
                fontFamily="PingFang SC, sans-serif"
              >
                {t('common:smallchat.subtitle')}
              </Text>
            </Flex>
            {/* 渐变线 - 盖住 title 下面 1/4 区域 */}
            <Box
              as="img"
              src="/icon/header-line.svg"
              w="260px"
              h="11px"
              display="block"
              position="absolute"
              bottom="3px"
              left="0"
            />
          </Box>
        )}

        {/* 聊天区域 */}
        <Box flex="1" overflow="hidden">
          {children}
        </Box>
      </Flex>

      {/* 关闭按钮 */}
      {showCloseButton && (
        <Box
          position="absolute"
          top="12px"
          right="12px"
          zIndex={999}
          cursor="pointer"
          pointerEvents="auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          bg="rgba(255,255,255,0.8)"
          borderRadius="50%"
          p="4px"
        >
          <MyIcon name="close" w="20px" h="20px" color="#666" />
        </Box>
      )}
    </Box>
  );

  // embedded 模式直接显示容器
  if (embedded) {
    return container;
  }

  // 浮动模式
  return (
    <>
      {/* 聊天窗口 - 使用 display 控制显隐，保持组件状态 */}
      <Box
        ref={chatBoxRef}
        position="fixed"
        bottom="100px"
        right="20px"
        zIndex={1000}
        display={isOpen ? 'block' : 'none'}
        maxH="90vh"
      >
        {container}
      </Box>

      {/* 浮动按钮 */}
      <Box
        ref={floatButtonRef}
        position="fixed"
        bottom="40px"
        right="40px"
        zIndex={1000}
        cursor="pointer"
        onClick={() => setIsOpen(true)}
        transition="transform 0.2s"
        _hover={{ transform: 'scale(1.05)' }}
        display={isOpen ? 'none' : 'block'}
      >
        <Box
          as="img"
          src={
            lang === 'zh-CN'
              ? '/imgs/app/student/float_chat.png'
              : '/imgs/app/student/float_chat-en.png'
          }
          w="80px"
          h="auto"
          display="block"
        />
      </Box>
    </>
  );
}
