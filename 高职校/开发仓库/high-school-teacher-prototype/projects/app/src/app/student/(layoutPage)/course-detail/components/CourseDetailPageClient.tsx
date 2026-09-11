'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SVGProps } from 'react';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Link,
  Progress,
  Stack,
  Text,
  Tooltip
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { getStudentCourseDetail } from '@/api/student/student';
import type { ChapterVO, MaterialVO, StudentCourseDetailVO } from '@/types/api/student/student';
import type {
  CourseCatalogChapter,
  CourseCatalogLesson,
  CourseDetailData,
  CourseDetailQuery,
  CourseDetailTabKey,
  CourseKnowledgeChapter,
  CourseLessonMediaType,
  CourseLessonStatus
} from '../types';
import { designTokens, studentProfileTokens } from '@/theme/designTokens';

import NewSmallChatContainer from '@/pageComponents/chat/ChatWindow/NewSmallChatContainer';
import { getAgentDetailByAppointedType } from '@/student/api/agent';
import { AgentAppointedTypeEnum } from '@/student/types/agent';
import { useStudentPreferenceStore } from '@/student/store/preference';
import {
  translateStudentSettingToJson,
  translateTeacherSettingToJson
} from '@/student/utils/settingTranslator';
import { getFileIconByName } from '@/utils/fileIcon';

const SmallChat = dynamic(() => import('@/pageComponents/chat/ChatWindow/SmallChat'), {
  ssr: false
});

const CourseMarkmap = dynamic(
  () => import('@/components/CourseMarkmap').then((mod) => mod.CourseMarkmap),
  { ssr: false }
);

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: studentProfileTokens.card.border,
  borderRadius: '20px',
  boxShadow: studentProfileTokens.card.shadow
} as const;

const formatDuration = (duration = 0) => {
  if (duration <= 0) return '--:--';
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getLessonMediaType = (material: MaterialVO): CourseLessonMediaType => {
  const typeValue = `${material.fileType || ''} ${material.fileFormat || ''}`.toLowerCase();

  if (/(mp3|wav|aac|audio)/.test(typeValue)) return 'audio';
  if (/(png|jpg|jpeg|gif|webp|image)/.test(typeValue)) return 'image';
  if (/(mp4|mov|avi|mkv|video)/.test(typeValue)) return 'video';
  return 'text';
};

const getLessonStatus = (studyStatus: number): CourseLessonStatus => {
  if (studyStatus === 2) return 'completed';
  if (studyStatus === 1) return 'current';
  return 'pending';
};

const dedupeStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const sortChapters = (chapters: ChapterVO[] = []) =>
  [...chapters].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

const getKnowledgePointNames = (chapter: ChapterVO) =>
  dedupeStrings(
    (chapter.knowledgePoints || []).map((item) => item.name).filter(Boolean) as string[]
  );

const createStudyHref = ({
  avatarId,
  chapterId,
  materialId,
  query
}: {
  avatarId: number;
  chapterId: number;
  materialId: number;
  query: CourseDetailQuery;
}) => {
  const searchParams = new URLSearchParams({
    avatarId: String(avatarId),
    chapterId: String(chapterId),
    materialId: String(materialId)
  });

  if (query.courseId) searchParams.set('courseId', query.courseId);
  if (query.teachingTaskId) searchParams.set('teachingTaskId', query.teachingTaskId);
  if (query.majorName) searchParams.set('majorName', query.majorName);
  if (query.teacherName) searchParams.set('teacherName', query.teacherName);
  if (query.hours) searchParams.set('hours', query.hours);

  return `/student/study?${searchParams.toString()}`;
};

const buildKnowledgeChapters = (chapters: ChapterVO[]): CourseKnowledgeChapter[] => {
  return sortChapters(chapters).map((chapter) => {
    const chapterId = chapter.chapterId || 0;
    const directChildren = sortChapters(chapter.children ?? []);
    const nodeNames = dedupeStrings([
      ...getKnowledgePointNames(chapter),
      ...directChildren.flatMap((item) => getKnowledgePointNames(item))
    ]);

    return {
      id: String(chapterId),
      title: chapter.title || '未命名章节',
      nodeNames,
      childCount: directChildren.length,
      knowledgeCount: nodeNames.length
    };
  });
};

const buildCatalogLesson = ({
  chapter,
  material,
  avatarId,
  query
}: {
  chapter: ChapterVO;
  material: MaterialVO;
  avatarId: number;
  query: CourseDetailQuery;
}): CourseCatalogLesson => ({
  id: `${chapter.chapterId}-${material.materialId}`,
  mediaType: getLessonMediaType(material),
  fileType: material.fileType,
  fileFormat: material.fileFormat,
  title: material.fileName || '未命名课件',
  duration: formatDuration(material.duration),
  status: getLessonStatus(material.studyStatus!),
  progress: material.duration
    ? Math.min(Math.round(((material.studyProgress || 0) / material.duration) * 100), 100)
    : 0,
  href: createStudyHref({
    avatarId,
    chapterId: chapter.chapterId || 0,
    materialId: material.materialId || 0,
    query
  })
});

const buildCatalogChapterTree = ({
  chapters,
  avatarId,
  query,
  isTopLevel = false
}: {
  chapters: ChapterVO[];
  avatarId: number;
  query: CourseDetailQuery;
  isTopLevel?: boolean;
}): CourseCatalogChapter[] => {
  return sortChapters(chapters).map((chapter, index) => {
    const lessons = (chapter.materials || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((material) => buildCatalogLesson({ chapter, material, avatarId, query }));

    const children =
      (chapter.children?.length ?? 0) > 0
        ? buildCatalogChapterTree({
            chapters: chapter.children!,
            avatarId,
            query
          })
        : undefined;

    const knowledgeNames = dedupeStrings(
      (chapter.knowledgePoints || []).map((p) => p.name).filter(Boolean) as string[]
    );

    return {
      id: String(chapter.chapterId),
      title: chapter.title || '未命名章节',
      tip: knowledgeNames.length > 0 ? knowledgeNames.join('、') : '暂无知识点',
      defaultExpanded: isTopLevel && index === 0,
      lessons,
      children
    };
  });
};

// 将后端章节树收敛成页面可直接渲染的介绍/知识图谱/目录结构。
const mapCourseDetail = (
  detail: StudentCourseDetailVO,
  query: CourseDetailQuery
): CourseDetailData => {
  const catalogChapters = buildCatalogChapterTree({
    chapters: detail.chapters ?? [],
    avatarId: detail.avatarId ?? 0,
    query,
    isTopLevel: true
  });

  return {
    avatarId: detail.avatarId,
    courseName: detail.courseName,
    cover: detail.coverUrl,
    description: detail.description,
    progress: detail.progress,
    majorName: query.majorName || '未提供专业信息',
    teacherName: query.teacherName || '未提供教师信息',
    durationLabel: query.hours || '-',
    courseId: query.courseId,
    teachingTaskId: query.teachingTaskId,
    datasetId: detail.datasetId || '',
    knowledgeChapters: buildKnowledgeChapters(detail.chapters || []),
    catalogChapters,
    rawChapters: detail.chapters || []
  };
};

const getChineseNumber = (num: number) => {
  const chineseChars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return chineseChars[num];
  if (num < 20) return `十${chineseChars[num % 10]}`;
  return num.toString();
};

const countAllLessons = (chapter: CourseCatalogChapter): number => {
  const own = chapter.lessons.length;
  const childCount = (chapter.children ?? []).reduce(
    (sum, child) => sum + countAllLessons(child),
    0
  );
  return own + childCount;
};

const countChaptersLessons = (chapters: CourseCatalogChapter[]): number =>
  chapters.reduce((sum, ch) => sum + countAllLessons(ch), 0);

export function CourseDetailPageClient({ query }: { query: CourseDetailQuery }) {
  const { t } = useTranslation('student');
  const studentSetting = useStudentPreferenceStore((state) => state.studentSetting);
  const { avatarId, courseId, teachingTaskId, majorName, teacherName, hours } = query;
  const [activeTab, setActiveTab] = useState<CourseDetailTabKey>('catalog');
  const [expandedKnowledgeIds, setExpandedKnowledgeIds] = useState<string[]>([]);
  const [courseAiAppId, setCourseAiAppId] = useState<string>('');
  const [isLoadingAppId, setIsLoadingAppId] = useState(true);
  const [courseDetail, setCourseDetail] = useState<CourseDetailData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [teachingConfig, setTeachingConfig] = useState<string>('{}');

  useEffect(() => {
    const fetchCourseAiTeacher = async () => {
      try {
        setIsLoadingAppId(true);
        const agentDetail = await getAgentDetailByAppointedType({
          appointedType: AgentAppointedTypeEnum.COURSE_AI_TEACHER
        });
        if (agentDetail?.fastgptAppId) {
          setCourseAiAppId(agentDetail.fastgptAppId);
        }
      } catch (error) {
        console.error('获取课程AI教师失败:', error);
      } finally {
        setIsLoadingAppId(false);
      }
    };

    fetchCourseAiTeacher();
  }, []);

  // 加载学生偏好设置（如果未加载）
  useEffect(() => {
    useStudentPreferenceStore.getState().loadPreferenceIfNeeded();
  }, []);

  useEffect(() => {
    if (!avatarId) {
      setLoadState('error');
      setErrorMessage('缺少 avatarId 参数，无法加载课程详情。');
      return;
    }

    const parsedAvatarId = Number(avatarId);
    if (Number.isNaN(parsedAvatarId) || parsedAvatarId <= 0) {
      setLoadState('error');
      setErrorMessage('avatarId 参数无效，无法加载课程详情。');
      return;
    }

    let active = true;
    setLoadState('loading');
    setErrorMessage('');

    const loadDetail = async () => {
      try {
        const detail = await getStudentCourseDetail({
          avatarId: parsedAvatarId
        });

        if (!active) return;

        const mappedDetail = mapCourseDetail(detail, {
          avatarId,
          courseId,
          teachingTaskId,
          majorName,
          teacherName,
          hours
        });
        setCourseDetail(mappedDetail);
        setExpandedKnowledgeIds(mappedDetail.knowledgeChapters.map((item) => item.id));
        // 保存 teachingConfig 作为 teacherSetting（已经是 JSON 字符串）
        setTeachingConfig(detail.teachingConfig || '{}');
        setLoadState('ready');
      } catch {
        if (!active) return;
        setLoadState('error');
        setErrorMessage('获取课程详情失败，请稍后重试。');
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [avatarId, courseId, teachingTaskId, majorName, teacherName, hours]);

  const toggleKnowledge = (id: string) => {
    setExpandedKnowledgeIds((state) =>
      state.includes(id) ? state.filter((item) => item !== id) : [...state, id]
    );
  };

  const defaultAccordionIndex = useMemo(
    () =>
      courseDetail?.catalogChapters.flatMap((item, index) =>
        item.defaultExpanded ? [index] : []
      ) ?? [],
    [courseDetail]
  );

  return (
    <Flex
      width={'100%'}
      maxW="1200px"
      direction={{ base: 'column', md: 'row' }}
      gap={{ base: '24px', md: '20px', lg: '32px' }}
      alignItems={{ base: 'center', md: 'flex-start' }}
    >
      <Box
        flex={{ base: 'none', md: '0 0 768px' }}
        w={{ base: '100%', md: '768px' }}
        maxW={{ base: '100%', md: '768px' }}
        minW={0}
      >
        <Link
          as={NextLink}
          href="/student/course-plaza"
          display="inline-flex"
          alignItems="center"
          gap="8px"
          mb="24px"
          color={designTokens.colors.textSecondary}
          _hover={{ color: designTokens.colors.complementary, textDecoration: 'none' }}
        >
          <ArrowLeftIcon width="16px" height="16px" />
          <Text>{t('studentCourseDetail.back')}</Text>
        </Link>

        {loadState !== 'ready' || !courseDetail ? (
          <Box {...cardStyle} p="24px">
            <Text color={designTokens.colors.textSecondary}>
              {loadState === 'loading' ? '正在加载课程详情...' : errorMessage}
            </Text>
          </Box>
        ) : (
          <>
            <Box {...cardStyle} overflow="hidden" mb="24px">
              <Box
                as="img"
                src={courseDetail.cover}
                alt={courseDetail.courseName}
                w="100%"
                h={{ base: '220px', md: '280px' }}
                objectFit="cover"
              />
              <Box p={{ base: '20px', md: '24px' }}>
                <Text
                  mb="12px"
                  fontSize={designTokens.typography.size.xxl}
                  fontWeight={designTokens.typography.weight.bold}
                  color={designTokens.colors.textPrimary}
                >
                  {courseDetail.courseName}
                </Text>
                <Flex
                  wrap="wrap"
                  gap="16px"
                  mb="18px"
                  color={designTokens.colors.textSecondary}
                  fontSize={designTokens.typography.size.base}
                >
                  <HStack spacing="6px">
                    <FolderIcon
                      width="16px"
                      height="16px"
                      color={designTokens.colors.complementary}
                    />
                    <Text>
                      {t('studentCourseDetail.course.majorLine', {
                        major: courseDetail.majorName
                      })}
                    </Text>
                  </HStack>
                  <HStack spacing="6px">
                    <UserIcon
                      width="16px"
                      height="16px"
                      color={designTokens.colors.complementary}
                    />
                    <Text>{courseDetail.teacherName}</Text>
                  </HStack>
                  <HStack spacing="6px">
                    <ClockIcon
                      width="16px"
                      height="16px"
                      color={designTokens.colors.complementary}
                    />
                    <Text>
                      {t('studentCourseDetail.course.duration', {
                        duration: courseDetail.durationLabel
                      })}
                    </Text>
                  </HStack>
                </Flex>
                <Box mb="18px">
                  <Flex justify="space-between" mb="8px">
                    <Text
                      fontSize={designTokens.typography.size.base}
                      color={designTokens.colors.textSecondary}
                    >
                      {t('studentCourseDetail.course.progress')}
                    </Text>
                    <Text
                      fontWeight={designTokens.typography.weight.semibold}
                      color={designTokens.colors.complementary}
                    >
                      {courseDetail.progress}%
                    </Text>
                  </Flex>
                  <Progress
                    value={courseDetail.progress}
                    borderRadius="full"
                    colorScheme="red"
                    bg={designTokens.colors.fill[3]}
                  />
                </Box>
                {(() => {
                  const firstOngoingLesson = courseDetail.catalogChapters
                    .flatMap((c) => c.lessons)
                    .find((l) => l.status === 'current');

                  const params = new URLSearchParams({
                    avatarId: String(courseDetail.avatarId)
                  });
                  if (query.courseId) params.set('courseId', query.courseId);
                  if (query.teachingTaskId) params.set('teachingTaskId', query.teachingTaskId);
                  if (query.majorName) params.set('majorName', query.majorName);
                  if (query.teacherName) params.set('teacherName', query.teacherName);
                  if (query.hours) params.set('hours', query.hours);

                  const studyHref = firstOngoingLesson
                    ? firstOngoingLesson.href
                    : `/student/study?${params.toString()}`;

                  return (
                    <Button
                      as={NextLink}
                      href={studyHref}
                      leftIcon={<PlayIcon width="14px" height="14px" />}
                      bg={designTokens.colors.complementary}
                      color={designTokens.colors.textWhite}
                      borderRadius="14px"
                      _hover={{
                        bg: designTokens.colors.complementaryHover,
                        textDecoration: 'none'
                      }}
                      w="100%"
                    >
                      {t('studentCourseDetail.course.action')}
                    </Button>
                  );
                })()}
              </Box>
            </Box>

            <Flex gap="14px" mb="24px">
              {(['catalog'] as const).map((tabKey) => {
                const active = tabKey === activeTab;
                return (
                  <Button
                    key={tabKey}
                    variant="ghost"
                    px="18px"
                    py="8px"
                    h="auto"
                    borderRadius="full"
                    bg={active ? designTokens.colors.bgHover : 'transparent'}
                    color={active ? designTokens.colors.primary : designTokens.colors.textSecondary}
                    _hover={{
                      bg: active ? designTokens.colors.bgHover : designTokens.colors.bgSecondary,
                      color: active ? designTokens.colors.primary : designTokens.colors.textPrimary
                    }}
                    onClick={() => setActiveTab(tabKey)}
                    rightIcon={
                      tabKey === 'catalog' ? (
                        <Badge
                          bg={'#fff'}
                          color={designTokens.colors.primary}
                          borderRadius="full"
                          px="8px"
                          py="2px"
                          fontSize={'12px'}
                        >
                          {countChaptersLessons(courseDetail.catalogChapters)}
                          {t('studentCourseDetail.sections.section')}
                        </Badge>
                      ) : undefined
                    }
                    fontSize={'16px'}
                  >
                    {t(`studentCourseDetail.tabs.${tabKey}`)}
                  </Button>
                );
              })}
            </Flex>

            {activeTab === 'intro' ? (
              <Stack spacing="24px">
                <Box {...cardStyle} p="24px">
                  <Box display={'flex'} gap={'6px'} mb="20px" alignItems={'center'}>
                    <Box width={'4px'} height={'15px'} background={'#C8000B'}></Box>
                    <Text
                      fontSize={designTokens.typography.size.md}
                      fontWeight={designTokens.typography.weight.semibold}
                    >
                      {t('studentCourseDetail.sections.introduction')}
                    </Text>
                  </Box>
                  <Text color={'#333'} fontSize={'16px'}>
                    {courseDetail.description || '暂无课程简介'}
                  </Text>
                </Box>

                <Box {...cardStyle} p="24px">
                  <Text
                    mb="16px"
                    fontSize={designTokens.typography.size.lg}
                    fontWeight={designTokens.typography.weight.semibold}
                  >
                    {t('studentCourseDetail.sections.knowledgeMap')}
                  </Text>
                  <Box
                    borderRadius="20px"
                    p={{ base: '0px', md: '0px' }}
                    bg="transparent"
                    border="none"
                    overflow="hidden"
                  >
                    <CourseMarkmap
                      courseName={courseDetail.courseName || ''}
                      chapters={courseDetail.rawChapters || []}
                    />
                  </Box>
                </Box>
              </Stack>
            ) : (
              <Box {...cardStyle} p="24px">
                <Flex
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap="12px"
                  mb="20px"
                >
                  <HStack spacing="8px" align="center">
                    <Box w="4px" h="16px" borderRadius="full" bg={designTokens.colors.primary} />
                    <Text
                      fontSize={designTokens.typography.size.lg}
                      fontWeight={designTokens.typography.weight.semibold}
                      color={designTokens.colors.textPrimary}
                    >
                      {t('studentCourseDetail.sections.catalog')}
                    </Text>
                  </HStack>
                  <Text
                    fontSize={designTokens.typography.size.base}
                    color={designTokens.colors.textTertiary}
                  >
                    {t('studentCourseDetail.catalog.total', {
                      total: countChaptersLessons(courseDetail.catalogChapters)
                    })}
                  </Text>
                </Flex>

                <Accordion allowMultiple defaultIndex={defaultAccordionIndex}>
                  {courseDetail.catalogChapters.map((chapter, index) => (
                    <AccordionItem
                      key={chapter.id}
                      border={`1px solid ${designTokens.colors.border}`}
                      borderRadius="20px"
                      overflow="hidden"
                      mb="16px"
                      boxShadow="sm"
                    >
                      <h2>
                        <AccordionButton
                          bg="transparent"
                          _hover={{ bg: designTokens.colors.bgSecondary }}
                          py="16px"
                          px="20px"
                        >
                          <AccordionIcon mr="12px" />
                          <Badge
                            bg="#D6E6FF"
                            color="#3B82F6"
                            borderRadius="4px"
                            px="6px"
                            py="2px"
                            mr="12px"
                            fontSize="sm"
                          >
                            第{getChineseNumber(index + 1)}章
                          </Badge>
                          <Box
                            flex="1"
                            textAlign="left"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Text
                              fontWeight={designTokens.typography.weight.semibold}
                              color={designTokens.colors.textPrimary}
                              fontSize="md"
                            >
                              {chapter.title}
                            </Text>
                          </Box>
                        </AccordionButton>
                      </h2>
                      <AccordionPanel p="0">
                        <CatalogChapterContent chapter={chapter} />
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            )}
          </>
        )}
      </Box>

      <Box
        flexShrink={0}
        w={{ base: '100%', md: '360px', lg: '380px', xl: '400px' }}
        display="flex"
        justifyContent="center"
      >
        <NewSmallChatContainer embedded showCloseButton={false} avatarId={courseDetail?.avatarId}>
          {!isLoadingAppId && courseAiAppId && (
            <SmallChat
              simpleInput
              minHeight="120px"
              appId={courseAiAppId}
              forceNewChat
              welcomeText={t('studentChat.courseWelcomeText')}
              aiAvatarId={courseDetail?.avatarId}
              variables={{
                knowledgeBase: [{ datasetId: courseDetail?.datasetId || '' }],
                studentSetting: translateStudentSettingToJson(studentSetting),
                teacherSetting: translateTeacherSettingToJson(teachingConfig),
                courseName: courseDetail?.courseName || '',
                description: courseDetail?.description || ''
              }}
            />
          )}
        </NewSmallChatContainer>
      </Box>
    </Flex>
  );
}

function CatalogChapterContent({
  chapter,
  depth = 0
}: {
  chapter: CourseCatalogChapter;
  depth?: number;
}) {
  const hasLessons = chapter.lessons.length > 0;
  const hasChildren = (chapter.children?.length ?? 0) > 0;

  if (!hasLessons && !hasChildren) {
    if (depth === 0) {
      return (
        <Box p="16px">
          <Text color={designTokens.colors.textTertiary}>当前章节暂无课件</Text>
        </Box>
      );
    }
    return null;
  }

  return (
    <Stack spacing={0}>
      {hasLessons && (
        <Stack divider={<Box h="1px" bg={designTokens.colors.borderLight} />}>
          {chapter.lessons.map((lesson) => (
            <CatalogLessonRow key={lesson.id} lesson={lesson} depth={depth} />
          ))}
        </Stack>
      )}

      {hasChildren && (
        <Stack spacing={0} ml={depth === 0 ? '0' : '16px'}>
          {chapter.children!.map((childChapter) => (
            <Box key={childChapter.id}>
              {/* 子章节 Header */}
              <Flex
                align="center"
                py="12px"
                px={depth === 0 ? '24px' : '0'}
                bg="transparent"
                borderTop={
                  hasLessons || depth > 0 ? `1px solid ${designTokens.colors.borderLight}` : 'none'
                }
              >
                <Box
                  w="4px"
                  h="4px"
                  borderRadius="full"
                  bg={designTokens.colors.primary}
                  mr="8px"
                />
                <Text fontSize="14px" fontWeight="600" color={designTokens.colors.textPrimary}>
                  {childChapter.title}
                </Text>
              </Flex>
              {/* 子章节 Content 递归 */}
              <Box mb={childChapter.children?.length ? '0' : '4px'}>
                <CatalogChapterContent chapter={childChapter} depth={depth + 1} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function CatalogLessonRow({ lesson, depth = 0 }: { lesson: CourseCatalogLesson; depth?: number }) {
  const isCurrent = lesson.status === 'current';

  return (
    <Link as={NextLink} href={lesson.href} _hover={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        justify="space-between"
        px={depth === 0 ? '24px' : '16px'}
        py="16px"
        ml={depth > 0 ? '24px' : '0'}
        bg={isCurrent ? designTokens.colors.bgHover : 'transparent'}
        _hover={{ bg: isCurrent ? designTokens.colors.bgHover : designTokens.colors.bgSecondary }}
        transition="all 0.2s"
        gap="12px"
      >
        <HStack spacing="16px">
          <LessonStatusIndicator status={lesson.status} />
          <Flex
            w="32px"
            h="32px"
            borderRadius="8px"
            bg={isCurrent ? '#E5EFFF' : '#F3F4F6'}
            align="center"
            justify="center"
            color={isCurrent ? '#3B82F6' : '#6B7280'}
          >
            {lesson.fileType === 'openmaic' || lesson.fileType === 'digital'
              ? getFileIconByName('folder', { size: '32px' })
              : getFileIconByName(lesson.fileFormat || lesson.title, { size: '32px' })}
          </Flex>
          <Tooltip label={lesson.title} placement="top" hasArrow>
            <Text
              color={
                isCurrent ? designTokens.colors.textPrimary : designTokens.colors.textSecondary
              }
              fontWeight={isCurrent ? 'semibold' : 'normal'}
              fontSize="base"
              maxW="500px"
              noOfLines={1}
            >
              {lesson.title}
            </Text>
          </Tooltip>
        </HStack>
        <LessonProgressRing progress={lesson.progress} />
      </Flex>
    </Link>
  );
}

function LessonStatusIndicator({ status }: { status: CourseLessonStatus }) {
  if (status === 'completed') {
    return (
      <Box
        as="img"
        src={'/imgs/app/student/courseDetail/circle_completed_icon.png'}
        alt="AI Teacher Avatar"
        w="20px"
        h="20px"
        objectFit="contain"
      />
    );
  }

  if (status === 'current') {
    return (
      <Box
        as="img"
        src={'/imgs/app/student/courseDetail/circle_current_icon.png'}
        alt="AI Teacher Avatar"
        w="20px"
        h="20px"
        objectFit="contain"
      />
    );
  }

  return (
    <Box
      as="img"
      src={'/imgs/app/student/courseDetail/circle_default_icon.png'}
      alt="AI Teacher Avatar"
      w="20px"
      h="20px"
      objectFit="contain"
    />
  );
}

function LessonProgressRing({
  progress = 0,
  size = 24
}: {
  progress?: number;
  size?: number;
}) {
  const r = 10;
  const c = 2 * Math.PI * r; // 周长 ~62.83
  const pct = Math.min(Math.max(progress, 0), 100);
  const offset = c * (1 - pct / 100);

  // 0%：灰色圆环 + 灰色 0（无 %）
  if (pct === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r={r} stroke="#F2F3F5" strokeWidth="2.5" fill="none" />
        <text x="12" y="16" textAnchor="middle" fill="#333333" fontSize="8" fontWeight="600">
          0
        </text>
      </svg>
    );
  }

  // 有进度（100% 绿色，其他红色），不显示 %
  const color = pct >= 100 ? '#2BA471' : '#C8000B';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r={r} stroke="#F2F3F5" strokeWidth="2.5" fill="none" />
      <circle
        cx="12" cy="12" r={r} stroke={color} strokeWidth="2.5" fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
      <text x="12" y="16" textAnchor="middle" fill={color} fontSize="8" fontWeight="600">
        {Math.round(pct)}
      </text>
    </svg>
  );
}

function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
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

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M13.0543 2.73828H4.90094C3.97094 2.73828 3.21094 3.40257 3.21094 4.21782V16.6581C3.21094 16.8392 3.30094 17.0083 3.45427 17.1231C3.57427 17.2136 3.72427 17.262 3.8776 17.262C3.92094 17.262 3.96094 17.2589 4.00427 17.2499L13.3843 15.6043C13.5574 15.5736 13.71 15.482 13.8087 15.3496C13.9075 15.2171 13.9442 15.0546 13.9109 14.8977C13.8409 14.5716 13.4909 14.3542 13.1309 14.4206L4.54427 15.9274V4.21782C4.54427 4.06685 4.70427 3.94607 4.90094 3.94607H13.0543C14.3776 3.94607 15.4576 4.85493 15.4576 5.97214V16.6581C15.4576 16.9902 15.7576 17.262 16.1243 17.262C16.4909 17.262 16.7909 16.9902 16.7909 16.6581V5.97214C16.7909 4.18763 15.1143 2.73828 13.0543 2.73828Z"
        fill="white"
      />
      <path
        d="M9.45185 6.51209C9.28596 6.39918 9.09229 6.33388 8.8919 6.3233C8.6915 6.31273 8.49204 6.35727 8.31518 6.45209C7.95518 6.64543 7.72852 7.01876 7.72852 7.42543V11.7388C7.72852 12.1488 7.95185 12.5221 8.31518 12.7121C8.47518 12.7988 8.65185 12.8421 8.82852 12.8421C9.04852 12.8421 9.26852 12.7754 9.46518 12.6454L12.2918 10.6288C12.4629 10.5129 12.603 10.3569 12.7 10.1745C12.7971 9.99207 12.848 9.78871 12.8485 9.58209C12.8485 9.16543 12.6452 8.77876 12.3018 8.54209L9.45185 6.51209ZM9.06185 11.2921V7.87209L11.4585 9.58209L9.06185 11.2921Z"
        fill="white"
      />
    </svg>
  );
}

function ChevronToggleIcon({
  expanded,
  ...props
}: SVGProps<SVGSVGElement> & { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
