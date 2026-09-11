'use client';

import { useRef } from 'react';
import type { Dispatch, FormEvent, SetStateAction, SVGProps } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import type { UserInfo } from '../types';
import { designTokens } from '@/theme/designTokens';

type EditableProfile = Pick<UserInfo, 'phone'>;

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.92)',
  background: '#FFFFFF',
  boxShadow: '0 6px 22px rgba(15, 23, 42, 0.04)'
} as const;

const fieldStyle = {
  h: '36px',
  px: '12px',
  borderRadius: '8px',
  borderColor: '#E5E6EB',
  fontSize: '14px',
  color: '#333333',
  bg: '#FFFFFF',
  _hover: { borderColor: '#D9D9D9' },
  _focusVisible: {
    borderColor: '#333333',
    boxShadow: '0 0 0 1px #333333'
  }
} as const;

const readonlyFieldStyle = {
  ...fieldStyle,
  borderColor: '#E7E7E7',
  bg: '#FAFAFA',
  color: '#333333',
  _hover: { borderColor: '#E7E7E7' },
  _focusVisible: {
    borderColor: '#E7E7E7',
    boxShadow: 'none'
  }
} as const;

export function ProfileInfoPanel({
  user,
  avatar,
  baseInfo,
  profileForm,
  isSavingProfile,
  isUploadingAvatar,
  wechatBound,
  onWechatBind,
  onWechatUnbind,
  isUnbindingWechat,
  onChange,
  onSubmit,
  onChangePhone,
  onAvatarChange
}: {
  user: UserInfo;
  avatar?: string;
  baseInfo: { label: string; value: string }[];
  profileForm: EditableProfile;
  isSavingProfile: boolean;
  isUploadingAvatar?: boolean;
  wechatBound?: boolean;
  onWechatBind: () => void;
  onWechatUnbind: () => void;
  isUnbindingWechat?: boolean;
  onChange: Dispatch<SetStateAction<EditableProfile>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangePhone: () => void;
  onAvatarChange: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useTranslation('student');

  return (
    <Box flex="1" w="100%">
      <Box {...cardStyle} p="18px 20px" mb="16px">
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
        <Flex direction="row" align="center" gap="14px" minH="40px">
          <Box position="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar || user.avatar}
              alt={user.realName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: designTokens.borderRadius.full,
                border: '1px solid #E5E6EB',
                background: 'white',
                objectFit: 'cover'
              }}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              position="absolute"
              right="-3px"
              bottom="-3px"
              minW="0"
              minH="0"
              w="18px"
              h="18px"
              p="0"
              borderRadius={designTokens.borderRadius.full}
              bg="#333333"
              color="#FFFFFF"
              border="none"
              _hover={{ bg: '#333333' }}
              _active={{ bg: '#333333' }}
              isDisabled={isUploadingAvatar}
              aria-label={t('profile.avatar.changeAriaLabel')}
            >
              <CameraIcon width="10px" height="10px" />
            </Button>
          </Box>

          <Box>
            <Text fontSize="16px" fontWeight={500} color="#333333" lineHeight="16px">
              {user.nickname}
            </Text>
            <Text mt="8px" fontSize="12px" lineHeight="12px" color="#86909C">
              支持 jpg/png 格式，最大 2MB
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box {...cardStyle} p="16px 20px" mb="16px">
        <SectionTitle>{t('profile.sections.basicInfo')}</SectionTitle>
        <SimpleGrid columns={2} spacing="16px 14px">
          {baseInfo.map((item) => (
            <FormControl key={item.label}>
              <FormLabel
                mb="8px"
                fontSize="14px"
                color="#4E5969"
                fontWeight={400}
                lineHeight="14px"
              >
                {item.label}
              </FormLabel>
              <Input value={item.value} readOnly {...readonlyFieldStyle} />
            </FormControl>
          ))}
        </SimpleGrid>
      </Box>

      <Box {...cardStyle} p="16px 20px">
        <Box as="form" onSubmit={onSubmit}>
          <SectionTitle>{t('profile.sections.contactInfo')}</SectionTitle>
          <SimpleGrid columns={2} spacing="16px 14px">
            <FormControl gridColumn="1 / -1">
              <FormLabel
                mb="8px"
                fontSize="14px"
                color="#4E5969"
                fontWeight={400}
                lineHeight="14px"
              >
                {t('profile.fields.phone')}
              </FormLabel>
              <Flex align="center" gap="12px">
                <Box position="relative" flex={1}>
                  <Input
                    type="tel"
                    value={user.loginPhone ? maskPhone(user.loginPhone) : ''}
                    placeholder={
                      user.loginPhone ? undefined : t('profile.changePhone.phoneEmptyPlaceholder')
                    }
                    readOnly
                    w="100%"
                    pr={user.loginPhone ? '80px' : '12px'}
                    {...readonlyFieldStyle}
                    _placeholder={{ color: '#86909C' }}
                  />
                  {user.loginPhone && (
                    <Box
                      position="absolute"
                      right="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      px="8px"
                      py="2px"
                      borderRadius="4px"
                      bg="#F0F9EB"
                      color="#67C23A"
                      fontSize="12px"
                      fontWeight={400}
                      lineHeight="18px"
                    >
                      {t('profile.wechat.bound')}
                    </Box>
                  )}
                </Box>
                <Button
                  variant="outline"
                  h="36px"
                  minH="36px"
                  px="16px"
                  borderRadius="8px"
                  fontSize="14px"
                  fontWeight={400}
                  color="#C8000B"
                  borderColor="#C8000B"
                  bg="transparent"
                  _hover={{ bg: '#FFF1F0', borderColor: '#C8000B', color: '#C8000B' }}
                  _active={{ bg: '#FFE4E1', borderColor: '#C8000B', color: '#C8000B' }}
                  onClick={onChangePhone}
                >
                  {user.loginPhone
                    ? t('profile.changePhone.changeButton')
                    : t('profile.changePhone.bindButton')}
                </Button>
              </Flex>
            </FormControl>
            <WechatBindRow
              isBound={!!wechatBound}
              displayName={user.realName}
              onBind={onWechatBind}
              onUnbind={onWechatUnbind}
              isUnbinding={isUnbindingWechat}
              t={t}
            />
          </SimpleGrid>

          <Flex justify="flex-end" gap="12px" mt="30px" direction="row">
            <Button
              type="submit"
              h="36px"
              minH="36px"
              px="16px"
              borderRadius="10px"
              bg="#333333"
              color="#FFFFFF"
              border="none"
              _hover={{ bg: '#1F1F1F' }}
              _active={{ bg: '#1F1F1F' }}
              isDisabled={isSavingProfile || isUploadingAvatar}
            >
              {isSavingProfile ? t('profile.actions.saving') : t('profile.actions.save')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Flex align="center" gap="8px" mb="18px">
      <Box w="3px" h="16px" borderRadius="999px" bg="#C8000B" />
      <Text fontSize="16px" lineHeight="16px" fontWeight={600} color="#333333">
        {children}
      </Text>
    </Flex>
  );
}

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function WechatBindRow({
  isBound,
  displayName,
  onBind,
  onUnbind,
  isUnbinding,
  t
}: {
  isBound: boolean;
  displayName: string;
  onBind: () => void;
  onUnbind: () => void;
  isUnbinding?: boolean;
  t: (key: string) => string;
}) {
  return (
    <FormControl gridColumn="1 / -1">
      <FormLabel mb="8px" fontSize="14px" color="#4E5969" fontWeight={400} lineHeight="14px">
        {t('profile.fields.wechat')}
      </FormLabel>
      <Flex align="center" gap="12px">
        <Box position="relative" flex={1}>
          <Input
            value={isBound ? displayName : t('profile.wechat.unbound')}
            readOnly
            w="100%"
            pr={isBound ? '80px' : '12px'}
            {...readonlyFieldStyle}
            color={isBound ? '#333333' : '#9CA3AF'}
          />
          {isBound && (
            <Box
              position="absolute"
              right="12px"
              top="50%"
              transform="translateY(-50%)"
              px="8px"
              py="2px"
              borderRadius="4px"
              bg="#F0F9EB"
              color="#67C23A"
              fontSize="12px"
              fontWeight={400}
              lineHeight="18px"
            >
              {t('profile.wechat.bound')}
            </Box>
          )}
        </Box>
        <Button
          variant="outline"
          h="36px"
          minH="36px"
          px="16px"
          borderRadius="8px"
          fontSize="14px"
          fontWeight={400}
          color={isBound ? '#EF4444' : '#C8000B'}
          borderColor={isBound ? '#EF4444' : '#C8000B'}
          bg="transparent"
          _hover={{
            bg: isBound ? '#FEF2F2' : '#FFF1F0',
            borderColor: isBound ? '#EF4444' : '#C8000B',
            color: isBound ? '#EF4444' : '#C8000B'
          }}
          _active={{
            bg: isBound ? '#FEE2E2' : '#FFE4E1',
            borderColor: isBound ? '#EF4444' : '#C8000B',
            color: isBound ? '#EF4444' : '#C8000B'
          }}
          onClick={isBound ? onUnbind : onBind}
          isLoading={isUnbinding}
        >
          {isBound ? t('profile.wechat.unbind') : t('profile.wechat.bind')}
        </Button>
      </Flex>
      <Box mt="12px" p="12px 16px" borderRadius="20px" bg="#FFF7F2">
        <Flex align="flex-start" gap="8px">
          <InfoOutlineIcon color="#E37318" boxSize={4} mt="2px" />
          <Box>
            <Text fontSize="14px" fontWeight={500} color="#E37318" lineHeight="20px" mb="6px">
              {t('profile.wechat.bindNote.title')}
            </Text>
            <Text fontSize="12px" color="#E37318" lineHeight="20px">
              {'• ' + t('profile.wechat.bindNote.tip1')}
            </Text>
            <Text fontSize="12px" color="#E37318" lineHeight="20px">
              {'• ' + t('profile.wechat.bindNote.tip2')}
            </Text>
            <Text fontSize="12px" color="#E37318" lineHeight="20px">
              {'• ' + t('profile.wechat.bindNote.tip3')}
            </Text>
          </Box>
        </Flex>
      </Box>
    </FormControl>
  );
}
