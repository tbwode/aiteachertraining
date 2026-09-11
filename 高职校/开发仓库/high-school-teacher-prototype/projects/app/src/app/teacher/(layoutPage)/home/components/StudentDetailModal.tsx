import { useEffect, useRef } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  VStack
} from '@chakra-ui/react';
import { Bell, BookOpenCheck, ChevronRight, CircleAlert, Clock3, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import type { LearningRiskLevel, StudentTodo } from '../constants';

type StudentDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentTodo | null;
  onOpenRemindModal?: () => void;
};

const riskMeta: Record<
  LearningRiskLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: { label: '紧急预警', color: '#B42318', bg: '#FEF3F2', border: '#FECDCA' },
  high: { label: '高风险', color: '#B54708', bg: '#FFFAEB', border: '#FEDF89' },
  medium: { label: '中风险', color: '#175CD3', bg: '#EFF8FF', border: '#B2DDFF' },
  low: { label: '学习正常', color: '#067647', bg: '#ECFDF3', border: '#ABEFC6' }
};

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onOpenRemindModal
}: StudentDetailModalProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [isOpen, student?.id]);

  if (!student) return null;

  const risk = riskMeta[student.riskLevel];
  const handleViewInAvatar = () => {
    router.push(`/teacher/aiTeacher/avatar/detail?id=${student.avatarId}&tab=students`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      scrollBehavior="inside"
      initialFocusRef={closeButtonRef}
    >
      <ModalOverlay bg="rgba(16,24,40,.58)" backdropFilter="blur(3px)" />
      <ModalContent
        w="calc(100vw - 24px)"
        maxW="900px"
        maxH="calc(100dvh - 48px)"
        borderRadius="20px"
        mx="auto"
        my={3}
        overflow="hidden"
      >
        <ModalHeader px={{ base: 5, md: 6 }} py={5} borderBottom="1px solid #EAECF0" flexShrink={0}>
          <HStack spacing={3} pr={10}>
            <Flex
              w="42px"
              h="42px"
              flexShrink={0}
              bg="#FFF1F0"
              borderRadius="12px"
              align="center"
              justify="center"
              color="#C83E3E"
              fontSize="15px"
              fontWeight={750}
            >
              {student.name.charAt(0)}
            </Flex>
            <Box minW={0}>
              <HStack spacing={2} flexWrap="wrap">
                <Text fontSize="16px" fontWeight={750} color="#1D2939">
                  {student.name}
                </Text>
                <Badge px={2.5} py={1} borderRadius="full" bg={risk.bg} color={risk.color}>
                  {risk.label}
                </Badge>
                <Badge px={2.5} py={1} borderRadius="full" bg="#F2F4F7" color="#475467">
                  {student.riskType}
                </Badge>
              </HStack>
              <Text fontSize="11px" color="#667085" mt={1} lineHeight="1.55">
                {student.className} · {student.course}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton ref={closeButtonRef} top={5} right={5} borderRadius="9px" />

        <ModalBody
          ref={bodyRef}
          px={{ base: 5, md: 6 }}
          pt={5}
          pb={5}
          overflowY="auto"
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#C9CDD4 transparent',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: '#C9CDD4',
              borderRadius: '999px',
              border: '2px solid white'
            }
          }}
        >
          <Flex
            p={4}
            borderRadius="15px"
            bg={risk.bg}
            border="1px solid"
            borderColor={risk.border}
            align="center"
            justify="space-between"
            gap={4}
            direction="row"
          >
            <Box flex="1" minW={0}>
              <HStack spacing={2} color={risk.color}>
                <CircleAlert size={16} aria-hidden="true" />
                <Text fontSize="12px" fontWeight={700}>
                  AI 学情评估
                </Text>
              </HStack>
              <Text fontSize="12px" color="#475467" mt={2} lineHeight="1.7">
                综合进度、测验、实训与互动数据，建议按优先级进行针对性干预。
              </Text>
            </Box>
            <Box textAlign={{ base: 'left', md: 'right' }} flexShrink={0}>
              <Text fontSize="28px" lineHeight="1" fontWeight={780} color={risk.color}>
                {student.riskScore}
              </Text>
              <Text fontSize="10px" color="#667085" mt={1}>
                风险指数 / 100
              </Text>
            </Box>
          </Flex>

          <Flex flexWrap="wrap" gap={3} mt={4}>
            {[
              { label: '当前进度', value: `${student.progress}%` },
              { label: '低于班均', value: `${student.progressGap}%` },
              { label: '待完成任务', value: `${student.uncompletedTaskCount} 项` },
              { label: '累计学习', value: `${student.studyHours} 小时` }
            ].map((metric) => (
              <Box
                key={metric.label}
                flex="1 1 180px"
                minW={0}
                p={3}
                border="1px solid #EAECF0"
                borderRadius="12px"
                bg="#FCFCFD"
              >
                <Text fontSize="10px" color="#667085">
                  {metric.label}
                </Text>
                <Text fontSize="15px" fontWeight={750} color="#1D2939" mt={1}>
                  {metric.value}
                </Text>
              </Box>
            ))}
          </Flex>

          <Box mt={4} p={3.5} border="1px solid #EAECF0" borderRadius="13px">
            <Flex justify="space-between" align="center" mb={2}>
              <HStack spacing={1.5} color="#475467">
                <TrendingDown size={14} aria-hidden="true" />
                <Text fontSize="12px" fontWeight={700}>
                  课程学习进度
                </Text>
              </HStack>
              <Text fontSize="11px" fontWeight={700} color={risk.color}>
                {student.progress}%
              </Text>
            </Flex>
            <Progress
              value={student.progress}
              aria-label={`${student.name}课程进度 ${student.progress}%`}
              size="sm"
              borderRadius="full"
              colorScheme={
                student.riskLevel === 'critical'
                  ? 'red'
                  : student.riskLevel === 'low'
                    ? 'green'
                    : 'yellow'
              }
              bg="#F2F4F7"
            />
            <HStack spacing={1.5} mt={2} color="#667085">
              <Clock3 size={12} aria-hidden="true" />
              <Text fontSize="10px">最后学习：{student.lastStudyTimeDesc}</Text>
            </HStack>
          </Box>

          <Flex flexWrap="wrap" gap={5} mt={5} alignItems="flex-start">
            <VStack flex="1 1 360px" minW={0} align="stretch" spacing={4}>
              <Box>
                <Text fontSize="13px" fontWeight={700} color="#344054" mb={2.5}>
                  风险信号
                </Text>
                <VStack align="stretch" spacing={2}>
                  {student.riskSignalList.map((signal) => (
                    <HStack
                      key={signal}
                      align="flex-start"
                      spacing={2.5}
                      p={3}
                      borderRadius="11px"
                      bg="#FFF8F7"
                    >
                      <CircleAlert
                        size={13}
                        color="#B42318"
                        style={{ marginTop: 3, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <Text fontSize="11px" color="#475467" lineHeight="1.65">
                        {signal}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <Box p={4} borderRadius="14px" bg="#FCFCFD" border="1px solid #EAECF0">
                <Text fontSize="13px" fontWeight={700} color="#344054" mb={2.5}>
                  薄弱知识点
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {student.weakKnowledgePoints.map((point) => (
                    <Badge
                      key={point}
                      px={2.5}
                      py={1.5}
                      borderRadius="8px"
                      bg="#F2F4F7"
                      color="#475467"
                      fontWeight={500}
                      whiteSpace="normal"
                    >
                      {point}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </VStack>

            <VStack flex="1 1 360px" minW={0} align="stretch" spacing={4}>
              <Box p={4} borderRadius="14px" bg="#F8FAFC" border="1px solid #EAECF0">
                <HStack spacing={2} mb={3}>
                  <BookOpenCheck size={15} color="#175CD3" aria-hidden="true" />
                  <Text fontSize="13px" fontWeight={700} color="#344054">
                    AI 建议干预方案
                  </Text>
                </HStack>
                <VStack align="stretch" spacing={2.5}>
                  {student.recommendedActions.map((action, index) => (
                    <Flex key={action} align="flex-start" gap={3}>
                      <Flex
                        w="22px"
                        h="22px"
                        flexShrink={0}
                        align="center"
                        justify="center"
                        borderRadius="7px"
                        bg="#EFF8FF"
                        color="#175CD3"
                        fontSize="10px"
                        fontWeight={750}
                      >
                        {index + 1}
                      </Flex>
                      <Text fontSize="12px" color="#475467" lineHeight="1.7">
                        {action}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>

              <Box p={4} borderRadius="14px" bg="#FFFAEB" border="1px solid #FEDF89">
                <Text fontSize="13px" fontWeight={700} color="#B54708" mb={2.5}>
                  滞后原因分析
                </Text>
                <VStack align="stretch" spacing={2}>
                  {student.lagReasonList.map((reason) => (
                    <HStack key={reason} align="flex-start" spacing={2}>
                      <CircleAlert
                        size={12}
                        color="#B54708"
                        style={{ marginTop: 3, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <Text fontSize="11px" color="#475467" lineHeight="1.65">
                        {reason}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Flex>

          <Flex
            mt={5}
            pt={3.5}
            borderTop="1px solid #EAECF0"
            gap={3}
            flexDirection={{ base: 'column-reverse', sm: 'row' }}
            justify="flex-end"
          >
            <Button
              variant="secondary"
              w={{ base: 'full', sm: 'auto' }}
              rightIcon={<ChevronRight size={15} aria-hidden="true" />}
              onClick={handleViewInAvatar}
            >
              查看学生完整学情
            </Button>
            {!student.reminded ? (
              <Button
                w={{ base: 'full', sm: 'auto' }}
                leftIcon={<Bell size={15} aria-hidden="true" />}
                onClick={() => {
                  onClose();
                  onOpenRemindModal?.();
                }}
              >
                发送个性化提醒
              </Button>
            ) : (
              <Button variant="secondary" w={{ base: 'full', sm: 'auto' }} isDisabled>
                今日已提醒
              </Button>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
