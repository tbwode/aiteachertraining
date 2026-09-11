'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Text,
  Spinner
} from '@chakra-ui/react';
import { getCaptcha } from '@/teacher/api/auth';
import type { CaptchaData, CaptchaTypeEnum } from '@/teacher/types/auth';

interface SliderCaptchaModalProps {
  isOpen: boolean;
  onClose: (isSuccess: boolean) => void;
  mobile?: string;
  type?: CaptchaTypeEnum;
  onVerifySuccess?: (ticket: string, moveLength: number) => void;
}

const SLIDER_SIZE = 36;
const SLIDER_RADIUS = SLIDER_SIZE / 2;

const SliderCaptchaModal: React.FC<SliderCaptchaModalProps> = ({
  isOpen,
  onClose,
  mobile,
  onVerifySuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [backgroundWidth, setBackgroundWidth] = useState<number>(320);
  const [backgroundHeight, setBackgroundHeight] = useState<number>(160);

  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 获取拼图验证码图片
  const fetchCaptchaImage = useCallback(async () => {
    setIsLoading(true);
    setVerifyStatus('idle');
    setSliderValue(0);
    try {
      const response = await getCaptcha();
      setCaptchaData(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 重置滑动条和滑块位置
  const resetSlider = useCallback(() => {
    setSliderValue(0);
    setVerifyStatus('idle');
  }, []);

  // 刷新验证码
  const refreshCaptcha = useCallback(() => {
    resetSlider();
    fetchCaptchaImage();
  }, [fetchCaptchaImage, resetSlider]);

  // 在组件加载或弹窗打开时获取拼图验证码图片
  useEffect(() => {
    if (isOpen) {
      fetchCaptchaImage();
    }
  }, [isOpen, fetchCaptchaImage]);

  // 处理滑动条值的变化
  const handleSliderChange = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !captchaData) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackWidth = trackRect.width - SLIDER_SIZE;
      const relativeX = clientX - trackRect.left - SLIDER_RADIUS;
      const maxSlide = (captchaData.canvasWidth || 320) - (captchaData.blockWidth || 65);
      const displayScale = maxSlide > 0 ? trackWidth / maxSlide : 1;

      let newValue = Math.max(0, Math.min(relativeX, trackWidth));
      newValue = Math.min(newValue, trackWidth);

      setSliderValue(newValue / displayScale);
    },
    [captchaData]
  );

  // 处理鼠标/触摸开始
  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isLoading || !captchaData) return;
      e.preventDefault();
      setIsDragging(true);
    },
    [captchaData, isLoading]
  );

  // 处理鼠标/触摸移动
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleSliderChange(clientX);
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // 滑动结束后触发验证
      if (sliderValue > 0 && captchaData) {
        // 调用验证成功的回调，传递 ticket 和滑动距离
        onVerifySuccess?.(captchaData.ticket, sliderValue);
        setVerifyStatus('success');
        // 延迟关闭弹窗
        setTimeout(() => {
          onClose(true);
        }, 500);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, sliderValue, captchaData, handleSliderChange, onVerifySuccess, onClose]);

  const handleClose = () => {
    resetSlider();
    onClose(false);
  };

  const canvasWidth = captchaData?.canvasWidth || 320;
  const canvasHeight = captchaData?.canvasHeight || 160;
  const blockWidth = captchaData?.blockWidth || 65;
  const blockHeight = captchaData?.blockHeight || 55;
  const maxSlide = canvasWidth - blockWidth;
  const scaleX = canvasWidth > 0 ? backgroundWidth / canvasWidth : 1;
  const scaleY = canvasHeight > 0 ? backgroundHeight / canvasHeight : 1;
  const sliderDisplayLeft =
    maxSlide > 0 ? sliderValue * ((backgroundWidth - SLIDER_SIZE) / maxSlide) : 0;
  const blockLeftPosition = sliderValue * scaleX;

  const maskedMobile = mobile?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="rgba(15, 23, 42, 0.36)" backdropFilter="blur(3px)" />
      <ModalContent
        maxW="384px"
        mx={4}
        borderRadius="24px"
        bg="#FFFFFF"
        boxShadow="0 24px 80px rgba(15, 23, 42, 0.18)"
        overflow="hidden"
      >
        <ModalHeader
          fontSize="20px"
          fontWeight="600"
          color="#1F2937"
          textAlign="left"
          px={6}
          pt={6}
          pb={4}
          borderBottom="1px solid #EEF2F7"
        >
          滑动验证
        </ModalHeader>
        <ModalCloseButton
          top="20px"
          right="20px"
          color="#111827"
          borderRadius="full"
          _hover={{ bg: '#F3F4F6' }}
          _active={{ bg: '#E5E7EB' }}
        />
        <ModalBody px={6} pt={5} pb={6}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
            {/* 验证码图片区域 */}
            <Box
              position="relative"
              width="100%"
              maxW="336px"
              aspectRatio={`${canvasWidth} / ${canvasHeight}`}
              bg="#FCE7EA"
              border="1px solid #F7D8DE"
              borderRadius="12px"
              overflow="hidden"
            >
              {isLoading ? (
                <Flex
                  w="100%"
                  h="100%"
                  align="center"
                  justify="center"
                  direction="column"
                  gap={3}
                  bg="linear-gradient(180deg, #FDF2F4 0%, #FCE7EA 100%)"
                >
                  <Spinner size="lg" color="#E05A6D" thickness="3px" />
                  <Text fontSize="13px" color="#C05A69">
                    验证码加载中...
                  </Text>
                </Flex>
              ) : captchaData ? (
                <>
                  {/* 背景图 */}
                  <img
                    src={captchaData.canvasSrc}
                    alt="验证码背景"
                    style={{
                      width: '100%',
                      height: '100%',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      display: 'block'
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      setBackgroundWidth(img.clientWidth);
                      setBackgroundHeight(img.clientHeight);
                    }}
                  />
                  {/* 拼图滑块 */}
                  <Box
                    position="absolute"
                    left={`${blockLeftPosition}px`}
                    top={`${captchaData.blockY * scaleY}px`}
                    width={`${blockWidth * scaleX}px`}
                    height={`${blockHeight * scaleY}px`}
                    borderRadius={`${captchaData.blockRadius || 4}px`}
                    overflow="hidden"
                    boxShadow="0 8px 24px rgba(17, 24, 39, 0.18)"
                    style={{
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    <img
                      src={captchaData.blockSrc}
                      alt="拼图滑块"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Flex
                  w="100%"
                  h="100%"
                  align="center"
                  justify="center"
                  direction="column"
                  gap={2}
                  bg="linear-gradient(180deg, #FDF2F4 0%, #FCE7EA 100%)"
                >
                  <Text fontSize="14px" color="#B45363" fontWeight="500">
                    验证码获取失败
                  </Text>
                  <Text
                    fontSize="13px"
                    color="#D94A62"
                    cursor="pointer"
                    onClick={refreshCaptcha}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    点击重新加载
                  </Text>
                </Flex>
              )}
            </Box>

            {/* 滑动条区域 */}
            <Box w="100%" maxW="336px" position="relative">
              {/* 轨道 */}
              <Flex
                ref={trackRef}
                w="100%"
                h="46px"
                py="6px"
                bg="#F2F3F5"
                borderRadius="36px"
                justify="center"
                align="center"
                gap="16px"
                alignSelf="stretch"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  left={0}
                  top={0}
                  bottom={0}
                  width={`calc(${sliderDisplayLeft}px + ${SLIDER_SIZE}px)`}
                  transition={isDragging ? 'none' : 'width 0.2s ease'}
                />
                {/* 背景文字 */}
                <Text
                  position="absolute"
                  w="100%"
                  textAlign="center"
                  color="#9CA3AF"
                  fontSize="14px"
                  fontWeight="500"
                  userSelect="none"
                  px={14}
                >
                  {verifyStatus === 'success'
                    ? '验证成功'
                    : verifyStatus === 'error'
                      ? '验证失败，请重试'
                      : '向右滑动完成验证'}
                </Text>

                {/* 滑块 */}
                <Box
                  ref={sliderRef}
                  position="absolute"
                  left={`${sliderDisplayLeft}px`}
                  top="50%"
                  transform="translateY(-50%)"
                  w={`${SLIDER_SIZE}px`}
                  h={`${SLIDER_SIZE}px`}
                  bg={
                    verifyStatus === 'success'
                      ? '#10B981'
                      : verifyStatus === 'error'
                        ? '#EF4444'
                        : '#2F333A'
                  }
                  borderRadius={`${SLIDER_RADIUS}px`}
                  cursor={isLoading ? 'not-allowed' : 'grab'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 8px 20px rgba(15, 23, 42, 0.22)"
                  _active={{ cursor: 'grabbing' }}
                  onMouseDown={handleStart}
                  onTouchStart={handleStart}
                  transition={isDragging ? 'none' : 'left 0.2s ease'}
                >
                  {/* 箭头图标 */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {verifyStatus === 'success' ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : verifyStatus === 'error' ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <polyline points="9 18 15 12 9 6" />
                    )}
                  </svg>
                </Box>
              </Flex>
            </Box>

            {/* 底部提示 */}
            <Flex w="100%" maxW="336px" justify="space-between" align="center">
              <Text
                fontSize="12px"
                color="#E53958"
                cursor="pointer"
                onClick={refreshCaptcha}
                fontWeight="500"
                _hover={{ textDecoration: 'underline' }}
              >
                刷新验证码
              </Text>
              {maskedMobile && (
                <Text fontSize="12px" color="#9CA3AF">
                  手机号: {maskedMobile}
                </Text>
              )}
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SliderCaptchaModal;
