'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Flex, Spinner, Text, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import ProfileSidebar from './components/ProfileSidebar';
import OverviewPanel from './components/OverviewPanel';
import BasicInfoPanel from './components/BasicInfoPanel';
import PasswordPanel from './components/PasswordPanel';
import MyResourcesPanel from './components/MyResourcesPanel';
import WechatBindModal from './components/WechatBindModal';
import ChangePhoneModal from './components/ChangePhoneModal';
import { initialPasswordForm, emptyTeacherProfile } from './constants';
import type {
  PasswordForm,
  ProfileTabItem,
  ProfileTabKey,
  TeacherProfileForm,
  TeacherProfileInfo
} from './types';
import { useAuth } from '@/app/components/auth';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import {
  postTeacherAvatarUpdate,
  postTeacherDetail,
  postTeacherPasswordUpdate,
  postTeacherProfileUpdate,
  postWechatUnbind,
  uploadFilePublic,
  getWechatIsBindWx
} from '@/teacher/api/profile';
import { sha256 } from '@/teacher/utils/crypto';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';

type ProfileLoadState = 'idle' | 'loading' | 'success' | 'error';

export default function TeacherProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const isI18nReady = useTeacherPageI18n(['profile']);
  const overviewTabLabel = t('profile.tabs.overview.label');
  const overviewTabDescription = t('profile.tabs.overview.description');
  const myResourcesTabLabel = t('profile.tabs.myResources.label');
  const myResourcesTabDescription = t('profile.tabs.myResources.description');
  const basicInfoTabLabel = t('profile.tabs.basicInfo.label');
  const basicInfoTabDescription = t('profile.tabs.basicInfo.description');
  const passwordTabLabel = t('profile.tabs.password.label');
  const passwordTabDescription = t('profile.tabs.password.description');
  const allClassesLabel = t('profile.overview.filters.allClasses');
  const classOption1Label = t('profile.overview.filters.classOption1');
  const classOption2Label = t('profile.overview.filters.classOption2');
  const classOption3Label = t('profile.overview.filters.classOption3');
  const thisWeekLabel = t('profile.overview.filters.thisWeek');
  const thisMonthLabel = t('profile.overview.filters.thisMonth');
  const thisSemesterLabel = t('profile.overview.filters.thisSemester');
  const profileTabs = useMemo<ProfileTabItem[]>(
    () => [
      {
        key: 'overview',
        label: overviewTabLabel,
        description: overviewTabDescription
      },
      {
        key: 'myResources',
        label: myResourcesTabLabel,
        description: myResourcesTabDescription
      },
      {
        key: 'basicInfo',
        label: basicInfoTabLabel,
        description: basicInfoTabDescription
      },
      {
        key: 'password',
        label: passwordTabLabel,
        description: passwordTabDescription
      }
    ],
    [
      basicInfoTabDescription,
      basicInfoTabLabel,
      myResourcesTabDescription,
      myResourcesTabLabel,
      overviewTabDescription,
      overviewTabLabel,
      passwordTabDescription,
      passwordTabLabel
    ]
  );
  const classOptions = useMemo(
    () => [allClassesLabel, classOption1Label, classOption2Label, classOption3Label],
    [allClassesLabel, classOption1Label, classOption2Label, classOption3Label]
  );
  const rangeOptions = useMemo(
    () => [thisWeekLabel, thisMonthLabel, thisSemesterLabel],
    [thisMonthLabel, thisSemesterLabel, thisWeekLabel]
  );
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('overview');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const [profileInfo, setProfileInfo] = useState<TeacherProfileInfo>(emptyTeacherProfile);
  const [profileForm, setProfileForm] = useState<TeacherProfileForm>({
    phone: '',
    email: ''
  });
  const [profileLoadState, setProfileLoadState] = useState<ProfileLoadState>('idle');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>(
    {}
  );
  const [isWechatBindModalOpen, setIsWechatBindModalOpen] = useState(false);
  const [isUnbindingWechat, setIsUnbindingWechat] = useState(false);
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);

  const { openConfirm: openUnbindConfirm, ConfirmModal: UnbindConfirmModal } = useConfirm({
    title: t('profile.wechat.unbindConfirmTitle'),
    iconSrc: 'common/warn',
    iconColor: '#F79009',
    showCancel: true,
    type: 'common'
  });

  const currentTab = useMemo(
    () => profileTabs.find((item) => item.key === activeTab) || profileTabs[0],
    [activeTab, profileTabs]
  );

  useEffect(() => {
    if (searchParams?.get('tab') === 'allResources') {
      router.replace('/teacher/resource-plaza/all');
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!selectedClass && classOptions[0]) {
      setSelectedClass(classOptions[0]);
    }
  }, [classOptions, selectedClass]);

  useEffect(() => {
    if (!selectedRange && rangeOptions[0]) {
      setSelectedRange(rangeOptions[0]);
    }
  }, [rangeOptions, selectedRange]);

  const showToast = useCallback(
    (title: string, status: 'success' | 'error', description?: string) => {
      toast({
        title,
        description,
        status,
        duration: 2500,
        isClosable: true,
        position: 'top'
      });
    },
    [toast]
  );

  useEffect(() => {
    if (!user?.teacherId) {
      setProfileLoadState('error');
      setProfileError(t('profile.feedback.missingTeacherIdForDetail'));
      return;
    }

    let cancelled = false;
    setProfileLoadState('loading');
    setProfileError('');

    postTeacherDetail({ id: user.teacherId })
      .then(async (detail) => {
        if (cancelled) return;
        const loginPhone = detail.loginPhone || detail.phone || '';
        let wechatBound = !!detail.wechatBound;
        try {
          const isBound = await getWechatIsBindWx();
          if (!cancelled) {
            wechatBound = isBound;
          }
        } catch {
          // 若 isBindWx 失败，保持详情接口返回的值
        }
        if (cancelled) return;
        const nextProfileInfo: TeacherProfileInfo = {
          avatarUrl: user.avatar || '',
          teacherNo: detail.code || '',
          name: detail.name || '',
          deptNames: Array.isArray(detail.deptNames) ? detail.deptNames.filter(Boolean) : [],
          phone: loginPhone,
          loginPhone,
          email: detail.email || '',
          wechatBound
        };
        setProfileInfo(nextProfileInfo);
        setProfileForm({
          phone: nextProfileInfo.phone,
          email: nextProfileInfo.email
        });
        setProfileLoadState('success');
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          typeof error === 'object' &&
          error !== null &&
          'msg' in error &&
          typeof (error as { msg?: unknown }).msg === 'string'
            ? (error as { msg: string }).msg
            : t('profile.feedback.loadError');
        setProfileLoadState('error');
        setProfileError(message);
        showToast(message, 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [showToast, t, user?.avatar, user?.teacherId]);

  const handleProfileFieldChange = (field: keyof TeacherProfileForm, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordFieldChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setPasswordErrors((prev) => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleProfileCancel = () => {
    setProfileForm({
      phone: profileInfo.phone,
      email: profileInfo.email
    });
  };

  const handleProfileSave = async () => {
    if (!user?.teacherId) {
      showToast(t('profile.feedback.missingTeacherIdForUpdate'), 'error');
      return;
    }

    try {
      setIsSavingProfile(true);
      await postTeacherProfileUpdate({
        id: user.teacherId,
        phone: profileForm.phone,
        email: profileForm.email
      });
      setProfileInfo((prev) => ({
        ...prev,
        phone: profileForm.phone,
        email: profileForm.email
      }));
      showToast(t('profile.feedback.saveSuccess'), 'success');
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'msg' in error &&
        typeof (error as { msg?: unknown }).msg === 'string'
          ? (error as { msg: string }).msg
          : t('profile.feedback.saveError');
      showToast(message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordForm(initialPasswordForm);
    setPasswordErrors({});
  };

  const validatePasswordForm = () => {
    const nextErrors: Partial<Record<keyof PasswordForm, string>> = {};

    if (!passwordForm.oldPassword.trim()) {
      nextErrors.oldPassword = t('profile.password.validation.oldPasswordRequired');
    }
    if (!passwordForm.newPassword.trim()) {
      nextErrors.newPassword = t('profile.password.validation.newPasswordRequired');
    } else if (passwordForm.newPassword.trim().length < 8) {
      nextErrors.newPassword = t('profile.password.validation.newPasswordMinLength');
    }
    if (!passwordForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = t('profile.password.validation.confirmPasswordRequired');
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      nextErrors.confirmPassword = t('profile.password.validation.passwordMismatch');
    }

    setPasswordErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;

    try {
      setIsSavingPassword(true);
      const [originalPassword, newPassword] = await Promise.all([
        sha256(passwordForm.oldPassword),
        sha256(passwordForm.newPassword)
      ]);
      await postTeacherPasswordUpdate({
        originalPassword,
        newPassword
      });
      setPasswordForm(initialPasswordForm);
      setPasswordErrors({});
      showToast(t('profile.password.feedback.success'), 'success');
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'msg' in error &&
        typeof (error as { msg?: unknown }).msg === 'string'
          ? (error as { msg: string }).msg
          : t('profile.password.feedback.error');
      showToast(message, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleWechatBindSuccess = useCallback(() => {
    setProfileInfo((prev) => ({ ...prev, wechatBound: true }));
    showToast(t('profile.wechat.bindSuccess'), 'success');
  }, [showToast, t]);

  const handleChangePhoneSuccess = useCallback(
    (newPhone: string) => {
      setProfileInfo((prev) => ({ ...prev, phone: newPhone, loginPhone: newPhone }));
      setProfileForm((prev) => ({ ...prev, phone: newPhone }));
      showToast(t('profile.changePhone.feedback.changeSuccess'), 'success');
    },
    [showToast, t]
  );

  const handleWechatUnbind = useCallback(async () => {
    try {
      setIsUnbindingWechat(true);
      await postWechatUnbind();
      setProfileInfo((prev) => ({ ...prev, wechatBound: false }));
      showToast(t('profile.wechat.unbindSuccess'), 'success');
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'msg' in error &&
        typeof (error as { msg?: unknown }).msg === 'string'
          ? (error as { msg: string }).msg
          : t('profile.wechat.unbindError');
      showToast(message, 'error');
    } finally {
      setIsUnbindingWechat(false);
    }
  }, [showToast, t]);

  const handleAvatarChange = useCallback(
    async (file: File) => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        showToast(t('profile.avatar.invalidType'), 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast(t('profile.avatar.maxSizeError'), 'error');
        return;
      }

      try {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await uploadFilePublic(formData);
        const avatarUrl = uploadResult.url || uploadResult.fileUrl || uploadResult.previewUrl || '';
        if (!avatarUrl) {
          throw new Error(t('profile.avatar.uploadMissingUrl'));
        }
        await postTeacherAvatarUpdate({ avatar: avatarUrl });
        setProfileInfo((prev) => ({
          ...prev,
          avatarUrl
        }));
        updateUser({ avatar: avatarUrl });
        showToast(t('profile.avatar.updateSuccess'), 'success');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' &&
                error !== null &&
                'msg' in error &&
                typeof (error as { msg?: unknown }).msg === 'string'
              ? (error as { msg: string }).msg
              : t('profile.avatar.updateError');
        showToast(message, 'error');
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [showToast, t, updateUser]
  );

  if (!isI18nReady) {
    return (
      <Flex minH="240px" align="center" justify="center">
        <Spinner color="#C8000B" />
      </Flex>
    );
  }

  return (
    <Box maxW="1280px" mx="auto">
      <Flex align="flex-start" gap={6} flexDir="row">
        <ProfileSidebar activeTab={activeTab} onChange={setActiveTab} />
        <Box flex="1" minW={0}>
          {currentTab.key === 'overview' && (
            <OverviewPanel
              selectedClass={selectedClass}
              selectedRange={selectedRange}
              selectedClassLabel={
                classOptions.find((o) => o === selectedClass) || classOptions[0] || ''
              }
              selectedRangeLabel={
                rangeOptions.find((o) => o === selectedRange) || rangeOptions[0] || ''
              }
              onClassChange={setSelectedClass}
              onRangeChange={setSelectedRange}
              classOptions={classOptions}
              rangeOptions={rangeOptions}
              onExport={() => showToast(t('profile.overview.feedback.exportCreated'), 'success')}
              onRowAction={(name) =>
                showToast(t('profile.overview.feedback.detailOpened', { name }), 'success')
              }
            />
          )}

          {currentTab.key === 'basicInfo' &&
            (profileLoadState === 'loading' ? (
              <Flex
                bg="#FFFFFF"
                rounded="16px"
                border="1px solid #F3F4F6"
                boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
                minH="240px"
                align="center"
                justify="center"
                direction="column"
                gap={3}
              >
                <Spinner color="#C8000B" />
                <Text color="#86909C">{t('profile.feedback.loading')}</Text>
              </Flex>
            ) : profileLoadState === 'error' ? (
              <Flex
                bg="#FFFFFF"
                rounded="16px"
                border="1px solid #F3F4F6"
                boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
                minH="240px"
                align="center"
                justify="center"
                direction="column"
                gap={3}
              >
                <Text color="#F5222D">{profileError || t('profile.feedback.loadError')}</Text>
              </Flex>
            ) : (
              <BasicInfoPanel
                value={profileForm}
                initialProfile={profileInfo}
                onChange={handleProfileFieldChange}
                onCancel={handleProfileCancel}
                onSave={() => void handleProfileSave()}
                onAvatarChange={(file) => void handleAvatarChange(file)}
                onNavigatePassword={() => setActiveTab('password')}
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
                onChangePhone={() => setIsChangePhoneOpen(true)}
                isSaving={isSavingProfile}
                isUploadingAvatar={isUploadingAvatar}
                isUnbindingWechat={isUnbindingWechat}
              />
            ))}

          {currentTab.key === 'password' && (
            <PasswordPanel
              value={passwordForm}
              errors={passwordErrors}
              onChange={handlePasswordFieldChange}
              onCancel={handlePasswordCancel}
              onSubmit={() => void handlePasswordSubmit()}
            />
          )}

          {currentTab.key === 'myResources' && <MyResourcesPanel />}

          <WechatBindModal
            isOpen={isWechatBindModalOpen}
            onClose={() => setIsWechatBindModalOpen(false)}
            onSuccess={handleWechatBindSuccess}
          />
          <UnbindConfirmModal isLoading={isUnbindingWechat} />
          <ChangePhoneModal
            isOpen={isChangePhoneOpen}
            onClose={() => setIsChangePhoneOpen(false)}
            oldPhone={profileInfo.loginPhone}
            onSuccess={handleChangePhoneSuccess}
          />
        </Box>
      </Flex>
    </Box>
  );
}
