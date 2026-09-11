'use client';

import { useRef } from 'react';
import { Box, Flex, FormControl, FormLabel, SimpleGrid, Text } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import type { TeacherProfileForm, TeacherProfileInfo } from '../types';

type BasicInfoPanelProps = {
  value: TeacherProfileForm;
  initialProfile: TeacherProfileInfo;
  onChange: (field: keyof TeacherProfileForm, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onAvatarChange: (file: File) => void;
  onNavigatePassword: () => void;
  onWechatBind: () => void;
  onWechatUnbind: () => void;
  onChangePhone: () => void;
  isSaving?: boolean;
  isUploadingAvatar?: boolean;
  isUnbindingWechat?: boolean;
};

export default function BasicInfoPanel({
  value,
  initialProfile,
  onChange,
  onCancel,
  onSave,
  onAvatarChange,
  onNavigatePassword,
  onWechatBind,
  onWechatUnbind,
  onChangePhone,
  isSaving,
  isUploadingAvatar,
  isUnbindingWechat
}: BasicInfoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation('teacher');

  return (
    <Box>
      <ProfileHeaderCard
        name={initialProfile.name}
        helperText={t('profile.basicInfo.avatar.helperText')}
        avatarUrl={initialProfile.avatarUrl}
        onAvatarClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onAvatarChange(file);
          event.target.value = '';
        }}
      />

      <InfoSectionCard title={t('profile.basicInfo.readonlySectionTitle')} mt="16px">
        <SimpleGrid columns={2} spacingX="12px" spacingY="12px">
          <ReadonlyField
            label={t('profile.basicInfo.fields.teacherNo')}
            value={initialProfile.teacherNo}
          />
          <ReadonlyField label={t('profile.basicInfo.fields.name')} value={initialProfile.name} />
          <Box gridColumn="span 2">
            <ReadonlyField
              label={t('profile.basicInfo.fields.department')}
              value={initialProfile.deptNames.join('、')}
            />
          </Box>
        </SimpleGrid>
      </InfoSectionCard>

      <InfoSectionCard title={t('profile.basicInfo.contactSectionTitle')} mt="16px">
        <SimpleGrid columns={2} spacingX="12px" spacingY="12px">
          <FormControl gridColumn="1 / -1">
            <FormLabel mb="6px" fontSize="12px" fontWeight={400} color="#666666" lineHeight="16px">
              {t('profile.basicInfo.fields.phone')}
            </FormLabel>
            <Flex align="center" gap="12px">
              <FieldInput
                value={maskPhone(initialProfile.loginPhone)}
                isDisabled
                flex={1}
                _disabled={{
                  bg: '#FAFAFA',
                  color: '#333333',
                  borderColor: '#E7E7E7',
                  opacity: 1,
                  cursor: 'default'
                }}
              />
              <Button
                variant="outline"
                h="40px"
                minH="40px"
                px="16px"
                borderRadius="8px"
                fontSize="12px"
                fontWeight={400}
                lineHeight="22px"
                bg="#FFFFFF"
                color="#333333"
                borderColor="#333333"
                _hover={{ bg: '#F9FAFB', borderColor: '#333333', color: '#333333' }}
                _active={{ bg: '#F3F4F6', borderColor: '#333333', color: '#333333' }}
                _focusVisible={{ boxShadow: 'none' }}
                onClick={onChangePhone}
              >
                {t('profile.changePhone.changeButton')}
              </Button>
            </Flex>
          </FormControl>
          <Box gridColumn="span 2 / span 2">
            <EditableField
              label={t('profile.basicInfo.fields.email')}
              value={value.email}
              onChange={(nextValue) => onChange('email', nextValue)}
            />
          </Box>
        </SimpleGrid>

        <WechatBindRow
          isBound={initialProfile.wechatBound}
          onBind={onWechatBind}
          onUnbind={onWechatUnbind}
          isUnbinding={isUnbindingWechat}
          t={t}
        />

        <Flex justify="flex-end" gap="8px" mt="12px">
          {/* <ActionButton variant="secondary" onClick={onCancel}>
            {t('profile.actions.cancel')}
          </ActionButton> */}
          <ActionButton onClick={onSave} isLoading={isSaving || isUploadingAvatar}>
            {t('profile.actions.saveChanges')}
          </ActionButton>
        </Flex>
      </InfoSectionCard>

      <InfoSectionCard title={t('profile.basicInfo.securitySectionTitle')} mt="16px">
        <Flex align="center" justify="space-between">
          <Box>
            <Text fontSize="14px" fontWeight={500} color="#333333" lineHeight="20px">
              {t('profile.basicInfo.security.passwordTitle')}
            </Text>
            <Text mt={1} fontSize="12px" fontWeight={400} color="#86909C" lineHeight="18px">
              {t('profile.basicInfo.security.passwordDescription')}
            </Text>
          </Box>

          <ActionButton variant="secondary" onClick={onNavigatePassword}>
            {t('profile.basicInfo.security.changePassword')}
          </ActionButton>
        </Flex>
      </InfoSectionCard>
    </Box>
  );
}

function ProfileHeaderCard({
  name,
  helperText,
  avatarUrl,
  onAvatarClick
}: {
  name: string;
  helperText: string;
  avatarUrl: string;
  onAvatarClick: () => void;
}) {
  return (
    <Flex
      align="center"
      bg="#FFFFFF"
      rounded="16px"
      border="1px solid #F3F4F6"
      boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
      h="62px"
      px="20px"
    >
      <Box position="relative" mr="12px">
        <Flex
          w="36px"
          h="36px"
          rounded="full"
          bg="#EEF2FF"
          align="center"
          justify="center"
          color="#6B7280"
          fontSize="16px"
          fontWeight={500}
          lineHeight="16px"
          cursor="pointer"
          overflow="hidden"
          onClick={onAvatarClick}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name || 'avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Text fontSize="14px" fontWeight={500} color="#6B7280">
              {name?.slice(0, 1) || ''}
            </Text>
          )}
        </Flex>
        <Box position="absolute" right="-2px" bottom="-2px" w="18px" h="18px">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="18" height="18" rx="9" fill="#333333" />
            <path
              d="M11.933 7.76981H11.2537C11.063 7.76981 10.9141 7.61487 10.9141 7.43015C10.9141 7.24542 11.069 7.09048 11.2537 7.09048H11.933C12.1237 7.09048 12.2727 7.24542 12.2727 7.43015C12.2727 7.61487 12.1178 7.76981 11.933 7.76981Z"
              fill="white"
            />
            <path
              d="M11.8733 6.32742H8.81036C8.61968 6.32742 8.4707 6.17249 8.4707 5.98776C8.4707 5.79708 8.62564 5.6481 8.81036 5.6481H11.8733C12.064 5.6481 12.2129 5.80303 12.2129 5.98776C12.2129 6.17845 12.064 6.32742 11.8733 6.32742Z"
              fill="white"
            />
            <path
              d="M12.2183 13.3709H5.78257C5.03174 13.3709 4.41797 12.7572 4.41797 12.0063V7.01271C4.41797 6.26188 5.02578 5.65406 5.77661 5.6481H6.11627C6.30696 5.6481 6.45594 5.80303 6.45594 5.98776C6.45594 6.17845 6.301 6.32742 6.11627 6.32742H5.78257C5.40716 6.32742 5.10325 6.63133 5.10325 7.00675V12.0004C5.10325 12.3758 5.40716 12.6797 5.78257 12.6797H12.2183C12.5937 12.6797 12.8976 12.3758 12.8976 12.0004V7.01271C12.8976 6.63729 12.5937 6.33338 12.2183 6.33338H11.8726C11.682 6.33338 11.533 6.17845 11.533 5.99372C11.533 5.80304 11.6879 5.65406 11.8726 5.65406H12.2123C12.9691 5.65406 13.5829 6.26783 13.5829 7.01866V12.0123C13.5829 12.7572 12.975 13.3709 12.2183 13.3709Z"
              fill="white"
            />
            <path
              d="M8.47108 5.30838H6.45099C6.2603 5.30838 6.11133 5.15345 6.11133 4.96872C6.11133 4.77803 6.26626 4.62906 6.45099 4.62906H8.47108C8.66177 4.62906 8.81074 4.78399 8.81074 4.96872C8.81074 5.15345 8.66177 5.30838 8.47108 5.30838Z"
              fill="white"
            />
            <path
              d="M8.23822 8.0619C9.08439 8.0619 9.77564 8.75314 9.77564 9.59931C9.77564 10.4455 9.08439 11.1367 8.23822 11.1367C7.39205 11.1367 6.70081 10.4455 6.70081 9.59931C6.70081 8.75314 7.39205 8.0619 8.23822 8.0619ZM8.23822 7.37662C7.01067 7.37662 6.02148 8.37176 6.02148 9.59335C6.02148 10.8149 7.01663 11.8101 8.23822 11.8101C9.45981 11.8101 10.455 10.8149 10.455 9.59335C10.455 8.37176 9.45981 7.37662 8.23822 7.37662Z"
              fill="white"
            />
          </svg>
        </Box>
      </Box>

      <Box>
        <Text fontSize="18px" fontWeight={500} color="#333333" lineHeight="22px">
          {name}
        </Text>
        <Text mt="2px" fontSize="12px" fontWeight={400} color="#86909C" lineHeight="18px">
          {helperText}
        </Text>
      </Box>
    </Flex>
  );
}

function InfoSectionCard({
  title,
  mt,
  children
}: {
  title: string;
  mt?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      mt={mt}
      bg="#FFFFFF"
      rounded="16px"
      border="1px solid #F3F4F6"
      boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
      p="20px"
    >
      <Flex align="center" gap="6px" mb="16px">
        <Box w="3px" h="14px" bg="#C8000B" rounded="full" />
        <Text fontSize="16px" fontWeight={500} color="#333333" lineHeight="20px">
          {title}
        </Text>
      </Flex>

      {children}
    </Box>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <FormControl>
      <FormLabel mb="6px" fontSize="12px" fontWeight={400} color="#666666" lineHeight="16px">
        {label}
      </FormLabel>
      <FieldInput
        value={value}
        isDisabled
        _disabled={{
          bg: '#FAFAFA',
          color: '#333333',
          borderColor: '#E7E7E7',
          opacity: 1,
          cursor: 'default'
        }}
      />
    </FormControl>
  );
}

function EditableField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormControl>
      <FormLabel mb="6px" fontSize="12px" fontWeight={400} color="#666666" lineHeight="16px">
        {label}
      </FormLabel>
      <FieldInput value={value} onChange={(event) => onChange(event.target.value)} />
    </FormControl>
  );
}

function FieldInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
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
      _disabled={{
        bg: '#FFFFFF',
        color: '#333333',
        borderColor: '#E5E7EB',
        opacity: 1,
        cursor: 'default'
      }}
      {...props}
    />
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

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function WechatBindRow({
  isBound,
  onBind,
  onUnbind,
  isUnbinding,
  t
}: {
  isBound: boolean;
  onBind: () => void;
  onUnbind: () => void;
  isUnbinding?: boolean;
  t: (key: string) => string;
}) {
  return (
    <Box mt="16px">
      <Text fontSize="12px" fontWeight={400} color="#666666" lineHeight="16px" mb="8px">
        {t('profile.basicInfo.fields.wechat')}
      </Text>
      <Flex align="center" gap="12px">
        <Flex align="center" gap="6px">
          {isBound ? (
            <>
              <Flex w="16px" h="16px" rounded="full" bg="#22C55E" align="center" justify="center">
                <CheckIcon boxSize={2.5} color="white" />
              </Flex>
              <Text fontSize="14px" fontWeight={400} color="#22C55E" lineHeight="20px">
                {t('profile.wechat.bound')}
              </Text>
            </>
          ) : (
            <>
              <Flex w="16px" h="16px" rounded="full" bg="#E5E7EB" align="center" justify="center">
                <Box w="8px" h="8px" rounded="full" bg="#9CA3AF" />
              </Flex>
              <Text fontSize="14px" fontWeight={400} color="#9CA3AF" lineHeight="20px">
                {t('profile.wechat.unbound')}
              </Text>
            </>
          )}
        </Flex>

        <Button
          variant="outline"
          h="34px"
          minH="34px"
          px="16px"
          borderRadius="12px"
          fontSize="12px"
          fontWeight={400}
          lineHeight="22px"
          bg="#FFFFFF"
          color="#333333"
          borderColor="#333333"
          _hover={{
            bg: '#F9FAFB',
            borderColor: '#333333',
            color: '#333333'
          }}
          _active={{
            bg: '#F3F4F6',
            borderColor: '#333333',
            color: '#333333'
          }}
          _focusVisible={{
            boxShadow: 'none'
          }}
          onClick={isBound ? onUnbind : onBind}
          isLoading={isUnbinding}
        >
          {isBound ? t('profile.wechat.unbind') : t('profile.wechat.bind')}
        </Button>
      </Flex>
    </Box>
  );
}
