'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/auth';
import { adminNavSections } from '../_config/adminConfig';

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

function getFirstAvailableMenu(userMenuCodes?: string[]) {
  const hasMenuCodes = Boolean(userMenuCodes?.length);
  const menuCodeSet = new Set(userMenuCodes || []);
  const menuCodeOrderMap = new Map((userMenuCodes || []).map((code, index) => [code, index]));

  const hasMenuAccess = (menuCode?: string | string[]) => {
    if (!hasMenuCodes) return true;
    if (!menuCode) return true;
    const menuCodes = Array.isArray(menuCode) ? menuCode : [menuCode];
    return menuCodes.some((code) => menuCodeSet.has(code));
  };

  // 过滤出有权限且未禁用的菜单
  const availableSections = adminNavSections
    .map((section, sectionIndex) => {
      const children = section.children
        .filter((child) => hasMenuAccess(child.menuCode) && !child.disabled)
        .map((child, childIndex) => ({
          ...child,
          __order: getMenuOrder(child.menuCode, menuCodeOrderMap),
          __index: childIndex
        }))
        .sort((a, b) => {
          if (a.__order !== b.__order) return a.__order - b.__order;
          return a.__index - b.__index;
        });

      const sectionOrder = Math.min(...children.map((child) => child.__order));

      return {
        ...section,
        children,
        __order: sectionOrder,
        __index: sectionIndex
      };
    })
    .filter((section) => hasMenuAccess(section.menuCode) && !section.disabled)
    .filter((section) => section.children.length > 0);

  if (availableSections.length === 0) {
    return null;
  }

  // 返回第一个 section 的第一个子菜单
  const firstSection = availableSections.sort((a, b) => {
    if (a.__order !== b.__order) return a.__order - b.__order;
    return a.__index - b.__index;
  })[0];
  return firstSection.children[0]?.href || null;
}

export default function AdminIndexPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    // if (isLoggedIn) return;

    const firstMenuHref = getFirstAvailableMenu(user?.menuCodes);

    if (firstMenuHref) {
      router.replace(firstMenuHref);
    }
  }, [isLoggedIn, router, user?.menuCodes]);

  return null;
}
