'use client';

import { useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Avatar,
  Spinner,
  Center,
  Image
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Markdown from '@/components/Markdown';
import type { StudentPortraitData } from '@/types/common-chat';
import type {
  CareerDiagnosisResult,
  CourseMatchMap,
  TargetPosition,
  RecommendedCourse,
  RecommendedBook
} from '@/types/career-diagnosis';

export type StudentPortraitCardProps = {
  data: StudentPortraitData | null;
  portraitUpdatedToday: boolean;
  portraitLoading?: boolean;
  onRefresh?: () => void;
  onCourseClick?: (course: {
    avatar_id?: number;
    course_id?: number;
    course_name: string;
    progress: number;
  }) => void;
  /** 职业能力诊断结果（AI 生成） */
  careerDiagnosis?: CareerDiagnosisResult | null;
  careerLoading?: boolean;
  careerError?: boolean;
  /** 当前选中的目标岗位 id */
  activePositionId?: string;
  onPositionChange?: (id: string) => void;
  /** 推荐课程模糊匹配结果 */
  courseMatchMap?: CourseMatchMap;
  /** 加入选修课程并跳转 */
  onJoinCourse?: (course: { avatarId?: number; courseId?: number; courseName?: string }) => void;
};

const BRAND_RED = '#C8000B';
const TRAINING_GRAY = '#4E5969';
const GAP_LIGHT_RED = '#FFD6D8';
const REACHED_GREEN = '#00B42A';

export default function StudentPortraitCard({
  data,
  portraitUpdatedToday,
  portraitLoading,
  onRefresh,
  onCourseClick,
  careerDiagnosis,
  careerLoading,
  careerError,
  activePositionId,
  onPositionChange,
  courseMatchMap,
  onJoinCourse
}: StudentPortraitCardProps) {
  const { t } = useTranslation();
  const {
    student_name = '',
    student_code = '',
    major_name = '',
    studying_course_count = 0,
    completed_course_count = 0,
    total_study_hours = 0,
    radar_chart,
    career_analysis = '',
    major_analysis = '',
    improvement_plan = ''
  } = data ?? {};

  // 当前选中岗位
  const positions = useMemo(() => careerDiagnosis?.targetPositions ?? [], [careerDiagnosis]);
  const activePosition: TargetPosition | undefined = useMemo(() => {
    if (positions.length === 0) return undefined;
    return positions.find((p) => p.id === activePositionId) ?? positions[0];
  }, [positions, activePositionId]);

  const hasCareer = !!activePosition && !careerError;
  const hasTraining = (careerDiagnosis?.trainingPlanAbilities?.length ?? 0) > 0;

  // 雷达图数据：三系列按维度对齐
  const radarData = useMemo(() => {
    const items = radar_chart?.items ?? [];
    return items.map((item) => {
      const dim = item.dimension;
      const target = activePosition?.abilities?.find((a) => a.dimension === dim)?.target ?? 0;
      const training =
        careerDiagnosis?.trainingPlanAbilities?.find((a) => a.dimension === dim)?.training ?? 0;
      return {
        subject: dim,
        current: item.value,
        target,
        training,
        fullMark: 100
      };
    });
  }, [radar_chart, activePosition, careerDiagnosis]);

  // 能力差距（按 gap 降序）
  const sortedGaps = useMemo(() => {
    if (!activePosition?.gaps?.length) return [];
    return [...activePosition.gaps].sort((a, b) => b.gap - a.gap);
  }, [activePosition]);

  // 推荐课程：仅展示匹配到的（过滤未上架）
  const matchedCourses = useMemo(() => {
    if (!activePosition?.recommendedCourses) return [];
    return activePosition.recommendedCourses
      .map((c) => ({ course: c, match: courseMatchMap?.[c.name] ?? null }))
      .filter((item) => !!item.match?.avatarId);
  }, [activePosition, courseMatchMap]);

  return (
    <VStack spacing="20px" align="stretch" w="100%" maxW="1120px">
      {/* 学生概览卡片（全宽） */}
      <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
        <Flex justify="space-between" align="center" mb="20px">
          <Flex align="center" gap="16px">
            <Box
              w="48px"
              h="48px"
              borderRadius="50%"
              bg="#F2F3F5"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="20px"
              color="#86909C"
            >
              <Avatar name={student_name} size="md" bg={BRAND_RED} color="#fff" />
            </Box>
            <Box>
              <Text fontSize="18px" fontWeight="600" color="#1D2129">
                {student_name}
              </Text>
              <Text fontSize="13px" color="#86909C" mt="2px">
                {t('commonChat.portrait.student_id_label')}：{student_code || '-'} | {t('commonChat.portrait.major_label')}：{major_name || '-'}
              </Text>
            </Box>
          </Flex>
          <Button
            h="32px"
            px="14px"
            borderRadius="999px"
            bg="#333"
            color="#fff"
            fontSize="13px"
            fontWeight="500"
            leftIcon={<RepeatIcon boxSize="12px" />}
            _hover={{ bg: '#1D2129' }}
            onClick={onRefresh}
          >
            {t('commonChat.portrait.update_portrait')}
          </Button>
        </Flex>

        <HStack spacing="12px">
          <SummaryMetric label={t('commonChat.portrait.in_progress_courses')} value={`${studying_course_count ?? 0}${t('commonChat.portrait.unit_course')}`} />
          <SummaryMetric label={t('commonChat.portrait.completed_courses')} value={`${completed_course_count ?? 0}${t('commonChat.portrait.unit_course')}`} />
          <SummaryMetric label={t('commonChat.portrait.total_hours')} value={`${total_study_hours ?? 0}${t('commonChat.portrait.unit_hour')}`} />
        </HStack>
      </Box>

      {/* 左右两列布局 */}
      <Flex gap="20px" align="flex-start" flexDirection={{ base: 'column', md: 'row' }}>
        {/* 左列：目标岗位 + 能力雷达图 + 岗位能力诊断 */}
        <VStack spacing="20px" align="stretch" flex="1" minW="0" w="100%">
          {/* 目标岗位切换器（在雷达图上方） */}
          {hasCareer && positions.length > 0 && (
            <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
              <SectionTitle title={t('commonChat.portrait.target_position')} />
              <HStack mt="16px" spacing="8px" overflowX="auto" sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                {positions.map((p) => {
                  const isActive = (activePosition?.id ?? positions[0].id) === p.id;
                  return (
                    <Box
                      key={p.id}
                      as="button"
                      flexShrink={0}
                      px="16px"
                      h="36px"
                      borderRadius="999px"
                      border="1px solid"
                      borderColor={isActive ? BRAND_RED : '#E5E6EB'}
                      bg={isActive ? BRAND_RED : '#fff'}
                      color={isActive ? '#fff' : '#4E5969'}
                      fontSize="13px"
                      fontWeight={isActive ? 600 : 400}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: BRAND_RED, color: isActive ? '#fff' : BRAND_RED }}
                      onClick={() => onPositionChange?.(p.id)}
                    >
                      {p.name}
                    </Box>
                  );
                })}
              </HStack>
              {activePosition?.summary && (
                <Text mt="12px" fontSize="13px" color="#86909C" lineHeight="1.7">
                  {activePosition.summary}
                </Text>
              )}
            </Box>
          )}

          {/* 能力对比雷达图（鼠标悬停显示分数） */}
          <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
            <SectionTitle title={t('commonChat.portrait.ability_radar')} />
            {portraitLoading ? (
              <Center py="40px">
                <Spinner size="md" color={BRAND_RED} />
              </Center>
            ) : (
              <>
                {radarData.length > 0 ? (
                  <>
                    <Box mt="16px" h="320px">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                          <PolarGrid stroke="#E5E6EB" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fontSize: 12, fill: '#4E5969', fontWeight: 500 }}
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          {hasCareer && (
                            <Radar
                              name={t('commonChat.portrait.target_requirement')}
                              dataKey="target"
                              stroke={BRAND_RED}
                              fill={BRAND_RED}
                              fillOpacity={0.1}
                              strokeWidth={2}
                            />
                          )}
                          {hasCareer && hasTraining && (
                            <Radar
                              name={t('commonChat.portrait.training_requirement')}
                              dataKey="training"
                              stroke={TRAINING_GRAY}
                              fill={TRAINING_GRAY}
                              fillOpacity={0.08}
                              strokeWidth={1.5}
                              strokeDasharray="4 3"
                            />
                          )}
                          <Radar
                            name={t('commonChat.portrait.my_ability')}
                            dataKey="current"
                            stroke={BRAND_RED}
                            fill={BRAND_RED}
                            fillOpacity={0.25}
                            strokeWidth={2.5}
                          />
                          <Tooltip content={<RadarTooltip t={t} />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Flex justify="center" gap="20px" mt="12px" flexWrap="wrap">
                      {hasCareer && (
                        <LegendItem color={BRAND_RED} label={t('commonChat.portrait.target_requirement')} />
                      )}
                      {hasCareer && hasTraining && (
                        <LegendItem color={TRAINING_GRAY} label={t('commonChat.portrait.training_requirement')} dashed />
                      )}
                      <LegendItem color={BRAND_RED} label={t('commonChat.portrait.my_ability')} solid />
                    </Flex>
                  </>
                ) : (
                  <Text fontSize="14px" color="#86909C" textAlign="center" py="20px">
                    {t('commonChat.portrait.no_data')}
                  </Text>
                )}
              </>
            )}
          </Box>

          {/* 岗位能力诊断 */}
          {hasCareer && sortedGaps.length > 0 && (
            <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
              <SectionTitle title={t('commonChat.portrait.ability_diagnosis')} />
              <VStack spacing="14px" align="stretch" mt="16px">
                {sortedGaps.map((gap, idx) => {
                  const reached = gap.gap <= 0;
                  const currentPct = Math.min(gap.current, 100);
                  const targetPct = Math.min(gap.target, 100);
                  return (
                    <Box key={gap.dimension + idx}>
                      <Flex justify="space-between" align="center" mb="6px">
                        <Text fontSize="13px" color="#1D2129" fontWeight="500">
                          {gap.dimension}
                        </Text>
                        <HStack spacing="8px">
                          <Text fontSize="12px" color="#86909C">
                            {t('commonChat.portrait.gap_current')} {gap.current} / {t('commonChat.portrait.gap_target')} {gap.target}
                          </Text>
                          <Box
                            px="8px"
                            py="2px"
                            borderRadius="4px"
                            bg={reached ? '#E8FFF0' : '#FFF0F0'}
                            fontSize="12px"
                            fontWeight="600"
                            color={reached ? REACHED_GREEN : BRAND_RED}
                          >
                            {reached
                              ? t('commonChat.portrait.gap_reached')
                              : `${t('commonChat.portrait.gap_to_improve')} +${gap.gap}`}
                          </Box>
                        </HStack>
                      </Flex>
                      <Box w="100%" h="8px" bg="#F2F3F5" borderRadius="4px" overflow="hidden" position="relative">
                        <Box
                          position="absolute"
                          left={0}
                          top={0}
                          h="100%"
                          w={`${currentPct}%`}
                          bg={BRAND_RED}
                          borderRadius="4px"
                        />
                        {!reached && (
                          <Box
                            position="absolute"
                            left={`${currentPct}%`}
                            top={0}
                            h="100%"
                            w={`${Math.max(targetPct - currentPct, 0)}%`}
                            bg={GAP_LIGHT_RED}
                          />
                        )}
                      </Box>
                      {gap.suggestion && (
                        <Text mt="6px" fontSize="12px" color="#86909C" lineHeight="1.6">
                          {gap.suggestion}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          )}
        </VStack>

        {/* 右列：专业就业方向 + 专业分析与建议 + 我的提升计划 */}
        <VStack spacing="20px" align="stretch" flex="1" minW="0" w="100%">
          {/* 专业就业方向解析 */}
          <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
            <SectionTitle title={t('commonChat.portrait.career_analysis')} />
            <Box mt="14px" fontSize="14px" color="#4E5969" lineHeight="1.8">
              {portraitLoading ? (
                <Center py="40px">
                  <Spinner size="md" color={BRAND_RED} />
                </Center>
              ) : career_analysis ? (
                <Markdown source={career_analysis} />
              ) : (
                <Text fontSize="14px" color="#86909C" textAlign="center" py="20px">
                  {t('commonChat.portrait.no_data')}
                </Text>
              )}
            </Box>
          </Box>

          {/* 专业分析与建议 */}
          <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
            <SectionTitle title={t('commonChat.portrait.major_analysis_title')} />
            <Box mt="14px" fontSize="14px" color="#4E5969" lineHeight="1.8">
              {portraitLoading ? (
                <Center py="40px">
                  <Spinner size="md" color={BRAND_RED} />
                </Center>
              ) : major_analysis ? (
                <Markdown source={major_analysis} />
              ) : (
                <Text fontSize="14px" color="#86909C" textAlign="center" py="20px">
                  {t('commonChat.portrait.no_data')}
                </Text>
              )}
            </Box>
          </Box>

          {/* 我的提升计划 */}
          <Box bg="#fff" borderRadius="16px" p="24px" border="1px solid #F2F3F5">
            <SectionTitle title={t('commonChat.portrait.improvement_plan')} />
            {hasCareer && activePosition ? (
              <VStack spacing="20px" align="stretch" mt="16px">
                {/* 推荐选修课程（仅展示已匹配） */}
                <Box>
                  <Text fontSize="14px" fontWeight="600" color="#1D2129" mb="12px">
                    {t('commonChat.portrait.improvement_plan_courses')}
                  </Text>
                  <VStack spacing="10px" align="stretch">
                    {matchedCourses.length > 0 ? (
                      matchedCourses.map(({ course, match }, idx) => (
                        <RecommendedCourseCard
                          key={course.name + idx}
                          course={course}
                          match={match}
                          onJoin={onJoinCourse}
                          t={t}
                        />
                      ))
                    ) : (
                      <Text fontSize="13px" color="#86909C">{t('commonChat.portrait.no_data')}</Text>
                    )}
                  </VStack>
                </Box>
                {/* 推荐书单 */}
                <Box>
                  <Text fontSize="14px" fontWeight="600" color="#1D2129" mb="12px">
                    {t('commonChat.portrait.improvement_plan_books')}
                  </Text>
                  <VStack spacing="10px" align="stretch">
                    {(activePosition.recommendedBooks ?? []).length > 0 ? (
                      activePosition.recommendedBooks.map((b, idx) => (
                        <RecommendedBookCard key={b.title + idx} book={b} t={t} />
                      ))
                    ) : (
                      <Text fontSize="13px" color="#86909C">{t('commonChat.portrait.no_data')}</Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            ) : (
              // 降级：原 improvement_plan Markdown 兜底
              <Box mt="14px" fontSize="14px" color="#4E5969" lineHeight="1.8">
                {portraitLoading ? (
                  <Center py="40px">
                    <Spinner size="md" color={BRAND_RED} />
                  </Center>
                ) : improvement_plan ? (
                  <Markdown source={improvement_plan} />
                ) : (
                  <Text fontSize="14px" color="#86909C" textAlign="center" py="20px">
                    {t('commonChat.portrait.no_data')}
                  </Text>
                )}
              </Box>
            )}
          </Box>
        </VStack>
      </Flex>
    </VStack>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Flex flex={1} direction="column" align="center" bg="#F7F8FA" borderRadius="12px" py="16px" gap="6px">
      <Text fontSize="12px" color="#86909C">{label}</Text>
      <Text fontSize="20px" fontWeight="700" color="#1D2129">{value}</Text>
    </Flex>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Flex align="center" gap="8px">
      <Box w="4px" h="16px" borderRadius="999px" bg={BRAND_RED} />
      <Text fontSize="16px" fontWeight="600" color="#1D2129">{title}</Text>
    </Flex>
  );
}

function LegendItem({
  color,
  label,
  dashed,
  solid
}: {
  color: string;
  label: string;
  dashed?: boolean;
  solid?: boolean;
}) {
  return (
    <HStack spacing="6px">
      <Box
        w="16px"
        h="3px"
        borderRadius="2px"
        bg={color}
        opacity={solid ? 1 : 0.6}
        sx={dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` } : undefined}
      />
      <Text fontSize="12px" color="#86909C">{label}</Text>
    </HStack>
  );
}

/** 雷达图悬停 Tooltip：显示各能力项分数 */
function RadarTooltip({ active, payload, t }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const rows: { label: string; value: number; color: string }[] = [];
  if (item.target !== undefined) rows.push({ label: t('commonChat.portrait.target_requirement'), value: item.target, color: BRAND_RED });
  if (item.training !== undefined) rows.push({ label: t('commonChat.portrait.training_requirement'), value: item.training, color: TRAINING_GRAY });
  if (item.current !== undefined) rows.push({ label: t('commonChat.portrait.my_ability'), value: item.current, color: BRAND_RED });
  return (
    <Box bg="rgba(29,33,41,0.92)" color="#fff" borderRadius="8px" px="12px" py="8px" fontSize="12px" boxShadow="0 4px 12px rgba(0,0,0,0.15)">
      <Text fontWeight="600" mb="4px">{item.subject}</Text>
      {rows.map((r) => (
        <Flex key={r.label} align="center" gap="6px" justify="space-between">
          <HStack spacing="6px">
            <Box w="8px" h="8px" borderRadius="50%" bg={r.color} />
            <Text>{r.label}</Text>
          </HStack>
          <Text fontWeight="600">{r.value}</Text>
        </Flex>
      ))}
    </Box>
  );
}

/** 推荐选修课程卡片：展示封面、名称、专业、教师，"加入学习"按钮 */
function RecommendedCourseCard({
  course,
  match,
  onJoin,
  t
}: {
  course: RecommendedCourse;
  match: { avatarId?: number; courseId?: number; courseName?: string; coverUrl?: string; majorName?: string; teacherName?: string; isEnrolled?: boolean } | null;
  onJoin?: (course: { avatarId?: number; courseId?: number; courseName?: string }) => void;
  t: (key: string) => string;
}) {
  return (
    <Flex
      align="stretch"
      gap="12px"
      p="12px"
      bg="#F7F8FA"
      borderRadius="10px"
      cursor="pointer"
      _hover={{ bg: '#F2F3F5' }}
      onClick={() => onJoin?.({ avatarId: match?.avatarId, courseId: match?.courseId, courseName: match?.courseName })}
    >
      {/* 课程封面 */}
      <Box
        w="72px"
        h="72px"
        borderRadius="8px"
        overflow="hidden"
        bg="#E5E6EB"
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {match?.coverUrl ? (
          <Image src={match.coverUrl} alt={course.name} w="100%" h="100%" objectFit="cover" fallback={<CourseCoverPlaceholder />} />
        ) : (
          <CourseCoverPlaceholder />
        )}
      </Box>
      {/* 课程信息 */}
      <Flex flex="1" minW={0} direction="column" justify="space-between" py="2px">
        <Box>
          <Text fontSize="14px" fontWeight="600" color="#1D2129" noOfLines={1}>
            {match?.courseName || course.name}
          </Text>
          <HStack spacing="6px" mt="4px" fontSize="12px" color="#86909C">
            {match?.majorName && (
              <HStack spacing="3px">
                <Text>📚</Text>
                <Text noOfLines={1}>{match.majorName}</Text>
              </HStack>
            )}
            {match?.teacherName && (
              <HStack spacing="3px">
                <Text>👤</Text>
                <Text noOfLines={1}>{match.teacherName}</Text>
              </HStack>
            )}
          </HStack>
        </Box>
        {course.reason && (
          <Text fontSize="12px" color="#86909C" noOfLines={1} mt="4px">
            {course.reason}
          </Text>
        )}
      </Flex>
      {/* 加入学习按钮 */}
      <Flex align="center" flexShrink={0}>
        <Button
          size="sm"
          h="30px"
          px="14px"
          borderRadius="6px"
          bg={BRAND_RED}
          color="#fff"
          fontSize="12px"
          fontWeight="500"
          _hover={{ bg: '#a00008' }}
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.({ avatarId: match?.avatarId, courseId: match?.courseId, courseName: match?.courseName });
          }}
        >
          {t('commonChat.portrait.join_study')}
        </Button>
      </Flex>
    </Flex>
  );
}

function CourseCoverPlaceholder() {
  return (
    <Text fontSize="20px" color="#86909C">📖</Text>
  );
}

/** 推荐书单卡片 */
function RecommendedBookCard({
  book,
  t
}: {
  book: RecommendedBook;
  t: (key: string) => string;
}) {
  const categoryColor = (cat?: string) => {
    if (cat?.includes('进阶')) return { bg: '#FFF0F0', color: BRAND_RED };
    if (cat?.includes('实战')) return { bg: '#E8FFF0', color: REACHED_GREEN };
    return { bg: '#F2F3F5', color: '#4E5969' };
  };
  const cat = categoryColor(book.category);
  return (
    <Flex align="flex-start" gap="12px" p="12px" bg="#F7F8FA" borderRadius="10px">
      <Box
        w="36px"
        h="48px"
        borderRadius="4px"
        bg="#fff"
        border="1px solid #E5E6EB"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        fontSize="16px"
      >
        📖
      </Box>
      <Box flex="1" minW={0}>
        <HStack spacing="8px" mb="4px">
          <Text fontSize="14px" fontWeight="500" color="#1D2129" noOfLines={1}>
            {book.title}
          </Text>
          {book.category && (
            <Box px="6px" py="1px" borderRadius="4px" bg={cat.bg} color={cat.color} fontSize="11px" flexShrink={0}>
              {book.category}
            </Box>
          )}
        </HStack>
        {book.author && (
          <Text fontSize="12px" color="#86909C" mb="2px">{book.author}</Text>
        )}
        {book.reason && (
          <Text fontSize="12px" color="#86909C" noOfLines={2}>{book.reason}</Text>
        )}
      </Box>
    </Flex>
  );
}
