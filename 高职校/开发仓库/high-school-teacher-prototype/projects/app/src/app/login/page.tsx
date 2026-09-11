'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  Heading,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import SvgIcon from '@/app/components/ui/SvgIcon';
import ForgotPasswordModal from '@/app/teacher/components/ForgotPasswordModal';
import SliderCaptchaModal from '@/app/teacher/components/SliderCaptchaModal';
import TeacherResetPasswordModal from '@/app/teacher/components/TeacherResetPasswordModal';
import { RoleTypeEnum, useAuth, UserTypeEnum } from '@/app/components/auth/AuthProvider';
import WechatLoginModal from '@/app/login/components/WechatLoginModal';
import { IdentitySelectModal } from '@/app/login/components/IdentitySelectModal';
import { useStudentAuthStore } from '@/student/store/auth';
import type { StudentAuthInfo } from '@/student/types/auth';
import { getTenantDetail } from '@/api/admin/teaching/tenant';
import { getTokenLogin, postLogin } from '@/teacher/api/auth';
import { getCourseFastgptToken as getStudentCourseFastgptToken } from '@/student/api/courseFastgpt';
import { getCourseFastgptToken as getTeacherCourseFastgptToken } from '@/teacher/api/courseFastgpt';
import type { AuthInfo, CaptchaTypeEnum } from '@/teacher/types/auth';
import { sha256 } from '@/teacher/utils/crypto';
import type { UserRole } from '@/app/components/auth/RoleSelectModal';
import { useTeacherI18n, type TeacherLocale } from '@/app/teacher/components/TeacherI18nProvider';
import { isMockMode } from '@/mocks/engine';

type RawAuthInfo = Partial<AuthInfo> & Record<string, unknown>;

const DEFAULT_LOGIN_BACKGROUND = '/imgs/teacher/login/login_bg.png';
const DEFAULT_LOGIN_COVER = '/imgs/teacher/login/login_bg.png';
const DEFAULT_LOGIN_TITLE = '高职校SaaS平台';
const DEFAULT_LOGIN_LOGO = '/imgs/app/logo.svg';
const MOCK_LOGIN_ACCOUNTS = [
  { label: '学生·教师·管理员共享', account: '15815501001' }
];

const toNumber = (value: unknown, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const toNumberArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    : [];

const normalizeAuthInfo = (rawAuthInfo: RawAuthInfo): AuthInfo => {
  const menuCodes = Array.isArray(rawAuthInfo.menuCodes) ? rawAuthInfo.menuCodes : [];
  const studentId = toNumber(rawAuthInfo.studentId);
  const teacherId = toNumber(rawAuthInfo.teacherId);
  const parsedType = toNumber(rawAuthInfo.type);
  const type =
    parsedType === UserTypeEnum.STUDENT || parsedType === UserTypeEnum.TEACHER
      ? (parsedType as UserTypeEnum)
      : studentId > 0
        ? UserTypeEnum.STUDENT
        : teacherId > 0 || !menuCodes.some((item) => item.startsWith('student_'))
          ? UserTypeEnum.TEACHER
          : UserTypeEnum.STUDENT;

  return {
    accessToken: rawAuthInfo.accessToken,
    source: rawAuthInfo.source || 'client',
    userId: toNumber(rawAuthInfo.userId),
    username: rawAuthInfo.username || '',
    account: rawAuthInfo.account || '',
    phone: rawAuthInfo.phone || '',
    avatar: rawAuthInfo.avatar || '',
    gender: toNumber(rawAuthInfo.gender),
    roleId: toNumber(rawAuthInfo.roleId),
    roleType: toNumber(rawAuthInfo.roleType, RoleTypeEnum.MEMBER) as RoleTypeEnum,
    roleName: rawAuthInfo.roleName || '',
    roleIds: toNumberArray(rawAuthInfo.roleIds),
    roleNames: Array.isArray(rawAuthInfo.roleNames) ? rawAuthInfo.roleNames : [],
    tmbId: toNumber(rawAuthInfo.tmbId),
    tenantId: toNumber(rawAuthInfo.tenantId),
    tenantName: rawAuthInfo.tenantName || '',
    domain: rawAuthInfo.domain || '',
    subType: toNumber(rawAuthInfo.subType),
    parentTenantId: toNumber(rawAuthInfo.parentTenantId),
    defaultApp: rawAuthInfo.defaultApp as AuthInfo['defaultApp'],
    status: rawAuthInfo.status ?? '1',
    menuCodes,
    chatId: rawAuthInfo.chatId || '',
    isSso: toNumber(rawAuthInfo.isSso),
    isShared: toNumber(rawAuthInfo.isShared),
    type,
    teacherId,
    studentId,
    isAiReview: toNumber(rawAuthInfo.isAiReview),
    officialIntroDatasetId: rawAuthInfo.officialIntroDatasetId,
    introDatasetId: rawAuthInfo.introDatasetId
  };
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const ssoToken = searchParams?.get('token') || searchParams?.get('accessToken') || '';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreement, setAgreement] = useState(true);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [captchaTicket, setCaptchaTicket] = useState('');
  const [captchaMoveLength, setCaptchaMoveLength] = useState(0);
  const [isIdentitySelectOpen, setIsIdentitySelectOpen] = useState(false);
  const [pendingAuthInfo, setPendingAuthInfo] = useState<AuthInfo | null>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [loginBackground, setLoginBackground] = useState(DEFAULT_LOGIN_BACKGROUND);
  const [loginCover, setLoginCover] = useState(DEFAULT_LOGIN_COVER);
  const [loginTitle, setLoginTitle] = useState(DEFAULT_LOGIN_TITLE);
  const [loginLogo, setLoginLogo] = useState(DEFAULT_LOGIN_LOGO);
  const [isWechatLoginOpen, setIsWechatLoginOpen] = useState(false);
  const handledSsoTokenRef = useRef<string | null>(null);

  const { login, selectRole } = useAuth();
  const { locale, changeLocale } = useTeacherI18n();
  const updateStudentAuthUserInfo = useStudentAuthStore((state) => state.updateUserInfo);
  const clearStudentAuth = useStudentAuthStore((state) => state.clearAuth);
  const toast = useToast();

  const {
    isOpen: isResetPasswordOpen,
    onOpen: onResetPasswordOpen,
    onClose: onResetPasswordClose
  } = useDisclosure();

  const {
    isOpen: isForgotPasswordOpen,
    onOpen: onForgotPasswordOpen,
    onClose: onForgotPasswordClose
  } = useDisclosure();

  const getTargetRole = (type?: number): UserRole =>
    Number(type) === UserTypeEnum.STUDENT ? 'student' : 'teacher';

  const clearSsoTokenFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('token');
    nextUrl.searchParams.delete('accessToken');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, []);

  const fetchCourseFastgptToken = useCallback(async (userType?: number) => {
    try {
      const fetchToken =
        Number(userType) === UserTypeEnum.STUDENT
          ? getStudentCourseFastgptToken
          : getTeacherCourseFastgptToken;
      const fastgptRes = await fetchToken();

      if (fastgptRes?.token) {
        localStorage.setItem('course_fastgpt_token', fastgptRes.token);
      }
    } catch (e) {
      console.error('获取 FastGPT token 失败:', e);
    }
  }, []);

  const completeLogin = useCallback(
    async (authInfo: AuthInfo, role?: UserRole) => {
      login({
        id: String(authInfo.userId),
        name: authInfo.username,
        account: authInfo.account,
        token: authInfo.accessToken,
        role: authInfo.roleName,
        avatar: authInfo.avatar,
        teacherId: authInfo.teacherId,
        studentId: authInfo.studentId,
        menuCodes: authInfo.menuCodes,
        type: authInfo.type,
        roleType: authInfo.roleType,
        roleIds: authInfo.roleIds,
        officialIntroDatasetId: authInfo.officialIntroDatasetId,
        introDatasetId: authInfo.introDatasetId
      });

      if (authInfo.studentId > 0) {
        localStorage.setItem('student_access_token', authInfo.accessToken);
        updateStudentAuthUserInfo({
          ...authInfo,
          type: UserTypeEnum.STUDENT,
          roleName: '学生'
        } as StudentAuthInfo);
      } else {
        clearStudentAuth();
        localStorage.removeItem('student_access_token');
      }

      toast({
        title: '登录成功',
        status: 'success',
        duration: 2000,
        position: 'top'
      });

      selectRole(role || getTargetRole(authInfo.type));

      void fetchCourseFastgptToken(authInfo.type);
    },
    [clearStudentAuth, fetchCourseFastgptToken, login, selectRole, toast, updateStudentAuthUserInfo]
  );

  const maybeShowRoleSelect = useCallback(
    async (authInfo: AuthInfo) => {
      const roles: UserRole[] = [];
      if (authInfo.studentId > 0) {
        roles.push('student');
      }
      if (authInfo.teacherId > 0) {
        roles.push('teacher');
      }
      if (
        authInfo.type === UserTypeEnum.TEACHER &&
        authInfo.roleIds &&
        authInfo.roleIds.length > 0
      ) {
        roles.push('admin');
      }

      if (roles.length > 1) {
        setPendingAuthInfo(authInfo);
        setAvailableRoles(roles);
        setIsIdentitySelectOpen(true);
        return;
      }
      await completeLogin(authInfo);
    },
    [completeLogin]
  );

  const handleResetPasswordSuccess = async () => {
    if (!pendingAuthInfo) return;

    const nextAuthInfo = pendingAuthInfo;
    handleResetPasswordClose();
    await completeLogin(nextAuthInfo);
  };

  const handleResetPasswordClose = () => {
    setPendingAuthInfo(null);
    onResetPasswordClose();
  };

  useEffect(() => {
    let active = true;

    const loadTenantDetail = async () => {
      try {
        const tenantDetail = await getTenantDetail();
        if (!active) return;

        const nextLoginBackground =
          tenantDetail?.backgroundImgUrl || tenantDetail?.backgroundImg || DEFAULT_LOGIN_BACKGROUND;
        const nextLoginCover =
          tenantDetail?.sidebarImgUrl || tenantDetail?.sidebarImg || DEFAULT_LOGIN_COVER;
        const nextLoginTitle = tenantDetail?.fullName || DEFAULT_LOGIN_TITLE;
        const nextLoginLogo = tenantDetail?.avatarUrl || tenantDetail?.avatar || DEFAULT_LOGIN_LOGO;

        setLoginBackground(nextLoginBackground);
        setLoginCover(nextLoginCover);
        setLoginTitle(nextLoginTitle);
        setLoginLogo(nextLoginLogo);
      } catch (error) {
        console.error('获取租户登录图片失败:', error);
      }
    };

    void loadTenantDetail();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ssoToken || handledSsoTokenRef.current === ssoToken) return;

    handledSsoTokenRef.current = ssoToken;
    let active = true;

    const handleTokenLogin = async () => {
      setIsLoading(true);

      try {
        const authInfo = normalizeAuthInfo(await getTokenLogin(ssoToken));
        if (!active) return;

        clearSsoTokenFromUrl();

        if (String(authInfo.status) === '0') {
          setPendingAuthInfo(authInfo);
          onResetPasswordOpen();

          toast({
            title: '当前账号需要先修改密码',
            status: 'warning',
            duration: 2000,
            position: 'top'
          });
          return;
        }

        await maybeShowRoleSelect(authInfo);
      } catch (error: any) {
        if (!active) return;
        clearSsoTokenFromUrl();
        toast({
          title: error?.message || error?.msg || '单点登录失败',
          status: 'error',
          duration: 3000,
          position: 'top'
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    handleTokenLogin();

    return () => {
      active = false;
    };
  }, [clearSsoTokenFromUrl, maybeShowRoleSelect, onResetPasswordOpen, ssoToken, toast]);

  const handleLogin = async (ticket?: string, moveLength?: number) => {
    if (!username || !password) {
      toast({
        title: '请输入账号和密码',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    if (!agreement) {
      toast({
        title: '请先同意用户协议和隐私政策',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    setIsLoading(true);
    try {
      const encryptedPassword = await sha256(password);
      const authInfo = normalizeAuthInfo(
        await postLogin({
          account: username,
          password: encryptedPassword,
          ticket: ticket || captchaTicket,
          moveLength:
            moveLength !== undefined
              ? parseInt(moveLength.toString())
              : parseInt(captchaMoveLength.toString())
        })
      );

      if (String(authInfo.status) === '0') {
        setPendingAuthInfo(authInfo);
        onResetPasswordOpen();

        toast({
          title: '当前账号需要先修改密码',
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }

      await maybeShowRoleSelect(authInfo);
    } catch (error: any) {
      toast({
        title: error?.message || error?.msg || '登录失败',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
      setIsCaptchaOpen(false);
    }
  };

  const handleCaptchaSuccess = (ticket: string, moveLength: number) => {
    setCaptchaTicket(ticket);
    setCaptchaMoveLength(moveLength);
    handleLogin(ticket, moveLength);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username || !password) {
      toast({
        title: '请输入账号和密码',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    if (!agreement) {
      toast({
        title: '请先同意用户协议和隐私政策',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    if (isMockMode) {
      await handleLogin();
      return;
    }

    setIsCaptchaOpen(true);
  };

  const handleCaptchaClose = (isSuccess: boolean) => {
    setIsCaptchaOpen(false);
    if (!isSuccess) {
      setIsLoading(false);
    }
  };

  const handleIdentityConfirm = useCallback(
    (role: UserRole) => {
      setIsIdentitySelectOpen(false);
      if (pendingAuthInfo) {
        const nextAuthInfo = {
          ...pendingAuthInfo,
          type: role === 'student' ? UserTypeEnum.STUDENT : UserTypeEnum.TEACHER
        };
        setPendingAuthInfo(null);
        setAvailableRoles([]);
        void completeLogin(nextAuthInfo, role);
      }
    },
    [completeLogin, pendingAuthInfo]
  );

  const handleBackToLogin = useCallback(() => {
    setIsIdentitySelectOpen(false);
    setPendingAuthInfo(null);
    setAvailableRoles([]);
  }, []);

  const handleWechatLoginSuccess = useCallback(
    async (authInfo: AuthInfo) => {
      setIsWechatLoginOpen(false);
      if (!authInfo) {
        return;
      }
      await maybeShowRoleSelect(authInfo);
    },
    [maybeShowRoleSelect]
  );

  return (
    <>
      <Flex
        minH="100vh"
        bgImage={`url('${loginBackground}')`}
        bgRepeat="no-repeat"
        bgPosition="center"
        bgSize="cover"
        px={8}
        py={10}
        position="relative"
        align="center"
        justify="center"
      >
        <Box position="absolute" top={6} left={6}>
          <Image src={loginLogo} alt="logo" h="36px" maxW="160px" objectFit="contain" />
        </Box>

        <Flex
          w="100%"
          maxW="1480px"
          maxH="800px"
          minH="650px"
          bg="rgba(255,255,255,0.96)"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.12)"
          overflow="hidden"
          direction="row"
          position="relative"
        >
          <Box position="absolute" top={4} right={6} zIndex={1}>
            <Menu placement="bottom-end">
              <MenuButton
                as={Text}
                fontSize="sm"
                color="#86909C"
                cursor="pointer"
                display="flex"
                alignItems="center"
                gap={1}
              >
                {locale === 'zh-CN' ? '简体中文' : locale === 'zh-Hant' ? '繁體中文' : 'EN'}
                <ChevronDownIcon boxSize={4} />
              </MenuButton>
              <MenuList minW="120px">
                <MenuItem
                  onClick={() => changeLocale('zh-CN')}
                  color={locale === 'zh-CN' ? '#C8000B' : undefined}
                  fontWeight={locale === 'zh-CN' ? 600 : 400}
                >
                  简体中文
                </MenuItem>
                <MenuItem
                  onClick={() => changeLocale('zh-Hant')}
                  color={locale === 'zh-Hant' ? '#C8000B' : undefined}
                  fontWeight={locale === 'zh-Hant' ? 600 : 400}
                >
                  繁體中文
                </MenuItem>
                <MenuItem
                  onClick={() => changeLocale('en')}
                  color={locale === 'en' ? '#C8000B' : undefined}
                  fontWeight={locale === 'en' ? 600 : 400}
                >
                  EN
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>

          <Flex
            flex="0 0 52%"
            minH="480px"
            bgSize="cover"
            bgPosition="center"
            position="relative"
            p={10}
            align="flex-end"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(31, 120, 212, 0.15) 0%, rgba(214, 72, 35, 0.38) 100%), url('${loginCover}')`
            }}
          >
            {/* <Box position="absolute" bottom={10} left={10} color="white">
              <Heading size="lg" mb={2}>
                高中 AI 教学平台
              </Heading>
              <Text fontSize="sm" opacity={0.9}>
                智能化教学管理 · 个性化学习体验
              </Text>
            </Box> */}
          </Flex>

          <Flex flex="1" align="center" justify="center" px={14} py={12}>
            <Box as="form" w="100%" maxW="360px" onSubmit={handleSubmit}>
              <VStack spacing={0} align="stretch">
                <Heading
                  textAlign="center"
                  color="#333"
                  fontFamily="PingFang SC"
                  fontSize="26px"
                  fontStyle="normal"
                  fontWeight="600"
                  lineHeight="26px"
                  letterSpacing="0.26px"
                  mb={3}
                >
                  欢迎使用 {loginTitle}
                </Heading>
                <Text textAlign="center" color="#4E5969" fontSize="14px" mb={8}>
                  统一登录入口
                </Text>

                {isMockMode && (
                  <Box mb={5} p={3} borderRadius="10px" bg="#FFF7F0" border="1px solid #FFE0C2">
                    <Flex align="center" justify="space-between" mb={2}>
                      <Text fontSize="12px" fontWeight={600} color="#7C2D12">
                        Mock 演示账号
                      </Text>
                      <Text fontSize="11px" color="#9A3412">
                        密码：Xx@123456
                      </Text>
                    </Flex>
                    <Flex gap={2} wrap="wrap">
                      {MOCK_LOGIN_ACCOUNTS.map((item) => (
                        <Box
                          as="button"
                          type="button"
                          key={item.account}
                          px={2.5}
                          py={1.5}
                          borderRadius="7px"
                          bg="white"
                          border="1px solid #FED7AA"
                          fontSize="11px"
                          color="#9A3412"
                          cursor="pointer"
                          _hover={{ bg: '#FFEDD5' }}
                          onClick={() => {
                            setUsername(item.account);
                            setPassword('Xx@123456');
                          }}
                        >
                          {item.label}
                        </Box>
                      ))}
                    </Flex>
                  </Box>
                )}

                <FormControl mb={5} isRequired>
                  <Text fontSize="12px" color="#333" mb={2}>
                    手机号/账号
                  </Text>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    leftIcon={<SvgIcon src="/imgs/teacher/login/user.svg" alt="用户" size="16px" />}
                    placeholder="请输入手机号/账号"
                  />
                </FormControl>

                <FormControl isRequired>
                  <Text fontSize="12px" color="#333" mb={2}>
                    密码
                  </Text>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<SvgIcon src="/imgs/teacher/login/psw.svg" alt="密码" size="16px" />}
                    isPassword
                    placeholder="请输入密码"
                  />
                </FormControl>

                <Flex align="flex-start" justify="space-between" gap={2} mb={5} mt={2}>
                  <Flex align="flex-start" gap={2} flex={1}>
                    <Checkbox
                      mt="1px"
                      isChecked={agreement}
                      onChange={(e) => setAgreement(e.target.checked)}
                    />
                    <Text fontSize="12px" lineHeight="20px" color="#666">
                      我已阅读并同意{' '}
                      <Link
                        color="#C8000B"
                        href="https://privacy.huayuntiantu.com/user-agreement.html"
                        isExternal
                      >
                        用户协议
                      </Link>{' '}
                      和{' '}
                      <Link
                        color="#C8000B"
                        href="https://privacy.huayuntiantu.com/kit-privacy.html"
                        isExternal
                      >
                        隐私政策
                      </Link>
                    </Text>
                  </Flex>
                  <Text
                    fontSize="12px"
                    lineHeight="20px"
                    color="#666"
                    cursor="pointer"
                    flexShrink={0}
                    onClick={onForgotPasswordOpen}
                  >
                    忘记密码？
                  </Text>
                </Flex>

                <Button
                  type="submit"
                  w="100%"
                  isLoading={isLoading}
                  loadingText="登录中..."
                  isDisabled={!username || !password || !agreement}
                >
                  登录
                </Button>

                <Flex align="center" gap={4} my={6}>
                  <Divider borderColor="#EDEDED" />
                  <Text flexShrink={0} fontSize="12px" color="#999">
                    更多方式
                  </Text>
                  <Divider borderColor="#EDEDED" />
                </Flex>

                <Flex justify="center">
                  <Flex
                    boxSize="32px"
                    borderRadius="full"
                    bg="#F5F5F5"
                    align="center"
                    justify="center"
                    cursor="pointer"
                    onClick={() => setIsWechatLoginOpen(true)}
                  >
                    <SvgIcon
                      src="/imgs/teacher/login/wx.svg"
                      alt="微信登录"
                      width="18px"
                      height="18px"
                    />
                  </Flex>
                </Flex>
              </VStack>
            </Box>
          </Flex>
        </Flex>
      </Flex>

      <SliderCaptchaModal
        isOpen={isCaptchaOpen}
        onClose={handleCaptchaClose}
        onVerifySuccess={handleCaptchaSuccess}
        type={1 as CaptchaTypeEnum}
      />
      <TeacherResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={handleResetPasswordClose}
        onSuccess={handleResetPasswordSuccess}
        accessToken={pendingAuthInfo?.accessToken}
        defaultMobile={
          pendingAuthInfo?.phone && /^1\d{10}$/.test(pendingAuthInfo.phone)
            ? pendingAuthInfo.phone
            : /^1\d{10}$/.test(username)
              ? username
              : ''
        }
        forceReset={!!pendingAuthInfo}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={onForgotPasswordClose}
        defaultMobile={/^1\d{10}$/.test(username) ? username : ''}
      />

      <IdentitySelectModal
        isOpen={isIdentitySelectOpen}
        availableRoles={availableRoles}
        onConfirm={handleIdentityConfirm}
        onBackToLogin={handleBackToLogin}
      />

      <WechatLoginModal
        isOpen={isWechatLoginOpen}
        onClose={() => setIsWechatLoginOpen(false)}
        onLoginSuccess={handleWechatLoginSuccess}
      />
    </>
  );
}
