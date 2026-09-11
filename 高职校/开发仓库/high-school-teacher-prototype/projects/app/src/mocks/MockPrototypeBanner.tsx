'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Button, Flex, Text, useToast } from '@chakra-ui/react';
import { isMockMode, resetMockState } from './engine';

export function MockPrototypeBanner() {
  const toast = useToast();
  const pathname = usePathname();
  const [isPrototypeOverlayOpen, setIsPrototypeOverlayOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'talent-training-overlay') return;
      setIsPrototypeOverlayOpen(Boolean(event.data.open));
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setIsPrototypeOverlayOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateDialogState = () => {
      setIsDialogOpen(Boolean(document.querySelector('[role="dialog"]')));
    };

    updateDialogState();
    const observer = new MutationObserver(updateDialogState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'aria-hidden']
    });

    return () => observer.disconnect();
  }, [pathname]);

  if (!isMockMode || isPrototypeOverlayOpen || isDialogOpen) return null;

  const handleReset = () => {
    resetMockState();
    toast({
      title: '演示数据已重置',
      status: 'success',
      duration: 1200,
      position: 'top'
    });
    window.setTimeout(() => window.location.reload(), 350);
  };

  return (
    <Flex
      position="fixed"
      right="16px"
      bottom="16px"
      zIndex={2000}
      align="center"
      gap={3}
      px={3}
      py={2}
      borderRadius="12px"
      bg="rgba(23, 32, 48, 0.92)"
      color="white"
      boxShadow="0 10px 28px rgba(15, 23, 42, 0.22)"
      backdropFilter="blur(8px)"
    >
      <Box>
        <Text fontSize="12px" fontWeight={700} lineHeight="16px">
          Mock 原型模式
        </Text>
        <Text fontSize="10px" color="whiteAlpha.700" lineHeight="14px">
          数据仅保存在当前浏览器
        </Text>
      </Box>
      <Button
        size="xs"
        variant="outline"
        colorScheme="whiteAlpha"
        color="white"
        borderColor="whiteAlpha.500"
        onClick={handleReset}
      >
        重置数据
      </Button>
    </Flex>
  );
}
