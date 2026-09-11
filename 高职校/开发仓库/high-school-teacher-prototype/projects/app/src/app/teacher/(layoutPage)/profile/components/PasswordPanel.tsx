'use client';

import { Box, Flex, FormControl, FormLabel, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import type { PasswordForm } from '../types';

type PasswordPanelProps = {
  value: PasswordForm;
  errors: Partial<Record<keyof PasswordForm, string>>;
  onChange: (field: keyof PasswordForm, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function PasswordPanel({
  value,
  errors,
  onChange,
  onCancel,
  onSubmit
}: PasswordPanelProps) {
  const { t } = useTranslation('teacher');

  return (
    <Box
      bg="#FFFFFF"
      rounded="16px"
      border="1px solid #F3F4F6"
      boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
      p="20px"
    >
      <Flex align="center" gap="6px" mb="18px">
        <Box w="3px" h="14px" bg="#C8000B" rounded="full" />
        <Text fontSize="16px" fontWeight={500} color="#333333" lineHeight="20px">
          {t('profile.password.title')}
        </Text>
      </Flex>

      <Flex direction="column" gap="16px">
        <PasswordField
          label={t('profile.password.fields.oldPassword')}
          placeholder={t('profile.password.placeholders.oldPassword')}
          value={value.oldPassword}
          error={errors.oldPassword}
          onChange={(nextValue) => onChange('oldPassword', nextValue)}
        />

        <PasswordField
          label={t('profile.password.fields.newPassword')}
          placeholder={t('profile.password.placeholders.newPassword')}
          value={value.newPassword}
          hint={t('profile.password.hints.newPassword')}
          error={errors.newPassword}
          onChange={(nextValue) => onChange('newPassword', nextValue)}
        />

        <PasswordField
          label={t('profile.password.fields.confirmPassword')}
          placeholder={t('profile.password.placeholders.confirmPassword')}
          value={value.confirmPassword}
          error={errors.confirmPassword}
          onChange={(nextValue) => onChange('confirmPassword', nextValue)}
        />

        <Flex justify="flex-end" gap="8px" pt="4px">
          {/* <ActionButton variant="secondary" onClick={onCancel}>
            {t('profile.actions.cancel')}
          </ActionButton> */}
          <ActionButton onClick={onSubmit}>{t('profile.actions.confirmChange')}</ActionButton>
        </Flex>
      </Flex>
    </Box>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  hint,
  error,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl>
      <FormLabel mb="8px" fontSize="12px" fontWeight={400} color="#666666" lineHeight="16px">
        {label}
      </FormLabel>
      <Input
        isPassword
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        h="40px"
        minH="40px"
        px="12px"
        py="9px"
        borderRadius="8px"
        borderColor="#E5E7EB"
        bg="#FFFFFF"
        color="#333333"
        fontSize="14px"
        lineHeight="22px"
        _placeholder={{ color: '#BFBFBF' }}
        _hover={{ borderColor: '#D9DDE4' }}
        _focusVisible={{
          borderColor: '#D9DDE4',
          boxShadow: 'none'
        }}
      />
      {hint ? (
        <Text mt="6px" fontSize="12px" fontWeight={400} color="#86909C" lineHeight="18px">
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text mt="6px" fontSize="12px" fontWeight={400} color="#F5222D" lineHeight="18px">
          {error}
        </Text>
      ) : null}
    </FormControl>
  );
}

function ActionButton({
  children,
  variant = 'primary',
  ...props
}: React.ComponentProps<typeof Button>) {
  const isSecondary = variant === 'secondary';

  return (
    <Button
      variant={variant}
      h="34px"
      minH="34px"
      px="16px"
      borderRadius="12px"
      fontSize="12px"
      fontWeight={400}
      lineHeight="22px"
      bg={isSecondary ? '#FFFFFF' : '#333333'}
      color={isSecondary ? '#333333' : '#FFFFFF'}
      borderColor="#333333"
      _hover={{
        bg: isSecondary ? '#F9FAFB' : '#1F1F1F',
        borderColor: '#333333',
        color: isSecondary ? '#333333' : '#FFFFFF'
      }}
      _active={{
        bg: isSecondary ? '#F3F4F6' : '#111111',
        borderColor: '#333333',
        color: isSecondary ? '#333333' : '#FFFFFF'
      }}
      _focusVisible={{
        boxShadow: 'none'
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
