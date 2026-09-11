'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SVGProps } from 'react';
import NextLink from 'next/link';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Link,
  Progress,
  Stack,
  Text,
  useToast,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  chakra,
  Tooltip
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useInterval, useMemoizedFn } from 'ahooks';
import { getStudentCourseDetail, saveStudyProgress } from '@/api/student/student';
import { useStudentAuthStore } from '@/student/store/auth';
import type {
  StudentCourseDetailVO,
  ChapterVO,
  MaterialVO,
  SaveStudyProgressRequest
} from '@/types/api/student/student';
import type {
  StudyChapter,
  StudyLesson,
  StudyLessonMediaType,
  StudyLessonStatus,
  StudyPageData
} from '../types';
import { designTokens, studentProfileTokens } from '@/theme/designTokens';
import { getAgentDetailByAppointedType } from '@/student/api/agent';
import { AgentAppointedTypeEnum } from '@/student/types/agent';
import { useStudentPreferenceStore } from '@/student/store/preference';
import {
  translateStudentSettingToJson,
  translateTeacherSettingToJson
} from '@/student/utils/settingTranslator';
import { getFileIconByName } from '@/utils/fileIcon';
import dynamic from 'next/dynamic';

const SmallChatContainer = dynamic(
  () => import('@/pageComponents/chat/ChatWindow/SmallChatContainer'),
  { ssr: false }
);
const NewSmallChatContainer = dynamic(
  () => import('@/pageComponents/chat/ChatWindow/NewSmallChatContainer'),
  { ssr: false }
);
const SmallChat = dynamic(() => import('@/pageComponents/chat/ChatWindow/SmallChat'), {
  ssr: false
});

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: studentProfileTokens.card.border,
  borderRadius: '20px',
  boxShadow: studentProfileTokens.card.shadow
} as const;

/* ---------- 辅助函数：根据 fileFormat / fileType 判断媒体类型 ---------- */
function getMediaType(fileFormat?: string, fileType?: string): StudyLessonMediaType {
  const type = (fileType || '').toLowerCase();
  if (type === 'openmaic' || type === 'digital') return 'iframe';

  const fmt = (fileFormat || '').toLowerCase();
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(fmt)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fmt)) return 'image';
  if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a'].includes(fmt)) return 'audio';
  if (fmt === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fmt)) return 'office';
  return 'text';
}

function numToChinese(num: number) {
  const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return chineseNums[num - 1];
  return String(num);
}

function updateChapterMaterial(
  chapter: ChapterVO,
  materialId: number,
  studyProgress: number,
  duration: number
): ChapterVO {
  const next: ChapterVO = {
    ...chapter,
    materials: chapter.materials?.map((m) => {
      if (m.materialId !== materialId) return m;
      const completed = duration > 0 && studyProgress >= duration;
      return {
        ...m,
        studyProgress,
        duration,
        studyStatus: completed ? 2 : m.studyStatus
      };
    }),
    children: chapter.children?.map((child) =>
      updateChapterMaterial(child, materialId, studyProgress, duration)
    )
  };
  return next;
}

export function StudyPageClient() {
  const { t } = useTranslation('student');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const avatarId = searchParams.get('avatarId');
  const toast = useToast();
  const studentSetting = useStudentPreferenceStore((state) => state.studentSetting);

  const [courseDetail, setCourseDetail] = useState<StudentCourseDetailVO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseAiAppId, setCourseAiAppId] = useState('');
  const [isLoadingAppId, setIsLoadingAppId] = useState(true);
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [teachingConfig, setTeachingConfig] = useState<string>('{}');
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const viewStartTimeRef = useRef<number>(Date.now());
  const hasSavedMaxRef = useRef<boolean>(false);
  const initialStudyProgressRef = useRef<number>(0);
  const studentId = useStudentAuthStore((state) => state.userInfo?.studentId);

  const materialId = searchParams.get('materialId');
  const chapterId = searchParams.get('chapterId');

  /* ---------- 将 API 数据转换为页面展示数据 ---------- */
  const displayData = useMemo<StudyPageData | null>(() => {
    if (!courseDetail) return null;

    const currentMaterialId = searchParams.get('materialId');
    const topLevelChapters = [...(courseDetail.chapters || [])].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    let currentMaterial: MaterialVO | undefined;
    let currentChapter: ChapterVO | undefined;
    const allLessons: StudyLesson[] = [];

    // 将所有章节（包括子章节）展平收集，用于后续查找
    const flatAllChapters: ChapterVO[] = [];
    const flattenChapters = (chapters: ChapterVO[]) => {
      for (const c of chapters) {
        flatAllChapters.push(c);
        if (c.children?.length) flattenChapters(c.children);
      }
    };
    flattenChapters(courseDetail.chapters || []);

    const mapToStudyChapter = (chapter: ChapterVO): StudyChapter => {
      const children = (chapter.children || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((child) => mapToStudyChapter(child));

      const lessons: StudyLesson[] = (chapter.materials || [])
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((m) => {
          const isCurrent = currentMaterialId
            ? String(m.materialId) === currentMaterialId
            : m.studyStatus === 1;

          if (isCurrent) {
            currentMaterial = m;
            currentChapter = chapter;
            initialStudyProgressRef.current = m.studyProgress || 0;
          }

          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.set('materialId', String(m.materialId || ''));
          nextParams.set('chapterId', String(chapter.chapterId || ''));

          const lesson: StudyLesson = {
            id: String(m.materialId || ''),
            title: m.fileName || '未命名课件',
            mediaType: getMediaType(m.fileFormat, m.fileType),
            fileType: m.fileType,
            fileFormat: m.fileFormat,
            status: (isCurrent
              ? 'current'
              : m.studyStatus === 2
                ? 'completed'
                : 'locked') as StudyLessonStatus,
            progress: m.duration
              ? Math.min(Math.round(((m.studyProgress || 0) / m.duration) * 100), 100)
              : 0,
            href: `/student/study?${nextParams.toString()}`
          };

          allLessons.push(lesson);
          return lesson;
        });

      return {
        id: String(chapter.chapterId || ''),
        title: chapter.title || '未命名章节',
        tip: '', // 稍后计算
        lessons,
        children: children.length > 0 ? children : undefined,
        knowledgePoints: (chapter.knowledgePoints || [])
          ?.map((kp) => kp.name)
          .filter(Boolean) as string[]
      };
    };

    const chapters: StudyChapter[] = topLevelChapters.map((chapter) => mapToStudyChapter(chapter));

    // 如果未选，默认首个
    if (!currentMaterial && allLessons.length > 0) {
      if (allLessons[0]) {
        allLessons[0].status = 'current';
        const targetLessonId = allLessons[0].id;

        // 在新树结构中查找
        const findAndMarkCurrent = (list: StudyChapter[]) => {
          for (const chap of list) {
            const l = chap.lessons.find((lesson) => lesson.id === targetLessonId);
            if (l) {
              l.status = 'current';
              return true;
            }
            if (chap.children && findAndMarkCurrent(chap.children)) return true;
          }
          return false;
        };
        findAndMarkCurrent(chapters);

        // 查找 context
        for (const chapVO of flatAllChapters) {
          const m = chapVO.materials?.find((mat) => String(mat.materialId) === targetLessonId);
          if (m) {
            currentMaterial = m;
            currentChapter = chapVO;
            break;
          }
        }
      }
    }

    // 计算位置（章节编号用顶级章节的）
    const topChapterIdx = topLevelChapters.findIndex(
      (tc) =>
        tc.chapterId === currentChapter?.chapterId ||
        (currentChapter?.parentId !== 0 &&
          tc.children?.some((child) => child.chapterId === currentChapter?.chapterId))
    );

    const findCurrentChapterInAggr = (list: StudyChapter[]): StudyChapter | undefined => {
      for (const c of list) {
        if (c.lessons.some((l) => l.status === 'current')) return c;
        if (c.children) {
          const result = findCurrentChapterInAggr(c.children);
          if (result) return result;
        }
      }
      return undefined;
    };

    const currentChapterInAggr = findCurrentChapterInAggr(chapters);
    const lessonIdxInAggr =
      currentChapterInAggr?.lessons.findIndex((l) => l.status === 'current') ?? -1;

    const lessonMeta =
      topChapterIdx !== -1 && lessonIdxInAggr !== -1
        ? `第${numToChinese(topChapterIdx + 1)}章 · 第${lessonIdxInAggr + 1}节`
        : '';

    // 上一课/下一课
    const currentIndex = allLessons.findIndex((l) => l.status === 'current');
    const safeIndex = currentIndex !== -1 ? currentIndex : 0;
    const prevLesson = safeIndex > 0 ? allLessons[safeIndex - 1] : null;
    const nextLesson = safeIndex < allLessons.length - 1 ? allLessons[safeIndex + 1] : null;

    return {
      courseTitle: courseDetail.courseName || '',
      lessonTitle: currentMaterial?.fileName || '未选择课件',
      lessonMeta,
      progress: courseDetail.progress ?? 0,
      source: currentMaterial?.fileUrl || '',
      poster: currentMaterial?.coverUrl || '',
      mediaType: getMediaType(currentMaterial?.fileFormat, currentMaterial?.fileType),
      knowledgePoints: (currentChapter?.knowledgePoints || [])
        .map((kp) => kp.name)
        .filter(Boolean) as string[],
      previousHref: prevLesson?.href || '',
      nextHref: nextLesson?.href || '',
      chapters,
      datasetId: courseDetail.datasetId
    };
  }, [courseDetail, searchParams]);

  /* ---------- 学习进度跟踪 ---------- */
  const saveProgress = useMemoizedFn(async () => {
    if (!avatarId || !materialId || !chapterId || !displayData) return;
    const isMedia = displayData.mediaType === 'video' || displayData.mediaType === 'audio';
    try {
      const payload: SaveStudyProgressRequest = {
        avatarId: Number(avatarId),
        chapterId: Number(chapterId),
        materialId: Number(materialId),
        isMedia,
        studentId: studentId ? Number(studentId) : undefined,
        studyProgress: 0,
        duration: 0
      };

      if (isMedia && mediaRef.current) {
        payload.studyProgress = Math.floor(mediaRef.current.currentTime);
        payload.duration = Math.floor(mediaRef.current.duration) || 0;
      } else {
        const stayTime = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        if (displayData.mediaType === 'image') {
          payload.duration = 10;
          payload.studyProgress = Math.min(
            initialStudyProgressRef.current + stayTime,
            payload.duration
          );
        } else if (
          displayData.mediaType === 'pdf' ||
          displayData.mediaType === 'office' ||
          displayData.mediaType === 'iframe'
        ) {
          payload.duration = 60;
          payload.studyProgress = Math.min(
            initialStudyProgressRef.current + stayTime,
            payload.duration
          );
        }
      }

      const duration = payload.duration ?? 0;
      const studyProgress = payload.studyProgress ?? 0;

      // 已达最大进度：只发送一次最终请求，避免重复调用
      if (duration > 0 && studyProgress >= duration) {
        if (hasSavedMaxRef.current) return;
        hasSavedMaxRef.current = true;
      }

      await saveStudyProgress(payload);

      // 成功后更新本地 courseDetail，让进度环实时变化
      setCourseDetail((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          chapters: prev.chapters?.map((ch) =>
            updateChapterMaterial(ch, Number(materialId), studyProgress, duration)
          )
        };
        return next;
      });
    } catch (error) {
      console.error('保存学习进度失败:', error);
    }
  });

  // 当课件切换时，立即调用一次
  useEffect(() => {
    if (displayData) {
      viewStartTimeRef.current = Date.now();
      hasSavedMaxRef.current = false;
      saveProgress();
    }
  }, [materialId, chapterId, saveProgress, !!displayData]);

  // 所有课件类型均开启 10s 轮询保存进度
  useInterval(
    () => {
      saveProgress();
    },
    displayData ? 2000 : undefined
  );

  /* ---------- 获取课程 AI 教师 appId ---------- */
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

  /* ---------- 加载学生偏好设置（如果未加载） ---------- */
  useEffect(() => {
    useStudentPreferenceStore.getState().loadPreferenceIfNeeded();
  }, []);

  /* ---------- 获取课程详情 ---------- */
  useEffect(() => {
    if (!avatarId) return;

    let active = true;
    const loadDetail = async () => {
      try {
        if (!courseDetail) {
          setIsLoading(true);
        }
        const detail = await getStudentCourseDetail({
          avatarId: Number(avatarId)
        });
        if (active) {
          setCourseDetail(detail);
          // 保存 teachingConfig 作为 teacherSetting（已经是 JSON 字符串）
          setTeachingConfig(detail.teachingConfig || '{}');
        }
      } catch (error) {
        if (active) {
          toast({
            title: '获取课程详情失败',
            status: 'error'
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      active = false;
    };
  }, [avatarId, toast, materialId]);

  const firstLessonQuery = useMemo(() => {
    if (!courseDetail) return null;

    const topLevelChapters = [...(courseDetail.chapters || [])].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    for (const chapter of topLevelChapters) {
      // 1. 检查章节自身的课件
      const materials = [...(chapter.materials || [])].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      if (materials[0]?.materialId) {
        return {
          chapterId: String(chapter.chapterId),
          materialId: String(materials[0].materialId)
        };
      }

      // 2. 检查子章节的课件
      const children = [...(chapter.children || [])].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );

      for (const child of children) {
        const childMaterials = [...(child.materials || [])].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
        );
        if (childMaterials[0]?.materialId) {
          return {
            chapterId: String(child.chapterId),
            materialId: String(childMaterials[0].materialId)
          };
        }
      }
    }

    return null;
  }, [courseDetail]);

  useEffect(() => {
    if (!firstLessonQuery) return;

    const chapterIdInUrl = searchParams.get('chapterId');
    const materialIdInUrl = searchParams.get('materialId');

    // URL 缺少目录定位参数时，自动补齐为首个可学习课件，确保地址可分享和可回放。
    if (chapterIdInUrl && materialIdInUrl) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('chapterId', firstLessonQuery.chapterId);
    nextParams.set('materialId', firstLessonQuery.materialId);

    router.replace(`${pathname || '/student/study'}?${nextParams.toString()}`);
  }, [firstLessonQuery, pathname, router, searchParams]);

  const currentChapterIndex = useMemo(() => {
    if (!displayData) return -1;

    const findInChapter = (chapter: StudyChapter): boolean => {
      if (chapter.lessons.some((l) => l.status === 'current')) return true;
      if (chapter.children?.some((child) => findInChapter(child))) return true;
      return false;
    };

    return displayData.chapters.findIndex((c) => findInChapter(c));
  }, [displayData]);

  // 右侧目录自动展开当前选中课件所在章节
  useEffect(() => {
    if (currentChapterIndex !== -1) {
      setExpandedIndices((prev) => {
        if (!prev.includes(currentChapterIndex)) {
          return [...new Set([...prev, currentChapterIndex])];
        }
        return prev;
      });
    }
  }, [currentChapterIndex]);

  const handleNav = async (href: string) => {
    if (!href || href === '#') return;
    try {
      await saveProgress();
    } catch (e) {
      console.error('Save progress failed before nav:', e);
    }
    router.push(href);
  };

  /* ---------- Loading 状态 ---------- */
  if (isLoading) {
    return (
      <Flex h="60vh" align="center" justify="center">
        <Spinner color="red.500" thickness="4px" size="xl" />
      </Flex>
    );
  }

  if (!displayData) {
    return null;
  }

  const data = displayData;

  /* ---------- 渲染 ---------- */
  return (
    <Box>
      {/* 顶部导航栏 */}
      <Box
        // bg={designTokens.colors.bgPrimary}
        // border={`1px solid ${designTokens.colors.borderLight}`}
        borderRadius="20px"
        px={{ base: '16px', md: '24px' }}
        py="14px"
      >
        <Flex justify="space-between" align="center" gap="16px" flexWrap="wrap">
          <HStack spacing="10px">
            <Link
              as={NextLink}
              href={`/student/course-detail?${searchParams.toString()}`}
              display="inline-flex"
              alignItems="center"
              gap="8px"
              color={designTokens.colors.textSecondary}
              _hover={{ color: designTokens.colors.complementary, textDecoration: 'none' }}
            >
              <ArrowLeftIcon width="18px" height="18px" />
              <Text fontWeight={designTokens.typography.weight.medium} fontSize="20px">
                {t('studentStudy.back' as any)}
              </Text>
            </Link>
            <Box w="1px" h="10px" bg={designTokens.colors.border} />
            <Text fontWeight={designTokens.typography.weight.semibold} color={'#888'}>
              {data.courseTitle}
            </Text>
          </HStack>
        </Flex>
      </Box>

      {/* 主体内容区 */}
      <Flex direction={{ base: 'column', lg: 'row' }} gap="24px">
        {/* 左侧：媒体预览 + 课件信息 */}
        <Box flex="1">
          {/* 媒体预览 */}
          <MediaPreview
            mediaType={data.mediaType}
            source={data.source || ''}
            poster={data.poster}
            mediaRef={mediaRef}
          />

          {/* 课件信息卡片 */}
          <Box {...cardStyle} p="24px" mb="16px">
            <Flex
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap="12px"
              mb="18px"
            >
              <Tooltip label={data.lessonTitle} hasArrow placement="top">
                <Text
                  fontSize={designTokens.typography.size.lg}
                  fontWeight={designTokens.typography.weight.bold}
                  noOfLines={1}
                  whiteSpace={'nowrap'}
                  maxW={'500px'}
                >
                  {data.lessonTitle}
                </Text>
              </Tooltip>
              {data.lessonMeta && (
                <Text color={designTokens.colors.textTertiary}>{data.lessonMeta}</Text>
              )}
            </Flex>

            {/* 知识点区域 */}
            {data.knowledgePoints.length > 0 && (
              <Box
                bg="#FFF7F7"
                border={`1px solid ${designTokens.colors.complementaryLight}`}
                borderRadius="18px"
                p="16px"
              >
                <HStack spacing="8px" mb="10px">
                  <BookIcon width="16px" height="16px" color={designTokens.colors.complementary} />
                  <Text
                    fontSize={designTokens.typography.size.base}
                    fontWeight={designTokens.typography.weight.medium}
                  >
                    {t('studentStudy.knowledgeTitle' as any)}
                  </Text>
                </HStack>
                <Flex wrap="wrap" gap="8px">
                  {data.knowledgePoints.map((name) => (
                    <Badge
                      key={name}
                      px="12px"
                      py="6px"
                      borderRadius="full"
                      bg={designTokens.colors.bgPrimary}
                      color={designTokens.colors.complementary}
                      border={`1px solid ${designTokens.colors.complementaryLight}`}
                    >
                      {name}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>

          {/* 上一课 / 下一课 导航 */}
          <Flex justify="space-between" gap="16px">
            <Button
              isDisabled={!data.previousHref}
              onClick={() => handleNav(data.previousHref)}
              leftIcon={<ChevronLeftIcon width="16px" height="16px" />}
              border={`1px solid #E7E7E7`}
              borderRadius="14px"
              bg="#fff"
              color="#333333"
              _hover={{
                borderColor: designTokens.colors.complementary,
                color: designTokens.colors.complementary,
                textDecoration: 'none'
              }}
            >
              {t('studentStudy.actions.previous' as any)}
            </Button>
            <Button
              isDisabled={!data.nextHref}
              onClick={() => handleNav(data.nextHref)}
              rightIcon={<ChevronRightIcon width="16px" height="16px" />}
              border={`1px solid #E7E7E7`}
              borderRadius="14px"
              bg="#fff"
              color="#333333"
              _hover={{
                borderColor: designTokens.colors.complementary,
                color: designTokens.colors.complementary,
                textDecoration: 'none'
              }}
            >
              {t('studentStudy.actions.next' as any)}
            </Button>
          </Flex>
        </Box>

        {/* 右侧：课程目录 */}
        <Box w={{ base: '100%', lg: '400px' }} flexShrink={0}>
          <Box {...cardStyle} overflow="hidden" position={{ lg: 'sticky' }} top={{ lg: '84px' }}>
            <Box p="16px" borderBottom={`1px solid ${designTokens.colors.borderLight}`}>
              <Box
                display={'flex'}
                alignItems={'center'}
                color={'#333'}
                fontSize={'18px'}
                gap={'6px'}
              >
                <Box width={'4px'} height={'15px'} background={'#C8000B'}></Box>
                <Text fontWeight={designTokens.typography.weight.semibold} fontSize={'18px'}>
                  {t('studentStudy.catalog.title' as any)}
                </Text>
              </Box>
              <Box mt="12px">
                <Flex justify="space-between" mb="6px">
                  <Text fontSize={designTokens.typography.size.base} color={'#4E5969'}>
                    {t('studentStudy.catalog.progress' as any)}
                  </Text>
                  <Text
                    fontSize={designTokens.typography.size.base}
                    fontWeight={designTokens.typography.weight.semibold}
                    color={'#C8000B'}
                  >
                    {data.progress}%
                  </Text>
                </Flex>
                <Progress
                  value={data.progress}
                  borderRadius="full"
                  colorScheme="red"
                  bg={designTokens.colors.fill[3]}
                />
              </Box>
            </Box>
            <Box
              height={'550px'}
              maxH="550px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px'
                }
              }}
            >
              <Accordion
                allowMultiple
                index={expandedIndices}
                onChange={(index) => setExpandedIndices(index as number[])}
              >
                <Stack spacing="20px" p="16px">
                  {data.chapters.map((chapter, index) => (
                    <StudyChapterBlock key={chapter.id} chapter={chapter} index={index} />
                  ))}
                </Stack>
              </Accordion>
            </Box>
          </Box>
        </Box>
      </Flex>

      {/* AI 助教聊天 */}
      <NewSmallChatContainer showCloseButton={true} avatarId={courseDetail?.avatarId}>
        {!isLoadingAppId && courseAiAppId && (
          <SmallChat
            simpleInput
            appId={courseAiAppId}
            minHeight="130px"
            forceNewChat
            aiAvatarId={courseDetail?.avatarId}
            welcomeText={t('studentChat.courseWelcomeText')}
            variables={{
              knowledgeBase: [{ datasetId: data.datasetId || '' }],
              studentSetting: translateStudentSettingToJson(studentSetting),
              teacherSetting: translateTeacherSettingToJson(teachingConfig),
              courseName: courseDetail?.courseName || '',
              description: courseDetail?.description || ''
            }}
          />
        )}
      </NewSmallChatContainer>
    </Box>
  );
}

/* ================================================================
   媒体预览组件 — 根据 mediaType 渲染不同元素
   ================================================================ */
function MediaPreview({
  mediaType,
  source,
  poster,
  mediaRef
}: {
  mediaType: StudyLessonMediaType;
  source: string;
  poster?: string;
  mediaRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC 键退出全屏
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const content = (() => {
    if (!source) {
      return (
        <Box
          w="100%"
          h="100%"
          borderRadius="24px"
          bg="gray.50"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <DocumentIcon width="48px" height="48px" color={designTokens.colors.textTertiary} />
          <Text mt="16px" color={designTokens.colors.textSecondary}>
            暂无课件内容
          </Text>
        </Box>
      );
    }

    switch (mediaType) {
      case 'video':
        return (
          <chakra.video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            controls
            poster={poster || undefined}
            width="100%"
            height="100%"
            borderRadius="24px"
            bg="black"
            objectFit="contain"
            key={source}
            src={source}
          />
        );
      case 'image':
        return (
          <Box
            as="img"
            key={source}
            src={source}
            w="100%"
            h="100%"
            borderRadius="24px"
            objectFit="contain"
            bg="gray.50"
          />
        );
      case 'audio':
        return (
          <Box
            w="100%"
            h="100%"
            borderRadius="24px"
            bg="gray.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <chakra.audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              controls
              src={source}
              w="80%"
              key={source}
            />
          </Box>
        );
      case 'office':
        return (
          <Box w="100%" h="100%" borderRadius="24px" overflow="hidden">
            <iframe
              key={source}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                source
              )}`}
              width="100%"
              height="100%"
              title="Office Preview"
              style={{ border: 'none' }}
            />
          </Box>
        );
      case 'pdf':
        return (
          <Box w="100%" h="100%" borderRadius="24px" overflow="hidden">
            <iframe
              key={source}
              src={`${source}#toolbar=0`}
              width="100%"
              height="100%"
              title="PDF Preview"
              style={{ border: 'none' }}
            />
          </Box>
        );
      case 'iframe':
        return (
          <Box w="100%" h="100%" borderRadius="24px" overflow="hidden">
            <iframe
              key={source}
              src={source}
              width="100%"
              height="100%"
              title="Content Preview"
              style={{ border: 'none' }}
            />
          </Box>
        );
      default:
        return (
          <Box
            w="100%"
            h="100%"
            borderRadius="24px"
            bg="gray.50"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
          >
            <DocumentIcon width="48px" height="48px" color={designTokens.colors.textTertiary} />
            <Text mt="16px" color={designTokens.colors.textSecondary}>
              该文件类型暂不支持在线预览
            </Text>
            <Button
              as="a"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              mt="12px"
              colorScheme="red"
              variant="outline"
              borderRadius="12px"
            >
              下载查看
            </Button>
          </Box>
        );
    }
  })();

  return (
    <Box
      {...cardStyle}
      w="100%"
      h={isFullscreen ? '100vh' : '550px'}
      p="16px"
      borderRadius={isFullscreen ? 0 : '24px'}
      mb={isFullscreen ? 0 : '16px'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : undefined}
      left={isFullscreen ? 0 : undefined}
      zIndex={isFullscreen ? 9999 : undefined}
    >
      {/* 全屏按钮 */}
      <Box position="absolute" top="12px" right="12px" zIndex={10}>
        <Button
          variant="ghost"
          minW="36px"
          h="36px"
          px="0"
          borderRadius="8px"
          bg="whiteAlpha.800"
          _hover={{ color: '#c8000b' }}
          onClick={() => setIsFullscreen((prev) => !prev)}
          aria-label={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </Button>
      </Box>
      {content}
    </Box>
  );
}

function StudyChapterContent({ chapter, depth = 0 }: { chapter: StudyChapter; depth?: number }) {
  const hasLessons = chapter.lessons.length > 0;
  const hasChildren = (chapter.children?.length ?? 0) > 0;

  return (
    <Stack spacing="4px">
      {hasLessons &&
        chapter.lessons.map((lesson) => (
          <StudyLessonRow key={lesson.id} lesson={lesson} depth={depth} />
        ))}

      {hasChildren && (
        <Stack spacing="4px" ml={depth === 0 ? '0' : '16px'}>
          {chapter.children!.map((childChapter) => (
            <Box key={childChapter.id}>
              {/* 子章节 Header */}
              <Flex align="center" gap="8px" py="8px" px="10px">
                <Box w="4px" h="4px" borderRadius="full" bg={designTokens.colors.primary} />
                <Text fontSize="13px" fontWeight="600" color={designTokens.colors.textPrimary}>
                  {childChapter.title}
                </Text>
              </Flex>
              {/* 递归子内容 */}
              <StudyChapterContent chapter={childChapter} depth={depth + 1} />
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

/* ================================================================
   课程目录 — 章节折叠块
   ================================================================ */
function StudyChapterBlock({ chapter, index }: { chapter: StudyChapter; index: number }) {
  const kpSummary = chapter.knowledgePoints?.join('、');

  return (
    <AccordionItem border="1px solid #F7F8FA" bg="white" borderRadius="16px" overflow="hidden">
      <AccordionButton
        p="12px 16px"
        bg="#F8FAFC"
        _hover={{ bg: '#F1F5F9' }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack spacing="12px">
          <Badge
            bg="#E6F4FF"
            color="#2E9AEC"
            px="8px"
            py="2px"
            borderRadius="12px 0"
            fontSize="12px"
            fontWeight="500"
          >
            第{numToChinese(index + 1)}章
          </Badge>
          <Text
            fontSize="14px"
            fontWeight="600"
            color="#333"
            noOfLines={1}
            textAlign="left"
            maxW="180px"
          >
            {chapter.title}
          </Text>
        </HStack>
        <AccordionIcon color="#86909C" />
      </AccordionButton>

      <AccordionPanel p="8px 16px 16px" bg="white">
        <Stack spacing="4px">
          {/* 知识点摘要行（仅顶层展示或根据需要递归） */}
          {kpSummary && (
            <Tooltip label={kpSummary} hasArrow placement="top">
              <Flex align="center" gap="10px" p="10px">
                <BookIcon width="16px" height="16px" color="#86909C" />
                <Text fontSize="14px" color="#86909C" noOfLines={1}>
                  {kpSummary}
                </Text>
              </Flex>
            </Tooltip>
          )}

          {/* 递归渲染层级内容 */}
          <StudyChapterContent chapter={chapter} />
        </Stack>
      </AccordionPanel>
    </AccordionItem>
  );
}

/* ================================================================
   课程目录 — 课件行
   ================================================================ */
function StudyLessonRow({ lesson, depth = 0 }: { lesson: StudyLesson; depth?: number }) {
  const current = lesson.status === 'current';

  return (
    <Link as={NextLink} href={lesson.href} _hover={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        gap="10px"
        p="10px"
        pl={depth > 0 ? `${depth * 16 + 10}px` : '10px'}
        borderRadius="12px"
        bg={current ? '#FFF1F0' : 'transparent'}
        transition="all 0.2s"
        _hover={{ bg: current ? '#FFF1F0' : '#F7F8FA' }}
      >
        <LessonStatusIndicator status={lesson.status} />

        <Flex align="center" justify="center" w="28px" h="28px" borderRadius="8px">
          {lesson.fileType === 'openmaic' || lesson.fileType === 'digital'
            ? getFileIconByName('folder')
            : getFileIconByName(lesson.fileFormat || lesson.title)}
        </Flex>

        <Box flex="1" minW={0}>
          <Tooltip label={lesson.title} placement="top" hasArrow>
            <Text
              fontSize="14px"
              color={current ? '#C8000B' : '#4E5969'}
              fontWeight={current ? '600' : '400'}
              noOfLines={1}
            >
              {lesson.title}
            </Text>
          </Tooltip>
        </Box>

        <LessonProgressRing progress={lesson.progress} />
      </Flex>
    </Link>
  );
}

/* ================================================================
   状态指示器
   ================================================================ */
function LessonStatusIndicator({ status }: { status: StudyLessonStatus }) {
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

/* ================================================================
   进度环 —— 纯进度展示，不感知 current 状态
   ================================================================ */
function LessonProgressRing({ progress = 0, size = 22 }: { progress?: number; size?: number }) {
  const r = 10;
  const c = 2 * Math.PI * r;
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
        cx="12"
        cy="12"
        r={r}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
      <text x="12" y="16" textAnchor="middle" fill={color} fontSize="8" fontWeight="600">
        {Math.round(pct)}
      </text>
    </svg>
  );
}

/* ================================================================
   SVG 图标
   ================================================================ */
function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="#333333"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function FullscreenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.93518 15.4525H7.5214V17.4353H2.56445V12.4784H4.54723V14.0646L7.5214 11.0904L8.90935 12.4784L5.93518 15.4525ZM13.9654 15.4525L10.9913 12.4784L12.3792 11.0904L15.4525 14.1637V12.4784H17.4353V17.4353H12.4784V15.4525H13.9654ZM5.93518 4.54723L8.90935 7.5214L7.5214 8.90935L4.54723 5.93518V7.5214H2.56445V2.56445H7.5214V4.54723H5.93518ZM13.9654 4.54723H12.4784V2.56445H17.4353V7.5214H15.4525V5.83604L12.3792 8.90935L10.9913 7.5214L13.9654 4.54723Z"
        fill="#333333"
      />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Box
      as="img"
      src={'/imgs/app/student/courseDetail/file_icon.png'}
      alt="AI Teacher Avatar"
      w="18px"
      h="18px"
      objectFit="contain"
    />
  );
}

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 2V9H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
