'use client';

import { useRouter } from 'next/navigation';
import { Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/components/auth';
import { useTeacherI18n } from '@/app/teacher/components/TeacherI18nProvider';
import HeaderUserMenu from '@/app/components/ui/HeaderUserMenu';
import HeaderLocaleToggle from '@/app/components/ui/HeaderLocaleToggle';
import {
  UserIcon,
  LogOutIcon,
  CourseIcon,
  ShieldIcon,
  StudentIcon
} from '@/app/teacher/components/Icons';

const localeLabelMap = {
  'zh-CN': 'languageSwitcher.options.zh-CN',
  en: 'languageSwitcher.options.en'
} as const;

export default function ChatHeader() {
  const router = useRouter();
  const { t } = useTranslation('teacher');
  const { t: tStudent } = useTranslation('student');
  const { user, logout, isStudent, isAdmin } = useAuth();
  const { locale, changeLocale } = useTeacherI18n();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push(isStudent ? '/student' : '/teacher');
    }
  };

  const userName = user?.name || '';
  const userAccount = isStudent
    ? tStudent('layout.account', { value: user?.account || '' })
    : t('layout.account', { value: user?.account || '' });
  const userRoleLabel = isStudent ? tStudent('layout.userRole') : t('layout.userRole');
  const roleBadges = [userRoleLabel];

  const handleToggleLocale = () => {
    changeLocale(locale === 'zh-CN' ? 'en' : 'zh-CN');
  };

  const handleLogout = () => {
    setTimeout(() => logout(), 100);
  };

  const handleSwitchRole = (href: string) => {
    if (typeof window !== 'undefined' && href.startsWith('/admin')) {
      window.localStorage.setItem(
        'admin-auth-user',
        JSON.stringify({
          id: user?.id,
          name: user?.name,
          token: user?.id,
          role: 'admin'
        })
      );
    }
    router.push(href);
  };

  const roleSwitchItems = isStudent
    ? [
        {
          key: 'student',
          label: tStudent('layout.studentPortal'),
          icon: <StudentIcon width="18px" height="18px" />,
          isCurrent: true,
          onClick: undefined
        }
      ]
    : [
        {
          key: 'teacher',
          label: t('layout.teacherPortal'),
          icon: <CourseIcon width="18px" height="18px" />,
          isCurrent: true,
          onClick: undefined
        },
        ...(isAdmin
          ? [
              {
                key: 'admin',
                label: t('layout.adminPortal'),
                icon: <ShieldIcon width="18px" height="18px" />,
                isCurrent: false,
                onClick: () => handleSwitchRole('/admin')
              }
            ]
          : [])
      ];

  return (
    <Flex
      h="60px"
      align="center"
      justify="space-between"
      px="24px"
      bg="#fff"
      borderBottom="1px solid #E5E6EB"
      flexShrink={0}
    >
      {/* 左侧：返回首页 */}
      <Text
        fontSize="14px"
        color="#333"
        cursor="pointer"
        _hover={{ color: '#333' }}
        onClick={handleBack}
        display="flex"
        alignItems="center"
        gap="6px"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="#333333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t('commonChat.header.back_home')}
      </Text>

      {/* 右侧：教师信息 + 语言切换 */}
      <HStack spacing={3}>
        <HeaderUserMenu
          accentColor="#C8000B"
          accentSoftBg="#FFF1F0"
          userName={userName}
          userRoleLabel={userRoleLabel}
          userAccount={userAccount}
          roleBadges={roleBadges}
          actionItems={[
            {
              key: 'profile',
              label: isStudent ? tStudent('layout.profile') : t('layout.profileCenter'),
              icon: <UserIcon width="18px" height="18px" />,
              onClick: () => {
                window.location.href = isStudent ? '/student/profile' : '/teacher/profile';
              }
            }
          ]}
          roleSwitchLabel={
            isStudent ? tStudent('layout.roleSwitchLabel') : t('layout.roleSwitchLabel')
          }
          roleSwitchItems={roleSwitchItems}
          logoutLabel={isStudent ? tStudent('layout.logout') : t('layout.logout')}
          onLogout={handleLogout}
          avatarUrl={user?.avatar}
          avatar={<UserIcon width="16px" height="16px" />}
          logoutIcon={<LogOutIcon width="18px" height="18px" />}
        />

        <HeaderLocaleToggle
          label={t(localeLabelMap[locale])}
          ariaLabel={String(t('languageSwitcher.ariaLabel'))}
          onClick={handleToggleLocale}
        />
      </HStack>
    </Flex>
  );
}
