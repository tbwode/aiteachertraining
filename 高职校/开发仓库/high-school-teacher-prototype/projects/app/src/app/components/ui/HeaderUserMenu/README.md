# HeaderUserMenu

## Usage

```tsx
import HeaderUserMenu from '@/app/components/ui/HeaderUserMenu';

<HeaderUserMenu
  accentColor="#C8000B"
  accentSoftBg="#FFF1F0"
  userName={userName}
  userRoleLabel={t('layout.userRole')}
  userAccount={userAccount}
  roleBadges={roleBadges}
  roleSwitchLabel={t('layout.roleSwitchLabel')}
  roleSwitchItems={roleSwitchItems}
  logoutLabel={t('layout.logout')}
  onLogout={handleLogout}
  avatar={<UserIcon width="16px" height="16px" />}
  logoutIcon={<LogOutIcon width="18px" height="18px" />}
/>
```

用于 admin / teacher 顶栏个人菜单，统一头像触发器、角色切换区和退出登录样式。
