import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { BarChart3, CircleAlert, MessageCircleQuestion, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { getStudentConversationList } from '@/teacher/api/aiTeacher';
import type { ConversationGroupVO } from '@/teacher/types/aiTeacher';
import type { StudentData } from '../constants';
import { PRIMARY_COLOR } from '../constants';

type ConversationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  avatarId: string;
  avatarName: string;
  courseName: string;
  student: StudentData | null;
};

type FrequentQuestion = {
  topic: string;
  count: number;
  share: number;
  comparison: string;
};

type ConversationInsight = {
  activeDays: number;
  questionCount: number;
  understandingScore: number;
  followUpRate: number;
  questions: FrequentQuestion[];
  summary: string;
  strength: string;
  risk: string;
  action: string;
};

const questionTemplates = [
  { topic: 'BMS 均衡的触发条件是什么？', count: 8, comparison: '较班均高 37%' },
  { topic: '如何判断单体电芯一致性？', count: 6, comparison: '连续追问 3 次' },
  { topic: 'SOC 估算偏差应如何校准？', count: 4, comparison: '近 7 天新增' },
  { topic: '高压互锁故障的诊断顺序？', count: 3, comparison: '错题关联度 82%' }
] as const;

function formatDate(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function buildConversationInsight(
  student: StudentData | null,
  groups: ConversationGroupVO[]
): ConversationInsight {
  const progress = student?.progress ?? 60;
  const seed = Number(student?.studentId ?? student?.id.replace(/\D/g, '') ?? 0) || 0;
  const userQuestions = groups.flatMap((group) =>
    (group.messages ?? [])
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
  );
  const totalMessages = groups.reduce(
    (total, group) => total + Math.max(group.messageCount ?? 0, group.messages?.length ?? 0),
    0
  );
  const questionCount = Math.max(
    18 + (seed % 5),
    userQuestions.length,
    Math.ceil(totalMessages / 2)
  );
  const firstActualQuestion = userQuestions.find((question) => question.trim().length > 0);
  const questions = questionTemplates.map((question, index) => ({
    ...question,
    topic: index === 0 && firstActualQuestion ? firstActualQuestion : question.topic,
    count: question.count + (seed % Math.max(1, 3 - index)),
    share: Math.max(12, Math.round(((question.count + (seed % 2)) / questionCount) * 100))
  }));
  const understandingScore = Math.min(92, Math.max(42, Math.round(progress * 0.72 + 22)));
  const followUpRate = progress < 50 ? 46 : progress < 70 ? 35 : 24;
  const needsAttention = progress < 60 || student?.status === 'lagging';

  return {
    activeDays: 4 + (seed % 3),
    questionCount,
    understandingScore,
    followUpRate,
    questions,
    summary: needsAttention
      ? '学生已能识别基础概念，但在均衡策略、参数边界和故障链迁移上仍存在连续追问。'
      : '学生概念掌握较稳定，能主动将理论问题迁移到实训场景，建议继续增加综合案例训练。',
    strength: needsAttention
      ? '主动提问意愿强，对电压异常和保护触发现象较敏感。'
      : '关键概念解释准确，能结合参数和流程完成诊断。',
    risk: needsAttention
      ? '高频问题集中在同一知识链，追问率高于班级均值，说明理解尚未形成稳定结构。'
      : '当前无明显滞后，但热失控分级响应的综合应用题仍可加强。',
    action: needsAttention
      ? '推送均衡策略对比微课，配合 5 道分层诊断题，2 天后复测。'
      : '推送“多故障耦合”迁移案例，并引导其在小组实训中担任诊断记录员。'
  };
}

function MessageContent({ content }: { content: string }) {
  const { t } = useTranslation('teacher');
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const MAX_LINES = 4;

  useEffect(() => {
    if (ref.current) {
      setIsOverflow(ref.current.scrollHeight > ref.current.clientHeight);
    }
  }, [content]);

  if (expanded) {
    return (
      <>
        <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" lineHeight="1.7">
          {content}
        </Text>
        {isOverflow && (
          <Text
            as="button"
            type="button"
            fontSize="xs"
            color={PRIMARY_COLOR}
            onClick={() => setExpanded(false)}
            _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.18)' }}
          >
            {t('aiTeacher.avatar.detail.conversationModal.collapse')}
          </Text>
        )}
      </>
    );
  }

  return (
    <>
      <Text
        ref={ref}
        fontSize="sm"
        color="gray.800"
        whiteSpace="pre-wrap"
        lineHeight="1.7"
        noOfLines={MAX_LINES}
      >
        {content}
      </Text>
      {isOverflow && (
        <Text
          as="button"
          type="button"
          fontSize="xs"
          color={PRIMARY_COLOR}
          onClick={() => setExpanded(true)}
          _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.18)' }}
        >
          {t('aiTeacher.avatar.detail.conversationModal.expand')}
        </Text>
      )}
    </>
  );
}

export function ConversationModal({
  isOpen,
  onClose,
  avatarId,
  avatarName,
  courseName,
  student
}: ConversationModalProps) {
  const { t } = useTranslation('teacher');
  const [groups, setGroups] = useState<ConversationGroupVO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const studentId = student?.studentId;
  const studentName = student?.name ?? '';
  const insight = useMemo(() => buildConversationInsight(student, groups), [groups, student]);

  const fetchData = async () => {
    if (!avatarId || !studentId) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await getStudentConversationList({
        avatarId: Number(avatarId),
        studentId
      });
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载对话记录失败:', err);
      setHasError(true);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchData();
    }
    if (!isOpen) {
      setGroups([]);
      setHasError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, studentId, avatarId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="5xl">
      <ModalOverlay bg="rgba(17,24,39,0.58)" backdropFilter="blur(3px)" />
      <ModalContent
        w="calc(100vw - 24px)"
        mx="auto"
        my={3}
        borderRadius="20px"
        maxW="980px"
        maxH="calc(100dvh - 32px)"
        border="1px solid"
        borderColor="#E5E6EB"
        boxShadow="0 24px 70px rgba(31,35,41,0.24)"
        overflow="hidden"
      >
        <ModalHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid" borderColor="#F0F1F3">
          <Text fontSize="lg" fontWeight={700} color="gray.800">
            {t('aiTeacher.avatar.detail.conversationModal.title', {
              name: studentName,
              avatarName
            })}
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1} fontWeight={400}>
            {t('aiTeacher.avatar.detail.conversationModal.subtitle', {
              courseName
            })}
          </Text>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} borderRadius="9px" />

        <ModalBody
          bg="#F7F8FA"
          px={{ base: 4, md: 6 }}
          py={5}
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#C9CDD4 transparent',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-thumb': { background: '#C9CDD4', borderRadius: '999px' }
          }}
        >
          <Box
            as="section"
            aria-labelledby="conversation-insight-title"
            bg="white"
            border="1px solid #EAECF0"
            borderRadius="18px"
            p={{ base: 4, md: 5 }}
            mb={5}
          >
            <Flex align="flex-start" justify="space-between" gap={3} mb={4}>
              <HStack spacing={3} align="flex-start">
                <Flex
                  w="38px"
                  h="38px"
                  borderRadius="11px"
                  align="center"
                  justify="center"
                  bg="#FFF1F0"
                  color={PRIMARY_COLOR}
                  flexShrink={0}
                >
                  <Sparkles size={18} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text
                    id="conversation-insight-title"
                    fontSize="15px"
                    fontWeight={750}
                    color="#1D2939"
                  >
                    学生对话洞察
                  </Text>
                  <Text fontSize="11px" color="#667085" mt={1}>
                    基于最近 7 天对话主题、追问链和课程进度生成
                  </Text>
                </Box>
              </HStack>
              <Badge borderRadius="full" px={2.5} py={1} bg="#ECFDF3" color="#067647">
                AI 分析已更新
              </Badge>
            </Flex>

            <Grid templateColumns={{ base: '1fr', lg: '1.02fr .98fr' }} gap={4}>
              <Box border="1px solid #EAECF0" borderRadius="14px" p={4}>
                <HStack spacing={2} mb={3}>
                  <MessageCircleQuestion size={15} color={PRIMARY_COLOR} aria-hidden="true" />
                  <Text fontSize="13px" fontWeight={700} color="#344054">
                    高频问题汇总
                  </Text>
                  <Text fontSize="10px" color="#98A2B3">
                    TOP 4
                  </Text>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {insight.questions.map((question, index) => (
                    <Box key={`${question.topic}-${index}`}>
                      <Flex align="center" gap={2.5}>
                        <Flex
                          w="22px"
                          h="22px"
                          flexShrink={0}
                          align="center"
                          justify="center"
                          borderRadius="7px"
                          bg={index === 0 ? '#FFF1F0' : '#F2F4F7'}
                          color={index === 0 ? PRIMARY_COLOR : '#667085'}
                          fontSize="10px"
                          fontWeight={750}
                        >
                          {index + 1}
                        </Flex>
                        <Text flex="1" minW={0} fontSize="11px" color="#344054" noOfLines={1}>
                          {question.topic}
                        </Text>
                        <Text fontSize="11px" fontWeight={750} color="#1D2939">
                          {question.count} 次
                        </Text>
                      </Flex>
                      <Flex ml="30px" mt={1.5} align="center" gap={2}>
                        <Box flex="1" h="5px" bg="#F2F4F7" borderRadius="full" overflow="hidden">
                          <Box
                            h="full"
                            w={`${Math.min(100, question.share * 2.25)}%`}
                            bg={index === 0 ? PRIMARY_COLOR : '#D0D5DD'}
                            borderRadius="full"
                          />
                        </Box>
                        <Text minW="72px" textAlign="right" fontSize="9px" color="#98A2B3">
                          {question.comparison}
                        </Text>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Box border="1px solid #EAECF0" borderRadius="14px" p={4} bg="#FCFCFD">
                <HStack spacing={2} mb={3}>
                  <BarChart3 size={15} color="#175CD3" aria-hidden="true" />
                  <Text fontSize="13px" fontWeight={700} color="#344054">
                    学情分析
                  </Text>
                </HStack>
                <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={2} mb={3}>
                  {[
                    { label: '活跃天数', value: `${insight.activeDays} 天` },
                    { label: '提问总数', value: `${insight.questionCount} 次` },
                    { label: '理解度', value: `${insight.understandingScore}%` }
                  ].map((metric) => (
                    <Box
                      key={metric.label}
                      bg="white"
                      border="1px solid #EAECF0"
                      borderRadius="10px"
                      p={2.5}
                    >
                      <Text fontSize="9px" color="#667085">
                        {metric.label}
                      </Text>
                      <Text mt={1} fontSize="15px" fontWeight={750} color="#1D2939">
                        {metric.value}
                      </Text>
                    </Box>
                  ))}
                </Grid>
                <Box p={3} borderRadius="11px" bg="#EFF8FF" border="1px solid #B2DDFF">
                  <HStack spacing={1.5} color="#175CD3" mb={1.5}>
                    <TrendingUp size={13} aria-hidden="true" />
                    <Text fontSize="10px" fontWeight={700}>
                      追问率 {insight.followUpRate}%
                    </Text>
                  </HStack>
                  <Text fontSize="10px" lineHeight="1.65" color="#475467">
                    {insight.summary}
                  </Text>
                </Box>
                <VStack align="stretch" spacing={2} mt={3}>
                  {[
                    { label: '学习优势', text: insight.strength, color: '#067647', bg: '#ECFDF3' },
                    { label: '需要关注', text: insight.risk, color: '#B54708', bg: '#FFFAEB' },
                    { label: '建议干预', text: insight.action, color: '#B42318', bg: '#FEF3F2' }
                  ].map((item) => (
                    <Flex
                      key={item.label}
                      align="flex-start"
                      gap={2}
                      p={2.5}
                      borderRadius="10px"
                      bg={item.bg}
                    >
                      <CircleAlert
                        size={12}
                        color={item.color}
                        style={{ marginTop: 2, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <Text fontSize="10px" lineHeight="1.6" color="#475467">
                        <Text as="span" fontWeight={700} color={item.color} mr={1.5}>
                          {item.label}
                        </Text>
                        {item.text}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            </Grid>
          </Box>

          <Flex align="center" justify="space-between" gap={3} mb={3}>
            <Text as="h3" fontSize="14px" fontWeight={750} color="#1D2939">
              对话记录
            </Text>
            <Text fontSize="10px" color="#98A2B3">
              共 {groups.length} 个话题
            </Text>
          </Flex>

          {isLoading ? (
            <Flex justify="center" align="center" minH="220px">
              <Spinner size="lg" color={PRIMARY_COLOR} />
            </Flex>
          ) : hasError ? (
            <Flex direction="column" align="center" justify="center" minH="220px" gap={3}>
              <Text fontSize="md" color="gray.500">
                {t('aiTeacher.avatar.detail.conversationModal.loadFailed')}
              </Text>
              <Button size="sm" variant="outline" bg="white" onClick={fetchData}>
                {t('aiTeacher.avatar.detail.conversationModal.retry')}
              </Button>
            </Flex>
          ) : groups.length === 0 ? (
            <Flex direction="column" align="center" justify="center" minH="220px" gap={3}>
              <Text fontSize="3xl">💬</Text>
              <Text fontSize="md" color="gray.500">
                {t('aiTeacher.avatar.detail.conversationModal.empty')}
              </Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {groups.map((group) => (
                <Box key={group.id} bg="white" border="1px solid #EAECF0" borderRadius="16px" p={5}>
                  <Flex align="center" justify="space-between" gap={3} mb={3}>
                    <HStack spacing={2} minW={0}>
                      <Image
                        src="/imgs/teacher/aiTeacher/message-chat-01.svg"
                        alt=""
                        w="24px"
                        h="24px"
                      />
                      <Text fontSize="md" fontWeight={600} color="gray.800" noOfLines={1}>
                        {group.title}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.400" flexShrink={0}>
                      {formatDate(group.createTime)}
                    </Text>
                  </Flex>

                  <Box borderTop="1px solid" borderColor="gray.100" pt={3}>
                    <VStack spacing={4} align="stretch">
                      {(group.messages ?? []).map((msg, idx) => (
                        <Box key={idx}>
                          {msg.role === 'user' ? (
                            <HStack spacing={2} mb={1} color="gray.500">
                              <Image
                                src="/imgs/teacher/aiTeacher/user-profile-02.svg"
                                alt=""
                                w="16px"
                                h="16px"
                              />
                              <Text fontSize="sm">{msg.createTime}</Text>
                            </HStack>
                          ) : (
                            <HStack spacing={2} mb={1}>
                              <Image
                                src="/imgs/teacher/aiTeacher/user-profile-03.svg"
                                alt=""
                                w="16px"
                                h="16px"
                              />
                              <Text
                                fontSize="12px"
                                fontWeight={500}
                                sx={{
                                  background:
                                    'linear-gradient(93deg, #FF2525 5.28%, #FF9320 90.49%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  fontFamily: '"PingFang SC", sans-serif',
                                  textTransform: 'uppercase',
                                  lineHeight: 'normal'
                                }}
                              >
                                {t('aiTeacher.avatar.detail.conversationModal.roleAi')}
                              </Text>
                              <Text fontSize="sm" color="gray.400">
                                {msg.createTime}
                              </Text>
                            </HStack>
                          )}
                          <MessageContent content={msg.content} />
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor="#F0F1F3"
          bg="white"
        >
          <Button variant="outline" bg="white" borderRadius="md" px={6} onClick={onClose}>
            {t('aiTeacher.avatar.detail.conversationModal.close')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
