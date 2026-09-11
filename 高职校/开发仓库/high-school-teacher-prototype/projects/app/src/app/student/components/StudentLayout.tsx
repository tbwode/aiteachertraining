'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import {
  Box,
  Flex,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HeaderLocaleToggle from '@/app/components/ui/HeaderLocaleToggle';
import HeaderUserMenu from '@/app/components/ui/HeaderUserMenu';
import { BellIcon, LogOutIcon, SchoolIcon, StudentIcon, UserIcon } from './Icons';
import { useAuth } from '@/app/components/auth';
import { type StudentLocale, useStudentI18n } from './StudentI18nProvider';
import { useStudentAuthStore } from '@/student/store/auth';
import { clearStudentAuth } from '@/student/hooks/auth';
import { useZhiqueRedirectUrl, useZhihuiSpaceRedirectUrl } from '@/teacher/hooks/tenant';
import { getTenantDetail } from '@/api/admin/teaching/tenant';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { postStudentNotificationUnreadNum } from '@/student/api/notice';
import { useGlobalIframe } from '@/app/components/GlobalIframeContext';

interface StudentLayoutProps {
  children: ReactNode;
}

type StudentNavChildItem = {
  label: string;
  href: string;
  activeHref?: string;
  external?: boolean;
  menuCode?: string | string[];
};

type StudentNavItem = {
  label: string;
  href: string;
  activeHref?: string;
  external?: boolean;
  menuCode?: string | string[];
  children?: StudentNavChildItem[];
};

const localeLabelMap: Record<
  StudentLocale,
  'languageSwitcher.options.zh-CN' | 'languageSwitcher.options.en'
> = {
  'zh-CN': 'languageSwitcher.options.zh-CN',
  en: 'languageSwitcher.options.en'
};

const HEADER_ACCENT = '#C8000B';
const HEADER_ACCENT_LIGHT = '#C8000B';
const HEADER_ACCENT_BG = '#FFF1F0';
const HEADER_MAX_WIDTH = '1200px';
const STUDENT_HOME_BG = '#F3F4F6';

export function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, selectRole } = useAuth();
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTenantBrand = async () => {
      try {
        const data = await getTenantDetail();
        if (!active) return;
        setTenantLogo(
          data.avatarUrl || data.avatar || data.fullNameImgUrl || data.fullNameImg || null
        );
        setTenantName(data.fullName || null);
      } catch {
        // fallback to default logo and i18n brand title
      }
    };
    void fetchTenantBrand();
    return () => {
      active = false;
    };
  }, []);
  const studentUserInfo = useStudentAuthStore((state) => state.userInfo);
  const { t } = useTranslation('student');
  const { locale, changeLocale } = useStudentI18n();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const isStudentHome = pathname === '/student';
  const menuCodeSet = useMemo(() => new Set(user?.menuCodes || []), [user?.menuCodes]);

  // 获取知雀跳转链接（仅当用户有权限时）
  const hasZhiquePermission = menuCodeSet.has('student_zhique');
  const hasZhihuiSpacePermission = menuCodeSet.has('student_zhihui_space');
  const { getRedirectUrl, redirectUrl } = useZhiqueRedirectUrl();
  const { getRedirectUrl: getZhihuiSpaceUrl, redirectUrl: zhihuiSpaceBaseUrl } =
    useZhihuiSpaceRedirectUrl();

  // 未读消息数
  const { runAsync: fetchUnreadNum } = useRequest2(postStudentNotificationUnreadNum, {
    errorToast: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadBadgeText = useMemo(() => {
    if (unreadCount <= 0) return '';
    if (unreadCount > 99) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const userId = Number(user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setUnreadCount(0);
      return;
    }

    const refreshUnread = async () => {
      try {
        const count = await fetchUnreadNum();
        setUnreadCount(count || 0);
      } catch {
        // 静默失败
      }
    };

    void refreshUnread();

    const timer = window.setInterval(() => {
      void refreshUnread();
    }, 30000);

    // 监听通知已读事件，立即刷新未读数量
    const handleNotificationRead = () => {
      void refreshUnread();
    };
    window.addEventListener('student-notification-read', handleNotificationRead);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('student-notification-read', handleNotificationRead);
    };
  }, [fetchUnreadNum, user?.id]);

  useEffect(() => {
    if (!hasZhiquePermission) return;
    getRedirectUrl();
  }, [getRedirectUrl, hasZhiquePermission]);

  useEffect(() => {
    if (!hasZhihuiSpacePermission) return;
    getZhihuiSpaceUrl();
  }, [getZhihuiSpaceUrl, hasZhihuiSpacePermission]);

  // 在获取到的链接后面拼接 state 参数（JSON 对象 encodeURIComponent 编码）
  const zhiqueUrl = useMemo(() => {
    if (typeof redirectUrl !== 'string' || !redirectUrl) return '#';
    const stateObj = { redirect: '/home' };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const separator = redirectUrl.includes('?') ? '&' : '?';
    return `${redirectUrl}${separator}state=${state}`;
  }, [redirectUrl]);

  const zhihuiSpaceUrl = useMemo(() => {
    if (typeof zhihuiSpaceBaseUrl !== 'string' || !zhihuiSpaceBaseUrl) return '#';
    const stateObj = { redirect: '/home' };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const separator = zhihuiSpaceBaseUrl.includes('?') ? '&' : '?';
    return `${zhihuiSpaceBaseUrl}${separator}state=${state}`;
  }, [zhihuiSpaceBaseUrl]);

  const navItems = useMemo(
    () =>
      [
        {
          label: t('layout.nav.home'),
          href: '/student/home',
          activeHref: '/student/home',
          menuCode: 'student_home'
        },
        {
          label: t('layout.nav.coursePlaza'),
          href: '/student/course-plaza',
          activeHref: '/student/course-plaza',
          menuCode: 'student_course_plaza'
        },
        {
          label: t('layout.nav.aiCreationSpace'),
          href: '#',
          menuCode: 'student_ai_creation_space',
          children: [
            {
              label: t('layout.nav.aiMainCourse'),
              href: '/student/digital-textbook',
              activeHref: '/student/digital-textbook',
              menuCode: 'student_digital_textbook'
            },
            {
              label: t('layout.nav.aiDigitalCourse'),
              href: zhiqueUrl,
              external: true,
              menuCode: 'student_zhique'
            },
            {
              label: t('layout.nav.aiAgentCreation'),
              href: zhihuiSpaceUrl,
              external: true,
              menuCode: 'student_ai_agent_creation'
            }
          ]
        },
        {
          label: t('layout.nav.agents'),
          href: '/student/agents',
          activeHref: '/student/agents',
          menuCode: 'student_agent_plaza'
        }
      ] as StudentNavItem[],
    [t, zhiqueUrl, zhihuiSpaceUrl]
  );
  const visibleNavItems = useMemo(
    () =>
      navItems.reduce((acc, item) => {
        const itemCodes = item.menuCode
          ? Array.isArray(item.menuCode)
            ? item.menuCode
            : [item.menuCode]
          : null;
        const itemHasPermission =
          !itemCodes || itemCodes.some((menuCode) => menuCodeSet.has(menuCode));

        if (item.children) {
          const visibleChildren = item.children.filter((child) => {
            if (!child.menuCode) return true;
            const childCodes = Array.isArray(child.menuCode) ? child.menuCode : [child.menuCode];
            return childCodes.some((menuCode) => menuCodeSet.has(menuCode));
          });
          if (itemHasPermission && visibleChildren.length > 0) {
            acc.push({ ...item, children: visibleChildren });
          }
        } else if (itemHasPermission) {
          acc.push(item);
        }
        return acc;
      }, [] as StudentNavItem[]),
    [menuCodeSet, navItems]
  );

  useEffect(() => {
    visibleNavItems.forEach((item) => {
      if (item.children) {
        item.children.forEach((child) => {
          if (!child.external) {
            router.prefetch(child.href);
          }
        });
      } else if (!item.external) {
        router.prefetch(item.href);
      }
    });
    router.prefetch('/student/profile');
    router.prefetch('/student/notice');
  }, [router, visibleNavItems]);

  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname]);

  const startPageLoading = useCallback(() => {
    setIsPageLoading(true);
  }, []);

  const handleInternalLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        href === pathname
      ) {
        return;
      }

      startPageLoading();
    },
    [pathname, startPageLoading]
  );

  const handleLogout = useCallback(() => {
    // 先清除学生端专属缓存（zustand store、token、对话记录等）
    clearStudentAuth();
    // 延迟执行，让菜单关闭动画先完成
    setTimeout(() => {
      logout();
    }, 100);
  }, [logout]);

  const handleToggleLocale = useCallback(() => {
    changeLocale(locale === 'zh-CN' ? 'en' : 'zh-CN');
  }, [changeLocale, locale]);

  const { iframeState } = useGlobalIframe();

  const userName = useMemo(() => user?.name || t('layout.demoStudent'), [t, user?.name]);
  const userAvatar = useMemo(
    () => studentUserInfo?.avatar || user?.avatar,
    [studentUserInfo?.avatar, user?.avatar]
  );
  const userAccount = useMemo(
    () =>
      t('layout.account', {
        value: user?.account || 'student-demo'
      }),
    [t, user?.account]
  );
  const roleBadges = useMemo(() => [t('layout.userRole')], [t]);
  const roleSwitchItems = useMemo(() => {
    const items = [
        {
          key: 'student',
          label: t('layout.studentPortal'),
          icon: StudentIcon,
          isCurrent: true
        }
      ];
    if (user?.teacherId) {
      items.push({
        key: 'teacher',
        label: t('layout.teacherPortal'),
        icon: UserIcon,
        isCurrent: false
      });
    }
    if (user?.roleIds?.length) {
      items.push({
        key: 'admin',
        label: t('layout.adminPortal'),
        icon: SchoolIcon,
        isCurrent: false
      });
    }
    return items;
  }, [t, user?.roleIds?.length, user?.teacherId]);
  const actionItems = useMemo(
    () =>
      [
        {
          key: 'profile',
          label: t('layout.profile'),
          icon: UserIcon,
          isCurrent: pathname === '/student/profile',
          onClick: () => {
            if (pathname === '/student/profile') return;
            startPageLoading();
            router.push('/student/profile');
          }
        }
      ] as const,
    [pathname, router, startPageLoading, t]
  );

  const handleSwitchRole = useCallback(
    (role: 'student' | 'teacher' | 'admin') => {
      if (role === 'student') return;
      startPageLoading();
      selectRole(role);
    },
    [selectRole, startPageLoading]
  );

  const isNavActive = (href: string) => {
    if (href === '/student/home') {
      return pathname === '/student/home';
    }

    return pathname === href;
  };

  return (
    <Box minH="100vh" bg={isStudentHome ? STUDENT_HOME_BG : 'gray.50'}>
      <Box
        bg="white"
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="0 1px 12px 0 rgba(0, 0, 0, 0.05)"
      >
        <Box maxW={HEADER_MAX_WIDTH} mx="auto" px={{ base: 4, md: 6 }}>
          <Flex h="64px" align="center" justify="space-between" gap={4}>
            <Flex align="center" gap={{ base: 4, md: 8 }} flex="1" minW={0}>
              <Link
                as={NextLink}
                href="/student/home"
                prefetch
                onClick={(event) => handleInternalLinkClick(event, '/student/home')}
                _hover={{ textDecoration: 'none' }}
                display="flex"
                alignItems="center"
                gap="0.85em"
                flexShrink={0}
              >
                <img src={tenantLogo || '/images/logo.svg'} width={32} height={32} alt="Logo" />
                <Text fontSize="lg" fontWeight="semibold" color="gray.800" whiteSpace="nowrap">
                  {tenantName || t('layout.brandTitle')}
                </Text>
              </Link>

              <HStack
                as="nav"
                spacing={{ base: 3, md: 6 }}
                flex="1"
                minW={0}
                overflowX="auto"
                sx={{
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }}
              >
                {visibleNavItems.map((item, index) => {
                  const hasChildren = item.children && item.children.length > 0;

                  // 分组菜单：有子项时检查任一子项是否激活
                  const isGroupActive = hasChildren
                    ? item.children!.some((child) => {
                        if (!child.activeHref && !child.external) return false;
                        const checkHref = child.activeHref || child.href;
                        return isNavActive(checkHref);
                      })
                    : false;

                  const isActive = !hasChildren && !item.external && isNavActive(item.href);

                  // 普通菜单项的 link content
                  const flatLinkContent = (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flexShrink={0}
                      px={1}
                      py={5}
                      borderBottom="2px solid"
                      borderColor={isActive ? HEADER_ACCENT : 'transparent'}
                      color={isActive ? HEADER_ACCENT : '#333333'}
                      fontFamily="PingFang SC"
                      fontSize="16px"
                      fontStyle="normal"
                      fontWeight={isActive ? 500 : 400}
                      lineHeight="22px"
                      transition="color 0.2s ease, border-color 0.2s ease"
                      _hover={{ color: HEADER_ACCENT, textDecoration: 'none' }}
                    >
                      {item.label}
                    </Box>
                  );

                  // 分组菜单的 trigger 内容
                  const groupLinkContent = (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flexShrink={0}
                      px={1}
                      py={5}
                      borderBottom="2px solid"
                      borderColor={isGroupActive ? HEADER_ACCENT : 'transparent'}
                      color={isGroupActive ? HEADER_ACCENT : '#333333'}
                      fontFamily="PingFang SC"
                      fontSize="16px"
                      fontStyle="normal"
                      fontWeight={isGroupActive ? 500 : 400}
                      lineHeight="22px"
                      transition="color 0.2s ease, border-color 0.2s ease"
                      _hover={{ color: HEADER_ACCENT, textDecoration: 'none' }}
                    >
                      {item.label}
                      <ChevronDownIcon
                        transition="transform 0.2s ease"
                        transform={openDropdownIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'}
                      />
                    </Box>
                  );

                  const itemKey = `${item.label}-${Array.isArray(item.menuCode) ? item.menuCode[0] : item.menuCode}`;

                  // 渲染分组菜单（有 children）
                  if (hasChildren) {
                    const firstVisibleChild = item.children![0];
                    const handleGroupClick = () => {
                      if (firstVisibleChild) {
                        if (firstVisibleChild.external) {
                          if (firstVisibleChild.href && firstVisibleChild.href !== '#') {
                            window.open(firstVisibleChild.href, '_blank');
                          }
                        } else {
                          if (firstVisibleChild.href !== pathname) {
                            router.push(firstVisibleChild.href);
                            startPageLoading();
                          }
                        }
                      }
                    };

                    return (
                      <Box
                        key={itemKey}
                        onMouseEnter={() => setOpenDropdownIndex(index)}
                        onMouseLeave={() => setOpenDropdownIndex(null)}
                      >
                        <Menu
                          isOpen={openDropdownIndex === index}
                          placement="bottom-start"
                          gutter={0}
                        >
                          <MenuButton
                            as={Box}
                            cursor="pointer"
                            _focus={{ outline: 'none' }}
                            onClick={handleGroupClick}
                          >
                            {groupLinkContent}
                          </MenuButton>
                          <MenuList
                            mt={0}
                            minW="160px"
                            boxShadow="0 4px 20px 0 rgba(0, 0, 0, 0.12)"
                            borderRadius="8px"
                            border="none"
                            py={1}
                            onMouseEnter={() => setOpenDropdownIndex(index)}
                            onMouseLeave={() => setOpenDropdownIndex(null)}
                          >
                            {item.children!.map((child) => {
                              const isChildActive = child.activeHref
                                ? isNavActive(child.activeHref)
                                : !child.external && isNavActive(child.href);
                              return (
                                <MenuItem
                                  key={`${child.label}-${Array.isArray(child.menuCode) ? child.menuCode[0] : child.menuCode}`}
                                  onClick={() => {
                                    if (child.href === '#') return;
                                    if (child.external) {
                                      if (child.href && child.href !== '#') {
                                        window.open(child.href, '_blank');
                                      }
                                    } else {
                                      if (child.href !== pathname) {
                                        router.push(child.href);
                                        startPageLoading();
                                      }
                                    }
                                  }}
                                  cursor={child.href === '#' ? 'not-allowed' : 'pointer'}
                                  color={
                                    child.href === '#'
                                      ? 'gray.400'
                                      : isChildActive
                                        ? HEADER_ACCENT
                                        : '#333333'
                                  }
                                  fontFamily="PingFang SC"
                                  fontSize="14px"
                                  fontWeight={isChildActive ? 600 : 400}
                                  lineHeight="22px"
                                  px={4}
                                  py={2.5}
                                  _hover={{ bg: HEADER_ACCENT_BG, color: HEADER_ACCENT }}
                                  bg={isChildActive ? HEADER_ACCENT_BG : 'white'}
                                >
                                  {child.label}
                                </MenuItem>
                              );
                            })}
                          </MenuList>
                        </Menu>
                      </Box>
                    );
                  }

                  // 渲染普通菜单项
                  return (
                    <Box
                      key={itemKey}
                      cursor={item.href === '#' ? 'not-allowed' : 'pointer'}
                      onClick={() => {
                        if (item.external) {
                          if (item.href && item.href !== '#') {
                            window.open(item.href, '_blank');
                          }
                        } else {
                          if (item.href !== pathname) {
                            router.push(item.href);
                            startPageLoading();
                          }
                        }
                      }}
                    >
                      {flatLinkContent}
                    </Box>
                  );
                })}
              </HStack>
            </Flex>

            <HStack spacing={3} flexShrink={0}>
              <Box
                as="button"
                type="button"
                position="relative"
                p={2}
                rounded="full"
                color="gray.600"
                transition="background-color 0.2s ease, color 0.2s ease"
                _hover={{ bg: 'gray.100', color: HEADER_ACCENT }}
                aria-label={t('layout.notificationButton')}
                onClick={() => {
                  if (pathname === '/student/notice') return;
                  router.push('/student/notice');
                  startPageLoading();
                }}
              >
                <BellIcon width="20px" height="20px" />
                {unreadCount > 0 && (
                  <Box
                    as="span"
                    position="absolute"
                    top="2px"
                    right={unreadBadgeText.length > 1 ? '-2px' : '4px'}
                    minW="18px"
                    h="18px"
                    px={unreadBadgeText.length > 1 ? 1 : 0}
                    borderRadius="full"
                    bg={HEADER_ACCENT}
                    color="white"
                    fontSize="10px"
                    fontWeight="bold"
                    lineHeight="18px"
                    textAlign="center"
                    boxShadow="0 0 0 2px white"
                  >
                    {unreadBadgeText}
                  </Box>
                )}
              </Box>

              <HeaderUserMenu
                accentColor={HEADER_ACCENT}
                accentSoftBg={HEADER_ACCENT_BG}
                userName={userName}
                userRoleLabel={t('layout.userRole')}
                userAccount={userAccount}
                roleBadges={roleBadges}
                roleSwitchLabel={t('layout.roleSwitchLabel')}
                roleSwitchItems={roleSwitchItems.map((item) => ({
                  key: item.key,
                  label: item.label,
                  icon: <item.icon width="18px" height="18px" />,
                  isCurrent: item.isCurrent,
                  onClick: item.isCurrent
                    ? undefined
                    : () => handleSwitchRole(item.key as 'student' | 'teacher' | 'admin')
                }))}
                actionItems={actionItems.map((item) => ({
                  key: item.key,
                  label: item.label,
                  icon: <item.icon width="18px" height="18px" />,
                  isCurrent: item.isCurrent,
                  onClick: item.onClick
                }))}
                logoutLabel={t('layout.logout')}
                onLogout={handleLogout}
                avatarUrl={userAvatar}
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
        </Box>
      </Box>

      <Box position="relative" maxW={HEADER_MAX_WIDTH} mx="auto" px={{ base: 4, md: 6 }} py={8}>
        {isPageLoading && user ? (
          <Box>
            <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
              <Box flex="1">
                <Skeleton height="32px" width={{ base: '60%', md: '240px' }} rounded="md" />
                <SkeletonText mt={4} noOfLines={2} spacing={3} skeletonHeight={4} width="70%" />
              </Box>
              <HStack spacing={3} alignSelf={{ base: 'flex-start', md: 'center' }}>
                <Skeleton height="36px" width="96px" rounded="full" />
                <Skeleton height="36px" width="120px" rounded="full" />
              </HStack>
            </Flex>

            <Flex mt={8} direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch">
              <Box flex="1">
                <Skeleton height="220px" rounded="2xl" />
                <SkeletonText mt={5} noOfLines={4} spacing={4} skeletonHeight={4} />
              </Box>

              <Box w={{ base: 'full', lg: '320px' }}>
                <Box border="1px solid" borderColor="gray.100" rounded="2xl" p={5} bg="white">
                  <HStack spacing={3} mb={5}>
                    <SkeletonCircle size="12" />
                    <Box flex="1">
                      <Skeleton height="18px" width="60%" rounded="md" />
                      <Skeleton height="14px" width="40%" rounded="md" mt={2} />
                    </Box>
                  </HStack>
                  <SkeletonText noOfLines={5} spacing={3} skeletonHeight={3} />
                </Box>
              </Box>
            </Flex>

            <Text mt={6} fontSize="sm" fontWeight="medium" color="gray.500">
              {t('common.loading')}
            </Text>
          </Box>
        ) : null}
        <Box
          display={isPageLoading && user ? 'none' : 'block'}
          aria-hidden={isPageLoading && !!user}
        >
          {children}
        </Box>
      </Box>

      <Box
        position="fixed"
        top="64px"
        left={0}
        w="100vw"
        h="calc(100vh - 64px)"
        zIndex={1}
        display={iframeState.visible ? 'block' : 'none'}
        pointerEvents={iframeState.visible ? 'auto' : 'none'}
      >
        <iframe
          src={iframeState.src}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="digital-textbook"
        />
      </Box>
    </Box>
  );
}
