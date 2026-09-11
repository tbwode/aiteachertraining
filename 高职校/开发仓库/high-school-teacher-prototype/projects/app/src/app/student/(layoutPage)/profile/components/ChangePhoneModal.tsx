'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { getClientUserSmsCode, postBindPhone, postChangePhoneNum } from '@/api/student/auth';
import SliderCaptchaModal from '@/app/teacher/components/SliderCaptchaModal';

type ChangePhoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  oldPhone: string;
  onSuccess: (newPhone: string) => void;
};

const PHONE_REGEX = /^1\d{10}$/;
const CODE_REGEX = /^\d{6}$/;

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export default function ChangePhoneModal({
  isOpen,
  onClose,
  oldPhone,
  onSuccess
}: ChangePhoneModalProps) {
  const { t } = useTranslation('student');
  const toast = useToast();

  const isBindMode = !oldPhone;
  const [newPhone, setNewPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [hasSentNewCode, setHasSentNewCode] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentToPhoneRef = useRef('');

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
      setNewPhone('');
      setNewCode('');
      setCountdown(0);
      clearCountdown();
      setHasSentNewCode(false);
      sentToPhoneRef.current = '';
    }
    return () => {
      clearCountdown();
    };
  }, [isOpen, clearCountdown]);

  const handleSendCode = () => {
    if (!newPhone) {
      toast({
        title: t('profile.changePhone.validation.phoneRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!PHONE_REGEX.test(newPhone)) {
      toast({
        title: t('profile.changePhone.validation.phoneFormat'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    setIsCaptchaOpen(true);
  };

  const handleCaptchaSuccess = async (ticket: string, moveLength: number) => {
    try {
      await getClientUserSmsCode({
        bizType: isBindMode ? 13 : 6,
        mobile: newPhone,
        ticket,
        moveLength
      });
      toast({
        title: t('profile.changePhone.feedback.sendSuccess'),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
      setHasSentNewCode(true);
      sentToPhoneRef.current = newPhone;
      startCountdown();
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || t('profile.changePhone.feedback.sendError'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    }
  };

  const handleCaptchaClose = (_isSuccess: boolean) => {
    setIsCaptchaOpen(false);
  };

  const handleConfirmChange = async () => {
    if (!newPhone || !newCode) {
      toast({
        title: t('profile.changePhone.validation.codeRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!PHONE_REGEX.test(newPhone)) {
      toast({
        title: t('profile.changePhone.validation.phoneFormat'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!hasSentNewCode || sentToPhoneRef.current !== newPhone) {
      toast({
        title: t('profile.changePhone.validation.sendCodeFirst'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!CODE_REGEX.test(newCode)) {
      toast({
        title: t('profile.changePhone.validation.codeFormat'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    setIsLoading(true);
    try {
      if (isBindMode) {
        await postBindPhone({
          bizType: 13,
          mobile: newPhone,
          code: newCode
        });
      } else {
        await postChangePhoneNum({
          bizType: 6,
          mobile: newPhone,
          code: newCode
        });
      }
      onSuccess(newPhone);
      toast({
        title: t(
          isBindMode
            ? 'profile.changePhone.feedback.bindSuccess'
            : 'profile.changePhone.feedback.changeSuccess'
        ),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
      onClose();
    } catch (error: any) {
      toast({
        title:
          error?.message ||
          error?.msg ||
          t(
            isBindMode
              ? 'profile.changePhone.feedback.bindError'
              : 'profile.changePhone.feedback.changeError'
          ),
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
              <Text>
                {t(
                  isBindMode
                    ? 'profile.changePhone.bindModalTitle'
                    : 'profile.changePhone.modalTitle'
                )}
              </Text>
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
              {!isBindMode && (
                <FormControl>
                  <FormLabel fontSize="14px" color="#4E5969" mb="8px" fontWeight={400}>
                    {t('profile.changePhone.currentPhoneLabel')}
                  </FormLabel>
                  <Input
                    value={oldPhone ? maskPhone(oldPhone) : ''}
                    readOnly
                    h="48px"
                    borderRadius="8px"
                    borderColor="#E5E6EB"
                    bg="#F5F5F5"
                    fontSize="14px"
                    color="#1D2129"
                    _hover={{ borderColor: '#E5E6EB' }}
                    _focusVisible={{ borderColor: '#E5E6EB', boxShadow: 'none' }}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel fontSize="14px" color="#4E5969" mb="8px" fontWeight={400}>
                  {t('profile.changePhone.newPhoneLabel')}
                </FormLabel>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder={t('profile.changePhone.newPhonePlaceholder')}
                  type="tel"
                  maxLength={11}
                  h="48px"
                  borderRadius="8px"
                  borderColor="#E5E6EB"
                  fontSize="14px"
                  _placeholder={{ color: '#BFBFBF' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="14px" color="#4E5969" mb="8px" fontWeight={400}>
                  {t('profile.changePhone.codeLabel')}
                </FormLabel>
                <InputGroup>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder={t('profile.changePhone.codePlaceholder')}
                    type="tel"
                    maxLength={6}
                    h="48px"
                    borderRadius="8px"
                    borderColor="#E5E6EB"
                    fontSize="14px"
                    _placeholder={{ color: '#BFBFBF' }}
                  />
                  <InputRightElement h="48px" width="auto" pr="8px">
                    <Button
                      h="32px"
                      px={3}
                      fontSize="14px"
                      fontWeight={400}
                      borderRadius="6px"
                      border="1px solid"
                      borderColor="#E5E6EB"
                      bg="transparent"
                      color={countdown > 0 ? '#86909C' : '#1D2129'}
                      isDisabled={countdown > 0}
                      onClick={handleSendCode}
                      _hover={{ bg: '#F9FAFB' }}
                    >
                      {countdown > 0
                        ? t('profile.changePhone.resendCode', { seconds: countdown })
                        : t('profile.changePhone.sendCode')}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {!isBindMode && (
                <Text fontSize="12px" color="#86909C" lineHeight="20px">
                  {t('profile.changePhone.note')}
                </Text>
              )}

              <Flex justify="flex-end" gap="12px" mt="4px">
                <Button
                  variant="outline"
                  h="44px"
                  px={6}
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={400}
                  borderColor="#E5E7EB"
                  color="#4E5969"
                  _hover={{ bg: '#F9FAFB' }}
                  onClick={onClose}
                >
                  {t('profile.changePhone.cancel')}
                </Button>
                <Button
                  h="44px"
                  px={6}
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={400}
                  bg="#333333"
                  color="white"
                  _hover={{ bg: '#1F1F1F' }}
                  isLoading={isLoading}
                  loadingText={t(
                    isBindMode ? 'profile.changePhone.bindConfirm' : 'profile.changePhone.confirm'
                  )}
                  isDisabled={
                    !newPhone ||
                    !newCode ||
                    !hasSentNewCode ||
                    sentToPhoneRef.current !== newPhone ||
                    !CODE_REGEX.test(newCode)
                  }
                  onClick={handleConfirmChange}
                >
                  {t(
                    isBindMode ? 'profile.changePhone.bindConfirm' : 'profile.changePhone.confirm'
                  )}
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
      />
    </>
  );
}
