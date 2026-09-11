'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Spinner, Text, useToast } from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import SvgIcon from '@/app/components/ui/SvgIcon';
import QRCode from 'qrcode';
import { getWechatQRCode, getWechatScanResult, getWechatLoginByUnionId } from '@/teacher/api/auth';
import type { AuthInfo } from '@/teacher/types/auth';
import BindPhoneModal from './BindPhoneModal';

type WechatLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (authInfo: AuthInfo) => void;
};

type ScanStatus = 'pending' | 'expired' | 'bound' | 'unbound_phone';

export default function WechatLoginModal({
  isOpen,
  onClose,
  onLoginSuccess
}: WechatLoginModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [unionId, setUnionId] = useState('');
  const [status, setStatus] = useState<ScanStatus>('pending');
  const [expireAt, setExpireAt] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isBindPhoneOpen, setIsBindPhoneOpen] = useState(false);
  const toast = useToast();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const stopAllTimers = useCallback(() => {
    clearPolling();
    clearCountdown();
  }, [clearPolling, clearCountdown]);

  const startCountdown = useCallback(
    (targetExpireAt: number) => {
      clearCountdown();
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((targetExpireAt - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearCountdown();
          setStatus('expired');
          clearPolling();
        }
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);
    },
    [clearCountdown, clearPolling]
  );

  const startPolling = useCallback(
    (pollTicket: string) => {
      clearPolling();
      pollCountRef.current = 0;
      intervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        // 超过 20 次（60 秒）自动停止
        if (pollCountRef.current >= 20) {
          clearPolling();
          setStatus('expired');
          clearCountdown();
          return;
        }
        try {
          const result = await getWechatScanResult(pollTicket);
          if (result === null) {
            // 未关注，继续轮询
            return;
          }
          // 已关注
          clearPolling();
          clearCountdown();
          setUnionId(result.unionid);
          try {
            const loginRes = await getWechatLoginByUnionId(result.unionid);
            if (!loginRes) {
              // 未绑定手机号
              setStatus('unbound_phone');
              onClose();
              setIsBindPhoneOpen(true);
              return;
            }
            // 已绑定，直接登录
            onLoginSuccess(loginRes);
          } catch {
            toast({
              title: '登录失败，请重试',
              status: 'error',
              duration: 3000,
              position: 'top'
            });
            setStatus('expired');
          }
        } catch {
          // 轮询出错继续，不中断
        }
      }, 3000);
    },
    [clearPolling, clearCountdown, onClose, onLoginSuccess, toast]
  );

  const fetchQR = useCallback(async () => {
    setIsLoading(true);
    setStatus('pending');
    setCountdown(60);
    try {
      const res = await getWechatQRCode();
      const qrDataUrl = await QRCode.toDataURL(res.url, { width: 200, margin: 2 });
      setQrUrl(qrDataUrl);
      setSessionId(res.ticket);
      const expireAt = Date.now() + 60000;
      setExpireAt(expireAt);
      startPolling(res.ticket);
      startCountdown(expireAt);
    } catch {
      toast({
        title: '获取二维码失败，请重试',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
      setStatus('expired');
    } finally {
      setIsLoading(false);
    }
  }, [startPolling, startCountdown, toast]);

  useEffect(() => {
    if (isOpen) {
      stopAllTimers();
      setQrUrl('');
      setSessionId('');
      setUnionId('');
      setStatus('pending');
      setIsBindPhoneOpen(false);
      void fetchQR();
    } else {
      stopAllTimers();
    }
    return () => {
      stopAllTimers();
    };
  }, [isOpen, fetchQR, stopAllTimers]);

  const handleRefresh = () => {
    void fetchQR();
  };

  const handleBindPhoneSuccess = (authInfo: AuthInfo) => {
    setIsBindPhoneOpen(false);
    onLoginSuccess(authInfo);
  };

  const handleBindPhoneClose = () => {
    setIsBindPhoneOpen(false);
    // 回到扫码页，保持当前二维码状态，用户可点击刷新重新获取
    if (status === 'unbound_phone') {
      setStatus('expired');
    }
  };

  const getStatusTip = () => {
    switch (status) {
      case 'expired':
        return '二维码已失效，请点击刷新';
      case 'unbound_phone':
        return '跳转绑定手机号...';
      case 'pending':
      default:
        return '请使用微信扫码登录';
    }
  };

  return (
    <>
      <MyModal isOpen={isOpen} onClose={onClose} w="440px" isCentered>
        <Box p="40px" pt="32px">
          <Flex direction="column" align="center" gap="16px">
            {/* Logo icon */}
            <Flex
              w="56px"
              h="56px"
              borderRadius="16px"
              bg="#FFF0F0"
              align="center"
              justify="center"
            >
              <SvgIcon src="/imgs/app/logo.svg" alt="logo" width="32px" height="32px" />
            </Flex>

            <Text fontSize="22px" fontWeight="600" color="#1D2129" lineHeight="30px">
              微信登录
            </Text>
            <Text fontSize="14px" color="#86909C" lineHeight="22px">
              使用微信扫码登录
            </Text>

            {/* QR Code Area */}
            <Box
              w="200px"
              h="200px"
              mt="8px"
              bg="#F5F5F5"
              rounded="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              position="relative"
            >
              {isLoading ? (
                <Spinner color="#C8000B" size="lg" />
              ) : status === 'expired' ? (
                <Flex direction="column" align="center" gap="12px">
                  <Text fontSize="14px" color="#86909C">
                    二维码已失效
                  </Text>
                  <Button
                    size="sm"
                    bg="#C8000B"
                    color="white"
                    _hover={{ bg: '#A0000A' }}
                    onClick={handleRefresh}
                  >
                    刷新
                  </Button>
                </Flex>
              ) : !qrUrl ? (
                <Text fontSize="14px" color="#86909C">
                  加载失败
                </Text>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="微信登录二维码"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}

              {/* 已关注但未绑定手机号时显示遮罩 */}
              {status === 'unbound_phone' && qrUrl && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="rgba(255,255,255,0.92)"
                  direction="column"
                  align="center"
                  justify="center"
                  gap="8px"
                >
                  <Spinner color="#C8000B" size="md" />
                  <Text fontSize="14px" color="#1D2129" fontWeight="500">
                    跳转绑定手机号...
                  </Text>
                </Flex>
              )}
            </Box>

            {/* Countdown / Status Tip */}
            <Text fontSize="14px" color="#86909C" lineHeight="22px">
              {status === 'pending' && countdown > 0
                ? `${getStatusTip()}（${countdown}s）`
                : getStatusTip()}
            </Text>
          </Flex>

          {/* Back to account login */}
          <Flex justify="center" mt="24px">
            <Flex
              as="button"
              align="center"
              gap="6px"
              color="#4E5969"
              fontSize="14px"
              lineHeight="22px"
              cursor="pointer"
              _hover={{ color: '#1D2129' }}
              onClick={onClose}
            >
              ← 返回账号登录
            </Flex>
          </Flex>
        </Box>
      </MyModal>

      <BindPhoneModal
        isOpen={isBindPhoneOpen}
        onClose={handleBindPhoneClose}
        unionId={unionId}
        onBindSuccess={handleBindPhoneSuccess}
      />
    </>
  );
}
