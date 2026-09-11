'use client';

import type { SVGProps } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { UserInfo } from '../types';
import { designTokens } from '@/theme/designTokens';

const TAB_ACTIVE_COLOR = '#C8000B';
const TAB_ACTIVE_BG = '#FFEDED';

export type AccountTabKey = 'dashboard' | 'profile' | 'password';

export function AccountCenterTabs({
  user,
  activeTab,
  onChange
}: {
  user: UserInfo;
  activeTab: AccountTabKey;
  onChange: (key: AccountTabKey) => void;
}) {
  const { t } = useTranslation('student');
  const navItems = [
    { key: 'dashboard', label: t('dashboard.title'), icon: ChartIcon },
    { key: 'profile', label: t('profile.sections.basicInfo'), icon: UserIcon },
    { key: 'password', label: t('passwordForm.title'), icon: LockIcon }
  ] as const;

  return (
    <Box w="234px" h="100%" flexShrink={0}>
      <Box
        w="100%"
        h="100%"
        borderRadius="16px"
        border="2px solid #FFF"
        bg="rgba(255, 255, 255, 0.50)"
        p={designTokens.spacing.md}
        position="sticky"
        top="84px"
      >
        <Flex
          align="center"
          gap="12px"
          p="12px"
          mb={designTokens.spacing.sm}
          rounded={designTokens.borderRadius.xl}
          bg={designTokens.colors.bgSecondary}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar}
            alt={user.realName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: designTokens.borderRadius.full,
              border: `1px solid ${designTokens.colors.border}`,
              background: 'white',
              objectFit: 'cover'
            }}
          />
          <Box>
            <Text
              fontSize={designTokens.typography.size.md}
              fontWeight={designTokens.typography.weight.semibold}
              color={designTokens.colors.textPrimary}
            >
              {user.nickname}
            </Text>
            <Text
              mt={designTokens.spacing.xs}
              fontSize={designTokens.typography.size.sm}
              color={designTokens.colors.textSecondary}
            >
              {user.major}
            </Text>
          </Box>
        </Flex>

        <Box>
          {navItems.map((item) => {
            const active = item.key === activeTab;

            return (
              <Box
                key={item.key}
                onClick={() => onChange(item.key)}
                display="flex"
                alignItems="center"
                w="100%"
                justifyContent="flex-start"
                gap="12px"
                px="16px"
                mb={designTokens.spacing.sm}
                h={designTokens.button.height}
                borderRadius={designTokens.button.borderRadius}
                fontSize={designTokens.typography.size.base}
                fontWeight={designTokens.typography.weight.medium}
                border="none"
                color={active ? TAB_ACTIVE_COLOR : designTokens.colors.textPrimary}
                bg={active ? TAB_ACTIVE_BG : 'transparent'}
                minH="0"
                _hover={{
                  bg: active ? TAB_ACTIVE_BG : designTokens.colors.bgHover
                }}
                _active={{
                  bg: active ? TAB_ACTIVE_BG : designTokens.colors.bgHover
                }}
                _focusVisible={{
                  boxShadow: active ? '0 0 0 1px #C8000B' : '0 0 0 1px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Box as="span" display="inline-flex">
                  <item.icon width="18px" height="18px" />
                </Box>
                {item.label}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
