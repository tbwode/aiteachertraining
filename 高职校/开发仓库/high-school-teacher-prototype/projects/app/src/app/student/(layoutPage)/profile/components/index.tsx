'use client';

import { useCallback, useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { Box, Button, Flex, Spinner, Text, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import {
  getAccountDashboardData,
  getStudentProfileDetail,
  updateStudentProfileAvatar,
  updatePassword,
  updateUserInfo
} from '../actions';
import { postWechatUnbind, getWechatIsBindWx } from '@/api/student/profile';
import type { PasswordFormData, UserInfo } from '../types';
import type { DashboardData } from '../../dashboard/types';
import { DashboardPanel } from '../../dashboard/components/DashboardPanel';
import { AccountCenterTabs, type AccountTabKey } from './AccountCenterTabs';
import { PasswordFormPanel } from './PasswordFormPanel';
import { ProfileInfoPanel } from './ProfileInfoPanel';
import ChangePhoneModal from './ChangePhoneModal';
import WechatBindModal from './WechatBindModal';
import { designTokens, studentProfileTokens } from '@/theme/designTokens';
import { useUserStore } from '@/common/store/useUserStore';
import { useStudentAuthStore } from '@/student/store/auth';

type EditableProfile = Pick<UserInfo, 'phone'>;
type DashboardLoadState = 'idle' | 'loading' | 'success' | 'error';
type ProfileDetailLoadState = 'idle' | 'loading' | 'success' | 'error';

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: studentProfileTokens.card.border,
  borderRadius: studentProfileTokens.card.borderRadius,
  boxShadow: studentProfileTokens.card.shadow
} as const;

export function ProfileIndex({ user }: { user: UserInfo }) {
  const { t } = useTranslation('student');
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AccountTabKey>('profile');
  const [profileUser, setProfileUser] = useState<UserInfo>(user);
  const [profileForm, setProfileForm] = useState<EditableProfile>({
    phone: user.phone
  });
  const [profileDetailState, setProfileDetailState] = useState<ProfileDetailLoadState>('idle');
  const [profileDetailError, setProfileDetailError] = useState('');
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [dashboardState, setDashboardState] = useState<DashboardLoadState>('idle');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isSavingProfile, startSavingProfile] = useTransition();
  const [isSavingPassword, startSavingPassword] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const [isWechatBindModalOpen, setIsWechatBindModalOpen] = useState(false);
  const [isUnbindingWechat, setIsUnbindingWechat] = useState(false);
  const authUserInfo = useStudentAuthStore((state) => state.userInfo);
  const updateStudentAuthUserInfo = useStudentAuthStore((state) => state.updateUserInfo);
  const updateAuthUserInfo = useUserStore((state) => state.updateUserInfo);
  const detailQueryId = String(
    authUserInfo?.studentId || profileUser.studentId || user.studentId || ''
  ).trim();

  const { openConfirm: openUnbindConfirm, ConfirmModal: UnbindConfirmModal } = useConfirm({
    title: t('profile.wechat.unbindConfirmTitle'),
    iconSrc: 'common/warn',
    iconColor: '#F79009',
    showCancel: true,
    type: 'common'
  });

  const baseInfo = useMemo(
    () => [
      { label: t('profile.fields.studentId'), value: profileUser.studentId },
      { label: t('profile.fields.realName'), value: profileUser.realName },
      {
        label: t('profile.fields.major'),
        value: `${profileUser.department} - ${profileUser.major}`.replace(/^ - | - $/g, '')
      },
      { label: t('profile.fields.className'), value: profileUser.className }
    ],
    [
      profileUser.className,
      profileUser.department,
      profileUser.major,
      profileUser.realName,
      profileUser.studentId,
      t
    ]
  );

  useEffect(() => {
    if (!detailQueryId) {
      setProfileDetailError(t('profile.feedback.loadError'));
      setProfileDetailState('error');
      return;
    }

    let cancelled = false;
    setProfileDetailError('');
    setProfileDetailState('loading');

    getStudentProfileDetail(detailQueryId)
      .then(async (detail) => {
        if (cancelled) return;
        const loginPhone = detail.loginPhone || detail.phone || '';
        setProfileUser((prev) => ({
          ...prev,
          ...detail,
          phone: loginPhone,
          loginPhone,
          avatar: authUserInfo?.avatar || detail.avatar || prev.avatar
        }));
        setProfileForm({
          phone: loginPhone
        });
        try {
          const isBound = await getWechatIsBindWx();
          if (!cancelled) {
            setProfileUser((prev) => ({ ...prev, wechatBound: isBound }));
          }
        } catch {
          // 若 isBindWx 失败，保持详情接口返回的值
        }
        if (!cancelled) {
          setProfileDetailState('success');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const errorMessage =
          typeof error === 'object' &&
          error !== null &&
          'msg' in error &&
          typeof (error as { msg?: unknown }).msg === 'string'
            ? (error as { msg: string }).msg
            : t('profile.feedback.loadError');
        setProfileDetailError(errorMessage);
        setProfileDetailState('error');
        toast({
          title: errorMessage,
          status: 'error',
          duration: 2500,
          position: 'top'
        });
      });

    return () => {
      cancelled = true;
    };
  }, [authUserInfo?.avatar, detailQueryId, t, toast]);

  useEffect(() => {
    if (activeTab !== 'dashboard' || dashboardState !== 'idle') {
      return;
    }

    let cancelled = false;

    getAccountDashboardData()
      .then((data) => {
        if (cancelled) return;
        setDashboardData(data);
        setDashboardState('success');
      })
      .catch(() => {
        if (cancelled) return;
        setDashboardState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, dashboardState]);

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSavingProfile(async () => {
      try {
        await updateUserInfo(profileForm);
        setProfileUser((prev) => ({
          ...prev,
          phone: profileForm.phone
        }));
        updateAuthUserInfo({
          phone: profileForm.phone
        });
        toast({
          title: t('profile.feedback.saveSuccess'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      } catch {
        toast({
          title: t('profile.feedback.saveError'),
          status: 'error',
          duration: 2500,
          position: 'top'
        });
      }
    });
  };

  const handleChangePhoneSuccess = (newPhone: string) => {
    setProfileUser((prev) => ({ ...prev, phone: newPhone, loginPhone: newPhone }));
    setProfileForm({ phone: newPhone });
  };

  const handleWechatBindSuccess = useCallback(() => {
    setProfileUser((prev) => ({ ...prev, wechatBound: true }));
    toast({
      title: t('profile.wechat.bindSuccess'),
      status: 'success',
      duration: 2000,
      position: 'top'
    });
  }, [t, toast]);

  const handleWechatUnbind = useCallback(async () => {
    try {
      setIsUnbindingWechat(true);
      await postWechatUnbind();
      setProfileUser((prev) => ({ ...prev, wechatBound: false }));
      toast({
        title: t('profile.wechat.unbindSuccess'),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'msg' in error &&
        typeof (error as { msg?: unknown }).msg === 'string'
          ? (error as { msg: string }).msg
          : t('profile.wechat.unbindError');
      toast({ title: message, status: 'error', duration: 2500, position: 'top' });
    } finally {
      setIsUnbindingWechat(false);
    }
  }, [t, toast]);

  const handleAvatarChange = async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: t('profile.avatar.invalidType'),
        status: 'error',
        duration: 2500,
        position: 'top'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('profile.avatar.maxSizeError'),
        status: 'error',
        duration: 2500,
        position: 'top'
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const result = await updateStudentProfileAvatar(file);
      const avatarUrl = result.data.avatarUrl;

      setProfileUser((prev) => ({
        ...prev,
        avatar: avatarUrl
      }));
      updateStudentAuthUserInfo({
        avatar: avatarUrl
      });
      updateAuthUserInfo({
        avatar: avatarUrl
      });

      toast({
        title: t('profile.avatar.updateSuccess'),
        status: 'success',
        duration: 2000,
        position: 'top'
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' &&
              error !== null &&
              'msg' in error &&
              typeof (error as { msg?: unknown }).msg === 'string'
            ? (error as { msg: string }).msg
            : t('profile.avatar.updateError');

      toast({
        title: errorMessage,
        status: 'error',
        duration: 2500,
        position: 'top'
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast({
        title: t('passwordForm.validation.incomplete'),
        status: 'error',
        duration: 2500,
        position: 'top'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: t('passwordForm.validation.minLength'),
        status: 'error',
        duration: 2500,
        position: 'top'
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t('passwordForm.validation.mismatch'),
        status: 'error',
        duration: 2500,
        position: 'top'
      });
      return;
    }

    startSavingPassword(async () => {
      try {
        await updatePassword(passwordForm);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast({
          title: t('passwordForm.feedback.success'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      } catch (error) {
        const errorMessage =
          typeof error === 'object' &&
          error !== null &&
          'msg' in error &&
          typeof (error as { msg?: unknown }).msg === 'string'
            ? (error as { msg: string }).msg
            : t('passwordForm.feedback.error');

        toast({
          title: errorMessage,
          status: 'error',
          duration: 2500,
          position: 'top'
        });
      }
    });
  };

  return (
    <Box>
      <Flex direction="row" gap={designTokens.spacing.card.gap} align="flex-start">
        <AccountCenterTabs user={profileUser} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'dashboard' && (
          <>
            {dashboardState === 'success' && dashboardData && (
              <DashboardPanel data={dashboardData} />
            )}
            {dashboardState === 'loading' && <DashboardLoadingState />}
            {dashboardState === 'error' && (
              <DashboardErrorState onRetry={() => setDashboardState('idle')} />
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <>
            {profileDetailState === 'success' && (
              <ProfileInfoPanel
                user={profileUser}
                avatar={authUserInfo?.avatar || profileUser.avatar}
                baseInfo={baseInfo}
                profileForm={profileForm}
                isSavingProfile={isSavingProfile}
                isUploadingAvatar={isUploadingAvatar}
                wechatBound={profileUser.wechatBound}
                onWechatBind={() => setIsWechatBindModalOpen(true)}
                onWechatUnbind={() =>
                  openUnbindConfirm({
                    onConfirm: handleWechatUnbind,
                    customContent: (
                      <Box
                        textAlign="center"
                        fontSize="16px"
                        lineHeight="24px"
                        color="#333333"
                        whiteSpace="pre-wrap"
                      >
                        {t('profile.wechat.unbindConfirmContent')}
                      </Box>
                    )
                  })()
                }
                isUnbindingWechat={isUnbindingWechat}
                onChange={setProfileForm}
                onSubmit={handleProfileSubmit}
                onChangePhone={() => setIsChangePhoneOpen(true)}
                onAvatarChange={(file) => void handleAvatarChange(file)}
              />
            )}
            {profileDetailState === 'loading' && <ProfileLoadingState />}
            {profileDetailState === 'error' && (
              <ProfileErrorState
                message={profileDetailError || t('profile.feedback.loadError')}
                onRetry={() => setProfileDetailState('idle')}
              />
            )}
          </>
        )}

        {activeTab === 'password' && (
          <PasswordFormPanel
            passwordForm={passwordForm}
            isSavingPassword={isSavingPassword}
            onChange={setPasswordForm}
            onSubmit={handlePasswordSubmit}
          />
        )}

        <ChangePhoneModal
          isOpen={isChangePhoneOpen}
          onClose={() => setIsChangePhoneOpen(false)}
          oldPhone={profileUser.loginPhone}
          onSuccess={handleChangePhoneSuccess}
        />
        <WechatBindModal
          isOpen={isWechatBindModalOpen}
          onClose={() => setIsWechatBindModalOpen(false)}
          onSuccess={handleWechatBindSuccess}
        />
        <UnbindConfirmModal isLoading={isUnbindingWechat} />
      </Flex>
    </Box>
  );
}

function ProfileLoadingState() {
  return (
    <Box
      {...cardStyle}
      flex="1"
      w="100%"
      p={designTokens.spacing.card.padding}
      minH="280px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="12px"
    >
      <Spinner color={designTokens.colors.primary} thickness="3px" />
      <Text color={designTokens.colors.textSecondary}>正在加载个人资料...</Text>
    </Box>
  );
}

function ProfileErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box
      {...cardStyle}
      flex="1"
      w="100%"
      p={designTokens.spacing.card.padding}
      minH="280px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="16px"
    >
      <Text color={designTokens.colors.textSecondary}>{message}</Text>
      <Button
        onClick={onRetry}
        h={designTokens.button.height}
        px="16px"
        borderRadius={designTokens.button.borderRadius}
        bg={designTokens.colors.primary}
        color={designTokens.colors.textWhite}
        border="none"
        minH="0"
        _hover={{ bg: designTokens.colors.primaryHover }}
        _active={{ bg: designTokens.colors.primaryActive }}
      >
        重新加载
      </Button>
    </Box>
  );
}

function DashboardLoadingState() {
  return (
    <Box
      {...cardStyle}
      flex="1"
      w="100%"
      p={designTokens.spacing.card.padding}
      minH="280px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="12px"
    >
      <Spinner color={designTokens.colors.primary} thickness="3px" />
      <Text color={designTokens.colors.textSecondary}>正在加载学情看板数据...</Text>
    </Box>
  );
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Box
      {...cardStyle}
      flex="1"
      w="100%"
      p={designTokens.spacing.card.padding}
      minH="280px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="16px"
    >
      <Text color={designTokens.colors.textSecondary}>学情看板加载失败，请重试。</Text>
      <Button
        onClick={onRetry}
        h={designTokens.button.height}
        px="16px"
        borderRadius={designTokens.button.borderRadius}
        bg={designTokens.colors.primary}
        color={designTokens.colors.textWhite}
        border="none"
        minH="0"
        _hover={{ bg: designTokens.colors.primaryHover }}
        _active={{ bg: designTokens.colors.primaryActive }}
      >
        重新加载
      </Button>
    </Box>
  );
}
