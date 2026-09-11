'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast
} from '@chakra-ui/react';
import Input from '@/app/components/ui/Input';
import { getClientUserSmsCode, postValidSmsCode, postChangePhoneNum } from '@/teacher/api/auth';
import { useTranslation } from 'react-i18next';
import SliderCaptchaModal from '@/app/teacher/components/SliderCaptchaModal';

type Step = 'verifyOld' | 'inputNew';

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
  const { t } = useTranslation('teacher');
  const toast = useToast();

  const [step, setStep] = useState<Step>('verifyOld');
  const [oldCode, setOldCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [captchaTarget, setCaptchaTarget] = useState<'old' | 'new' | null>(null);
  const [hasSentOldCode, setHasSentOldCode] = useState(false);
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
      setStep('verifyOld');
      setOldCode('');
      setNewPhone('');
      setNewCode('');
      setCountdown(0);
      clearCountdown();
      setHasSentOldCode(false);
      setHasSentNewCode(false);
      sentToPhoneRef.current = '';
    }
    return () => {
      clearCountdown();
    };
  }, [isOpen, clearCountdown]);

  const handleSendCode = (target: 'old' | 'new') => {
    const mobile = target === 'old' ? oldPhone : newPhone;
    if (target === 'new') {
      if (!mobile) {
        toast({
          title: t('profile.changePhone.validation.phoneRequired'),
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }
      if (!PHONE_REGEX.test(mobile)) {
        toast({
          title: t('profile.changePhone.validation.phoneFormat'),
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }
    }
    setCaptchaTarget(target);
    setIsCaptchaOpen(true);
  };

  const handleCaptchaSuccess = async (ticket: string, moveLength: number) => {
    if (!captchaTarget) return;
    const mobile = captchaTarget === 'old' ? oldPhone : newPhone;
    try {
      await getClientUserSmsCode({ bizType: 6, mobile, ticket, moveLength });
      toast({
        title: t('profile.changePhone.feedback.sendSuccess'),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
      if (captchaTarget === 'old') {
        setHasSentOldCode(true);
      } else {
        setHasSentNewCode(true);
        sentToPhoneRef.current = newPhone;
      }
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

  const handleCaptchaClose = (isSuccess: boolean) => {
    setIsCaptchaOpen(false);
    if (!isSuccess) {
      setCaptchaTarget(null);
    }
  };

  const handleNextStep = async () => {
    if (!oldCode) {
      toast({
        title: t('profile.changePhone.validation.codeRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!hasSentOldCode) {
      toast({
        title: t('profile.changePhone.validation.sendCodeFirst'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!CODE_REGEX.test(oldCode)) {
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
      await postValidSmsCode({ bizType: 6, code: oldCode, mobile: oldPhone });
      setStep('inputNew');
      setCountdown(0);
      clearCountdown();
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || t('profile.changePhone.feedback.sendError'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
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
      await postChangePhoneNum({
        bizType: 6,
        mobile: newPhone,
        code: newCode
      });
      onSuccess(newPhone);
      onClose();
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || t('profile.changePhone.feedback.changeError'),
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
              <Text>{t('profile.changePhone.modalTitle')}</Text>
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
            {step === 'verifyOld' && (
              <Flex direction="column" gap="20px">
                <Text fontSize="14px" color="#4E5969" lineHeight="22px">
                  {t('profile.changePhone.verifyOld.description')}
                </Text>
                <Text fontSize="14px" color="#1D2129" fontWeight={500}>
                  {t('profile.changePhone.verifyOld.sendTarget', { phone: maskPhone(oldPhone) })}
                </Text>

                <FormControl>
                  <FormLabel fontSize="14px" color="#1D2129" mb="8px" fontWeight={500}>
                    {t('profile.changePhone.verifyOld.codeLabel')}
                  </FormLabel>
                  <Flex gap="12px">
                    <Input
                      value={oldCode}
                      onChange={(e) => setOldCode(e.target.value)}
                      placeholder={t('profile.changePhone.verifyOld.codePlaceholder')}
                      type="tel"
                      maxLength={6}
                      flex={1}
                      h="40px"
                      borderRadius="8px"
                      borderColor="#E5E7EB"
                      fontSize="14px"
                      _placeholder={{ color: '#BFBFBF' }}
                    />
                    <Button
                      variant="outline"
                      h="40px"
                      px={4}
                      fontSize="14px"
                      fontWeight="400"
                      borderColor="#E5E7EB"
                      color={countdown > 0 ? '#86909C' : '#1D2129'}
                      isDisabled={countdown > 0}
                      onClick={() => handleSendCode('old')}
                      minW="108px"
                    >
                      {countdown > 0
                        ? t('profile.changePhone.verifyOld.resendCode', { seconds: countdown })
                        : t('profile.changePhone.verifyOld.sendCode')}
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
                    {t('profile.actions.cancel')}
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
                    loadingText={t('profile.changePhone.verifyOld.nextStep')}
                    isDisabled={!oldCode || !hasSentOldCode || !CODE_REGEX.test(oldCode)}
                    onClick={handleNextStep}
                  >
                    {t('profile.changePhone.verifyOld.nextStep')}
                  </Button>
                </Flex>
              </Flex>
            )}

            {step === 'inputNew' && (
              <Flex direction="column" gap="20px">
                <FormControl>
                  <FormLabel fontSize="14px" color="#1D2129" mb="8px" fontWeight={500}>
                    {t('profile.changePhone.inputNew.newPhoneLabel')}
                  </FormLabel>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={t('profile.changePhone.inputNew.newPhonePlaceholder')}
                    type="tel"
                    maxLength={11}
                    h="40px"
                    borderRadius="8px"
                    borderColor="#E5E7EB"
                    fontSize="14px"
                    _placeholder={{ color: '#BFBFBF' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="14px" color="#1D2129" mb="8px" fontWeight={500}>
                    {t('profile.changePhone.inputNew.codeLabel')}
                  </FormLabel>
                  <Flex gap="12px">
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder={t('profile.changePhone.inputNew.codePlaceholder')}
                      type="tel"
                      maxLength={6}
                      flex={1}
                      h="40px"
                      borderRadius="8px"
                      borderColor="#E5E7EB"
                      fontSize="14px"
                      _placeholder={{ color: '#BFBFBF' }}
                    />
                    <Button
                      variant="outline"
                      h="40px"
                      px={4}
                      fontSize="14px"
                      fontWeight="400"
                      borderColor="#E5E7EB"
                      color={countdown > 0 ? '#86909C' : '#1D2129'}
                      isDisabled={countdown > 0}
                      onClick={() => handleSendCode('new')}
                      minW="108px"
                    >
                      {countdown > 0
                        ? t('profile.changePhone.inputNew.resendCode', { seconds: countdown })
                        : t('profile.changePhone.inputNew.sendCode')}
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
                    {t('profile.actions.cancel')}
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
                    loadingText={t('profile.changePhone.inputNew.confirm')}
                    isDisabled={
                      !newPhone ||
                      !newCode ||
                      !hasSentNewCode ||
                      sentToPhoneRef.current !== newPhone ||
                      !CODE_REGEX.test(newCode)
                    }
                    onClick={handleConfirmChange}
                  >
                    {t('profile.changePhone.inputNew.confirm')}
                  </Button>
                </Flex>
              </Flex>
            )}
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
