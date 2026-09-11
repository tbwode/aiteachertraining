'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import Button from '@/app/components/ui/Button';
import { QUESTION_TYPE_META } from '../questionBank/types';
import { StemRichText } from '../questionBank/StemRichText';
import type { Quiz } from './types';
import { QUIZ_STATUS_META, totalScoreOf } from './types';
import type { StudentQuizResult } from './mockReport';
import {
  buildAiSummary,
  buildQuizReport,
  computeKpMastery,
  computeOverallStats,
  computeScoreBands,
  computeTypeStats,
  formatPercent
} from './mockReport';
import { formatDeadline } from './mockQuiz';

type ReportTab = 'overall' | 'students';

const REPORT_TABS: { key: ReportTab; label: string }[] = [
  { key: 'overall', label: '总体数据' },
  { key: 'students', label: '学生答题明细' }
];

const masteryColor = (rate: number) =>
  rate < 0.6 ? '#C8000B' : rate < 0.8 ? '#D97706' : '#059669';

const RANK_COLORS = ['#D97706', '#86909C', '#B45309'];

type QuizReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
};

// 测验数据报表：总体数据 / 知识薄弱点分析 / 学生答题明细
export function QuizReportModal({ isOpen, onClose, quiz }: QuizReportModalProps) {
  const [tab, setTab] = useState<ReportTab>('overall');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // 同一测验数据 deterministic 生成，打开期间缓存
  const report = useMemo(() => (quiz && isOpen ? buildQuizReport(quiz) : null), [quiz, isOpen]);
  const overall = useMemo(
    () => (report && quiz ? computeOverallStats(report, quiz) : null),
    [report, quiz]
  );
  const bands = useMemo(
    () => (report && quiz ? computeScoreBands(report, quiz) : []),
    [report, quiz]
  );
  const typeStats = useMemo(
    () => (report && quiz ? computeTypeStats(report, quiz) : []),
    [report, quiz]
  );
  const kpList = useMemo(
    () => (report && quiz ? computeKpMastery(report, quiz) : []),
    [report, quiz]
  );
  const aiSummary = useMemo(
    () =>
      report && quiz && overall
        ? buildAiSummary({
            quiz,
            overall,
            bands,
            typeStats,
            kpList,
            unsubmittedCount: report.unsubmitted.length
          })
        : null,
    [report, quiz, overall, bands, typeStats, kpList]
  );
  const sortedResults = useMemo(
    () => (report ? [...report.results].sort((a, b) => b.totalScore - a.totalScore) : []),
    [report]
  );

  if (!quiz) return null;
  const total = totalScoreOf(quiz);
  const statusMeta = QUIZ_STATUS_META[quiz.status];

  const statCard = (value: string, label: string, color = 'gray.800') => (
    <Box
      flex={1}
      minW="110px"
      p={3}
      borderRadius="lg"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.100"
    >
      <Text fontSize="xl" fontWeight={700} color={color} lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.400" mt={0.5}>
        {label}
      </Text>
    </Box>
  );

  const hBar = (label: string, ratio: number, color: string, right: string, key?: string) => (
    <Flex key={key} align="center" gap={2} fontSize="xs">
      <Text w="72px" flexShrink={0} color="gray.600" noOfLines={1}>
        {label}
      </Text>
      <Box flex={1} h="14px" borderRadius="full" bg="gray.100" overflow="hidden">
        <Box
          h="100%"
          w={`${Math.max(ratio * 100, ratio > 0 ? 3 : 0)}%`}
          bg={color}
          borderRadius="full"
        />
      </Box>
      <Text w="52px" flexShrink={0} textAlign="right" color="gray.500">
        {right}
      </Text>
    </Flex>
  );

  const renderStudentDetail = (r: StudentQuizResult) => (
    <VStack align="stretch" spacing={2} mt={2} pl={9} pr={1}>
      {quiz.questions.map((item, idx) => {
        const ans = r.answers.find((a) => a.questionId === item.question.id);
        const earned = ans?.earned ?? 0;
        const state = earned >= item.score ? 'correct' : earned > 0 ? 'partial' : 'wrong';
        const stateMeta =
          state === 'correct'
            ? { label: '正确', color: '#059669', bg: 'rgba(5,150,105,0.08)' }
            : state === 'partial'
              ? { label: '部分得分', color: '#D97706', bg: 'rgba(217,119,6,0.08)' }
              : { label: '错误', color: '#C8000B', bg: 'rgba(200,0,11,0.06)' };
        const meta = QUESTION_TYPE_META[item.question.type];
        return (
          <Flex
            key={item.question.id}
            gap={2}
            p={2.5}
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.100"
            bg={state === 'wrong' ? 'rgba(200,0,11,0.02)' : 'white'}
            align="flex-start"
          >
            <Text fontSize="xs" color="gray.400" fontWeight={600} mt={0.5} w="18px" flexShrink={0}>
              {idx + 1}.
            </Text>
            <Box flex={1} minW={0}>
              <HStack spacing={1.5} mb={1}>
                <Badge bg={meta.bg} color={meta.color} borderRadius="md" px={1.5}>
                  {meta.label}
                </Badge>
                <Badge bg={stateMeta.bg} color={stateMeta.color} borderRadius="md" px={1.5}>
                  {stateMeta.label}
                </Badge>
                <Text fontSize="xs" color="gray.400" noOfLines={1}>
                  {item.question.chapterTitle}
                </Text>
              </HStack>
              <StemRichText
                text={item.question.stem}
                images={item.question.images}
                color="gray.600"
                fontSize="xs"
              />
            </Box>
            <Text fontSize="sm" fontWeight={700} color={stateMeta.color} flexShrink={0} mt={0.5}>
              {earned}/{item.score}
            </Text>
          </Flex>
        );
      })}
    </VStack>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setTab('overall');
        setExpandedStudentId(null);
        onClose();
      }}
      isCentered
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="rgba(17,24,39,0.58)" backdropFilter="blur(3px)" />
      <ModalContent
        mx={3}
        maxH="calc(100vh - 32px)"
        borderRadius="20px"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 24px 70px rgba(31,35,41,0.24)"
        overflow="hidden"
      >
        <ModalHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid" borderColor="#F0F1F3">
          <Flex align="center" gap={2} flexWrap="wrap">
            <Text fontSize="md" fontWeight={700} color="gray.800">
              数据报表
            </Text>
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {quiz.title}
            </Text>
            <Badge bg={statusMeta.bg} color={statusMeta.color} borderRadius="md" px={2}>
              {statusMeta.label}
            </Badge>
            <Box flex={1} />
            <Text fontSize="xs" color="gray.400">
              截止 {formatDeadline(quiz.deadline)} · 满分 {total} 分
            </Text>
          </Flex>
        </ModalHeader>
        <ModalBody px={{ base: 4, md: 6 }} py={5}>
          {/* 报表内 tab 切换 */}
          <HStack spacing={2} mb={4}>
            {REPORT_TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Box
                  key={t.key}
                  as="button"
                  px={3.5}
                  py={1.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight={active ? 600 : 400}
                  color={active ? 'white' : 'gray.600'}
                  bg={active ? 'gray.700' : 'gray.50'}
                  border="1px solid"
                  borderColor={active ? 'gray.700' : 'gray.200'}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </Box>
              );
            })}
          </HStack>

          {!report || !overall || report.results.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={10}>
              暂无学生提交数据
            </Text>
          ) : (
            <>
              {/* 总体数据 */}
              {tab === 'overall' && (
                <VStack align="stretch" spacing={4}>
                  {/* AI 测验总结 */}
                  {aiSummary && (
                    <Box
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="purple.100"
                      bgGradient="linear(to-br, #F5F3FF, #EFF6FF)"
                    >
                      <Flex align="center" gap={2} mb={3} flexWrap="wrap">
                        <Text fontSize="sm" fontWeight={700} color="gray.800">
                          ✨ AI 测验总结
                        </Text>
                        <Badge bg={aiSummary.levelColor} color="white" borderRadius="md" px={2}>
                          总体水平：{aiSummary.level}
                        </Badge>
                      </Flex>
                      <Box mb={3}>
                        <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
                          学生总体测验水平
                        </Text>
                        <Text fontSize="sm" color="gray.700" lineHeight="1.7">
                          {aiSummary.levelText}
                        </Text>
                      </Box>
                      <Box mb={3}>
                        <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
                          重点发现
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {aiSummary.findings.map((f) => (
                            <Flex key={f} gap={1.5} fontSize="sm" color="gray.700" lineHeight="1.6">
                              <Text color="#7C3AED" flexShrink={0}>
                                •
                              </Text>
                              <Text>{f}</Text>
                            </Flex>
                          ))}
                        </VStack>
                      </Box>
                      <Box>
                        <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
                          教学建议
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {aiSummary.suggestions.map((s, i) => (
                            <Flex key={s} gap={1.5} fontSize="sm" color="gray.700" lineHeight="1.6">
                              <Text color="#059669" flexShrink={0} fontWeight={600}>
                                {i + 1}.
                              </Text>
                              <Text>{s}</Text>
                            </Flex>
                          ))}
                        </VStack>
                      </Box>
                    </Box>
                  )}
                  <Flex gap={3} flexWrap="wrap">
                    {statCard(
                      `${overall.submitted}/${overall.totalStudents}`,
                      `提交人数（${formatPercent(overall.submitRate)}）`,
                      '#2563EB'
                    )}
                    {statCard(String(overall.avg), '平均分', '#C8000B')}
                    {statCard(String(overall.max), '最高分', '#059669')}
                    {statCard(String(overall.min), '最低分', '#D97706')}
                    {statCard(formatPercent(overall.passRate), '及格率', '#7C3AED')}
                  </Flex>

                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                    <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                      <Text fontSize="sm" fontWeight={600} color="gray.700" mb={3}>
                        分数段分布（占总分比例）
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {bands.map((b, i) =>
                          hBar(
                            b.label,
                            overall.submitted > 0 ? b.count / overall.submitted : 0,
                            ['#C8000B', '#D97706', '#EAB308', '#2563EB', '#059669'][i],
                            `${b.count} 人`,
                            b.label
                          )
                        )}
                      </VStack>
                    </Box>
                    <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                      <Text fontSize="sm" fontWeight={600} color="gray.700" mb={3}>
                        题型得分率
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {typeStats.map((t) => {
                          const meta = QUESTION_TYPE_META[t.type];
                          return hBar(
                            `${meta.label}（${t.count}题）`,
                            Math.max(t.rate, 0),
                            meta.color,
                            t.rate < 0 ? '--' : formatPercent(t.rate),
                            t.type
                          );
                        })}
                      </VStack>
                    </Box>
                  </Grid>

                  {/* 知识薄弱点分析 */}
                  {kpList.length > 0 && (
                    <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                      <Text fontSize="sm" fontWeight={600} color="gray.700" mb={1}>
                        知识薄弱点分析
                      </Text>
                      <Text fontSize="xs" color="gray.400" mb={3}>
                        按知识点聚合所有已提交学生的得分率，掌握率低于 60%
                        标记为薄弱知识点，建议重点讲解。
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {kpList.map((item) => (
                          <Flex
                            key={item.kp}
                            align="center"
                            gap={3}
                            p={3}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={item.weak ? 'red.200' : 'gray.100'}
                            bg={item.weak ? 'rgba(200,0,11,0.02)' : 'white'}
                          >
                            <Box flex={1} minW={0}>
                              <Flex align="center" gap={2} mb={1.5}>
                                <Text fontSize="sm" fontWeight={600} color="gray.700" noOfLines={1}>
                                  {item.kp}
                                </Text>
                                {item.weak && (
                                  <Badge
                                    bg="rgba(200,0,11,0.08)"
                                    color="#C8000B"
                                    borderRadius="md"
                                    px={1.5}
                                  >
                                    薄弱
                                  </Badge>
                                )}
                              </Flex>
                              <Flex align="center" gap={2}>
                                <Box
                                  flex={1}
                                  h="10px"
                                  borderRadius="full"
                                  bg="gray.100"
                                  overflow="hidden"
                                >
                                  <Box
                                    h="100%"
                                    w={`${Math.max(item.rate * 100, 3)}%`}
                                    bg={masteryColor(item.rate)}
                                    borderRadius="full"
                                  />
                                </Box>
                                <Text
                                  fontSize="sm"
                                  fontWeight={700}
                                  color={masteryColor(item.rate)}
                                  w="44px"
                                  textAlign="right"
                                >
                                  {formatPercent(item.rate)}
                                </Text>
                              </Flex>
                            </Box>
                            <VStack spacing={0} align="flex-end" flexShrink={0} w="90px">
                              <Text fontSize="xs" color="gray.400">
                                关联 {item.questionCount} 题
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                答错 {item.wrongCount} 人次
                              </Text>
                            </VStack>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {report.unsubmitted.length > 0 && (
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg="orange.50"
                      border="1px solid"
                      borderColor="orange.100"
                    >
                      <Text fontSize="xs" fontWeight={600} color="#D97706" mb={1.5}>
                        未提交 {report.unsubmitted.length} 人
                      </Text>
                      <Flex gap={1.5} flexWrap="wrap">
                        {report.unsubmitted.map((s) => (
                          <Badge
                            key={s.studentName + s.className}
                            colorScheme="orange"
                            variant="subtle"
                            borderRadius="full"
                          >
                            {s.studentName}（{s.className}）
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </VStack>
              )}

              {/* 学生答题明细 */}
              {tab === 'students' && (
                <VStack align="stretch" spacing={2}>
                  <Flex
                    px={3}
                    py={2}
                    fontSize="xs"
                    color="gray.400"
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    <Text w="36px" flexShrink={0}>
                      排名
                    </Text>
                    <Text w="72px" flexShrink={0}>
                      学生
                    </Text>
                    <Text flex={1} minW={0}>
                      班级
                    </Text>
                    <Text w="110px" flexShrink={0}>
                      得分
                    </Text>
                    <Text w="56px" flexShrink={0}>
                      正确
                    </Text>
                    <Text w="52px" flexShrink={0}>
                      用时
                    </Text>
                    <Text w="110px" flexShrink={0}>
                      提交时间
                    </Text>
                    <Text w="52px" flexShrink={0} textAlign="right">
                      明细
                    </Text>
                  </Flex>
                  {sortedResults.map((r, idx) => {
                    const expanded = expandedStudentId === r.studentId;
                    return (
                      <Box
                        key={r.studentId}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={expanded ? 'red.200' : 'gray.100'}
                        p={3}
                      >
                        <Flex align="center" fontSize="sm">
                          <Text
                            w="36px"
                            flexShrink={0}
                            fontWeight={700}
                            color={idx < 3 ? RANK_COLORS[idx] : 'gray.400'}
                          >
                            {idx + 1}
                          </Text>
                          <Text
                            w="72px"
                            flexShrink={0}
                            fontWeight={600}
                            color="gray.800"
                            noOfLines={1}
                          >
                            {r.studentName}
                          </Text>
                          <Text flex={1} minW={0} fontSize="xs" color="gray.500" noOfLines={1}>
                            {r.className}
                          </Text>
                          <Box w="110px" flexShrink={0}>
                            <Flex align="center" gap={1.5}>
                              <Text
                                fontWeight={700}
                                color={r.totalScore >= total * 0.6 ? 'gray.800' : '#C8000B'}
                              >
                                {r.totalScore}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                /{total}
                              </Text>
                              <Box
                                w="36px"
                                h="6px"
                                borderRadius="full"
                                bg="gray.100"
                                overflow="hidden"
                              >
                                <Box
                                  h="100%"
                                  w={`${total > 0 ? (r.totalScore / total) * 100 : 0}%`}
                                  bg={r.totalScore >= total * 0.6 ? '#059669' : '#C8000B'}
                                  borderRadius="full"
                                />
                              </Box>
                            </Flex>
                          </Box>
                          <Text w="56px" flexShrink={0} fontSize="xs" color="gray.500">
                            {r.fullCorrectCount}/{quiz.questions.length} 题
                          </Text>
                          <Text w="52px" flexShrink={0} fontSize="xs" color="gray.500">
                            {r.durationMin} 分钟
                          </Text>
                          <Text w="110px" flexShrink={0} fontSize="xs" color="gray.400">
                            {r.submitTime.slice(5)}
                          </Text>
                          <Flex w="52px" flexShrink={0} justify="flex-end">
                            <Button
                              size="xs"
                              variant="ghost"
                              color="gray.500"
                              rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                              onClick={() => setExpandedStudentId(expanded ? null : r.studentId)}
                            >
                              明细
                            </Button>
                          </Flex>
                        </Flex>
                        {expanded && renderStudentDetail(r)}
                      </Box>
                    );
                  })}
                  {report.unsubmitted.length > 0 && (
                    <Text fontSize="xs" color="gray.400" pt={1}>
                      未提交：
                      {report.unsubmitted
                        .map((s) => `${s.studentName}（${s.className}）`)
                        .join('、')}
                    </Text>
                  )}
                </VStack>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
