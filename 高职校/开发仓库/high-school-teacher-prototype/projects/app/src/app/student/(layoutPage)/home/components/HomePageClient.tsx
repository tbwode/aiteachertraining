'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { NewsModal } from './NewsModal';
import { TodoModal } from './TodoModal';
import { NewsDetailModal } from './NewsDetailModal';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Spinner,
  Text,
  Textarea,
  useMediaQuery,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@chakra-ui/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import type { HomePageData, SuggestionItem, NewsItem } from '../types';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import {
  getStudentAiTeacherSuggestions,
  postStudentSuggestionsMarkRead,
  getStudentPortrait
} from '@/student/api/aiTeacher';
import { getStudentOverview } from '@/student/api/overview';
import {
  postStudentNotificationPage,
  postStudentNotificationUnreadNum
} from '@/student/api/notice';
import { useAuth } from '@/app/components/auth';
import { useVoiceInput } from '@/web/common/hooks/useVoiceInput';
import { uploadPrivateFile, createMineruParseTask } from '@/teacher/api/file';
import type { FileMetaType } from '@/teacher/api/file';
import { getFileIconByName } from '@/utils/fileIcon';
import { useCareerDiagnosis } from '@/app/common-chat/hooks/useCareerDiagnosis';
import type { TargetPosition } from '@/types/career-diagnosis';

export type AttachmentFile = FileMetaType & { taskId?: string };

const ORDER = ['news', 'ability', 'todo'] as const;
type TabKey = (typeof ORDER)[number];

const POSITIONS = ['far-left', 'left', 'center', 'right', 'far-right'] as const;
type Position = (typeof POSITIONS)[number];

const POS_OFFSET: Record<Position, number> = {
  'far-left': -2,
  left: -1,
  center: 0,
  right: 1,
  'far-right': 2
};

const POS_STYLE: Record<
  Position,
  { transform: string; opacity: number; zIndex: number; filter?: string; transformOrigin: string }
> = {
  'far-left': {
    transform: 'translateX(-132%) translateZ(-160px) rotateY(26deg) scale(0.68)',
    opacity: 0.48,
    zIndex: 0,
    filter: 'blur(2px) saturate(0.85)',
    transformOrigin: 'right center'
  },
  left: {
    transform: 'translateX(-78%) translateZ(-70px) rotateY(18deg) scale(0.84)',
    opacity: 0.75,
    zIndex: 1,
    filter: 'blur(0px) saturate(1)',
    transformOrigin: 'right center'
  },
  center: {
    transform: 'translateX(0) translateZ(0) rotateY(0) scale(1)',
    opacity: 1,
    zIndex: 10,
    filter: 'blur(0px) saturate(1)',
    transformOrigin: 'center center'
  },
  right: {
    transform: 'translateX(78%) translateZ(-70px) rotateY(-18deg) scale(0.84)',
    opacity: 0.75,
    zIndex: 1,
    filter: 'blur(0px) saturate(1)',
    transformOrigin: 'left center'
  },
  'far-right': {
    transform: 'translateX(132%) translateZ(-160px) rotateY(-26deg) scale(0.68)',
    opacity: 0.48,
    zIndex: 0,
    filter: 'blur(2px) saturate(0.85)',
    transformOrigin: 'left center'
  }
};

const cardStyle = {
  bg: '#FFFFFF',
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid #F0F0F0'
} as const;

const titleAccentStyle = {
  width: '4px',
  height: '14px',
  borderRadius: '999px',
  bg: '#C8000B'
} as const;

export function HomePageClient({ data }: { data: HomePageData }) {
  const { t } = useTranslation('student');
  const toast = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isShortScreen] = useMediaQuery('(max-height: 900px)');
  const cardWidth = isShortScreen ? 280 : 368;
  const cardHeight = isShortScreen ? 300 : 448;
  const carouselHeight = isShortScreen ? 340 : 520;
  const receiverId = Number(user?.id);
  const hasValidReceiverId = Number.isFinite(receiverId) && receiverId > 0;
  const [text, setText] = useState('');

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 12) return 'forenoon';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 18) return 'afternoon';
    return 'evening';
  }, []);
  const { startSpeak, stopSpeak, isSpeaking, isTransCription, speakingTimeString } =
    useVoiceInput();
  const isRecordingMode = isSpeaking || isTransCription;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('news');
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [todoList, setTodoList] = useState(data.todoList);
  const [suggestionList, setSuggestionList] = useState<SuggestionItem[]>([]);
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: fetchedSuggestions } = useRequest2(getStudentAiTeacherSuggestions, {
    errorToast: '',
    manual: false
  });

  const { runAsync: markRead } = useRequest2(postStudentSuggestionsMarkRead, {
    errorToast: ''
  });

  useEffect(() => {
    if (fetchedSuggestions && fetchedSuggestions.length > 0) {
      setSuggestionList(fetchedSuggestions);
    }
  }, [fetchedSuggestions]);

  const { data: notificationPageData } = useRequest2(
    () =>
      postStudentNotificationPage({
        current: 1,
        size: 3,
        receiverId,
        descs: 'notificationTime'
      }),
    {
      errorToast: '',
      manual: !hasValidReceiverId
    }
  );

  const { data: portraitData } = useRequest2(getStudentPortrait, {
    errorToast: '',
    manual: false
  });

  const studentId = user?.studentId;

  // 解析 portraitJson，判断 student_code 是否存在
  const parsedPortrait = useMemo(() => {
    if (portraitData?.portraitJson) {
      try {
        return JSON.parse(portraitData.portraitJson);
      } catch {
        return null;
      }
    }
    return null;
  }, [portraitData]);

  const hasStudentCode = !!parsedPortrait?.student_code;

  // 仅当 student_code 不存在时，调用学生信息接口获取雷达图维度名称
  const { data: overviewData, run: fetchOverview } = useRequest2(
    () => getStudentOverview({ studentId: studentId! }),
    {
      errorToast: '',
      manual: true,
    }
  );

  useEffect(() => {
    if (studentId && !hasStudentCode && portraitData !== undefined) {
      fetchOverview();
    }
  }, [studentId, hasStudentCode, portraitData, fetchOverview]);

  const { data: unreadNumData } = useRequest2(postStudentNotificationUnreadNum, {
    errorToast: '',
    manual: false
  });

  const abilityDimensions = useMemo(() => {
    // 场景一：student_code 存在，从 portraitJson 取完整雷达图数据
    if (hasStudentCode && parsedPortrait?.radar_chart?.items?.length > 0) {
      return parsedPortrait.radar_chart.items.map((item: any) => ({
        key: String(item.dimension),
        label: String(item.dimension),
        value: Number(item.value ?? 0),
        fullMark: 100
      }));
    }

    // 场景二：student_code 不存在，从 overview 接口取维度名称（分值=0）
    if (!hasStudentCode && overviewData?.radarDimensions) {
      try {
        const dimensions = JSON.parse(overviewData.radarDimensions);
        if (Array.isArray(dimensions) && dimensions.length > 0) {
          return dimensions.map((dim: string) => ({
            key: dim,
            label: dim,
            value: 0,
            fullMark: 100
          }));
        }
      } catch {
        // 解析失败返回空数组
      }
    }

    return [];
  }, [hasStudentCode, parsedPortrait, overviewData]);

  const radarData = useMemo(
    () =>
      abilityDimensions.map((item) => ({
        subject: item.label,
        A: item.value,
        fullMark: item.fullMark
      })),
    [abilityDimensions]
  );

  // 职业能力诊断（目标岗位 + 人培要求），用于雷达图三系列对比
  const { careerDiagnosis, fetchCareerDiagnosis } = useCareerDiagnosis();
  const activePosition: TargetPosition | undefined = careerDiagnosis?.targetPositions?.[0];
  const hasTraining = (careerDiagnosis?.trainingPlanAbilities?.length ?? 0) > 0;

  // 能力维度就绪后触发职业诊断（默认取第一个目标岗位）
  useEffect(() => {
    if (!studentId || abilityDimensions.length === 0) return;
    const majorName = parsedPortrait?.major_name ?? overviewData?.majorName ?? '';
    if (!majorName) return;
    void fetchCareerDiagnosis({
      studentId,
      studentName: parsedPortrait?.student_name,
      studentCode: parsedPortrait?.student_code,
      majorName,
      abilityDimensions: abilityDimensions.map((a) => a.label),
      currentAbilities: abilityDimensions.map((a) => ({ dimension: a.label, value: a.value }))
    });
  }, [studentId, abilityDimensions, parsedPortrait, overviewData, fetchCareerDiagnosis]);

  // 三系列雷达数据：目标岗位要求 / 人培要求 / 我的能力
  const radarDataTriple = useMemo(
    () =>
      abilityDimensions.map((item) => {
        const target =
          activePosition?.abilities?.find((a) => a.dimension === item.label)?.target ?? 0;
        const training =
          careerDiagnosis?.trainingPlanAbilities?.find((a) => a.dimension === item.label)
            ?.training ?? 0;
        return {
          subject: item.label,
          current: item.value,
          target,
          training,
          fullMark: 100
        };
      }),
    [abilityDimensions, activePosition, careerDiagnosis]
  );

  const tabToPosition = useMemo(() => {
    const activeIndex = ORDER.indexOf(activeTab);
    const n = ORDER.length;
    const result: Partial<Record<TabKey, Position>> = {};
    ORDER.forEach((tab, i) => {
      const offset = i - activeIndex;
      const normalizedOffset = ((offset % n) + n) % n;
      if (normalizedOffset === 0) result[tab] = 'center';
      else if (normalizedOffset === 1) result[tab] = 'right';
      else if (normalizedOffset === n - 1) result[tab] = 'left';
      else if (normalizedOffset === 2) result[tab] = 'far-right';
      else if (normalizedOffset === n - 2) result[tab] = 'far-left';
    });
    return result;
  }, [activeTab]);

  const positionToTab = useMemo(() => {
    const activeIndex = ORDER.indexOf(activeTab);
    const n = ORDER.length;
    return POSITIONS.reduce(
      (acc, pos) => {
        const offset = POS_OFFSET[pos];
        const tabIndex = (((activeIndex + offset) % n) + n) % n;
        acc[pos] = ORDER[tabIndex];
        return acc;
      },
      {} as Record<Position, TabKey>
    );
  }, [activeTab]);

  const goToCommonChat = () => {
    router.push('/common-chat');
  };

  const handleStartVoice = () => {
    startSpeak((result) => {
      setText((prev) => (prev ? prev + result : result));
    });
  };

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveAttachment = useCallback((fileKey: string) => {
    setAttachments((prev) => prev.filter((f) => f.fileKey !== fileKey));
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadPrivateFile(formData);
      setAttachments((prev) => [...prev, { ...res }]);
      try {
        const taskId = await createMineruParseTask({
          fileKey: res.fileKey,
          fileUrl: res.fileUrl || ''
        });
        setAttachments((prev) =>
          prev.map((f) => (f.fileKey === res.fileKey ? { ...f, taskId } : f))
        );
      } catch {
        // 解析任务失败不影响附件展示
      }
    } catch (error) {
      console.error('文件上传失败:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const renderPanel = (tab: TabKey) => {
    if (tab === 'news') {
      const displayList = suggestionList;
      const hasNewsData = displayList.length > 0;
      return (
        <>
          <SectionTitle compact={isShortScreen}>{t('home.news.title')}</SectionTitle>
          <Text
            fontSize={isShortScreen ? '14px' : '16px'}
            fontWeight={500}
            color="#1F2937"
            mb={isShortScreen ? '8px' : '16px'}
          >
            {t('home.news.subtitle')}
          </Text>

          <Box flex={1} w="100%" overflow="auto">
            {hasNewsData ? (
              <VStack spacing={isShortScreen ? '8px' : '12px'} align="stretch">
                {displayList.slice(0, 3).map((item) => (
                  <Box
                    key={item.id}
                    p={isShortScreen ? '10px' : '14px'}
                    bg="#FAFBFC"
                    borderRadius={isShortScreen ? '8px' : '12px'}
                    border="1px solid #F2F3F5"
                    cursor="pointer"
                    _hover={{ bg: '#F0F1F3' }}
                    onClick={() => {
                      if ('summary' in item) {
                        setDetailItem(item as NewsItem);
                      } else {
                        setDetailItem({
                          id: String(item.id),
                          title: item.title,
                          summary: item.content,
                          content: item.content,
                          relatedCourse: item.relatedCourseName,
                          publishTime: item.publishTime,
                          isRead: item.isRead === 1
                        });
                      }
                      setIsDetailOpen(true);
                    }}
                  >
                    <Text
                      fontSize={isShortScreen ? '12px' : '13px'}
                      fontWeight={500}
                      color="#1F2937"
                      mb={isShortScreen ? '4px' : '6px'}
                    >
                      {item.title}
                    </Text>
                    <Text fontSize="12px" color="#9CA3AF" noOfLines={1}>
                      {'content' in item ? item.content : item.summary}
                    </Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Flex h="100%" align="center" justify="center">
                <Text fontSize="14px" color="#9CA3AF">
                  {t('home.todoDetail.noData')}
                </Text>
              </Flex>
            )}
          </Box>

          <Flex justify="center" mt="auto">
            <Button
              variant="ghost"
              size="sm"
              color="#C8000B"
              fontSize="13px"
              fontWeight={500}
              rightIcon={<ArrowRightIcon />}
              _hover={{ bg: 'transparent', color: '#B9000D' }}
              onClick={() => setIsNewsOpen(true)}
            >
              {t('home.news.viewAll')}
            </Button>
          </Flex>
        </>
      );
    }

    if (tab === 'ability') {
      const hasRadarData = radarData.length > 0;
      return (
        <>
          <SectionTitle compact={isShortScreen}>{t('home.ability.title')}</SectionTitle>
          {hasRadarData && (
            <Text
              fontSize={isShortScreen ? '14px' : '16px'}
              fontWeight={500}
              color="#1F2937"
              mb={isShortScreen ? '4px' : '8px'}
            >
              {t('home.ability.subtitle')}
            </Text>
          )}

          {hasRadarData && (
            <Text fontSize="12px" color="#9CA3AF" mb={isShortScreen ? '4px' : '8px'}>
              {t('home.ability.radarName')}
            </Text>
          )}

          <Box flex={1} w="100%">
            {hasRadarData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius={isShortScreen ? '60%' : '68%'}
                  data={radarDataTriple}
                >
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  {activePosition && (
                    <Radar
                      name={t('home.ability.target_requirement')}
                      dataKey="target"
                      stroke="#C8000B"
                      fill="#C8000B"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  )}
                  {activePosition && hasTraining && (
                    <Radar
                      name={t('home.ability.training_requirement')}
                      dataKey="training"
                      stroke="#4E5969"
                      fill="#4E5969"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  )}
                  <Radar
                    name={t('home.ability.my_ability')}
                    dataKey="current"
                    stroke="#C8000B"
                    fill="#C8000B"
                    fillOpacity={0.25}
                    strokeWidth={2.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Flex h="100%" align="center" justify="center">
                <Text fontSize="14px" color="#9CA3AF">
                  {t('home.todoDetail.noData')}
                </Text>
              </Flex>
            )}
          </Box>

          {hasRadarData && (
            <Flex justify="center" gap="12px" mt={2} flexWrap="wrap">
              {activePosition && (
                <HStack spacing="4px">
                  <Box w="10px" h="3px" bg="#C8000B" opacity={0.6} borderRadius="2px" />
                  <Text fontSize="11px" color="#6B7280">{t('home.ability.target_requirement')}</Text>
                </HStack>
              )}
              {activePosition && hasTraining && (
                <HStack spacing="4px">
                  <Box w="10px" h="3px" bg="#4E5969" opacity={0.6} borderRadius="2px" />
                  <Text fontSize="11px" color="#6B7280">{t('home.ability.training_requirement')}</Text>
                </HStack>
              )}
              <HStack spacing="4px">
                <Box w="10px" h="3px" bg="#C8000B" borderRadius="2px" />
                <Text fontSize="11px" color="#6B7280">{t('home.ability.my_ability')}</Text>
              </HStack>
            </Flex>
          )}

          <Flex justify="center" mt="auto">
            <Button
              variant="ghost"
              size="sm"
              color="#C8000B"
              fontSize="13px"
              fontWeight={500}
              rightIcon={<ArrowRightIcon />}
              _hover={{ bg: 'transparent', color: '#B9000D' }}
              onClick={() => router.push('/common-chat/study-portrait')}
            >
              {t('home.ability.viewDetail')}
            </Button>
          </Flex>
        </>
      );
    }

    const notificationRecords = notificationPageData?.records || [];
    const todoDisplayList = notificationRecords;
    const todoTotalCount = unreadNumData ?? 0;

    return (
      <>
        <SectionTitle compact={isShortScreen}>{t('home.todo.title')}</SectionTitle>
        <Text
          fontSize={isShortScreen ? '14px' : '16px'}
          fontWeight={500}
          color="#1F2937"
          mb={isShortScreen ? '8px' : '16px'}
        >
          {t('home.todo.subtitle', { count: todoTotalCount })}
        </Text>

        <Box flex={1} w="100%" overflow="auto">
          {todoDisplayList.length > 0 ? (
            <VStack spacing={isShortScreen ? '8px' : '12px'} align="stretch">
              {todoDisplayList.slice(0, 3).map((item) => {
                const isNotification = typeof item.id === 'number';
                const title = isNotification
                  ? (item as any).title || t('home.todoDetail.systemNotify')
                  : `【${(item as any).teacherName}】${t('home.todoDetail.teacherRemind')}：`;
                const content = isNotification
                  ? (item as any).content || ''
                  : `${(item as any).courseName}${t('home.todoDetail.progressSuffix')}`;
                return (
                  <Box
                    key={isNotification ? `n-${item.id}` : item.id}
                    p={isShortScreen ? '10px' : '14px'}
                    bg="#FAFBFC"
                    borderRadius={isShortScreen ? '8px' : '12px'}
                    border="1px solid #F2F3F5"
                  >
                    <Text
                      fontSize={isShortScreen ? '12px' : '13px'}
                      fontWeight={500}
                      color="#1F2937"
                      mb={isShortScreen ? '4px' : '6px'}
                    >
                      {title}
                    </Text>
                    <Text fontSize="12px" color="#9CA3AF" noOfLines={1}>
                      {content}
                    </Text>
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <Flex h="100%" align="center" justify="center">
              <Text fontSize="14px" color="#9CA3AF">
                {t('home.todoDetail.noData')}
              </Text>
            </Flex>
          )}
        </Box>

        <Flex justify="center" mt="auto">
          <Button
            variant="ghost"
            size="sm"
            color="#C8000B"
            fontSize="13px"
            fontWeight={500}
            rightIcon={<ArrowRightIcon />}
            _hover={{ bg: 'transparent', color: '#B9000D' }}
            onClick={() => router.push('/student/notice')}
          >
            {t('home.todo.viewAll', { count: todoTotalCount })}
          </Button>
        </Flex>
      </>
    );
  };

  return (
    <VStack spacing={isShortScreen ? 2 : 6} w="100%">
      {/* Greeting */}
      <VStack spacing={2} align="center">
        <Text fontSize="25px" fontWeight={500} color="#1F2937">
          {t(`home.greeting.${greetingKey}`, { name: (user?.name ?? data.userName).charAt(0) })}
        </Text>
      </VStack>

      {/* Cards Carousel */}
      <Box position="relative" h={`${carouselHeight}px`} sx={{ perspective: '1200px' }} w="100%">
        {ORDER.map((tab) => {
          const pos = tabToPosition[tab];
          if (!pos) return null;
          const style = POS_STYLE[pos];
          const isCenter = pos === 'center';
          const isClickable = pos === 'left' || pos === 'right';

          return (
            <Box
              key={tab}
              role={isClickable ? 'button' : undefined}
              onClick={isClickable ? () => setActiveTab(tab) : undefined}
              cursor={isClickable ? 'pointer' : 'default'}
              position="absolute"
              top="50%"
              left="50%"
              mt={`-${cardHeight / 2}px`}
              ml={`-${cardWidth / 2}px`}
              w={`${cardWidth}px`}
              h={`${cardHeight}px`}
              bg="white"
              border="1px solid"
              borderColor={isCenter ? 'rgba(0, 0, 0, 0.50)' : '#E5E7EB'}
              borderRadius="28px"
              boxShadow={isCenter ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.05)'}
              px={5}
              py={5}
              transform={style.transform}
              opacity={style.opacity}
              zIndex={style.zIndex}
              filter={style.filter}
              transition="transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease, filter 0.45s ease, box-shadow 0.45s ease"
              transformOrigin={style.transformOrigin}
              overflow="hidden"
            >
              <Flex h="100%" direction="column" pointerEvents={isCenter ? 'auto' : 'none'}>
                {renderPanel(tab)}
              </Flex>
            </Box>
          );
        })}

        {(['far-left', 'far-right'] as Position[]).map((pos) => {
          const tab = positionToTab[pos];
          const mainPos = tabToPosition[tab];
          if (mainPos === pos) return null;

          const style = POS_STYLE[pos];

          return (
            <Box
              key={pos}
              position="absolute"
              top="50%"
              left="50%"
              mt={`-${cardHeight / 2}px`}
              ml={`-${cardWidth / 2}px`}
              w={`${cardWidth}px`}
              h={`${cardHeight}px`}
              bg="white"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="28px"
              boxShadow="0 8px 24px rgba(0, 0, 0, 0.05)"
              px={5}
              py={5}
              transform={style.transform}
              opacity={style.opacity}
              zIndex={style.zIndex}
              filter={style.filter}
              transition="transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease, filter 0.45s ease"
              transformOrigin={style.transformOrigin}
              overflow="hidden"
              pointerEvents="none"
            >
              <Flex h="100%" direction="column">
                {renderPanel(tab)}
              </Flex>
            </Box>
          );
        })}
      </Box>

      <NewsModal
        isOpen={isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        newsList={newsList}
        suggestionList={suggestionList}
        onMarkRead={async (id) => {
          const numId = Number(id);
          if (Number.isNaN(numId)) return;
          try {
            await markRead({ suggestionIds: [numId] });
            setSuggestionList((prev) =>
              prev.map((item) => (item.id === numId ? { ...item, isRead: 1 } : item))
            );
          } catch {
            // 静默失败
          }
        }}
        onMarkAllRead={async () => {
          const unreadIds = suggestionList
            .filter((item) => item.isRead === 0)
            .map((item) => item.id);
          if (unreadIds.length === 0) return;
          try {
            await markRead({ suggestionIds: unreadIds });
            setSuggestionList((prev) => prev.map((item) => ({ ...item, isRead: 1 })));
          } catch {
            // 静默失败
          }
        }}
      />

      <TodoModal
        isOpen={isTodoOpen}
        onClose={() => setIsTodoOpen(false)}
        todoList={todoList}
        onMarkRead={(id) =>
          setTodoList((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
          )
        }
        onDelete={(id) => setTodoList((prev) => prev.filter((item) => item.id !== id))}
      />

      <NewsDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
        onMarkRead={async () => {
          if (detailItem) {
            const numId = Number(detailItem.id);
            if (!Number.isNaN(numId)) {
              try {
                await markRead({ suggestionIds: [numId] });
                setSuggestionList((prev) =>
                  prev.map((item) => (item.id === numId ? { ...item, isRead: 1 } : item))
                );
              } catch {
                // 静默失败
              }
            }
          }
        }}
      />

      {/* Chat Input Area */}
      <Box maxW="880px" mx="auto" w="100%" mt="20px">
        <HStack spacing={2} mb="12px" justify="flex-start">
          <ChatTab onClick={goToCommonChat}>{t('home.chat.tabDialogue')}</ChatTab>
          <ChatTab onClick={() => router.push('/common-chat?type=create_ai_lecture')}>
            {t('home.chat.tabAiTeacher')}
          </ChatTab>
          <ChatTab onClick={() => router.push('/common-chat?type=learning_portrait')}>
            {t('home.chat.tabLearning')}
          </ChatTab>
        </HStack>

        {/* 附件预览 */}
        {attachments.length > 0 && (
          <HStack spacing="12px" mt="12px" flexWrap="wrap">
            {attachments.map((file) => (
              <Box
                key={file.fileKey}
                position="relative"
                borderRadius="8px"
                border="1px solid #E5E6EB"
                bg="#F7F8FA"
                p="6px"
                display="flex"
                alignItems="center"
                gap="8px"
                maxW="200px"
              >
                <Box
                  position="relative"
                  w="40px"
                  h="40px"
                  flexShrink={0}
                  borderRadius="4px"
                  bg="#E5E6EB"
                  overflow="hidden"
                >
                  {file.fileUrl && (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      w="40px"
                      h="40px"
                      objectFit="cover"
                      position="absolute"
                      top={0}
                      left={0}
                      zIndex={1}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <Flex
                    position="absolute"
                    top={0}
                    left={0}
                    w="40px"
                    h="40px"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={0}
                  >
                    {getFileIconByName(file.fileName, { size: '24px' })}
                  </Flex>
                </Box>
                <Text fontSize="12px" color="#333" noOfLines={1} maxW="100px">
                  {file.fileName}
                </Text>
                <Box
                  as="button"
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  w="16px"
                  h="16px"
                  borderRadius="50%"
                  bg="#999"
                  color="#fff"
                  fontSize="10px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={() => handleRemoveAttachment(file.fileKey)}
                >
                  ×
                </Box>
              </Box>
            ))}
          </HStack>
        )}
        <Box
          position="relative"
          bg="white"
          border="1px solid"
          borderColor="#E5E7EB"
          borderRadius="14px"
          boxShadow="0 1px 3px rgba(0, 0, 0, 0.04)"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('home.chat.placeholder')}
            resize="none"
            rows={2}
            minH="130px"
            maxH="180px"
            border="none"
            px={4}
            pt={3}
            pb={12}
            borderRadius="14px"
            _focus={{ boxShadow: 'none' }}
            fontSize="14px"
            color="#1F2937"
            isDisabled={isRecordingMode}
            sx={{
              '&::placeholder': {
                color: '#9CA3AF'
              }
            }}
          />

          {isRecordingMode ? (
            <Flex position="absolute" bottom="12px" right="16px" align="center" gap={2} zIndex={1}>
              <Box
                as="button"
                type="button"
                w="28px"
                h="28px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="red.500"
                _hover={{ color: 'red.600', bg: 'red.50' }}
                aria-label={t('home.chat.voice_cancel')}
                onClick={() => stopSpeak('cancel')}
                disabled={isTransCription}
              >
                <CloseIcon />
              </Box>
              <Flex
                align="center"
                gap={1.5}
                px={2.5}
                h="28px"
                bg={isTransCription ? 'gray.100' : 'red.50'}
                borderRadius="full"
                fontSize="13px"
                color={isTransCription ? '#9CA3AF' : 'red.500'}
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {isTransCription ? (
                  <>
                    <Spinner size="xs" />
                    <Text>{t('home.chat.voice_transcribing')}</Text>
                  </>
                ) : (
                  <>
                    <Box
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      bg="red.500"
                      sx={{
                        animation: 'pulse 1.2s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.3 }
                        }
                      }}
                    />
                    <Text>{speakingTimeString}</Text>
                  </>
                )}
              </Flex>
              <Box
                as="button"
                type="button"
                w="28px"
                h="28px"
                borderRadius="full"
                bg="#1F1F1F"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{ bg: '#000' }}
                aria-label={t('home.chat.voice_finish')}
                onClick={() => stopSpeak('finish')}
                disabled={isTransCription}
              >
                <CheckIcon />
              </Box>
            </Flex>
          ) : (
            <Flex position="absolute" bottom="12px" right="16px" align="center" gap={2} zIndex={1}>
              <Box
                as="button"
                type="button"
                w="28px"
                h="28px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="#9CA3AF"
                _hover={{ color: '#1F2937', bg: '#F3F4F6' }}
                aria-label={t('home.chat.voice')}
                onClick={handleStartVoice}
              >
                <MicIcon />
              </Box>
              <Box
                as="button"
                type="button"
                w="28px"
                h="28px"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="#9CA3AF"
                _hover={{ color: '#1F2937', bg: '#F3F4F6' }}
                aria-label={t('home.chat.attachment')}
                onClick={handleUploadClick}
              >
                {isUploading ? <Spinner size="xs" /> : <AttachIcon />}
              </Box>
              <Box
                as="button"
                type="button"
                w="28px"
                h="28px"
                borderRadius="full"
                bg="#1F1F1F"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{ bg: '#000' }}
                aria-label={t('home.chat.send')}
                onClick={() => {
                  if (attachments.length > 0) {
                    localStorage.setItem('common_chat_attachments', JSON.stringify(attachments));
                  }
                  if (text.trim()) {
                    router.push(`/common-chat?text=${encodeURIComponent(text)}`);
                  } else {
                    router.push('/common-chat');
                  }
                }}
              >
                <SendIcon />
              </Box>
            </Flex>
          )}
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>
    </VStack>
  );
}

function SectionTitle({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <Flex align="center" gap="6px" mb={compact ? '6px' : '12px'}>
      <Box {...titleAccentStyle} />
      <Text fontSize={compact ? '12px' : '14px'} fontWeight={500} color="#1F2937">
        {children}
      </Text>
    </Flex>
  );
}

function ChatTab({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Box
      px="16px"
      py="6px"
      borderRadius="999px"
      bg="#FFFFFF"
      color="#6B7280"
      fontSize="14px"
      fontWeight={400}
      cursor="pointer"
      border="1px solid"
      borderColor="#E5E7EB"
      transition="all 0.2s ease"
      _hover={{
        bg: '#F9FAFB'
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 19 23" fill="none">
      <path
        d="M15.3599 10.4726C15.3599 10.2893 15.396 10.1077 15.4661 9.93822C15.5363 9.76878 15.6391 9.61482 15.7688 9.48514C15.8985 9.35545 16.0524 9.25258 16.2218 9.18239C16.3913 9.11221 16.5728 9.07608 16.7562 9.07608C16.9396 9.07608 17.1212 9.11221 17.2906 9.18239C17.4601 9.25258 17.614 9.35545 17.7437 9.48514C17.8733 9.61482 17.9762 9.76878 18.0464 9.93822C18.1165 10.1077 18.1526 10.2893 18.1526 10.4726C18.1526 15.0108 14.8223 18.7705 10.4726 19.4421V20.9453C10.4726 21.3156 10.3255 21.6708 10.0637 21.9327C9.8018 22.1945 9.44663 22.3416 9.0763 22.3416C8.70596 22.3416 8.35079 22.1945 8.08892 21.9327C7.82706 21.6708 7.67994 21.3156 7.67994 20.9453V19.4421C3.3303 18.7705 1.63651e-08 15.0108 1.63651e-08 10.4726C-2.80593e-05 10.2893 0.0360688 10.1077 0.10623 9.93822C0.17639 9.76878 0.27924 9.61482 0.408907 9.48514C0.538573 9.35545 0.692515 9.25258 0.861942 9.18239C1.03137 9.11221 1.21296 9.07608 1.39635 9.07608C1.57974 9.07608 1.76134 9.11221 1.93076 9.18239C2.10019 9.25258 2.25413 9.35545 2.3838 9.48514C2.51347 9.61482 2.61632 9.76878 2.68648 9.93822C2.75664 10.1077 2.79273 10.2893 2.79271 10.4726C2.79271 12.1392 3.45473 13.7374 4.63313 14.9158C5.81153 16.0942 7.40978 16.7562 9.0763 16.7562C10.7428 16.7562 12.3411 16.0942 13.5195 14.9158C14.6979 13.7374 15.3599 12.1392 15.3599 10.4726ZM9.0763 0C9.7181 0 10.3536 0.126412 10.9466 0.372019C11.5395 0.617625 12.0783 0.977616 12.5321 1.43144C12.9859 1.88526 13.3459 2.42402 13.5915 3.01697C13.8371 3.60992 13.9635 4.24543 13.9635 4.88724V10.4726C13.9635 11.7688 13.4486 13.0119 12.5321 13.9284C11.6156 14.845 10.3725 15.3599 9.0763 15.3599C7.78012 15.3599 6.53703 14.845 5.6205 13.9284C4.70396 13.0119 4.18906 11.7688 4.18906 10.4726V4.88724C4.18906 3.59106 4.70396 2.34797 5.6205 1.43144C6.53703 0.514903 7.78012 0 9.0763 0Z"
        fill="#333333"
      />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 21 21" fill="none">
      <path
        d="M10.874 14.2643C9.69311 15.3752 8.64405 16.5071 7.51064 17.6074C6.29024 18.8106 4.33182 18.8106 3.10879 17.6074C2.51045 17.0006 2.18888 16.1747 2.22051 15.3224C2.25214 14.4701 2.6317 13.6706 3.27221 13.1086C4.36872 11.9872 5.49159 10.9001 6.58809 9.7892C6.86486 9.60186 7.03882 9.29842 7.06518 8.96331C7.09154 8.63085 6.96238 8.30366 6.71725 8.07674C6.48002 7.86037 6.16372 7.74955 5.84215 7.7733C5.52058 7.7944 5.22273 7.94744 5.01713 8.19547C3.83628 9.37758 2.65806 10.4858 1.55891 11.6573C0.322705 12.9001 -0.225549 14.6707 0.0854799 16.3963C0.399145 18.122 1.53519 19.5864 3.12724 20.3147C4.96705 21.2329 7.18116 20.911 8.68359 19.5125C10.0173 18.3304 11.243 17.0322 12.4713 15.7446C12.7059 15.4517 12.8087 15.077 12.7533 14.705C12.6637 14.3012 12.35 13.9846 11.9468 13.8896C11.5514 13.792 11.1323 13.9398 10.874 14.2643ZM20.3366 3.20848C19.5933 1.32451 17.793 0.0685229 15.7714 0.0183891C14.5246 -0.0897944 13.2858 0.282251 12.3026 1.05801C10.8871 2.33246 9.55341 3.69135 8.23286 5.06079C8.09866 5.20793 8.00886 5.39014 7.97387 5.58628C7.93888 5.78242 7.96014 5.98447 8.03517 6.16901C8.18805 6.54634 8.54652 6.79964 8.95244 6.82075C9.32673 6.80756 9.6852 6.65716 9.95406 6.39594C11.1349 5.21383 12.3131 4.03437 13.494 2.94726C14.2109 2.27705 15.2336 2.04221 16.172 2.33246C17.258 2.59632 18.112 3.43013 18.4072 4.50668C18.7024 5.58588 18.3887 6.73896 17.5875 7.51735L14.1319 10.9792C13.6416 11.3988 13.5783 12.1349 13.9895 12.6336C14.4798 13.1165 15.2679 13.1165 15.7582 12.6336C16.939 11.4515 18.1173 10.3433 19.2981 9.08997C20.8585 7.54901 21.275 5.19009 20.3366 3.20848Z"
        fill="#333333"
      />
      <path
        d="M5.84354 13.9103C6.07238 14.1296 6.39276 14.2545 6.72744 14.2545C7.06213 14.2545 7.3825 14.1296 7.61135 13.9103C10.0771 11.7199 12.5315 9.51925 14.9744 7.31352C15.1317 7.13503 15.2576 6.93358 15.3462 6.71938C15.392 6.23489 15.0888 5.77589 14.591 5.577C14.1076 5.38065 13.5355 5.49795 13.1951 5.86259L5.90647 12.3599C5.64902 12.5486 5.49455 12.8266 5.48311 13.1224C5.47167 13.4181 5.60325 13.7063 5.84354 13.9103Z"
        fill="#333333"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.60526 3.735C4.03818 3.26867 4.71888 3.09328 5.36895 3.03064C6.05103 2.96521 6.86954 3.00837 7.7493 3.1239C9.51437 3.35498 11.6469 3.89091 13.6974 4.55072C15.7478 5.21054 17.7468 6.00538 19.2432 6.76542C19.9879 7.14405 20.6352 7.52825 21.1043 7.89574C21.3303 8.06653 21.5342 8.26479 21.7112 8.48595C21.8643 8.6864 22.0258 8.97316 22.023 9.3156C22.0175 10.2176 21.4036 10.8552 20.7493 11.2825C20.0812 11.7196 19.2112 12.0481 18.3467 12.307C17.4739 12.5673 16.5538 12.7692 15.7645 12.9334L15.4819 12.9919C15.0045 13.0894 14.7665 13.1395 14.5409 13.0726C14.3182 13.0044 14.1442 12.8318 13.799 12.488L10.383 9.07199C10.2063 8.91278 9.97515 8.82747 9.73736 8.83367C9.49957 8.83987 9.27322 8.9371 9.10502 9.1053C8.93681 9.2735 8.83959 9.49985 8.83339 9.73764C8.82719 9.97544 8.9125 10.2065 9.07171 10.3833L12.2566 13.5696C12.6088 13.9218 12.7856 14.0972 12.851 14.3255C12.9179 14.5538 12.865 14.796 12.7564 15.2804C12.3402 17.1596 11.9782 18.7117 11.6177 19.7571C11.4089 20.3668 11.1709 20.8958 10.8702 21.2842C10.5584 21.6906 10.1324 21.9983 9.57144 22.0219C9.22344 22.0386 8.93112 21.8785 8.73345 21.731C8.52326 21.5751 8.32559 21.3663 8.14324 21.138C7.77574 20.6786 7.39015 20.0439 7.00596 19.3089C6.23339 17.8333 5.41628 15.8553 4.72305 13.8202C4.03261 11.785 3.45632 9.6636 3.17791 7.89992C3.0401 7.02016 2.97189 6.20305 3.01087 5.51957C3.04567 4.86949 3.18348 4.1888 3.60526 3.735Z"
        fill="white"
      />
    </svg>
  );
}
