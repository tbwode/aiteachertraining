'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Progress,
  Text,
  VStack
} from '@chakra-ui/react';
import { ArrowLeft, Award, BookOpenCheck, Target, TrendingUp } from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Button from '@/app/components/ui/Button';
import type { AbilityResult, TrainingState, TrainingSubmission, TrainingTask } from './types';
import { abilityLevel } from './types';
import { buildCumulativeAbilityResults } from './mockTraining';

type Props = {
  state: TrainingState;
  task: TrainingTask;
  submission: TrainingSubmission;
  onBack: () => void;
};

function averageScore(items: AbilityResult[]) {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
}

export function StudentAbilityView({ state, task, submission, onBack }: Props) {
  const { current, cumulative } = useMemo(
    () => buildCumulativeAbilityResults(state, submission.studentId, task.id),
    [state, submission.studentId, task.id]
  );
  const [mode, setMode] = useState<'current' | 'cumulative'>('current');
  const activeResults = mode === 'current' ? current : cumulative;
  const [selectedCode, setSelectedCode] = useState(activeResults[0]?.abilityCode ?? '');
  const selected =
    activeResults.find((item) => item.abilityCode === selectedCode) ?? activeResults[0];
  const overall = averageScore(activeResults);
  const level = abilityLevel(overall);
  const evidencePool = cumulative.flatMap((item) => item.evidences);
  const evidences = selected
    ? evidencePool.filter(
        (item) =>
          item.abilityCode === selected.abilityCode &&
          (mode === 'cumulative' || item.taskId === task.id)
      )
    : [];
  const radarData = activeResults.map((item) => ({
    subject: item.abilityName.length > 6 ? `${item.abilityName.slice(0, 6)}…` : item.abilityName,
    score: item.score,
    fullMark: 100
  }));

  const switchMode = (next: 'current' | 'cumulative') => {
    setMode(next);
    const first = (next === 'current' ? current : cumulative)[0];
    setSelectedCode(first?.abilityCode ?? '');
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Button variant="tertiary" alignSelf="flex-start" leftIcon={<ArrowLeft size={17} />} onClick={onBack}>
        返回批改详情
      </Button>

      <Box
        bg="linear-gradient(135deg,#172554 0%,#1D4ED8 58%,#60A5FA 100%)"
        color="white"
        borderRadius="20px"
        p={{ base: 5, md: 6 }}
        boxShadow="0 14px 34px rgba(37,99,235,.2)"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" w="220px" h="220px" borderRadius="full" bg="whiteAlpha.100" right="-50px" top="-110px" />
        <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }} position="relative">
          <Box>
            <HStack spacing={2} mb={2} flexWrap="wrap">
              <Text fontSize="2xl" fontWeight={780}>{submission.studentName}</Text>
              <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={2.5}>{submission.studentCode}</Badge>
              <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={2.5}>{submission.className}</Badge>
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.800">{task.title} · 岗位能力证据分析</Text>
          </Box>
          <Box textAlign={{ base: 'left', md: 'right' }}>
            <Text fontSize="xs" color="whiteAlpha.700">{mode === 'current' ? '本次综合能力达成度' : '累计综合能力达成度'}</Text>
            <HStack justify={{ md: 'flex-end' }} mt={1}><Text fontSize="4xl" fontWeight={800}>{overall}%</Text><Badge bg="white" color={level.color} borderRadius="full" px={2.5}>{level.label}</Badge></HStack>
          </Box>
        </Flex>
      </Box>

      <Flex bg="white" border="1px solid #E5E6EB" borderRadius="14px" p="4px" alignSelf="flex-start">
        {([
          { key: 'current', label: '本次实训表现' },
          { key: 'cumulative', label: '累计能力达成' }
        ] as const).map((item) => (
          <Box key={item.key} as="button" px={4} py={2} borderRadius="10px" fontSize="sm" fontWeight={mode === item.key ? 700 : 500} color={mode === item.key ? '#C83E3E' : '#646A73'} bg={mode === item.key ? '#FFF1F0' : 'transparent'} onClick={() => switchMode(item.key)}>
            {item.label}
          </Box>
        ))}
      </Flex>

      {activeResults.length === 0 ? (
        <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={10} textAlign="center">
          <Target size={36} color="#C9CDD4" />
          <Text mt={3} color="#86909C">尚无已提交的批改证据</Text>
        </Box>
      ) : (
        <>
          <Grid templateColumns={{ base: '1fr', lg: 'minmax(320px,.8fr) minmax(0,1.2fr)' }} gap={4}>
            <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5} minH="390px">
              <HStack><Award size={18} color="#2563EB" /><Text fontWeight={750}>能力雷达图</Text></HStack>
              <Box h="320px" mt={2}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="68%">
                    <PolarGrid stroke="#D8DEE9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4E5969', fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`, '达成度']} />
                    <Radar name="能力达成度" dataKey="score" stroke="#2563EB" fill="#60A5FA" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
              <Flex justify="space-between" align="center" mb={4}><HStack><TrendingUp size={18} color="#C83E3E" /><Text fontWeight={750}>能力维度</Text></HStack><Text fontSize="xs" color="#86909C">点击查看证据</Text></Flex>
              <VStack align="stretch" spacing={3}>
                {activeResults.map((ability) => {
                  const meta = abilityLevel(ability.score);
                  const active = selected?.abilityCode === ability.abilityCode;
                  return (
                    <Box key={ability.abilityCode} as="button" textAlign="left" p={4} borderRadius="14px" border="1px solid" borderColor={active ? '#C83E3E' : '#E5E6EB'} bg={active ? '#FFF9F9' : 'white'} onClick={() => setSelectedCode(ability.abilityCode)} transition="all .15s ease" _hover={{ borderColor: active ? '#C83E3E' : '#AEB3BC' }}>
                      <Flex justify="space-between" align="center" gap={3} mb={2}>
                        <HStack><Text fontWeight={700}>{ability.abilityCode} · {ability.abilityName}</Text><Badge bg={meta.bg} color={meta.color} borderRadius="full">{meta.label}</Badge></HStack>
                        <Text fontSize="lg" fontWeight={800} color={meta.color}>{ability.score}%</Text>
                      </Flex>
                      <Progress value={ability.score} size="sm" colorScheme={ability.score >= 85 ? 'green' : ability.score >= 70 ? 'blue' : ability.score >= 60 ? 'orange' : 'red'} borderRadius="full" />
                      <Text fontSize="xs" color="#86909C" mt={2}>有效证据 {mode === 'current' ? 1 : ability.evidences.length} 项 · 加权得分 {ability.earned.toFixed(1)} / {ability.maximum.toFixed(1)}</Text>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </Grid>

          {selected ? (
            <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={{ base: 4, md: 5 }}>
              <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} mb={4}>
                <HStack><BookOpenCheck size={18} color="#7C3AED" /><Box><Text fontWeight={750}>{selected.abilityName}·证据明细</Text><Text fontSize="xs" color="#86909C" mt={1}>可追溯到具体实训任务和评价项</Text></Box></HStack>
                <Badge px={3} py={1.5} borderRadius="full" bg="#F5F3FF" color="#7C3AED">{evidences.length} 条证据</Badge>
              </Flex>
              <VStack align="stretch" spacing={3}>
                {evidences.map((evidence) => {
                  const delta = evidence.score - evidence.classAverage;
                  return (
                    <Box key={`${evidence.taskId}-${evidence.abilityCode}`} border="1px solid #E5E6EB" borderRadius="14px" p={4}>
                      <Flex justify="space-between" gap={4} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
                        <Box><Text fontSize="sm" fontWeight={700}>{evidence.taskTitle}</Text><Text fontSize="xs" color="#86909C" mt={1}>关联评价项：{evidence.rubricNames.join('、')}</Text></Box>
                        <HStack spacing={4}><Box textAlign="center"><Text fontSize="xs" color="#86909C">本次达成</Text><Text fontSize="lg" fontWeight={800} color="#2563EB">{evidence.score}%</Text></Box><Box textAlign="center"><Text fontSize="xs" color="#86909C">班级平均</Text><Text fontSize="lg" fontWeight={800}>{evidence.classAverage}%</Text></Box><Badge bg={delta >= 0 ? '#ECFDF5' : '#FEF2F2'} color={delta >= 0 ? '#059669' : '#DC2626'} borderRadius="full">{delta >= 0 ? '+' : ''}{delta}%</Badge></HStack>
                      </Flex>
                      <Box bg="#F7F8FA" borderRadius="10px" p={3} mt={3}><Text fontSize="xs" color="#86909C" mb={1}>教师反馈</Text><Text fontSize="sm" color="#4E5969">{evidence.feedback}</Text></Box>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          ) : null}
        </>
      )}
    </VStack>
  );
}

