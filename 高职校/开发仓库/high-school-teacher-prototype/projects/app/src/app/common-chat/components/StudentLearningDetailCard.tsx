'use client';

import { Box, Text, VStack, HStack, Flex, Spinner, Avatar } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Markdown from '@/components/Markdown';
import type {
  StudentLearningDetailData,
  StudentLearningCourseProgress,
  StudentLearningConversationSummary,
  StudentLearningAnalysis
} from '@/types/common-chat';

const BRAND_RED = '#C8000B';

const STATUS_META: Record<number, { key: string; bg: string; color: string }> = {
  0: { key: 'status_not_started', bg: '#F2F3F5', color: '#86909C' },
  1: { key: 'status_normal', bg: '#E8FFF0', color: '#00B42A' },
  2: { key: 'status_lagging', bg: '#FFF0F0', color: BRAND_RED },
  3: { key: 'status_completed', bg: '#FFF7E6', color: '#FA8C16' }
};

/** 高频词字号/颜色映射：品牌红渐变（深红→浅红→灰） */
const keywordStyle = (rank: number): { fontSize: string; color: string; weight: number } => {
  if (rank === 0) return { fontSize: '24px', color: '#C8000B', weight: 700 };
  if (rank <= 2) return { fontSize: '19px', color: '#E03400', weight: 600 };
  if (rank <= 5) return { fontSize: '16px', color: '#F0603A', weight: 500 };
  if (rank <= 8) return { fontSize: '14px', color: '#F58A6B', weight: 400 };
  return { fontSize: '12px', color: '#C9A9A9', weight: 400 };
};

export default function StudentLearningDetailCard({ data }: { data: StudentLearningDetailData }) {
  const { t } = useTranslation();

  return (
    <Box w="100%" maxW="620px">
      {/* 红头：学员基本信息 */}
      <Box bg={BRAND_RED} borderRadius="12px 12px 0 0" p="20px 24px" color="#fff">
        <Flex align="center" gap="12px">
          <Box w="40px" h="40px" borderRadius="50%" bg="rgba(255,255,255,0.2)" display="flex" alignItems="center" justifyContent="center">
            <Avatar name={data.studentName} size="sm" bg="rgba(255,255,255,0.2)" color="#fff" />
          </Box>
          <Box>
            <Text fontSize="18px" fontWeight="600">{data.studentName}</Text>
            <Text fontSize="13px" opacity={0.85}>
              {data.studentCode && `${t('commonChat.studentLearning.student_id')}：${data.studentCode}`}
              {data.className && ` · ${data.className}`}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Box bg="#fff" borderRadius="0 0 12px 12px" p="20px 24px" border="1px solid #F2F3F5" borderTop="none">
        <VStack spacing="20px" align="stretch">
          {/* ① 课程学习进度 */}
          <Section title={t('commonChat.studentLearning.course_progress_title')}>
            {data.loading?.courses ? (
              <LoadingHint text={t('commonChat.studentLearning.loading_courses')} />
            ) : data.error?.studentNotFound || data.courses.length === 0 ? (
              <Text fontSize="13px" color="#86909C">{t('commonChat.studentLearning.student_not_found')}</Text>
            ) : (
              <VStack spacing="12px" align="stretch">
                {data.courses.map((c, i) => (
                  <CourseProgressRow key={c.avatarId + '-' + i} course={c} t={t} />
                ))}
              </VStack>
            )}
          </Section>

          {/* ② AI 问答情况：3 指标 + 高频词云 */}
          <Section title={t('commonChat.studentLearning.ai_qa_title')}>
            {data.loading?.conversation ? (
              <LoadingHint text={t('commonChat.studentLearning.loading_conversation')} />
            ) : data.error?.conversation ? (
              <Text fontSize="13px" color="#86909C">{t('commonChat.studentLearning.load_failed')}</Text>
            ) : !data.conversation ? (
              <Text fontSize="13px" color="#86909C">{t('commonChat.studentLearning.student_not_found')}</Text>
            ) : (
              <ConversationSummaryView data={data.conversation} t={t} />
            )}
          </Section>

          {/* ③ 学情发展优劣势剖析 */}
          {data.analysis && (data.analysis.strengths.length > 0 || data.analysis.weaknesses.length > 0) && (
            <Section title={t('commonChat.studentLearning.analysis_title')}>
              <AnalysisView data={data.analysis} t={t} />
            </Section>
          )}

          {/* ④ 学习建议 */}
          <Section title={t('commonChat.studentLearning.suggestion_title')}>
            {data.loading?.suggestion ? (
              <LoadingHint />
            ) : data.suggestion ? (
              <Box fontSize="14px" color="#4E5969" lineHeight="1.8">
                <Markdown source={data.suggestion} />
              </Box>
            ) : (
              <Text fontSize="13px" color="#86909C">{t('commonChat.studentLearning.no_suggestion')}</Text>
            )}
          </Section>
        </VStack>
      </Box>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Flex align="center" gap="8px" mb="12px">
        <Box w="3px" h="14px" borderRadius="999px" bg={BRAND_RED} />
        <Text fontSize="14px" fontWeight="600" color="#1D2129">{title}</Text>
      </Flex>
      {children}
    </Box>
  );
}

function LoadingHint({ text }: { text?: string }) {
  return (
    <Flex align="center" gap="8px" py="8px">
      <Spinner size="sm" color={BRAND_RED} />
      {text && <Text fontSize="13px" color="#86909C">{text}</Text>}
    </Flex>
  );
}

function CourseProgressRow({ course, t }: { course: StudentLearningCourseProgress; t: (k: string) => string }) {
  const meta = STATUS_META[course.status] ?? STATUS_META[0];
  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6px">
        <Text fontSize="13px" color="#1D2129" fontWeight="500" noOfLines={1} flex="1">{course.courseName}</Text>
        <HStack spacing="8px">
          <Text fontSize="12px" color="#86909C">{course.studyHours}{t('commonChat.studentLearning.study_hours_unit')}</Text>
          <Text fontSize="13px" color="#1D2129" fontWeight="600">{course.progress}%</Text>
          <Box px="6px" py="1px" borderRadius="4px" bg={meta.bg} color={meta.color} fontSize="11px" fontWeight="500">
            {t(`commonChat.studentLearning.${meta.key}`)}
          </Box>
        </HStack>
      </Flex>
      <Box w="100%" h="6px" bg="#F2F3F5" borderRadius="3px" overflow="hidden">
        <Box h="100%" w={`${course.progress}%`} bg={course.status === 2 ? BRAND_RED : '#333'} borderRadius="3px" transition="width 0.6s ease" />
      </Box>
    </Box>
  );
}

function ConversationSummaryView({
  data,
  t
}: {
  data: StudentLearningConversationSummary;
  t: (k: string) => string;
}) {
  return (
    <Box>
      {/* 3 指标 */}
      <HStack spacing="8px" mb="16px">
        <Metric label={t('commonChat.studentLearning.qa_sessions')} value={String(data.totalSessions)} />
        <Metric label={t('commonChat.studentLearning.qa_rounds')} value={String(data.totalMessages)} />
        <Metric label={t('commonChat.studentLearning.qa_last_active')} value={data.lastActiveTime ? data.lastActiveTime.slice(0, 10) : '-'} />
      </HStack>

      {/* 高频词云 */}
      <Box>
        <Text fontSize="12px" color="#86909C" mb="10px">{t('commonChat.studentLearning.qa_keywords')}</Text>
        {data.keywords.length > 0 ? (
          <Flex wrap="wrap" align="center" justify="center" gap="8px 16px" p="18px 16px" bg="#F7F8FA" borderRadius="10px" minH="110px">
            {data.keywords.map((kw, i) => {
              const st = keywordStyle(i);
              const rotate = i % 3 === 1; // 每 3 个词第 2 个垂直，交错效果
              return (
                <Text
                  key={kw.word + i}
                  fontSize={st.fontSize}
                  color={st.color}
                  fontWeight={st.weight}
                  lineHeight="1.2"
                  whiteSpace="nowrap"
                  cursor="default"
                  transform={rotate ? 'rotate(90deg)' : undefined}
                  transformOrigin="center"
                  transition="all 0.2s ease"
                  _hover={{ color: BRAND_RED, transform: rotate ? 'rotate(90deg) scale(1.12)' : 'scale(1.12)' }}
                >
                  {kw.word}
                </Text>
              );
            })}
          </Flex>
        ) : (
          <Text fontSize="13px" color="#86909C" p="12px" bg="#F7F8FA" borderRadius="10px">
            {t('commonChat.studentLearning.keywords_empty')}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function AnalysisView({ data, t }: { data: StudentLearningAnalysis; t: (k: string) => string }) {
  return (
    <VStack spacing="10px" align="stretch">
      {data.strengths.length > 0 && (
        <Box bg="#F0FFF4" borderRadius="10px" p="12px" border="1px solid #D6F5E0">
          <HStack spacing="6px" mb="8px">
            <Text fontSize="13px" color="#00B42A" fontWeight="600">▲ {t('commonChat.studentLearning.analysis_strengths')}</Text>
          </HStack>
          <VStack spacing="4px" align="stretch">
            {data.strengths.map((s, i) => (
              <Text key={i} fontSize="13px" color="#1D2129" lineHeight="1.6">• {s}</Text>
            ))}
          </VStack>
        </Box>
      )}
      {data.weaknesses.length > 0 && (
        <Box bg="#FFF5F5" borderRadius="10px" p="12px" border="1px solid #FFD6D8">
          <HStack spacing="6px" mb="8px">
            <Text fontSize="13px" color={BRAND_RED} fontWeight="600">▼ {t('commonChat.studentLearning.analysis_weaknesses')}</Text>
          </HStack>
          <VStack spacing="4px" align="stretch">
            {data.weaknesses.map((w, i) => (
              <Text key={i} fontSize="13px" color="#1D2129" lineHeight="1.6">• {w}</Text>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Flex flex={1} direction="column" align="center" bg="#F7F8FA" borderRadius="8px" py="10px" gap="4px">
      <Text fontSize="11px" color="#86909C">{label}</Text>
      <Text fontSize="16px" fontWeight="700" color="#1D2129">{value}</Text>
    </Flex>
  );
}
