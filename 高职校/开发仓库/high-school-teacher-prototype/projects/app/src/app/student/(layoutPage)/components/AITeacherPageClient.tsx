'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode, SVGProps } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  GridItem,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';
import {
  getStudentAiTeacherStats,
  getStudentCourseList,
  joinAvatarStudy,
  queryStudentPreference,
  saveStudentPreference
} from '@/api/student/student';
import type {
  StudentAiTeacherStatsVO,
  StudentCourseCardVO,
  StudentPreferenceRequest,
  StudentPreferenceVO
} from '@/types/api/student/student';
import { useStudentAuthStore } from '@/student/store/auth';
import { useStudentPreferenceStore } from '@/student/store/preference';
import {
  aiTeacherPageConfig,
  defaultAiTeacherPreferenceState,
  type AiTeacherCourse,
  type AiTeacherCourseStatus,
  type AiTeacherMetric,
  type AiTeacherPreferenceState,
  type AiTeacherTab,
  type AiTeacherTabKey,
  type LearningPaceOptionId,
  type PreferenceGroup,
  type PreferenceOptionId,
  type TeacherStyleOptionId
} from '../aiTeacherTypes';
import { designTokens, studentProfileTokens } from '@/theme/designTokens';

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: studentProfileTokens.card.border,
  borderRadius: '20px',
  boxShadow: studentProfileTokens.card.shadow
} as const;

const inputStyle = {
  w: '274px',
  h: '40px',
  borderRadius: '14px',
  borderColor: studentProfileTokens.input.borderColor,
  bg: '#FFFFFF',
  fontSize: designTokens.typography.size.sm,
  color: studentProfileTokens.input.color,
  _placeholder: {
    color: '#9CA3AF'
  },
  _hover: { borderColor: '#D0D5DD' },
  _focusVisible: {
    borderColor: designTokens.colors.complementary,
    boxShadow: `0 0 0 1px ${designTokens.colors.complementary}`
  }
} as const;

const statusColorMap: Record<
  AiTeacherCourseStatus,
  { bg: string; color: string; progress: string; actionBg: string; actionHover: string }
> = {
  locked: {
    bg: '#F5F6F8',
    color: '#98A2B3',
    progress: '#D0D5DD',
    actionBg: '#C6C9CF',
    actionHover: '#C6C9CF'
  },
  learning: {
    bg: '#2B2D31',
    color: designTokens.colors.textWhite,
    progress: '#E60B12',
    actionBg: '#2F3136',
    actionHover: '#1F2125'
  },
  completed: {
    bg: '#FFF1F2',
    color: '#D7000F',
    progress: '#E60B12',
    actionBg: '#D7000F',
    actionHover: '#B9000D'
  }
};

const courseCoverTones = [
  'linear-gradient(135deg, #FDE8E8, #FEE2B3)',
  'linear-gradient(135deg, #FFE9D6, #FFF1BF)',
  'linear-gradient(135deg, #FDE68A, #FEF3C7)',
  'linear-gradient(135deg, #FFE4E6, #FBCFE8)',
  'linear-gradient(135deg, #F3E8FF, #FBCFE8)'
] as const;

const heroAvatarSrc = '/imgs/app/student/ai_teacher.png';

const teacherStyleValueMap: Record<TeacherStyleOptionId, number> = {
  gentle: 1,
  professional: 2,
  funny: 3,
  inspiring: 4
};

const learningPaceValueMap: Record<LearningPaceOptionId, number> = {
  fast: 1,
  steady: 2,
  deepDive: 3
};

const explanationMethodCodeMap: Record<
  Extract<PreferenceOptionId, 'stepByStep' | 'dialogue' | 'visual' | 'analogy' | 'caseStudy'>,
  string
> = {
  stepByStep: '1',
  dialogue: '2',
  visual: '3',
  analogy: '4',
  caseStudy: '5'
};

const coursewareTypeCodeMap: Record<
  Extract<PreferenceOptionId, 'article' | 'audio' | 'interactive' | 'video' | 'code' | 'project'>,
  string
> = {
  article: '1',
  audio: '2',
  interactive: '3',
  video: '4',
  code: '5',
  project: '6'
};

const feedbackStyleCodeMap: Record<
  Extract<PreferenceOptionId, 'corrective' | 'encouraging' | 'summary'>,
  string
> = {
  corrective: '1',
  encouraging: '2',
  summary: '3'
};

const teacherStyleReverseMap = new Map<number, TeacherStyleOptionId>(
  Object.entries(teacherStyleValueMap).map(([key, value]) => [value, key as TeacherStyleOptionId])
);

const learningPaceReverseMap = new Map<number, LearningPaceOptionId>(
  Object.entries(learningPaceValueMap).map(([key, value]) => [value, key as LearningPaceOptionId])
);

const explanationMethodReverseMap = new Map<string, PreferenceOptionId>(
  Object.entries(explanationMethodCodeMap).map(([key, value]) => [value, key as PreferenceOptionId])
);

const coursewareTypeReverseMap = new Map<string, PreferenceOptionId>(
  Object.entries(coursewareTypeCodeMap).map(([key, value]) => [value, key as PreferenceOptionId])
);

const feedbackStyleReverseMap = new Map<string, PreferenceOptionId>(
  Object.entries(feedbackStyleCodeMap).map(([key, value]) => [value, key as PreferenceOptionId])
);

const emptyMetrics: AiTeacherMetric[] = [
  { key: 'teacherCount', value: '0' },
  { key: 'interactionCount', value: '0' },
  { key: 'studyDuration', value: '0h' }
];

const isZhLocale = (locale: string) => locale.toLowerCase().startsWith('zh');

const createDefaultPreferenceState = (): AiTeacherPreferenceState => ({
  ...defaultAiTeacherPreferenceState,
  sliderValues: {
    ...defaultAiTeacherPreferenceState.sliderValues
  },
  selectedOptions: [...defaultAiTeacherPreferenceState.selectedOptions]
});

const parseCodeValue = (
  rawValue: string | undefined,
  reverseMap: Map<string, PreferenceOptionId>
): PreferenceOptionId[] =>
  (rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => reverseMap.get(item))
    .filter((item): item is PreferenceOptionId => Boolean(item));

const mapPreferenceToState = (preference?: StudentPreferenceVO): AiTeacherPreferenceState => {
  if (!preference) {
    return createDefaultPreferenceState();
  }

  const selectedOptions = [
    ...parseCodeValue(preference.explanationMethods, explanationMethodReverseMap),
    ...parseCodeValue(preference.coursewareTypes, coursewareTypeReverseMap),
    ...parseCodeValue(preference.feedbackStyle, feedbackStyleReverseMap)
  ];

  return {
    id: preference.id,
    teachingStyle:
      (preference.teachingStyle !== undefined
        ? teacherStyleReverseMap.get(preference.teachingStyle)
        : undefined) ?? defaultAiTeacherPreferenceState.teachingStyle,
    learningPace:
      (preference.learningPace !== undefined
        ? learningPaceReverseMap.get(preference.learningPace)
        : undefined) ?? defaultAiTeacherPreferenceState.learningPace,
    sliderValues: {
      depth: preference.explanationDepth || defaultAiTeacherPreferenceState.sliderValues.depth,
      interaction:
        preference.interactionFrequency || defaultAiTeacherPreferenceState.sliderValues.interaction
    },
    selectedOptions:
      selectedOptions.length > 0
        ? selectedOptions
        : [...defaultAiTeacherPreferenceState.selectedOptions]
  };
};

const buildPreferencePayload = (
  preferenceState: AiTeacherPreferenceState,
  preferenceGroups: PreferenceGroup[]
): StudentPreferenceRequest => {
  const getCodesByGroup = (groupId: PreferenceGroup['id'], codeMap: Record<string, string>) => {
    const optionIds = preferenceGroups.find((item) => item.id === groupId)?.optionIds ?? [];

    return optionIds
      .filter((optionId) => preferenceState.selectedOptions.includes(optionId))
      .map((optionId) => codeMap[optionId])
      .filter(Boolean)
      .join(',');
  };

  return {
    ...(preferenceState.id !== undefined ? { id: preferenceState.id } : {}),
    teachingStyle: teacherStyleValueMap[preferenceState.teachingStyle],
    explanationDepth: preferenceState.sliderValues.depth,
    interactionFrequency: preferenceState.sliderValues.interaction,
    explanationMethods: getCodesByGroup('teachingMethod', explanationMethodCodeMap),
    coursewareTypes: getCodesByGroup('contentFormat', coursewareTypeCodeMap),
    feedbackStyle: getCodesByGroup('feedbackStyle', feedbackStyleCodeMap),
    learningPace: learningPaceValueMap[preferenceState.learningPace]
  };
};

const mapStatsToMetrics = (stats?: StudentAiTeacherStatsVO): AiTeacherMetric[] => {
  if (!stats) return emptyMetrics;

  return [
    { key: 'teacherCount', value: String(stats.aiTeacherCount ?? 0) },
    { key: 'interactionCount', value: String(stats.interactionCount ?? 0) },
    { key: 'studyDuration', value: `${stats.totalStudyHours ?? 0}h` }
  ];
};

const mapStudyStatusToCourseStatus = (studyStatus: number): AiTeacherCourseStatus => {
  if (studyStatus === 0) return 'locked';
  if (studyStatus === 3) return 'completed';
  return 'learning';
};

const formatUnlockDate = (date: string | undefined, locale: string) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  const month = parsedDate.getMonth() + 1;
  const day = parsedDate.getDate();

  return isZhLocale(locale) ? `${month}月${day}日` : `${month}/${day}`;
};

const mapCourses = (courses: StudentCourseCardVO[]): AiTeacherCourse[] =>
  courses.map((course) => {
    const status = mapStudyStatusToCourseStatus(course.studyStatus);

    return {
      courseId: course.courseId,
      teachingTaskId: course.teachingTaskId,
      avatarId: course.avatarId,
      courseType: course.courseType,
      hours: course.hours,
      courseName: course.courseName,
      courseImage: course.courseImage,
      majorName: course.majorName,
      teacherName: course.teacherName,
      studentCount: course.studentCount,
      progress: Math.max(0, Math.min(100, course.progress ?? 0)),
      status,
      actionKey: status === 'locked' ? 'locked' : status === 'completed' ? 'review' : 'continue',
      availableTabs: [course.courseType === 2 ? 'optional' : 'required', 'all'],
      unlockDate: course.startTime || undefined
    };
  });

const buildTabs = (courses: AiTeacherCourse[]): AiTeacherTab[] => {
  const requiredCount = courses.filter((course) => course.courseType !== 2).length;
  const optionalCount = courses.filter((course) => course.courseType === 2).length;

  return [
    { key: 'required', count: requiredCount },
    { key: 'optional', count: optionalCount },
    { key: 'all', count: courses.length }
  ];
};

// 统一由首页构建详情 query，避免后续页面再猜测字段来源。
const buildCourseDetailUrl = (course: AiTeacherCourse) => {
  const searchParams = new URLSearchParams({
    avatarId: String(course.avatarId),
    courseId: String(course.courseId),
    teachingTaskId: String(course.teachingTaskId),
    majorName: course.majorName,
    teacherName: course.teacherName,
    hours: String(course.hours)
  });

  return `/student/course-detail?${searchParams.toString()}`;
};

export function AITeacherPageClient({
  showExploreBanner = true
}: {
  showExploreBanner?: boolean;
}) {
  const { t } = useTranslation('student');
  const { toast } = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const studentInfo = useStudentAuthStore((state: any) => state.userInfo);

  const [activeTab, setActiveTab] = useState<AiTeacherTabKey>('required');
  const [keyword, setKeyword] = useState('');
  const [metrics, setMetrics] = useState<AiTeacherMetric[]>(emptyMetrics);
  const [allCourses, setAllCourses] = useState<AiTeacherCourse[]>([]);
  const [preferenceState, setPreferenceState] = useState<AiTeacherPreferenceState>(() =>
    createDefaultPreferenceState()
  );
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [actingCourseId, setActingCourseId] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    setIsBootstrapping(true);
    setPreferenceState(createDefaultPreferenceState());

    const loadData = async () => {
      const [statsResult, coursesResult, preferenceResult] = await Promise.allSettled([
        getStudentAiTeacherStats({}),
        getStudentCourseList({}),
        queryStudentPreference({})
      ]);

      if (!active) return;

      if (statsResult.status === 'fulfilled') {
        setMetrics(mapStatsToMetrics(statsResult.value));
      } else {
        setMetrics(emptyMetrics);
        toast({
          title: '获取首页统计失败',
          status: 'error'
        });
      }

      if (coursesResult.status === 'fulfilled') {
        setAllCourses(mapCourses(coursesResult.value));
      } else {
        setAllCourses([]);
        toast({
          title: '获取课程列表失败',
          status: 'error'
        });
      }

      if (preferenceResult.status === 'fulfilled') {
        setPreferenceState(mapPreferenceToState(preferenceResult.value));
        // 存入全局 store，供其他页面使用
        useStudentPreferenceStore.getState().setPreference(preferenceResult.value);
      }

      setIsBootstrapping(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [toast]);

  const tabs = useMemo(() => buildTabs(allCourses), [allCourses]);
  const totalCourseCount = allCourses.length;

  const courses = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return allCourses.filter((course) => {
      const inTab = activeTab === 'all' ? true : course.availableTabs.includes(activeTab);
      const title = course.courseName.trim().toLowerCase();

      return inTab && (!normalizedKeyword || title.includes(normalizedKeyword));
    });
  }, [activeTab, allCourses, keyword]);

  const handleSavePreference = async () => {
    try {
      setIsSavingPreference(true);
      await saveStudentPreference(
        buildPreferencePayload(preferenceState, aiTeacherPageConfig.preferenceGroups)
      );
      toast({
        title: 'AI教师风格保存成功',
        status: 'success'
      });
      onClose();
    } catch {
      toast({
        title: 'AI教师风格保存失败',
        status: 'error'
      });
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleCourseAction = async (course: AiTeacherCourse) => {
    if (course.status === 'locked') return;

    try {
      setActingCourseId(course.courseId);
      if (course.courseType === 2) {
        await joinAvatarStudy({
          avatarId: course.avatarId
        });
      }
      router.push(buildCourseDetailUrl(course));
    } catch {
      toast({
        title: '进入课程失败',
        status: 'error'
      });
    } finally {
      setActingCourseId(null);
    }
  };

  return (
    <Box>
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', lg: 'center' }}
        gap={{ base: 4, lg: 6 }}
        mb="20px"
      >
        <HStack spacing={{ base: 3, md: 4 }} align="center" minW={0}>
          <Box
            position="relative"
            w={{ base: '64px', md: '85px' }}
            h={{ base: '64px', md: '94px' }}
            flexShrink={0}
          >
            <Box
              as="img"
              src={heroAvatarSrc}
              alt="AI Teacher Avatar"
              w="100%"
              h="100%"
              objectFit="contain"
            />
          </Box>

          <Box minW={0}>
            <Text
              mb="4px"
              fontSize={{ base: '18px', md: '18px' }}
              fontWeight={600}
              color="#C8000B"
              lineHeight="1.15"
            >
              {t('aiTeacher.hero.title')}
            </Text>
            <Text fontSize={{ base: '16px', md: '16px' }} color="#4E5969" lineHeight="1.6">
              {t('aiTeacher.hero.description')}
            </Text>
          </Box>
        </HStack>

        <HStack
          spacing="12px"
          align="center"
          flexShrink={0}
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          justify={{ base: 'flex-start', lg: 'flex-end' }}
        >
          <Box position="relative" minW={{ base: '100%', md: '274px' }}>
            <Box
              position="absolute"
              right="14px"
              top="50%"
              transform="translateY(-50%)"
              color="#667085"
              zIndex={1}
            >
              <SearchIcon width="18px" height="18px" />
            </Box>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t('aiTeacher.hero.searchPlaceholder')}
              pr="44px"
              {...inputStyle}
            />
          </Box>
          <Button
            leftIcon={<SettingsIcon width="15px" height="15px" />}
            onClick={onOpen}
            h="40px"
            p="8px 12px"
            bg="#2F3136"
            borderRadius="12px"
            color="#FFFFFF"
            fontSize="14px"
            fontWeight={600}
            _hover={{ bg: '#1F2125' }}
          >
            {t('aiTeacher.hero.configButton')}
          </Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="16px" mb="22px">
        {(metrics.length > 0 ? metrics : emptyMetrics).map((metric) => (
          <GridItem key={metric.key}>
            <MetricCard
              value={metric.value}
              label={t(`aiTeacher.metrics.${metric.key}.label`)}
              icon={<MetricIcon metricKey={metric.key} width="20px" height="20px" />}
              tone={t(`aiTeacher.metrics.${metric.key}.tone`) as 'brand' | 'orange' | 'gold'}
            />
          </GridItem>
        ))}
      </Grid>

      <Flex align="center" gap="8px" mb="16px">
        <BookOpenIcon width="20px" height="20px" color="#C83E3E" />
        <Text fontSize="18px" fontWeight={600} color="#1F2937">
          {t('aiTeacher.myCourses.title')}
        </Text>
        <Text fontSize="14px" color="#9CA3AF">
          {t('aiTeacher.myCourses.count', { count: totalCourseCount })}
        </Text>
      </Flex>

      <HStack spacing="20px" mb="18px" overflowX="auto" pb="4px" align="center">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Button
              minW={'140px'}
              key={tab.key}
              variant="ghost"
              onClick={() => setActiveTab(tab.key)}
              h="38px"
              px={active ? '14px' : '0'}
              borderRadius="12px"
              bg={active ? '#FFECED' : 'transparent'}
              color={active ? '#C8000B' : '#2D3648'}
              fontSize="16px"
              fontWeight={active ? 600 : 500}
              flexShrink={0}
              rightIcon={
                <Badge
                  minW="20px"
                  h="20px"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="full"
                  bg="#FFF"
                  color="#D7000F"
                  fontSize="12px"
                  fontWeight={600}
                  lineHeight={'20px'}
                >
                  {tab.count}
                </Badge>
              }
              _hover={{
                bg: active ? '#FFECED' : 'transparent',
                color: '#D7000F'
              }}
            >
              {t(`aiTeacher.tabs.${tab.key}`)}
            </Button>
          );
        })}
      </HStack>

      {isBootstrapping ? (
        <Box {...cardStyle} p="24px" mb="20px">
          <Text color={designTokens.colors.textSecondary}>正在加载 AI 教师课程...</Text>
        </Box>
      ) : courses.length > 0 ? (
        <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="18px" mb="20px">
          {courses.map((course, index) => (
            <CourseCard
              key={`${course.courseId}-${course.avatarId}`}
              course={course}
              coverTone={courseCoverTones[index % courseCoverTones.length] ?? courseCoverTones[0]}
              isLoading={actingCourseId === course.courseId}
              onAction={handleCourseAction}
            />
          ))}
        </Grid>
      ) : (
        <Box {...cardStyle} p="24px" mb="20px">
          <Text color={designTokens.colors.textSecondary}> {t('aiTeacher.explore.empty')}</Text>
        </Box>
      )}

      {showExploreBanner && (
        <Box
          borderRadius="18px"
          p={{ base: '20px', md: '24px 28px' }}
          border="1px solid #F6E1E2"
          background={
            'linear-gradient(180deg, rgba(255, 247, 247, 1) 0%, rgba(255, 248, 236, 1) 100%);'
          }
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap="16px"
          >
            <Box>
              <Text mb="6px" fontSize="18px" fontWeight={600} color="#1F2937">
                {t('aiTeacher.explore.title')}
              </Text>
              <Text fontSize="15px" color="#667085">
                {t('aiTeacher.explore.description')}
              </Text>
            </Box>
            <Button
              as={NextLink}
              href="/student/course-plaza"
              rightIcon={<ArrowRightIcon width="16px" height="16px" />}
              h="48px"
              px="26px"
              bg="#D7000F"
              color="#FFFFFF"
              borderRadius="14px"
              fontSize="16px"
              fontWeight={600}
              _hover={{ bg: '#B9000D', textDecoration: 'none' }}
            >
              {t('aiTeacher.explore.action')}
            </Button>
          </Flex>
        </Box>
      )}

      <TeacherConfigModal
        isOpen={isOpen}
        onClose={onClose}
        isSaving={isSavingPreference}
        preferenceState={preferenceState}
        onSave={handleSavePreference}
        onSelectLearningPace={(value) =>
          setPreferenceState((state) => ({
            ...state,
            learningPace: value
          }))
        }
        onSelectStyle={(value) =>
          setPreferenceState((state) => ({
            ...state,
            teachingStyle: value
          }))
        }
        onToggleOption={(optionId) =>
          setPreferenceState((state) => ({
            ...state,
            selectedOptions: state.selectedOptions.includes(optionId)
              ? state.selectedOptions.filter((item) => item !== optionId)
              : [...state.selectedOptions, optionId]
          }))
        }
        onSliderChange={(key, value) =>
          setPreferenceState((state) => ({
            ...state,
            sliderValues: {
              ...state.sliderValues,
              [key]: value
            }
          }))
        }
      />
    </Box>
  );
}

function MetricCard({
  icon,
  label,
  tone,
  value
}: {
  icon: ReactNode;
  label: string;
  tone: 'brand' | 'orange' | 'gold';
  value: string;
}) {
  const toneMap = {
    brand: {
      border: '#ffd0d0',
      iconBg: 'linear-gradient(95deg, #FFF 12.6%, #FFF5F5 93.91%)',
      icon: '/imgs/app/student/brand_icon.png'
    },
    orange: {
      border: '#b9eafa',
      iconBg: 'linear-gradient(95deg, #FFF 12.6%, #F5FFFE 93.91%)',
      icon: '/imgs/app/student/orange_icon.png'
    },
    gold: {
      border: '#ffd7c3',
      iconBg: 'linear-gradient(95deg, #FFF 12.6%, #FFF6F2 93.91%)',
      icon: '/imgs/app/student/gold_icon.png'
    }
  } as const;
  const currentTone = toneMap[tone];

  return (
    <Box
      borderRadius="16px"
      padding={'25px 32px 24px 24px'}
      bg={currentTone.iconBg}
      border={`1px solid ${currentTone.border}`}
    >
      <Flex align="center" justify="space-between" gap="16px">
        <Box>
          <Text fontSize="20px" lineHeight="1" fontWeight={700} color="#333">
            {value}
          </Text>
          <Text mt="14px" fontSize="16px" color="#86909C">
            {label}
          </Text>
        </Box>
        <Box
          as="img"
          src={currentTone.icon}
          alt="AI Teacher Avatar"
          w="40px"
          h="40px"
          objectFit="contain"
        />
      </Flex>
    </Box>
  );
}

function CourseCard({
  course,
  coverTone,
  isLoading,
  onAction
}: {
  course: AiTeacherCourse;
  coverTone: string;
  isLoading: boolean;
  onAction: (course: AiTeacherCourse) => Promise<void>;
}) {
  const { i18n, t } = useTranslation('student');
  const statusTone = statusColorMap[course.status];
  const progressValue = Math.max(0, Math.min(100, course.progress));
  const unlockDate = formatUnlockDate(course.unlockDate, i18n.language);
  const statusBadge = {
    locked: { bg: '#FFFFFF', color: '#98A2B3' },
    learning: { bg: '#FFFFFF', color: '#2B2D31' },
    completed: { bg: '#FFF1F2', color: '#D7000F' }
  }[course.status];
  const actionLabel =
    course.actionKey === 'locked'
      ? t('aiTeacher.actions.locked', { date: unlockDate || course.unlockDate || '--' })
      : t(`aiTeacher.actions.${course.actionKey}`);

  return (
    <Box
      {...cardStyle}
      overflow="hidden"
      bg="#FFFFFF"
      borderColor="#E9EDF3"
      borderRadius="16px"
      boxShadow="0 5px 8.8px 0 rgba(0, 0, 0, 0.05)"
      opacity={course.status === 'locked' ? 0.9 : 1}
      transition={designTokens.transitions.normal}
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.12)'
      }}
    >
      <Box
        position="relative"
        h="144px"
        bg={coverTone}
        m="8px 8px 0"
        borderRadius="14px"
        overflow="hidden"
      >
        <Box
          as="img"
          src={course.courseImage}
          alt={course.courseName}
          w="100%"
          h="100%"
          objectFit="cover"
          filter={course.status === 'locked' ? 'grayscale(38%)' : 'none'}
        />
        <Badge
          position="absolute"
          top="10px"
          right="10px"
          display="flex"
          alignItems="center"
          gap="4px"
          px="9px"
          py="5px"
          borderRadius="10px"
          bg={statusBadge.bg}
          color={statusBadge.color}
          border="1px solid rgba(15,23,42,0.08)"
          fontSize="12px"
        >
          {t(`aiTeacher.status.${course.status}`)}
        </Badge>
        {course.status === 'locked' && (
          <Flex position="absolute" inset={0} align="center" justify="center" bg="rgba(0,0,0,0.18)">
            <Flex
              w="52px"
              h="52px"
              borderRadius="full"
              bg="rgba(255,255,255,0.88)"
              align="center"
              justify="center"
              color={designTokens.colors.textSecondary}
            >
              <LockIcon width="24px" height="24px" />
            </Flex>
          </Flex>
        )}
        <Box
          position="absolute"
          left="10px"
          right="10px"
          bottom="8px"
          h="7px"
          borderRadius="full"
          bg="#fff"
          border="1px solid #fff"
        >
          <Box
            h="100%"
            w={progressValue > 0 ? `${progressValue}%` : '0%'}
            borderRadius="full"
            bg="#E60B12"
            transition="width 0.2s ease"
          />
        </Box>
      </Box>

      <Box p="14px">
        <Text
          mb="8px"
          fontSize="16px"
          fontWeight={designTokens.typography.weight.semibold}
          color={designTokens.colors.textPrimary}
          noOfLines={1}
        >
          {course.courseName}
        </Text>
        <Text mb="12px" fontSize="14px" color={designTokens.colors.textTertiary}>
          {t('aiTeacher.courseMeta.majorLine', { major: course.majorName })}
        </Text>
        <Flex justify="space-between" align="center" mb="14px" gap="10px">
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            color={'#4E5969'}
            fontSize="12px"
            border="1px solid #F2F3F5"
            borderRadius="12px"
            bg="#FAFBFC"
            width={'205px'}
            maxWidth={'205px'}
            height={'38px'}
          >
            <HStack spacing="4px" px="6px" minW={0}>
              <UserIcon width="16px" height="16px" />
              <Text noOfLines={1}>{course.teacherName}</Text>
            </HStack>
            <Box w="1px" h="14px" bg="#E2E8F0" margin={`0 27px`} />
            <HStack spacing="4px" px="6px" minW={0}>
              <GroupIcon width="16px" height="16px" />
              <Text noOfLines={1}>
                {t('aiTeacher.courseMeta.studentCount', { count: course.studentCount })}
              </Text>
            </HStack>
          </Box>
          <Text fontSize="14px" fontWeight={700} color={'#C8000B'} flexShrink={0}>
            {progressValue}%
          </Text>
        </Flex>

        {course.actionKey === 'locked' ? (
          <Button
            w="100%"
            isDisabled
            leftIcon={<CalendarIcon width="14px" height="14px" />}
            h="40px"
            bg={statusTone.actionBg}
            color="#FFFFFF"
            borderRadius="12px"
            _disabled={{ bg: statusTone.actionBg, color: '#FFFFFF', opacity: 1 }}
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            w="100%"
            h="40px"
            bg={statusTone.actionBg}
            color={designTokens.colors.textWhite}
            borderRadius="12px"
            fontWeight={600}
            isLoading={isLoading}
            onClick={() => {
              void onAction(course);
            }}
            _hover={{ bg: statusTone.actionHover }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}

function TeacherConfigModal({
  isOpen,
  onClose,
  isSaving,
  preferenceState,
  onSave,
  onSelectLearningPace,
  onSelectStyle,
  onSliderChange,
  onToggleOption
}: {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  preferenceState: AiTeacherPreferenceState;
  onSave: () => Promise<void>;
  onSelectLearningPace: (value: LearningPaceOptionId) => void;
  onSelectStyle: (value: TeacherStyleOptionId) => void;
  onSliderChange: (key: 'depth' | 'interaction', value: number) => void;
  onToggleOption: (value: PreferenceOptionId) => void;
}) {
  const { t } = useTranslation('student');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg={designTokens.modal.overlay} backdropFilter="blur(6px)" />
      <ModalContent borderRadius="24px" overflow="hidden">
        <ModalHeader borderBottom={`1px solid ${designTokens.colors.borderLight}`} py="20px">
          <HStack spacing="12px">
            <Flex
              w="40px"
              h="40px"
              borderRadius="16px"
              bg={designTokens.colors.complementaryLight}
              color={designTokens.colors.complementary}
              align="center"
              justify="center"
            >
              <SettingsIcon width="18px" height="18px" />
            </Flex>
            <Box>
              <Text
                fontSize={designTokens.typography.size.lg}
                fontWeight={designTokens.typography.weight.semibold}
              >
                {t('aiTeacher.config.title')}
              </Text>
              <Text
                mt="2px"
                fontSize={designTokens.typography.size.sm}
                color={designTokens.colors.textTertiary}
              >
                {t('aiTeacher.config.description')}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py="24px">
          <Stack spacing="28px">
            <Box>
              <Text
                mb="14px"
                fontSize={designTokens.typography.size.base}
                fontWeight={designTokens.typography.weight.semibold}
              >
                {t('aiTeacher.config.sections.style')}
              </Text>
              <RadioGroup
                value={preferenceState.teachingStyle}
                onChange={(value) => onSelectStyle(value as TeacherStyleOptionId)}
              >
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="20px">
                  {aiTeacherPageConfig.styleOptions.map((option) => {
                    const checked = preferenceState.teachingStyle === option.id;

                    return (
                      <Box
                        key={option.id}
                        as="label"
                        cursor="pointer"
                        minH="98px"
                        px="24px"
                        py="20px"
                        borderRadius="18px"
                        border={`1.5px solid ${checked ? '#E60B12' : '#E4E7EC'}`}
                        bg="#FFFFFF"
                        transition="all 0.2s ease"
                        _hover={{
                          borderColor: checked ? '#E60B12' : '#D0D5DD',
                          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
                        }}
                      >
                        <Radio
                          value={option.id}
                          colorScheme="red"
                          size="md"
                          alignItems="flex-start"
                          sx={{
                            '.chakra-radio__control': {
                              mt: '4px',
                              borderColor: checked ? '#E60B12' : '#D0D5DD'
                            },
                            '.chakra-radio__label': {
                              width: '100%',
                              marginInlineStart: '12px'
                            }
                          }}
                        >
                          <Box>
                            <Text
                              fontSize="17px"
                              fontWeight={600}
                              lineHeight="24px"
                              color="#303133"
                            >
                              {t(`aiTeacher.config.styleOptions.${option.id}.label`)}
                            </Text>
                            <Text mt="8px" fontSize="15px" lineHeight="22px" color="#98A2B3">
                              {t(`aiTeacher.config.styleOptions.${option.id}.description`)}
                            </Text>
                          </Box>
                        </Radio>
                      </Box>
                    );
                  })}
                </Grid>
              </RadioGroup>
            </Box>

            {aiTeacherPageConfig.sliders.map((slider) => (
              <Box key={slider.id}>
                <Text
                  mb="12px"
                  fontSize={designTokens.typography.size.base}
                  fontWeight={designTokens.typography.weight.semibold}
                >
                  {t(`aiTeacher.config.sections.${slider.id}`)}
                </Text>
                <Box px="18px" py="18px" borderRadius="16px" bg="#F7F8FB">
                  <Flex justify="space-between" mb="18px" fontSize="16px" color="#667085">
                    <Text>{t(`aiTeacher.config.sliderRange.${slider.labelRange[0]}` as any)}</Text>
                    <Text>{t(`aiTeacher.config.sliderRange.${slider.labelRange[1]}` as any)}</Text>
                  </Flex>
                  <Slider
                    min={slider.min}
                    max={slider.max}
                    step={1}
                    focusThumbOnChange={false}
                    value={preferenceState.sliderValues[slider.id]}
                    onChange={(value) => onSliderChange(slider.id, value)}
                  >
                    <SliderTrack h="6px" borderRadius="999px" bg="#FBEAEC">
                      <SliderFilledTrack bg="linear-gradient(90deg, #FFE5E7 0%, #FF9FA6 52%, #D7000F 100%)" />
                    </SliderTrack>
                    <SliderThumb boxSize="20px" bg="#D7000F" />
                  </Slider>
                  <Flex justify="space-between" mt="14px" color="#98A2B3" fontSize="13px">
                    {slider.scaleLabels.map((label) => (
                      <Text key={label}>{t(`aiTeacher.config.sliderScale.${label}` as any)}</Text>
                    ))}
                  </Flex>
                </Box>
              </Box>
            ))}

            {aiTeacherPageConfig.preferenceGroups.map((group) => (
              <Box key={group.id}>
                <Text
                  mb="14px"
                  fontSize={designTokens.typography.size.base}
                  fontWeight={designTokens.typography.weight.semibold}
                >
                  {t(`aiTeacher.config.sections.${group.id}`)}
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap="12px">
                  {group.optionIds.map((optionId) => {
                    const checked = preferenceState.selectedOptions.includes(optionId);

                    return (
                      <Box
                        key={optionId}
                        as="label"
                        cursor="pointer"
                        borderRadius="16px"
                        border={`1px solid ${checked ? '#FCA5A5' : '#E5E7EB'}`}
                        bg={checked ? '#FFF5F5' : '#FFFFFF'}
                        px="16px"
                        py="14px"
                        transition="all 0.2s ease"
                        _hover={{
                          borderColor: checked ? '#F87171' : '#D1D5DB'
                        }}
                      >
                        <HStack align="flex-start" spacing="12px">
                          <Checkbox
                            isChecked={checked}
                            onChange={() => onToggleOption(optionId)}
                            colorScheme="red"
                            mt="2px"
                          />
                          <Box>
                            <Text fontWeight={600} color="#303133">
                              {t(`aiTeacher.config.preferenceOptions.${optionId}.label`)}
                            </Text>
                            <Text mt="4px" fontSize="14px" color="#98A2B3" lineHeight="22px">
                              {t(`aiTeacher.config.preferenceOptions.${optionId}.description`)}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    );
                  })}
                </Grid>
              </Box>
            ))}

            <Box>
              <Text
                mb="14px"
                fontSize={designTokens.typography.size.base}
                fontWeight={designTokens.typography.weight.semibold}
              >
                {t('aiTeacher.config.sections.learningPace')}
              </Text>
              <RadioGroup
                value={preferenceState.learningPace}
                onChange={(value) => onSelectLearningPace(value as LearningPaceOptionId)}
              >
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="14px">
                  {aiTeacherPageConfig.learningPaceOptions.map((option) => {
                    const checked = preferenceState.learningPace === option.id;

                    return (
                      <Box
                        key={option.id}
                        as="label"
                        cursor="pointer"
                        borderRadius="16px"
                        border={`1.5px solid ${checked ? '#E60B12' : '#E4E7EC'}`}
                        bg={checked ? '#FFF5F5' : '#FFFFFF'}
                        px="18px"
                        py="16px"
                        transition="all 0.2s ease"
                      >
                        <Radio
                          value={option.id}
                          colorScheme="red"
                          sx={{
                            '.chakra-radio__label': {
                              marginInlineStart: '12px'
                            }
                          }}
                        >
                          <Box>
                            <Text fontWeight={600}>
                              {t(`aiTeacher.config.learningPaceOptions.${option.id}.label`)}
                            </Text>
                            <Text mt="4px" fontSize="14px" color="#98A2B3" lineHeight="22px">
                              {t(`aiTeacher.config.learningPaceOptions.${option.id}.description`)}
                            </Text>
                          </Box>
                        </Radio>
                      </Box>
                    );
                  })}
                </Grid>
              </RadioGroup>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter borderTop={`1px solid ${designTokens.colors.borderLight}`} gap="12px">
          <Button variant="ghost" onClick={onClose} isDisabled={isSaving}>
            {t('aiTeacher.config.actions.cancel')}
          </Button>
          <Button
            bg={designTokens.colors.complementary}
            color={designTokens.colors.textWhite}
            _hover={{ bg: designTokens.colors.complementaryHover }}
            isLoading={isSaving}
            onClick={() => {
              void onSave();
            }}
          >
            {t('aiTeacher.config.actions.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function MetricIcon({
  metricKey,
  ...props
}: SVGProps<SVGSVGElement> & { metricKey: 'teacherCount' | 'interactionCount' | 'studyDuration' }) {
  switch (metricKey) {
    case 'teacherCount':
      return <BotIcon {...props} />;
    case 'interactionCount':
      return <MessageIcon {...props} />;
    case 'studyDuration':
      return <ClockIcon {...props} />;
    default:
      return <ClockIcon {...props} />;
  }
}

function StatusIcon({
  status,
  ...props
}: SVGProps<SVGSVGElement> & { status: AiTeacherCourseStatus }) {
  switch (status) {
    case 'locked':
      return <LockIcon {...props} />;
    case 'completed':
      return <CheckIcon {...props} />;
    case 'learning':
      return <SparkIcon {...props} />;
    default:
      return <SparkIcon {...props} />;
  }
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M7.6353 1.9389C7.86153 1.82652 8.1107 1.76804 8.3633 1.76804C8.6159 1.76804 8.86508 1.82652 9.0913 1.9389L13.4549 4.12071C13.7276 4.25617 13.9571 4.46503 14.1176 4.72379C14.2781 4.98256 14.3632 5.28096 14.3633 5.58544V10.784C14.3632 11.0882 14.2782 11.3863 14.118 11.6449C13.9578 11.9035 13.7287 12.1124 13.4564 12.248L9.09276 14.4298C8.86549 14.5435 8.61487 14.6027 8.36076 14.6027C8.10665 14.6027 7.85603 14.5435 7.62876 14.4298L3.26367 12.2473C2.9917 12.1105 2.76332 11.9005 2.60424 11.641C2.44517 11.3814 2.36173 11.0826 2.3633 10.7782V5.58544C2.36345 5.28124 2.44839 4.98309 2.60859 4.72449C2.76879 4.46588 2.9979 4.25705 3.27021 4.12144L7.6353 1.9389ZM3.45349 5.79199V10.7818C3.45281 10.8832 3.48043 10.9828 3.53323 11.0694C3.58603 11.156 3.66193 11.2261 3.75239 11.272L7.81785 13.3047V7.9738L3.45421 5.79199H3.45349ZM13.2717 5.79199L8.90803 7.9738V13.3018L12.9698 11.2713C13.049 11.232 13.1174 11.1741 13.1693 11.1025C13.2211 11.0309 13.2547 10.9478 13.2673 10.8604L13.2724 10.784V5.79199H13.2717ZM8.60621 2.91562C8.53093 2.87832 8.44805 2.85891 8.36403 2.85891C8.28001 2.85891 8.19713 2.87832 8.12185 2.91562L4.13058 4.9098L8.3633 7.02544L12.5953 4.90908L8.60621 2.91562Z"
        fill="white"
      />
    </svg>
  );
}

function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function BotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4" y="8" width="16" height="11" rx="344" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M9 16h6" />
      <path d="M12 4v4" />
    </svg>
  );
}

function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function GroupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M17 11h6" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 11h18" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3v4" />
      <path d="m5.5 6.5 2.8 2.8" />
      <path d="M3 12h4" />
      <path d="m5.5 17.5 2.8-2.8" />
      <path d="M12 17v4" />
      <path d="m18.5 17.5-2.8-2.8" />
      <path d="M17 12h4" />
      <path d="m18.5 6.5-2.8 2.8" />
    </svg>
  );
}

function BookOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}
