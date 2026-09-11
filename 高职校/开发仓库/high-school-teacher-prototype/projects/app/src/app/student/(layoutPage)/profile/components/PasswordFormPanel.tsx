'use client';

import { useState, type SVGProps } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { PasswordFormData } from '../types';
import { designTokens, studentProfileTokens } from '@/theme/designTokens';

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: studentProfileTokens.card.border,
  borderRadius: studentProfileTokens.card.borderRadius,
  boxShadow: studentProfileTokens.card.shadow
} as const;

const fieldStyle = {
  h: studentProfileTokens.input.h,
  px: studentProfileTokens.input.px,
  borderRadius: studentProfileTokens.input.borderRadius,
  borderColor: studentProfileTokens.input.borderColor,
  fontSize: studentProfileTokens.input.fontSize,
  color: studentProfileTokens.input.color,
  _hover: { borderColor: studentProfileTokens.inputHoverBorderColor },
  _focusVisible: {
    borderColor: studentProfileTokens.inputFocusBorderColor,
    boxShadow: studentProfileTokens.inputFocusShadow
  }
} as const;

export function PasswordFormPanel({
  passwordForm,
  isSavingPassword,
  onChange,
  onSubmit
}: {
  passwordForm: PasswordFormData;
  isSavingPassword: boolean;
  onChange: React.Dispatch<React.SetStateAction<PasswordFormData>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useTranslation('student');

  return (
    <Box flex="1" w="100%">
      <Box as="form" {...cardStyle} p={designTokens.spacing.card.padding} onSubmit={onSubmit}>
        <Text
          mb={designTokens.spacing.lg}
          fontSize={designTokens.typography.size.lg}
          fontWeight={designTokens.typography.weight.semibold}
          color={designTokens.colors.textPrimary}
        >
          {t('passwordForm.title')}
        </Text>

        <PasswordField
          label={t('passwordForm.fields.currentPassword.label')}
          placeholder={t('passwordForm.fields.currentPassword.placeholder')}
          value={passwordForm.currentPassword}
          onChange={(value) => onChange((state) => ({ ...state, currentPassword: value }))}
        />
        <PasswordField
          label={t('passwordForm.fields.newPassword.label')}
          placeholder={t('passwordForm.fields.newPassword.placeholder')}
          value={passwordForm.newPassword}
          tip={t('passwordForm.tip')}
          onChange={(value) => onChange((state) => ({ ...state, newPassword: value }))}
        />
        <PasswordField
          label={t('passwordForm.fields.confirmPassword.label')}
          placeholder={t('passwordForm.fields.confirmPassword.placeholder')}
          value={passwordForm.confirmPassword}
          onChange={(value) => onChange((state) => ({ ...state, confirmPassword: value }))}
        />

        <Box mt={designTokens.spacing.lg} pt="20px" display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            h={designTokens.button.height}
            px="16px"
            borderRadius={designTokens.button.borderRadius}
            bg={designTokens.colors.primary}
            color={designTokens.colors.textWhite}
            border="none"
            minH="0"
            _hover={{ bg: designTokens.colors.primaryHover }}
            _active={{ bg: designTokens.colors.primaryActive }}
            isDisabled={isSavingPassword}
          >
            {isSavingPassword
              ? t('passwordForm.actions.submitting')
              : t('passwordForm.actions.submit')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  tip,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  tip?: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation('student');
  const [visible, setVisible] = useState(false);

  return (
    <FormControl mb={designTokens.spacing.md}>
      <FormLabel
        mb={designTokens.spacing.sm}
        fontSize={designTokens.typography.size.base}
        color={designTokens.colors.textPrimary}
        fontWeight={designTokens.typography.weight.medium}
      >
        {label}
      </FormLabel>
      <Box position="relative">
        <Input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pr="44px"
          {...fieldStyle}
        />
        <Button
          type="button"
          variant="ghost"
          minW="0"
          minH="0"
          w="32px"
          h="32px"
          p="0"
          position="absolute"
          right="4px"
          top="50%"
          transform="translateY(-50%)"
          color={designTokens.colors.textSecondary}
          _hover={{ bg: 'transparent', color: designTokens.colors.textPrimary }}
          onClick={() => setVisible((state) => !state)}
          aria-label={
            visible ? t('passwordForm.aria.hidePassword') : t('passwordForm.aria.showPassword')
          }
        >
          {visible ? (
            <EyeOffIcon width="18px" height="18px" />
          ) : (
            <EyeIcon width="18px" height="18px" />
          )}
        </Button>
      </Box>
      {tip && (
        <Text
          mt={designTokens.spacing.sm}
          fontSize={designTokens.typography.size.xs}
          color={designTokens.colors.textTertiary}
        >
          {tip}
        </Text>
      )}
    </FormControl>
  );
}

function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
      <path d="M9.9 5.1A11.3 11.3 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4 4.7" />
      <path d="M6.7 6.7A17.3 17.3 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.2 3.8-.7" />
    </svg>
  );
}
