'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import MyModal from '@fastgpt/web/components/common/MyModal';

type WechatBindModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ns: string;
  getWechatBindQR: () => Promise<{ ticket: string; url: string }>;
  getWechatBindResult: (ticket: string) => Promise<{ unionid?: string } | null>;
  postWechatBind: (unionId: string) => Promise<unknown>;
};

export default function WechatBindModal({
  isOpen,
  onClose,
  onSuccess,
  ns,
  getWechatBindQR,
  getWechatBindResult,
  postWechatBind
}: WechatBindModalProps) {
  const { t } = useTranslation(ns);
  const [qrUrl, setQrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const ticketRef = useRef('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (ticket: string) => {
      clearPolling();
      pollCountRef.current = 0;
      intervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        try {
          const result = await getWechatBindResult(ticket);
          if (result !== null && result.unionid) {
            clearPolling();
            await postWechatBind(result.unionid);
            onSuccess();
            onClose();
          }
        } catch {
          if (pollCountRef.current >= 20) {
            clearPolling();
            setError(t('profile.wechat.bindTimeout'));
          }
        }
      }, 3000);
    },
    [clearPolling, getWechatBindResult, postWechatBind, onSuccess, onClose, t]
  );

  const fetchQR = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getWechatBindQR();
      const dataUrl = await QRCode.toDataURL(res.url, { width: 200, margin: 2 });
      setQrUrl(dataUrl);
      ticketRef.current = res.ticket;
      startPolling(res.ticket);
    } catch {
      setError(t('profile.wechat.loadQRError'));
    } finally {
      setIsLoading(false);
    }
  }, [getWechatBindQR, startPolling, t]);

  useEffect(() => {
    if (isOpen) {
      void fetchQR();
    } else {
      clearPolling();
      setQrUrl('');
      setError('');
    }
    return () => {
      clearPolling();
    };
  }, [isOpen, fetchQR, clearPolling]);

  return (
    <MyModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('profile.wechat.bindModalTitle')}
      w="400px"
      isCentered
    >
      <Box p="24px" pt="12px">
        <Flex direction="column" align="center" gap="16px">
          <Box
            w="200px"
            h="200px"
            bg="#F5F5F5"
            rounded="12px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {isLoading ? (
              <Spinner color="#C8000B" size="lg" />
            ) : error || !qrUrl ? (
              <Flex direction="column" align="center" gap="8px">
                <Text fontSize="14px" color="#86909C">
                  {error || t('profile.wechat.loadQRError')}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  borderColor="#C8000B"
                  color="#C8000B"
                  onClick={() => void fetchQR()}
                >
                  {t('profile.wechat.retry')}
                </Button>
              </Flex>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt={t('profile.wechat.qrAlt')}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </Box>

          <Text fontSize="14px" fontWeight={400} color="#666666" lineHeight="20px">
            {t('profile.wechat.scanTip')}
          </Text>
        </Flex>

        <Button
          w="100%"
          mt="24px"
          h="44px"
          borderRadius="12px"
          fontSize="14px"
          fontWeight={400}
          bg="#FFFFFF"
          color="#333333"
          border="1px solid #E5E7EB"
          _hover={{ bg: '#F9FAFB' }}
          _active={{ bg: '#F3F4F6' }}
          onClick={onClose}
        >
          {t('profile.actions.cancel')}
        </Button>
      </Box>
    </MyModal>
  );
}
