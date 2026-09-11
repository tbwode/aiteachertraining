'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Collapse,
  Flex,
  HStack,
  Image,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  SkeletonText,
  Stack,
  Text
} from '@chakra-ui/react';
import HeaderUserMenu from '@/app/components/ui/HeaderUserMenu';
import SvgIcon from '@/app/components/ui/SvgIcon';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AdminIcon } from './AdminIcon';
import { useAuth } from '@/app/components/auth';
import { adminLocales, type AdminLocale, useAdminI18n, useAdminPageI18n } from './AdminI18nProvider';
import { adminNavSections } from '../_config/adminConfig';
import { getTenantDetail } from '@/api/admin/teaching/tenant';
import type { TenantType } from '@/types/api/admin/teaching/tenant';

const localeDisplayMap: Record<AdminLocale, string> = {
  'zh-CN': '简体中文',
  en: 'EN',
  'zh-Hant': '繁體中文'
};

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF1F0';
const MENU_FALLBACK_ORDER = Number.MAX_SAFE_INTEGER;

const getMenuOrder = (
  menuCode: string | string[] | undefined,
  menuCodeOrderMap: Map<string, number>
) => {
  if (!menuCode) return MENU_FALLBACK_ORDER;

  const menuCodes = Array.isArray(menuCode) ? menuCode : [menuCode];
  const matchedOrders = menuCodes
    .map((code) => menuCodeOrderMap.get(code))
    .filter((order): order is number => order !== undefined);

  return matchedOrders.length > 0 ? Math.min(...matchedOrders) : MENU_FALLBACK_ORDER;
};

function AdminPageSkeleton() {
  return (
    <Stack spacing={6} flex="1">
      <Box>
        <Skeleton height="32px" width={{ base: '58%', md: '240px' }} rounded="md" />
        <SkeletonText mt={4} noOfLines={2} spacing={3} skeletonHeight={4} width="70%" />
      </Box>

      <HStack spacing={3}>
        <Skeleton height="36px" width="104px" rounded="full" />
        <Skeleton height="36px" width="128px" rounded="full" />
      </HStack>

      <Box
        rounded="24px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        p={{ base: 4, md: 6 }}
      >
        <Skeleton height="220px" rounded="2xl" />
        <SkeletonText mt={5} noOfLines={4} spacing={4} skeletonHeight={4} />
      </Box>

      <Box
        rounded="24px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        p={{ base: 4, md: 6 }}
      >
        <Skeleton height="20px" width="180px" rounded="md" />
        <Stack spacing={4} mt={5}>
          <Skeleton height="56px" rounded="xl" />
          <Skeleton height="56px" rounded="xl" />
          <Skeleton height="56px" rounded="xl" />
        </Stack>
      </Box>
    </Stack>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, selectRole } = useAuth();
  const { locale, changeLocale } = useAdminI18n();
  const { t } = useTranslation('admin');
  const isResourceI18nReady = useAdminPageI18n(
    pathname === '/admin/resource/teaching-resources' ? ['resource'] : []
  );
  const isTeachersPage = pathname === '/admin/teaching/teachers';
  const isTeachingI18nReady = useAdminPageI18n(isTeachersPage ? ['teaching'] : []);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [onlyAdmin, setOnlyAdmin] = useState(false);
  const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<string[]>([]);
  const [tenantBrand, setTenantBrand] = useState<Pick<
    TenantType,
    'fullName' | 'avatarUrl' | 'avatar' | 'fullNameImgUrl' | 'fullNameImg'
  > | null>(null);
  const looseT = t as unknown as (key: string) => string;
  const translateConfigKey = useCallback((key: string) => String(looseT(key)), [looseT]);
  const hasMenuCodes = Boolean(user?.menuCodes?.length);
  const menuCodeSet = useMemo(() => new Set(user?.menuCodes || []), [user?.menuCodes]);
  const menuCodeOrderMap = useMemo(
    () => new Map((user?.menuCodes || []).map((code, index) => [code, index])),
    [user?.menuCodes]
  );
  const hasMenuAccess = useCallback(
    (menuCode?: string | string[]) => {
      if (!hasMenuCodes) return true;
      if (!menuCode) return true;
      const menuCodes = Array.isArray(menuCode) ? menuCode : [menuCode];
      return menuCodes.some((code) => menuCodeSet.has(code));
    },
    [hasMenuCodes, menuCodeSet]
  );

  const userName = user?.name || String(t('layout.demoAdmin'));
  const userAccount = String(
    t('layout.account', {
      value: user?.account || 'admin-demo'
    })
  );
  const roleBadges = [String(t('layout.userRole'))];
  const actionItems = useMemo(
    () =>
      [
        {
          key: 'profile',
          label: String(t('layout.profileCenter')),
          href: '/admin/profile',
          isCurrent: pathname === '/admin/profile',
          icon: 'user' as const,
          menuCode: 'admin_profile'
        }
      ] as const,
    [pathname, t]
  );
  const roleSwitchItems = [
    {
      key: 'admin',
      label: String(t('layout.adminPortal')),
      href: '/admin',
      isCurrent: true,
      icon: 'shield' as const
    },
    {
      key: 'teacher',
      label: String(t('layout.teacherPortal')),
      href: '/teacher',
      isCurrent: false,
      icon: 'book-open' as const
    },
    {
      key: 'student',
      label: String(t('layout.studentPortal')),
      href: '/student/home',
      isCurrent: false,
      icon: 'graduation-cap' as const
    }
  ] as const;
  const headerTitleFallback = String(t('layout.headerTitle'));
  const userRoleLabel = String(t('layout.userRole'));
  const roleSwitchLabel = String(t('layout.roleSwitchLabel'));
  const logoutLabel = String(t('layout.logout'));
  const localeAriaLabel = String(t('languageSwitcher.ariaLabel'));
  const tenantBrandTitle = tenantBrand?.fullName || String(t('layout.brandTitle'));
  const tenantBrandLogo = tenantBrand?.fullNameImgUrl || tenantBrand?.fullNameImg || '';
  const tenantFavicon = tenantBrand?.avatarUrl || tenantBrand?.avatar || '';
  const visibleActionItems = useMemo(
    () => actionItems.filter((item) => hasMenuAccess(item.menuCode)),
    [actionItems, hasMenuAccess]
  );
  const visibleAdminNavSections = useMemo(
    () =>
      adminNavSections
        .map((section, sectionIndex) => {
          const children = section.children
            .filter((child) => hasMenuAccess(child.menuCode))
            .map((child, childIndex) => ({
              ...child,
              __order: getMenuOrder(child.menuCode, menuCodeOrderMap),
              __index: childIndex
            }))
            .sort((a, b) => {
              if (a.__order !== b.__order) return a.__order - b.__order;
              return a.__index - b.__index;
            })
            .map(({ __order: _order, __index: _index, ...child }) => child);

          const sectionOrder = Math.min(
            ...children.map((child) => getMenuOrder(child.menuCode, menuCodeOrderMap))
          );

          return {
            ...section,
            children,
            __order: sectionOrder,
            __index: sectionIndex
          };
        })
        .filter((section) => hasMenuAccess(section.menuCode))
        .filter((section) => section.children.length > 0),
    [hasMenuAccess, menuCodeOrderMap]
  );
  const orderedAdminNavSections = useMemo(
    () =>
      visibleAdminNavSections
        .sort((a, b) => {
          if (a.__order !== b.__order) return a.__order - b.__order;
          return a.__index - b.__index;
        })
        .map(({ __order: _order, __index: _index, ...section }) => section),
    [visibleAdminNavSections]
  );

  const currentPageTitle = useMemo<string>(() => {
    const matchedChild = orderedAdminNavSections
      .flatMap((section) => section.children)
      .find((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));

    return matchedChild ? translateConfigKey(matchedChild.labelKey) : headerTitleFallback;
  }, [headerTitleFallback, pathname, translateConfigKey, orderedAdminNavSections]);

  useEffect(() => {
    orderedAdminNavSections.forEach((section) => {
      section.children.forEach((child) => {
        if (!child.disabled) {
          router.prefetch(child.href);
        }
      });
    });

    visibleActionItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router, visibleActionItems, orderedAdminNavSections]);

  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname]);

  // 切换页面时重置教师管理 header 的"仅看管理员"高亮态
  useEffect(() => {
    if (!isTeachersPage) {
      setOnlyAdmin(false);
    }
  }, [isTeachersPage]);

  // 监听 TeachersPageClient 同步过来的真值，保持 header 按钮高亮态一致
  useEffect(() => {
    if (!isTeachersPage) return;

    const handleStateSync = (event: Event) => {
      const detail = (event as CustomEvent<{ value: boolean }>).detail;
      setOnlyAdmin(Boolean(detail?.value));
    };

    window.addEventListener('admin-teachers:only-admin-state', handleStateSync);
    return () => {
      window.removeEventListener('admin-teachers:only-admin-state', handleStateSync);
    };
  }, [isTeachersPage]);

  useEffect(() => {
    let active = true;

    const fetchTenantBrand = async () => {
      try {
        const data = await getTenantDetail();
        if (!active) return;

        setTenantBrand({
          fullName: data.fullName || '',
          avatar: data.avatar || '',
          avatarUrl: data.avatarUrl || data.avatar || '',
          fullNameImg: data.fullNameImg || '',
          fullNameImgUrl: data.fullNameImgUrl || data.fullNameImg || ''
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to fetch tenant detail for admin layout', error);
        }
      }
    };

    void fetchTenantBrand();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !tenantFavicon) return;

    const ensureIconLink = (rel: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }

      link.href = tenantFavicon;
    };

    ensureIconLink('icon');
    ensureIconLink('shortcut icon');
    ensureIconLink('apple-touch-icon');
  }, [tenantFavicon]);

  useEffect(() => {
    setCollapsedSectionKeys((prev) =>
      prev.filter((key) => orderedAdminNavSections.some((section) => section.key === key))
    );
  }, [orderedAdminNavSections]);

  useEffect(() => {
    const activeSectionKeys = orderedAdminNavSections
      .filter((section) =>
        section.children.some(
          (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
        )
      )
      .map((section) => section.key);

    if (activeSectionKeys.length === 0) return;

    // 路由切换后聚焦当前业务分组，避免前序长菜单把当前入口推到首屏之外。
    setCollapsedSectionKeys(
      orderedAdminNavSections
        .filter((section) => !activeSectionKeys.includes(section.key))
        .map((section) => section.key)
    );
  }, [pathname, orderedAdminNavSections]);

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

  const navigateWithLoading = useCallback(
    (href: string) => {
      if (href === pathname) return;
      startPageLoading();
      router.push(href);
    },
    [pathname, router, startPageLoading]
  );

  const handleLogout = useCallback(() => {
    // 延迟执行，让菜单关闭动画先完成
    setTimeout(() => {
      logout();
    }, 100);
  }, [logout]);

  const handleSwitchRole = useCallback(
    (href: string) => {
      if (href.startsWith('/admin')) {
        selectRole('admin');
        return;
      }
      if (href.startsWith('/teacher')) {
        selectRole('teacher');
        return;
      }
      if (href.startsWith('/student')) {
        selectRole('student');
        return;
      }
      navigateWithLoading(href);
    },
    [navigateWithLoading, selectRole]
  );

  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsedSectionKeys((prev) =>
      prev.includes(sectionKey) ? prev.filter((key) => key !== sectionKey) : [...prev, sectionKey]
    );
  }, []);

  return (
    <Flex
      minH="100vh"
      direction="row"
      bgGradient="linear(to-b, #f8f5f1 0%, #f3f4f6 100%)"
      backgroundImage="radial-gradient(circle at top left, rgba(200, 0, 11, 0.08), transparent 24%)"
      color="gray.800"
    >
      <Box
        as="aside"
        w="280px"
        minW="280px"
        position="sticky"
        top={0}
        h="100vh"
        px={4}
        py={6}
        borderRightWidth="1px"
        borderBottomWidth={0}
        borderColor="blackAlpha.100"
        bg="rgba(255,255,255,0.78)"
        sx={{ backdropFilter: 'blur(18px)' }}
        overflowY="auto"
      >
        <Flex align="center" justify="center" gap={3.5} pb={4.5}>
          <Flex>
            {tenantBrandLogo ? (
              <Image
                src={tenantBrandLogo}
                alt={tenantBrandTitle}
                boxSize="24px"
                objectFit="contain"
                borderRadius="md"
              />
            ) : (
              <SvgIcon src="/imgs/app/admin/admin_logo.svg" alt="admin logo" size="24px" />
            )}
          </Flex>
          <Box textAlign="left">
            <Text
              mt={1}
              color="#000"
              fontFamily='"Douyin Sans"'
              fontSize="20px"
              fontStyle="normal"
              fontWeight="700"
              lineHeight="normal"
            >
              {tenantBrandTitle}
            </Text>
          </Box>
        </Flex>

        <Stack as="nav" spacing={4.5} mt={5.5}>
          {orderedAdminNavSections.map((section) => {
            const sectionActive = section.children.some((child) => {
              return pathname === child.href || pathname.startsWith(`${child.href}/`);
            });
            const isSectionCollapsed = collapsedSectionKeys.includes(section.key);
            const sectionToggleLabel = String(
              t(isSectionCollapsed ? 'layout.expandSection' : 'layout.collapseSection', {
                value: translateConfigKey(section.labelKey)
              })
            );

            return (
              <Box key={section.key}>
                <Flex
                  as="button"
                  type="button"
                  w="full"
                  border="none"
                  cursor="pointer"
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2.5}
                  rounded="14px"
                  color={section.disabled ? 'gray.400' : sectionActive ? ACCENT : 'gray.800'}
                  bg={sectionActive ? 'rgba(200, 0, 11, 0.08)' : 'transparent'}
                  fontWeight="700"
                  title={sectionToggleLabel}
                  aria-label={sectionToggleLabel}
                  onClick={() => toggleSection(section.key)}
                  _hover={{
                    bg: sectionActive ? 'rgba(200, 0, 11, 0.12)' : 'blackAlpha.50'
                  }}
                  transition="background-color 0.2s ease, color 0.2s ease"
                  aria-expanded={!isSectionCollapsed}
                  aria-controls={`admin-nav-section-${section.key}`}
                >
                  <HStack spacing={2.5}>
                    <Box color="currentColor">
                      <AdminIcon name={section.icon} />
                    </Box>
                    <Text
                      color="inherit"
                      fontSize="15px"
                      fontWeight="inherit"
                      lineHeight="1.4"
                      whiteSpace="normal"
                      textAlign="left"
                    >
                      {translateConfigKey(section.labelKey)}
                    </Text>
                  </HStack>
                  <Box as="span" display="inline-flex" alignItems="center" color="currentColor">
                    {isSectionCollapsed ? (
                      <ChevronRightIcon boxSize={5} />
                    ) : (
                      <ChevronDownIcon boxSize={5} />
                    )}
                  </Box>
                </Flex>

                <Collapse in={!isSectionCollapsed} animateOpacity>
                  <Stack id={`admin-nav-section-${section.key}`} spacing={1} pl={4} mt={2}>
                    {section.children.map((child) => {
                      const isActive =
                        pathname === child.href || pathname.startsWith(`${child.href}/`);
                      const label = translateConfigKey(child.labelKey);
                      const description = translateConfigKey(child.descriptionKey);

                      if (child.disabled) {
                        return (
                          <Flex
                            key={child.href}
                            align="center"
                            justify="flex-start"
                            minH="42px"
                            px={3}
                            py={2.5}
                            rounded="12px"
                            opacity={0.48}
                            cursor="default"
                            color="gray.500"
                            title={description}
                          >
                            <HStack spacing={2.5} minW={0}>
                              <Box color="currentColor">
                                <AdminIcon name={child.icon} />
                              </Box>
                              <Text
                                color="inherit"
                                display="block"
                                minW={0}
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                fontFamily='"PingFang SC"'
                                fontSize="14px"
                                fontStyle="normal"
                                fontWeight="400"
                                lineHeight="22px"
                              >
                                {label}
                              </Text>
                            </HStack>
                          </Flex>
                        );
                      }

                      return (
                        <ChakraLink
                          as={Link}
                          key={child.href}
                          href={child.href}
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-start"
                          minH="42px"
                          px={3}
                          py={2.5}
                          rounded="12px"
                          color={isActive ? ACCENT : 'gray.500'}
                          bg={isActive ? 'rgba(200, 0, 11, 0.1)' : 'transparent'}
                          fontWeight={isActive ? '600' : '500'}
                          textDecoration="none"
                          transition="background-color 0.2s ease, color 0.2s ease, transform 0.2s ease"
                          onClick={(event) => handleInternalLinkClick(event, child.href)}
                          _hover={{
                            bg: 'rgba(200, 0, 11, 0.06)',
                            color: ACCENT,
                            transform: 'translateX(2px)',
                            textDecoration: 'none'
                          }}
                          title={description}
                        >
                          <HStack spacing={2.5} minW={0}>
                            <Box color="currentColor">
                              <AdminIcon name={child.icon} />
                            </Box>
                            <Text
                              color="inherit"
                              fontSize="14px"
                              fontWeight="inherit"
                              lineHeight="1.4"
                              whiteSpace="normal"
                            >
                              {label}
                            </Text>
                          </HStack>
                        </ChakraLink>
                      );
                    })}
                  </Stack>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box flex="1" minW={0} display="flex" flexDirection="column" minH="100vh">
        <Flex
          as="header"
          position="sticky"
          top={0}
          zIndex={10}
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: 3, md: 6 }}
          px={{ base: 3, md: '26px' }}
          py={{ base: 4, md: 6 }}
          borderBottom={'1px solid #EEE'}
          bg="#f9f9f9"
          backdropFilter="blur(10px)"
        >
          <Box flex="1" minW={0} display="block">
            <Text mt={1} fontSize="20px" fontWeight="700" lineHeight="1.2" noOfLines={1}>
              {currentPageTitle}
            </Text>
          </Box>

          <Flex align="center" justify={{ base: 'flex-end', md: 'flex-start' }} gap={4} wrap="nowrap">
            {/* 教师管理页面专用：仅看管理员切换按钮 */}
            {isTeachersPage && isTeachingI18nReady && (
              <Button
                leftIcon={
                  <Box as="span" display="inline-flex" alignItems="center" lineHeight={0}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{ display: 'block' }}
                    >
                      <path
                        d="M9.94147 1.432H6.47747C4.41881 1.432 2.74414 3.10667 2.74414 5.16533V9.61867C2.74414 12.632 5.19481 15.0827 8.20814 15.0827C11.2215 15.0827 13.6721 12.632 13.6721 9.61867V5.16533C13.6748 3.10667 12.0001 1.432 9.94147 1.432ZM12.6081 9.61867C12.6081 12.0427 10.6348 14.016 8.21081 14.016C5.78681 14.016 3.81347 12.0427 3.81347 9.61867V5.16533C3.81347 3.696 5.01081 2.49867 6.48014 2.49867H9.94414C11.4135 2.49867 12.6108 3.696 12.6108 5.16533V9.61867H12.6081Z"
                        fill={ACCENT}
                      />
                      <path
                        d="M8.74164 6.376V4.776C8.74164 4.48267 8.50164 4.24267 8.20831 4.24267C7.91498 4.24267 7.67498 4.48267 7.67498 4.776V6.376C7.26507 6.49208 6.90423 6.73874 6.64723 7.07851C6.39023 7.41829 6.25111 7.83264 6.25098 8.25867C6.25098 9.33867 7.12831 10.216 8.20831 10.216C9.28831 10.216 10.1656 9.33867 10.1656 8.25867C10.1683 7.36267 9.56298 6.608 8.74164 6.376ZM8.20831 9.14933C7.71764 9.14933 7.31764 8.74934 7.31764 8.25867C7.31764 7.768 7.71764 7.368 8.20831 7.368C8.69898 7.368 9.09898 7.768 9.09898 8.25867C9.10164 8.74934 8.70164 9.14933 8.20831 9.14933Z"
                        fill={ACCENT}
                      />
                    </svg>
                  </Box>
                }
                variant="outline"
                size="sm"
                h="36px"
                px={5}
                borderRadius="8px"
                borderColor={onlyAdmin ? ACCENT : '#E5E5E5'}
                color={ACCENT}
                bg="white"
                fontSize="14px"
                fontWeight="400"
                _hover={{
                  bg: ACCENT_SOFT,
                  borderColor: ACCENT
                }}
                _active={{
                  bg: ACCENT_SOFT
                }}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('admin-teachers:toggle-only-admin', {
                      detail: { value: !onlyAdmin }
                    })
                  )
                }
                aria-pressed={onlyAdmin}
              >
                {t('teaching.teachers.headerActions.onlyAdmin')}
              </Button>
            )}
            {/* 教学资源管理页面专用按钮组 */}
            {pathname === '/admin/resource/teaching-resources' && isResourceI18nReady && (
              <Flex gap={2} mr={2}>
                <Button
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  }
                  variant="outline"
                  size="sm"
                  h="36px"
                  px={4}
                  rounded="md"
                  borderColor="#333"
                  color="#333"
                  fontSize="14px"
                  fontWeight="400"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('teaching-resource:open-settings'))
                  }
                >
                  {t('resource.headerActions.settings')}
                </Button>
                <Button
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                      <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                      <path d="m14.5 12.5-5 5"></path>
                      <path d="m9.5 12.5 5 5"></path>
                    </svg>
                  }
                  variant="outline"
                  size="sm"
                  h="36px"
                  px={4}
                  rounded="md"
                  borderColor="#333"
                  color="#333"
                  fontSize="14px"
                  fontWeight="400"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('teaching-resource:open-drafts'))
                  }
                >
                  {t('resource.headerActions.drafts')}
                </Button>
                <Button
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                  }
                  size="sm"
                  h="36px"
                  px={4}
                  rounded="md"
                  bg="#2D2D2D"
                  color="white"
                  fontSize="14px"
                  fontWeight="400"
                  _hover={{ bg: '#1F1F1F' }}
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('teaching-resource:open-upload'))
                  }
                >
                  {t('resource.headerActions.upload')}
                </Button>
              </Flex>
            )}
            <HeaderUserMenu
              accentColor={ACCENT}
              accentSoftBg={ACCENT_SOFT}
              userName={userName}
              userRoleLabel={userRoleLabel}
              userAccount={userAccount}
              roleBadges={roleBadges}
              actionItems={visibleActionItems.map((item) => ({
                key: item.key,
                label: item.label,
                icon: <AdminIcon name={item.icon} style={{ width: 18, height: 18 }} />,
                isCurrent: item.isCurrent,
                onClick: () => navigateWithLoading(item.href)
              }))}
              roleSwitchLabel={roleSwitchLabel}
              roleSwitchItems={roleSwitchItems.map((item) => ({
                key: item.key,
                label: item.label,
                icon: <AdminIcon name={item.icon} style={{ width: 18, height: 18 }} />,
                isCurrent: item.isCurrent,
                onClick: item.isCurrent ? undefined : () => handleSwitchRole(item.href)
              }))}
              logoutLabel={logoutLabel}
              onLogout={handleLogout}
              avatarUrl={user?.avatar}
              avatar={<AdminIcon name="user" style={{ width: 16, height: 16 }} />}
              logoutIcon={<AdminIcon name="shield" style={{ width: 18, height: 18 }} />}
            />
            <Menu placement="bottom-end">
              <MenuButton
                borderRadius="16px"
                bg="#F2F3F5"
                px="15px"
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
                  <Text whiteSpace="nowrap">{localeDisplayMap[locale]}</Text>
                  <ChevronDownIcon boxSize={4} />
                </Flex>
              </MenuButton>
              <MenuList minW="140px">
                {adminLocales.map((loc) => (
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
          </Flex>
        </Flex>

        <Box
          as="main"
          padding={{ base: '14px 12px 20px', md: '22px 24px 24px' }}
          className="admin-main-content"
          flex="1"
          minH="0"
          display="flex"
          flexDirection="column"
        >
          {/* 让页面内容区域占满头部下方的剩余高度，便于子页面内部做弹性布局。 */}
          <motion.div
            key={isPageLoading ? `${pathname}-loading` : pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column' }}
          >
            {isPageLoading ? <AdminPageSkeleton /> : children}
          </motion.div>
        </Box>
      </Box>
    </Flex>
  );
}
