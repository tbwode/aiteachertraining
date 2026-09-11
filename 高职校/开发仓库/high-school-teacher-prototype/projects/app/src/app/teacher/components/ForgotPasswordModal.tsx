'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast
} from '@chakra-ui/react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { getClientUserSmsCode, postResetPwd } from '@/teacher/api/auth';
import { CaptchaTypeEnum } from '@/teacher/types/auth';
import { sha256 } from '@/teacher/utils/crypto';
import SliderCaptchaModal from './SliderCaptchaModal';

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultMobile?: string;
};

type FormState = {
  mobile: string;
  code: string;
  password: string;
  password1: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const SMS_BIZ_TYPE = 3;
const CAPTCHA_TYPE = CaptchaTypeEnum.FORGET_PASSWORD;
const COUNTDOWN_SECONDS = 60;
const MOBILE_REGEX = /^1[3-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,16}$/;
const PASSWORD_RULE_HINT = '密码需 8 至 16 位，包含大小写字母和数字的组合，可以输入特殊符号';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultMobile
}: ForgotPasswordModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>({
    mobile: '',
    code: '',
    password: '',
    password1: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);

  useEffect(() => {
    if (!countdown) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (isOpen) {
      setForm({
        mobile: defaultMobile?.trim() || '',
        code: '',
        password: '',
        password1: ''
      });
    } else {
      setForm({
        mobile: '',
        code: '',
        password: '',
        password1: ''
      });
    }
    setErrors({});
    setCountdown(0);
    setIsSubmitting(false);
    setIsSendingCode(false);
    setIsCaptchaOpen(false);
  }, [defaultMobile, isOpen]);

  const sendCodeText = useMemo(() => {
    if (isSendingCode) return '发送中...';
    if (countdown > 0) return `${countdown}s 后重试`;
    return '获取验证码';
  }, [countdown, isSendingCode]);

  const validateMobile = (value: string) => {
    if (!value) return '请输入手机号';
    if (!MOBILE_REGEX.test(value)) return '请输入正确的手机号';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return '请输入新密码';
    if (!PASSWORD_REGEX.test(value)) return PASSWORD_RULE_HINT;
    return '';
  };

  const validateConfirmPassword = (confirmValue: string, passwordValue: string) => {
    if (!confirmValue) return '请再次输入新密码';
    if (passwordValue && confirmValue !== passwordValue) return '两次输入的新密码不一致';
    return '';
  };

  const handleMobileChange = (rawValue: string) => {
    const value = rawValue.trim();
    setForm((prev) => ({ ...prev, mobile: value }));
    const message = validateMobile(value);
    setErrors((prev) => ({ ...prev, mobile: message || undefined }));
  };

  const handleCodeChange = (rawValue: string) => {
    const value = rawValue.trim();
    setForm((prev) => ({ ...prev, code: value }));
    setErrors((prev) => ({ ...prev, code: value ? undefined : '请输入验证码' }));
  };

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }));
    const message = validatePassword(value);
    setErrors((prev) => {
      const next: FormErrors = { ...prev, password: message || undefined };
      if (form.password1) {
        const confirmMessage = validateConfirmPassword(form.password1, value);
        next.password1 = confirmMessage || undefined;
      }
      return next;
    });
  };

  const handleConfirmPasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password1: value }));
    const message = validateConfirmPassword(value, form.password);
    setErrors((prev) => ({ ...prev, password1: message || undefined }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    const mobileError = validateMobile(form.mobile);
    if (mobileError) nextErrors.mobile = mobileError;
    if (!form.code) nextErrors.code = '请输入验证码';

    const passwordError = validatePassword(form.password);
    if (passwordError) nextErrors.password = passwordError;

    const confirmError = validateConfirmPassword(form.password1, form.password);
    if (confirmError) nextErrors.password1 = confirmError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendCodeClick = () => {
    const mobileError = validateMobile(form.mobile);

    if (mobileError) {
      setErrors((prev) => ({
        ...prev,
        mobile: mobileError
      }));
      return;
    }

    if (countdown > 0 || isSendingCode) return;
    setIsCaptchaOpen(true);
  };

  const handleCaptchaClose = (isSuccess: boolean) => {
    setIsCaptchaOpen(false);
    if (!isSuccess) {
      setIsSendingCode(false);
    }
  };

  const handleCaptchaSuccess = async (ticket: string, moveLength: number) => {
    setIsSendingCode(true);

    try {
      const normalizedMoveLength = Math.trunc(moveLength);

      await getClientUserSmsCode({
        bizType: SMS_BIZ_TYPE,
        mobile: form.mobile,
        ticket,
        moveLength: normalizedMoveLength
      });

      setCountdown(COUNTDOWN_SECONDS);
      toast({
        title: '验证码已发送',
        status: 'success',
        duration: 2000,
        position: 'top'
      });
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || '验证码发送失败',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsSendingCode(false);
      setIsCaptchaOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const [password, password1] = await Promise.all([
        sha256(form.password),
        sha256(form.password1)
      ]);

      await postResetPwd({
        code: form.code,
        mobile: form.mobile,
        password,
        password1
      });

      toast({
        title: '密码重置成功，请使用新密码登录',
        status: 'success',
        duration: 2000,
        position: 'top'
      });

      onClose();
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || '密码重置失败',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (key: keyof FormState) =>
    errors[key] ? (
      <Text mt={2} fontSize="12px" color="#C8000B" lineHeight="16px">
        {errors[key]}
      </Text>
    ) : null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.35)" />
        <ModalContent borderRadius="20px" px={2}>
          <ModalHeader
            pt={6}
            pb={4}
            fontSize="16px"
            fontWeight={600}
            color="#1D2129"
            lineHeight="40px"
          >
            忘记密码
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />
          <ModalBody pb={2}>
            <Box mb={4}>
              <Input
                value={form.mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                placeholder="请输入手机号"
                h="48px"
                minH="48px"
                borderRadius="10px"
                color="#1D2129"
                borderColor={errors.mobile ? '#C8000B' : '#E5E6EB'}
                maxLength={11}
                inputMode="numeric"
              />
              {renderError('mobile')}
            </Box>

            <Box mb={4}>
              <Flex position="relative" align="center">
                <Input
                  value={form.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  name="forgot-password-code"
                  placeholder="请输入验证码"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  h="48px"
                  minH="48px"
                  borderRadius="10px"
                  color="#1D2129"
                  borderColor={errors.code ? '#C8000B' : '#E5E6EB'}
                  pr="128px"
                />
                <Button
                  position="absolute"
                  right="8px"
                  top="7px"
                  h="34px"
                  minH="34px"
                  px="12px"
                  borderRadius="8px"
                  variant="secondary"
                  fontSize="12px"
                  fontWeight={400}
                  isLoading={isSendingCode}
                  isDisabled={isSendingCode || countdown > 0}
                  onClick={handleSendCodeClick}
                >
                  {sendCodeText}
                </Button>
              </Flex>
              {renderError('code')}
            </Box>

            <Box mb={4}>
              <Input
                value={form.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="请输入新密码"
                h="48px"
                minH="48px"
                borderRadius="10px"
                color="#1D2129"
                borderColor={errors.password ? '#C8000B' : '#E5E6EB'}
                isPassword
              />
              {renderError('password')}
            </Box>

            <Box>
              <Input
                value={form.password1}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                placeholder="请再次输入新密码"
                h="48px"
                minH="48px"
                borderRadius="10px"
                color="#1D2129"
                borderColor={errors.password1 ? '#C8000B' : '#E5E6EB'}
                isPassword
              />
              {renderError('password1')}
            </Box>
          </ModalBody>
          <ModalFooter gap={3} pt={8} pb={6}>
            <Button variant="secondary" minW="88px" onClick={onClose}>
              取消
            </Button>
            <Button
              minW="110px"
              fontSize="14px"
              fontWeight={500}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              确认修改
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <SliderCaptchaModal
        isOpen={isCaptchaOpen}
        onClose={handleCaptchaClose}
        onVerifySuccess={handleCaptchaSuccess}
        type={CAPTCHA_TYPE}
      />
    </>
  );
}
