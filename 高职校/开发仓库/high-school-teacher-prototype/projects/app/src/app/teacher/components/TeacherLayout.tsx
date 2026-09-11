'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import NextLink from 'next/link';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text
} from '@chakra-ui/react';
import HeaderUserMenu from '@/app/components/ui/HeaderUserMenu';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CourseIcon, LogOutIcon, ShieldIcon, StudentIcon, UserIcon } from './Icons';
import { useAuth } from '@/app/components/auth';
import { teacherLocales, type TeacherLocale, useTeacherI18n } from './TeacherI18nProvider';
import { useZhiqueRedirectUrl, useZhihuiSpaceRedirectUrl } from '@/teacher/hooks/tenant';
import { getTenantDetail } from '@/api/admin/teaching/tenant';
import { useGlobalIframe } from '@/app/components/GlobalIframeContext';

type TeacherSubjectTranslationKey = 'subjects.math' | 'subjects.headTeacher';

type TeacherNavItem = {
  key: string;
  label: string;
  href: string;
  activeHref: string;
  menuCode?: string | string[];
  external?: boolean;
  children?: TeacherNavItem[];
};

type TeacherRoleSwitchItem = {
  key: 'teacher' | 'student' | 'admin';
  label: string;
  icon: typeof CourseIcon | typeof StudentIcon | typeof ShieldIcon;
  href: string;
  isCurrent: boolean;
};

const subjectLabelMap: Record<string, TeacherSubjectTranslationKey> = {
  math: 'subjects.math',
  数学教师: 'subjects.math',
  'Math Teacher': 'subjects.math',
  headTeacher: 'subjects.headTeacher',
  班主任: 'subjects.headTeacher',
  'Homeroom Teacher': 'subjects.headTeacher'
};

const localeDisplayMap: Record<TeacherLocale, string> = {
  'zh-CN': '简体中文',
  en: 'EN',
  'zh-Hant': '繁體中文'
};

const HEADER_ACCENT = '#C8000B';
const HEADER_ACCENT_LIGHT = '#C8000B';
const HEADER_ACCENT_BG = '#FFF1F0';
const HEADER_MAX_WIDTH = '1200px';
const TEACHER_PLATFORM_TITLE = 'AI教育新范式智慧教育平台';

export function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWorkbuddyWorkspace =
    pathname === '/teacher' || Boolean(pathname?.startsWith('/teacher/workspace'));
  const router = useRouter();
  const { user, logout, selectRole } = useAuth();
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTenantBrand = async () => {
      try {
        const data = await getTenantDetail();
        if (!active) return;
        setTenantLogo(
          data.avatarUrl || data.avatar || data.fullNameImgUrl || data.fullNameImg || null
        );
      } catch {
        // fallback to default logo
      }
    };
    void fetchTenantBrand();
    return () => {
      active = false;
    };
  }, []);
  const { t } = useTranslation('teacher');
  const { locale, changeLocale } = useTeacherI18n();
  const userSubject = (user as { subject?: string } | null)?.subject;
  const hasMenuCodes = Boolean(user?.menuCodes?.length);
  const menuCodeSet = useMemo(() => new Set(user?.menuCodes || []), [user?.menuCodes]);

  // 获取知雀与智慧空间跳转链接
  const hasZhiquePermission = menuCodeSet.has('teacher_zhique');
  const hasZhihuiSpacePermission = menuCodeSet.has('teacher_zhihui_space');
  const { getRedirectUrl: getZhiqueUrl, redirectUrl: zhiqueBaseUrl } = useZhiqueRedirectUrl();
  const { getRedirectUrl: getZhihuiSpaceUrl, redirectUrl: zhihuiSpaceBaseUrl } =
    useZhihuiSpaceRedirectUrl();

  useEffect(() => {
    if (hasZhiquePermission) {
      getZhiqueUrl();
    }
  }, [getZhiqueUrl, hasZhiquePermission]);

  useEffect(() => {
    if (hasZhihuiSpacePermission) {
      getZhihuiSpaceUrl();
    }
  }, [getZhihuiSpaceUrl, hasZhihuiSpacePermission]);

  // 在获取到的链接后面拼接 state 参数（JSON 对象 encodeURIComponent 编码）
  const zhiqueUrl = useMemo(() => {
    if (typeof zhiqueBaseUrl !== 'string' || !zhiqueBaseUrl) return '#';
    const stateObj = { redirect: '/home' };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const separator = zhiqueBaseUrl.includes('?') ? '&' : '?';
    return `${zhiqueBaseUrl}${separator}state=${state}`;
  }, [zhiqueBaseUrl]);

  const zhihuiSpaceUrl = useMemo(() => {
    if (typeof zhihuiSpaceBaseUrl !== 'string' || !zhihuiSpaceBaseUrl) return '#';
    const stateObj = { redirect: '/home' };
    const state = encodeURIComponent(JSON.stringify(stateObj));
    const separator = zhihuiSpaceBaseUrl.includes('?') ? '&' : '?';
    return `${zhihuiSpaceBaseUrl}${separator}state=${state}`;
  }, [zhihuiSpaceBaseUrl]);

  const hasMenuAccess = useCallback(
    (menuCode?: string | string[]) => {
      if (!hasMenuCodes) return true;
      if (!menuCode) return true;
      const menuCodes = Array.isArray(menuCode) ? menuCode : [menuCode];
      return menuCodes.some((code) => menuCodeSet.has(code));
    },
    [hasMenuCodes, menuCodeSet]
  );

  const navItems = useMemo<TeacherNavItem[]>(
    () => [
      {
        key: 'home',
        label: t('nav.home'),
        href: '/teacher',
        activeHref: '/teacher'
      },
      {
        key: 'lessonPrep',
        label: t('nav.lessonPrep'),
        href: '/teacher/digital-textbook',
        activeHref: '/teacher/digital-textbook',
        menuCode: ['teacher_digital_textbook', 'teacher_zhique'],
        children: [
          {
            key: 'digitalTextbook',
            label: t('nav.digitalTextbook'),
            href: '/teacher/digital-textbook',
            activeHref: '/teacher/digital-textbook',
            menuCode: 'teacher_digital_textbook'
          },
          {
            key: 'zhique',
            label: t('nav.zhique'),
            href: zhiqueUrl || '#',
            activeHref: '/teacher/chat',
            menuCode: 'teacher_zhique',
            external: true
          },
          {
            key: 'aiVideoCourse',
            label: t('nav.aiVideoCourse'),
            href: '/teacher/ai-video',
            activeHref: '/teacher/ai-video'
          }
        ]
      },
      {
        key: 'dashboard',
        label: t('nav.dashboard'),
        href: '/teacher/ai-teacher',
        activeHref: '/teacher/ai-teacher',
        menuCode: ['teacher_ai_teacher']
      },
      {
        key: 'resourcePlaza',
        label: t('nav.resourcePlaza'),
        href: '/teacher/resource-plaza',
        activeHref: '/teacher/resource-plaza'
      },
      {
        key: 'zhihuiSpace',
        label: t('nav.zhihuiSpace'),
        href: zhihuiSpaceUrl || '#',
        activeHref: '/teacher/zhihui-space',
        menuCode: 'teacher_zhihui_space',
        external: true
      },
      {
        key: 'agentPlaza',
        label: t('nav.agentPlaza'),
        href: '/teacher/agent-plaza',
        activeHref: '/teacher/agent-plaza',
        menuCode: 'teacher_agent_plaza'
      }
    ],
    [t, zhiqueUrl, zhihuiSpaceUrl]
  );
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => hasMenuAccess(item.menuCode)),
    [hasMenuAccess, navItems]
  );

  const subjectLabel = useMemo(() => {
    const subjectTranslationKey = userSubject ? subjectLabelMap[userSubject] : undefined;

    return subjectTranslationKey
      ? t(subjectTranslationKey)
      : userSubject || t('subjects.headTeacher');
  }, [t, userSubject]);

  const { iframeState } = useGlobalIframe();
  const iframeLoadCount = useRef(0);

  useEffect(() => {
    if (!iframeState.visible) return;
    const timer = setInterval(() => {
      console.log(
        '[TeacherLayout iframe monitor] visible=' +
          iframeState.visible +
          ', src=' +
          iframeState.src.slice(0, 60) +
          '...' +
          ', loadCount=' +
          iframeLoadCount.current
      );
    }, 3000);
    return () => clearInterval(timer);
  }, [iframeState.visible, iframeState.src]);

  const userName = useMemo(() => user?.name || '', [user?.name]);
  const userAccount = useMemo(
    () =>
      t('layout.account', {
        value: user?.account || ''
      }),
    [t, user?.account]
  );
  const roleBadges = useMemo(
    () => Array.from(new Set([t('layout.userRole'), subjectLabel])),
    [subjectLabel, t]
  );
  const actionItems = useMemo(
    () => [
      {
        key: 'profile',
        label: t('layout.profileCenter'),
        icon: <UserIcon width="18px" height="18px" />,
        isCurrent: pathname === '/teacher/profile',
        onClick: () => router.push('/teacher/profile')
      }
    ],
    [pathname, router, t]
  );
  const roleSwitchItems = useMemo(() => {
    const items: TeacherRoleSwitchItem[] = [
      {
        key: 'teacher',
        label: t('layout.teacherPortal'),
        icon: CourseIcon,
        href: '/teacher',
        isCurrent: true
      }
    ];
    if (user?.studentId) {
      items.push({
        key: 'student',
        label: t('layout.studentPortal'),
        icon: StudentIcon,
        href: '/student/home',
        isCurrent: false
      });
    }
    if (user?.roleIds?.length) {
      items.push({
        key: 'admin',
        label: t('layout.adminPortal'),
        icon: ShieldIcon,
        href: '/admin',
        isCurrent: false
      });
    }
    return items;
  }, [t, user?.roleIds?.length, user?.studentId]);

  useEffect(() => {
    visibleNavItems.forEach((item) => {
      if (!item.external) {
        router.prefetch(item.href);
      }
      item.children?.forEach((child) => {
        if (!child.external) {
          router.prefetch(child.href);
        }
      });
    });
    if (user?.studentId) {
      router.prefetch('/student/home');
    }
    if (user?.roleIds?.length) {
      router.prefetch('/admin');
    }
  }, [visibleNavItems, router, user?.roleIds?.length, user?.studentId]);

  const handleLogout = useCallback(() => {
    // 延迟执行，让菜单关闭动画先完成
    setTimeout(() => {
      logout();
    }, 100);
  }, [logout]);

  const handleSwitchRole = useCallback(
    (role: TeacherRoleSwitchItem['key']) => {
      selectRole(role);
    },
    [selectRole]
  );

  return (
    <Box minH="100vh" bg="gray.50">
      <Box
        bg="white"
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="0 1px 12px 0 rgba(0, 0, 0, 0.05)"
      >
        <Box maxW={HEADER_MAX_WIDTH} mx="auto" px={{ base: 3, xl: 0 }}>
          <Flex h="64px" align="center" justify="space-between" gap={4}>
            <Flex align="center" gap={{ base: 4, md: 8 }} flex="1" minW={0}>
              <Link
                as={NextLink}
                href="/teacher"
                prefetch
                _hover={{ textDecoration: 'none' }}
                display="flex"
                alignItems="center"
                gap="0.85em"
                flexShrink={0}
              >
                <img src={tenantLogo || '/images/logo.svg'} width={32} height={32} alt="Logo" />
                <Text
                  display="block"
                  fontSize={{ base: '14px', md: '16px', lg: '18px' }}
                  fontWeight="semibold"
                  color="gray.800"
                  whiteSpace="nowrap"
                >
                  {TEACHER_PLATFORM_TITLE}
                </Text>
              </Link>

              <HStack
                as="nav"
                display={{ base: 'none', md: 'flex' }}
                spacing={{ md: 3, xl: 5 }}
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
                {visibleNavItems.map((item) => {
                  // 下拉菜单项：检查子项是否有匹配
                  const isChildActive =
                    item.children?.some(
                      (child) =>
                        pathname === child.activeHref ||
                        (child.activeHref !== '/teacher' &&
                          pathname?.startsWith(`${child.activeHref}/`))
                    ) ?? false;

                  const isActive =
                    isChildActive ||
                    pathname === item.activeHref ||
                    (item.activeHref !== '/teacher' && pathname?.startsWith(`${item.activeHref}/`));

                  // 下拉菜单渲染
                  if (item.children?.length) {
                    const visibleChildren = item.children.filter((child) =>
                      hasMenuAccess(child.menuCode)
                    );

                    // 无可见子项时降级为普通链接
                    if (visibleChildren.length === 0) {
                      return (
                        <Link
                          key={item.key}
                          as={NextLink}
                          href={item.href}
                          prefetch
                          flexShrink={0}
                          _hover={{ textDecoration: 'none' }}
                        >
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
                            fontSize={{ md: '14px', xl: '16px' }}
                            fontWeight={isActive ? 500 : 400}
                            lineHeight="22px"
                            transition="color 0.2s ease, border-color 0.2s ease"
                            _hover={{ color: HEADER_ACCENT, textDecoration: 'none' }}
                          >
                            {item.label}
                          </Box>
                        </Link>
                      );
                    }

                    return (
                      <Popover key={item.key} trigger="hover" placement="bottom" isLazy>
                        {({ isOpen }) => (
                          <>
                            <PopoverTrigger>
                              <Link
                                as={NextLink}
                                href={item.href}
                                prefetch
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexShrink={0}
                                px={1}
                                py={5}
                                borderBottom="2px solid"
                                borderColor={isActive ? HEADER_ACCENT : 'transparent'}
                                color={isActive ? HEADER_ACCENT : '#333333'}
                                fontFamily="PingFang SC"
                                fontSize={{ md: '14px', xl: '16px' }}
                                fontWeight={isActive ? 500 : 400}
                                lineHeight="22px"
                                transition="color 0.2s ease, border-color 0.2s ease"
                                _hover={{ textDecoration: 'none', color: HEADER_ACCENT }}
                              >
                                {item.label}
                                <ChevronDownIcon
                                  boxSize={4}
                                  transform={isOpen ? 'rotate(180deg)' : undefined}
                                  transition="transform 0.2s ease"
                                />
                              </Link>
                            </PopoverTrigger>

                            <PopoverContent
                              w="auto"
                              minW="120px"
                              mt={-2}
                              py={1}
                              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
                              border="none"
                              rounded="10px"
                            >
                              <PopoverBody p={0}>
                                {visibleChildren.map((child) => {
                                  const childActive =
                                    pathname === child.activeHref ||
                                    (child.activeHref !== '/teacher' &&
                                      pathname?.startsWith(`${child.activeHref}/`));

                                  if (child.external) {
                                    return (
                                      <Box
                                        key={child.key}
                                        px={4}
                                        py={2.5}
                                        mx={1}
                                        rounded="10px"
                                        cursor="pointer"
                                        color={childActive ? HEADER_ACCENT : '#333333'}
                                        fontSize="14px"
                                        _hover={{ bg: HEADER_ACCENT_BG, color: HEADER_ACCENT }}
                                        onClick={() => {
                                          if (child.href && child.href !== '#') {
                                            window.open(child.href, '_blank');
                                          }
                                        }}
                                      >
                                        {child.label}
                                      </Box>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={child.key}
                                      as={NextLink}
                                      href={child.href}
                                      prefetch
                                      display="block"
                                      px={4}
                                      py={2.5}
                                      mx={1}
                                      rounded="10px"
                                      color={childActive ? HEADER_ACCENT : '#333333'}
                                      fontSize="14px"
                                      _hover={{
                                        textDecoration: 'none',
                                        bg: HEADER_ACCENT_BG,
                                        color: HEADER_ACCENT
                                      }}
                                    >
                                      {child.label}
                                    </Link>
                                  );
                                })}
                              </PopoverBody>
                            </PopoverContent>
                          </>
                        )}
                      </Popover>
                    );
                  }

                  // 普通导航项渲染
                  const navContent = (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flexShrink={0}
                      whiteSpace="nowrap"
                      px={1}
                      py={5}
                      borderBottom="2px solid"
                      borderColor={isActive ? HEADER_ACCENT : 'transparent'}
                      color={isActive ? HEADER_ACCENT : '#333333'}
                      fontFamily="PingFang SC"
                      fontSize={{ md: '14px', xl: '16px' }}
                      fontStyle="normal"
                      fontWeight={isActive ? 500 : 400}
                      lineHeight="22px"
                      transition="color 0.2s ease, border-color 0.2s ease"
                      _hover={{ color: HEADER_ACCENT, textDecoration: 'none' }}
                    >
                      {item.label}
                    </Box>
                  );

                  return item.external ? (
                    <Box
                      key={item.key}
                      flexShrink={0}
                      cursor={item.href === '#' ? 'not-allowed' : 'pointer'}
                      onClick={() => {
                        if (item.href && item.href !== '#') {
                          window.open(item.href, '_blank');
                        }
                      }}
                    >
                      {navContent}
                    </Box>
                  ) : (
                    <Link
                      key={item.key}
                      as={NextLink}
                      href={item.href}
                      prefetch
                      flexShrink={0}
                      _hover={{ textDecoration: 'none' }}
                    >
                      {navContent}
                    </Link>
                  );
                })}
              </HStack>
            </Flex>

            <HStack spacing={3} flexShrink={0}>
              <HeaderUserMenu
                accentColor={HEADER_ACCENT}
                accentSoftBg={HEADER_ACCENT_BG}
                userName={userName}
                userRoleLabel={t('layout.userRole')}
                userAccount={userAccount}
                roleBadges={roleBadges}
                actionItems={actionItems}
                roleSwitchLabel={t('layout.roleSwitchLabel')}
                roleSwitchItems={roleSwitchItems.map((item) => ({
                  key: item.key,
                  label: item.label,
                  icon: <item.icon width="18px" height="18px" />,
                  isCurrent: item.isCurrent,
                  onClick: item.isCurrent ? undefined : () => handleSwitchRole(item.key)
                }))}
                logoutLabel={t('layout.logout')}
                onLogout={handleLogout}
                avatarUrl={user?.avatar}
                avatar={<UserIcon width="16px" height="16px" />}
                logoutIcon={<LogOutIcon width="18px" height="18px" />}
              />

              <Menu placement="bottom-end">
                <MenuButton
                  aria-label="切换语言"
                  borderRadius="16px"
                  bg="#F2F3F5"
                  px={{ base: 2, md: '15px' }}
                  py="6px"
                  color="#333333"
                  fontSize="16px"
                  fontWeight={400}
                  cursor="pointer"
                  flexShrink={0}
                  _hover={{ bg: '#E5E6EB' }}
                  _active={{ bg: '#D9DADD' }}
                >
                  <Flex align="center" gap="4px">
                    <Text display={{ base: 'none', md: 'block' }} whiteSpace="nowrap">
                      {localeDisplayMap[locale]}
                    </Text>
                    <ChevronDownIcon boxSize={4} />
                  </Flex>
                </MenuButton>
                <MenuList minW="140px">
                  {teacherLocales.map((loc) => (
                    <MenuItem
                      key={loc}
                      onClick={() => changeLocale(loc)}
                      color={locale === loc ? '#C83E3E' : undefined}
                      fontWeight={locale === loc ? 600 : 400}
                    >
                      {localeDisplayMap[loc]}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Box>

        <HStack
          as="nav"
          aria-label="教师端快捷导航"
          display={{ base: 'flex', md: 'none' }}
          spacing={1}
          px={3}
          h="44px"
          overflowX="auto"
          borderTop="1px solid"
          borderColor="#F2F4F7"
          sx={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.activeHref ||
              (item.activeHref !== '/teacher' && pathname?.startsWith(`${item.activeHref}/`));

            if (item.external) {
              return (
                <Box
                  key={item.key}
                  as="button"
                  type="button"
                  flexShrink={0}
                  px={3}
                  py={2}
                  borderRadius="8px"
                  color={isActive ? HEADER_ACCENT : '#475467'}
                  bg={isActive ? HEADER_ACCENT_BG : 'transparent'}
                  fontSize="14px"
                  fontWeight={isActive ? 600 : 400}
                  whiteSpace="nowrap"
                  _hover={{ color: HEADER_ACCENT, bg: HEADER_ACCENT_BG }}
                  _focusVisible={{ boxShadow: `0 0 0 2px ${HEADER_ACCENT}` }}
                  onClick={() => {
                    if (item.href && item.href !== '#') window.open(item.href, '_blank');
                  }}
                >
                  {item.label}
                </Box>
              );
            }

            return (
              <Link
                key={item.key}
                as={NextLink}
                href={item.href}
                prefetch
                flexShrink={0}
                px={3}
                py={2}
                borderRadius="8px"
                color={isActive ? HEADER_ACCENT : '#475467'}
                bg={isActive ? HEADER_ACCENT_BG : 'transparent'}
                fontSize="14px"
                fontWeight={isActive ? 600 : 400}
                whiteSpace="nowrap"
                _hover={{ color: HEADER_ACCENT, bg: HEADER_ACCENT_BG, textDecoration: 'none' }}
                _focusVisible={{ boxShadow: `0 0 0 2px ${HEADER_ACCENT}` }}
              >
                {item.label}
              </Link>
            );
          })}
        </HStack>
      </Box>

      <Box
        minH="calc(100vh - 64px)"
        bg={isWorkbuddyWorkspace ? '#FAFBFC' : undefined}
        backgroundImage={
          isWorkbuddyWorkspace
            ? 'radial-gradient(circle, #E2E8F0 1px, transparent 1px)'
            : "url('/images/teacher-bg.svg')"
        }
        backgroundSize={isWorkbuddyWorkspace ? '24px 24px' : 'cover'}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      >
        <Box
          maxW={isWorkbuddyWorkspace ? '100%' : HEADER_MAX_WIDTH}
          mx="auto"
          py={isWorkbuddyWorkspace ? 0 : 8}
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
          onLoad={() => {
            iframeLoadCount.current += 1;
            console.log(
              '[TeacherLayout iframe onLoad] iframe 重新加载了! loadCount=' +
                iframeLoadCount.current
            );
          }}
        />
      </Box>
    </Box>
  );
}
