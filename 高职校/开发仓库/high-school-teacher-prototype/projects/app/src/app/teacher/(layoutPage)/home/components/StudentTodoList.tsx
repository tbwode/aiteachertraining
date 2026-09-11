import { useMemo, useState } from 'react';
import { Badge, Box, Button as ChakraButton, Flex, HStack, Progress, Text } from '@chakra-ui/react';
import { Bell, Check, ChevronRight, ShieldAlert, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { LearningRiskLevel, StudentTodo } from '../constants';
import { getStudentProgressMeta } from '../utils';

type StudentTodoListProps = {
  students: StudentTodo[];
  unremindedCount: number;
  onRemind: (id: string) => void;
  onBatchProcess: () => void;
  onViewStudent: (student: StudentTodo) => void;
};

type RiskFilter = 'all' | LearningRiskLevel;

const riskMeta: Record<
  LearningRiskLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: { label: '紧急', color: '#B42318', bg: '#FEF3F2', border: '#FECDCA' },
  high: { label: '高风险', color: '#B54708', bg: '#FFFAEB', border: '#FEDF89' },
  medium: { label: '中风险', color: '#175CD3', bg: '#EFF8FF', border: '#B2DDFF' },
  low: { label: '学习正常', color: '#067647', bg: '#ECFDF3', border: '#ABEFC6' }
};

export function StudentTodoList({
  students,
  unremindedCount,
  onRemind,
  onBatchProcess,
  onViewStudent
}: StudentTodoListProps) {
  const { t } = useTranslation('teacher');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const visibleStudents = useMemo(
    () =>
      riskFilter === 'all'
        ? students
        : students.filter((student) => student.riskLevel === riskFilter),
    [riskFilter, students]
  );
  const urgentCount = students.filter((student) => student.riskLevel === 'critical').length;
  const filters: Array<{ key: RiskFilter; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'critical', label: '紧急' },
    { key: 'high', label: '高风险' },
    { key: 'medium', label: '中风险' }
  ];

  return (
    <Box>
      <Flex
        bg={urgentCount > 0 ? '#FFFAFA' : '#F6FEF9'}
        border="1px solid"
        borderColor={urgentCount > 0 ? '#FECACA' : '#ABEFC6'}
        borderRadius="14px"
        p={3}
        align="center"
        justify="space-between"
        gap={3}
        mb={4}
      >
        <HStack spacing={3} minW={0}>
          <Flex
            w="36px"
            h="36px"
            flexShrink={0}
            align="center"
            justify="center"
            borderRadius="11px"
            bg={urgentCount > 0 ? '#FEE4E2' : '#D1FADF'}
            color={urgentCount > 0 ? '#B42318' : '#027A48'}
          >
            <ShieldAlert size={18} aria-hidden="true" />
          </Flex>
          <Box minW={0}>
            <Text fontSize="13px" fontWeight={700} color="#1D2939">
              {students.length} 位学生触发学情预警
            </Text>
            <Text fontSize="11px" color="#667085" mt={0.5}>
              {urgentCount > 0 ? `${urgentCount} 位需要今日优先干预` : '暂无紧急学情风险'}
            </Text>
          </Box>
        </HStack>
        {unremindedCount > 0 ? (
          <Button
            variant="primaryOutline"
            h="34px"
            minH="34px"
            px={3}
            fontSize="11px"
            leftIcon={<Bell size={13} aria-hidden="true" />}
            onClick={onBatchProcess}
          >
            一键提醒 {unremindedCount}人
          </Button>
        ) : (
          <Badge borderRadius="full" px={2.5} py={1} bg="#ECFDF3" color="#027A48">
            已全部跟进
          </Badge>
        )}
      </Flex>

      <Flex
        role="tablist"
        aria-label="学情预警等级"
        gap={1}
        p={1}
        bg="#F2F4F7"
        borderRadius="12px"
        mb={4}
      >
        {filters.map((filter) => {
          const selected = riskFilter === filter.key;
          const count =
            filter.key === 'all'
              ? students.length
              : students.filter((student) => student.riskLevel === filter.key).length;
          return (
            <ChakraButton
              key={filter.key}
              role="tab"
              aria-selected={selected}
              aria-label={`${filter.label}，${count} 位学生`}
              flex="1"
              h="36px"
              px={1}
              borderRadius="9px"
              border="0"
              bg={selected ? 'white' : 'transparent'}
              color={selected ? '#1D2939' : '#667085'}
              boxShadow={selected ? '0 1px 3px rgba(16,24,40,.10)' : 'none'}
              fontSize="11px"
              fontWeight={selected ? 700 : 500}
              _hover={{ bg: selected ? 'white' : 'rgba(255,255,255,.58)' }}
              _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.18)' }}
              onClick={() => setRiskFilter(filter.key)}
            >
              {filter.label}
              <Box
                as="span"
                ml={1}
                minW="18px"
                borderRadius="full"
                bg={selected ? '#FFF1F0' : '#E4E7EC'}
                color={selected ? '#B42318' : '#667085'}
                lineHeight="18px"
              >
                {count}
              </Box>
            </ChakraButton>
          );
        })}
      </Flex>

      <Flex direction="column" gap={3} aria-live="polite">
        {visibleStudents.map((student) => {
          const risk = riskMeta[student.riskLevel];
          const progress = getStudentProgressMeta(student.progress);
          return (
            <Box
              key={student.id}
              border="1px solid"
              borderColor="#EAECF0"
              borderRadius="14px"
              bg="white"
              p={3.5}
              transition="border-color .18s ease, box-shadow .18s ease, transform .18s ease"
              _hover={{
                borderColor: risk.border,
                boxShadow: '0 6px 16px rgba(16,24,40,.06)',
                transform: 'translateY(-1px)'
              }}
            >
              <Flex align="flex-start" justify="space-between" gap={3}>
                <Box minW={0}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Text fontSize="13px" fontWeight={750} color="#1D2939">
                      {student.name}
                    </Text>
                    <Badge
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bg={risk.bg}
                      color={risk.color}
                      fontSize="10px"
                    >
                      {risk.label}
                    </Badge>
                    <Badge
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bg="#F2F4F7"
                      color="#475467"
                      fontSize="10px"
                    >
                      {student.riskType}
                    </Badge>
                  </HStack>
                  <Text fontSize="10px" color="#667085" mt={1.5} noOfLines={1}>
                    {student.className} · {student.course}
                  </Text>
                </Box>
                <Box textAlign="right" flexShrink={0}>
                  <Text fontSize="16px" lineHeight="1" fontWeight={750} color={risk.color}>
                    {student.riskScore}
                  </Text>
                  <Text fontSize="9px" color="#98A2B3" mt={1}>
                    风险指数
                  </Text>
                </Box>
              </Flex>

              <Flex mt={3} gap={3} align="center">
                <Progress
                  value={student.progress}
                  aria-label={`${student.name}课程进度 ${student.progress}%`}
                  size="sm"
                  flex="1"
                  borderRadius="full"
                  colorScheme={progress.scheme}
                  bg="#F2F4F7"
                />
                <Text fontSize="11px" minW="75px" textAlign="right" color="#475467">
                  进度 {student.progress}%
                </Text>
              </Flex>

              <Flex mt={2.5} gap={2} flexWrap="wrap">
                <HStack spacing={1} px={2} py={1} borderRadius="7px" bg="#FEF3F2" color="#B42318">
                  <TrendingDown size={11} aria-hidden="true" />
                  <Text fontSize="10px">低于班级均值 {student.progressGap}%</Text>
                </HStack>
                <Text px={2} py={1} borderRadius="7px" bg="#F9FAFB" color="#475467" fontSize="10px">
                  待完成任务 {student.uncompletedTaskCount} 项
                </Text>
                <Text px={2} py={1} borderRadius="7px" bg="#F9FAFB" color="#475467" fontSize="10px">
                  最后学习 {student.lastStudyTimeDesc}
                </Text>
              </Flex>

              <Flex mt={3} pt={3} borderTop="1px solid #F2F4F7" align="center" gap={3}>
                <Text flex="1" minW={0} fontSize="10px" color="#667085" noOfLines={1}>
                  主要信号：{student.riskSignalList[0] ?? student.lagReasonList[0]}
                </Text>
                <HStack spacing={1.5} flexShrink={0}>
                  <Button
                    variant="tertiary"
                    h="34px"
                    minH="34px"
                    px={2.5}
                    fontSize="11px"
                    rightIcon={<ChevronRight size={13} aria-hidden="true" />}
                    onClick={() => onViewStudent(student)}
                  >
                    {t('home.student_todos.view')}
                  </Button>
                  <Button
                    variant={student.reminded ? 'secondary' : 'primaryOutline'}
                    h="34px"
                    minH="34px"
                    px={3}
                    fontSize="11px"
                    leftIcon={
                      student.reminded ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <Bell size={13} aria-hidden="true" />
                      )
                    }
                    isDisabled={student.reminded}
                    onClick={() => onRemind(student.id)}
                  >
                    {student.reminded
                      ? t('home.student_todos.reminded')
                      : t('home.student_todos.remind')}
                  </Button>
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </Flex>

      {visibleStudents.length === 0 ? (
        <Flex role="status" minH="220px" align="center" justify="center" direction="column" gap={3}>
          <Flex
            w="44px"
            h="44px"
            borderRadius="14px"
            bg="#ECFDF3"
            color="#027A48"
            align="center"
            justify="center"
          >
            <Check size={21} aria-hidden="true" />
          </Flex>
          <Text color="#667085" fontSize="13px">
            当前等级暂无学情预警
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
}
