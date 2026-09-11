'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast
} from '@chakra-ui/react';
import Input from '@/app/components/ui/Input';
import SliderCaptchaModal from '@/app/teacher/components/SliderCaptchaModal';
import {
  getClientUserSmsCode,
  postValidSmsCode,
  postWechatBindUserLogin
} from '@/teacher/api/auth';
import type { AuthInfo, CaptchaTypeEnum } from '@/teacher/types/auth';

type BindPhoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  unionId: string;
  onBindSuccess: (authInfo: AuthInfo) => void;
};

const PHONE_REGEX = /^1\d{10}$/;

export default function BindPhoneModal({
  isOpen,
  onClose,
  unionId,
  onBindSuccess
}: BindPhoneModalProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const toast = useToast();

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearCountdown();
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setCode('');
      setCountdown(0);
      clearCountdown();
    }
    return () => {
      clearCountdown();
    };
  }, [isOpen, clearCountdown]);

  const handleSendCode = () => {
    if (!phone) {
      toast({
        title: '请输入手机号',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast({
        title: '手机号格式不正确',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    setIsCaptchaOpen(true);
  };

  const handleCaptchaSuccess = async (ticket: string, moveLength: number) => {
    setIsCaptchaOpen(false);
    try {
      await getClientUserSmsCode({
        bizType: 2,
        mobile: phone,
        ticket,
        moveLength
      });
      toast({
        title: '验证码已发送',
        status: 'success',
        duration: 2000,
        position: 'top'
      });
      startCountdown();
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || '发送验证码失败',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    }
  };

  const handleCaptchaClose = (_isSuccess: boolean) => {
    setIsCaptchaOpen(false);
  };

  const handleSubmit = async () => {
    if (!phone || !code) {
      toast({
        title: '请填写手机号和验证码',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast({
        title: '手机号格式不正确',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. 校验短信验证码
      await postValidSmsCode({ bizType: 2, code, mobile: phone });
      // 2. 绑定并登录（后端直接返回 AuthInfo，无 { token, userInfo } 包装层）
      const authInfo = await postWechatBindUserLogin({ phone, unionId });
      if (!authInfo?.accessToken) {
        toast({
          title: '登录信息异常，请重试',
          status: 'error',
          duration: 3000,
          position: 'top'
        });
        return;
      }
      onBindSuccess(authInfo);
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || '绑定失败',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="16px" mx={4}>
          <ModalHeader
            fontSize="18px"
            fontWeight="600"
            color="#1D2129"
            py={5}
            px={6}
            borderBottom="1px solid"
            borderColor="#F2F3F5"
          >
            <Flex justify="space-between" align="center">
              <Text>绑定手机号</Text>
              <Box
                as="button"
                onClick={onClose}
                color="#86909C"
                _hover={{ color: '#1D2129' }}
                fontSize="20px"
                lineHeight="1"
              >
                ×
              </Box>
            </Flex>
          </ModalHeader>
          <ModalBody py={6} px={6}>
            <Flex direction="column" gap="20px">
              <FormControl>
                <Text fontSize="14px" color="#1D2129" mb="8px" fontWeight="500">
                  请输入手机号
                </Text>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  type="tel"
                  maxLength={11}
                />
              </FormControl>

              <FormControl>
                <Text fontSize="14px" color="#1D2129" mb="8px" fontWeight="500">
                  请输入验证码
                </Text>
                <Flex gap="12px">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    type="tel"
                    maxLength={6}
                    flex={1}
                  />
                  <Button
                    variant="outline"
                    h="34px"
                    minH="34px"
                    px={4}
                    fontSize="14px"
                    fontWeight="400"
                    borderColor="#E5E7EB"
                    borderRadius="8px"
                    color={countdown > 0 ? '#86909C' : '#1D2129'}
                    isDisabled={countdown > 0}
                    onClick={handleSendCode}
                    minW="108px"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </Flex>
              </FormControl>

              <Flex gap="12px" mt="4px">
                <Button
                  variant="outline"
                  flex={1}
                  h="44px"
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight="400"
                  borderColor="#E5E7EB"
                  color="#4E5969"
                  _hover={{ bg: '#F9FAFB' }}
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  flex={1}
                  h="44px"
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight="400"
                  bg="#C8000B"
                  color="white"
                  _hover={{ bg: '#A0000A' }}
                  isLoading={isLoading}
                  loadingText="绑定中..."
                  isDisabled={!phone || !code}
                  onClick={handleSubmit}
                >
                  绑定并登录
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      <SliderCaptchaModal
        isOpen={isCaptchaOpen}
        onClose={handleCaptchaClose}
        onVerifySuccess={handleCaptchaSuccess}
        type={2 as CaptchaTypeEnum}
      />
    </>
  );
}
