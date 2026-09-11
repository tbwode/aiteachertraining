'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Input,
  Progress,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack
} from '@chakra-ui/react';
import { ArrowLeft, BarChart3, ClipboardCheck, Pencil, Search, UsersRound } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type { TrainingSubmission, TrainingTask } from './types';
import { calculateAbilityResults, reviewTotalScore, totalRubricScore } from './types';

type Props = {
  task: TrainingTask;
  submissions: TrainingSubmission[];
  onBack: () => void;
  onEdit: () => void;
  onGrade: (submission: TrainingSubmission) => void;
  onAbility: (submission: TrainingSubmission) => void;
};

const submitMeta = {
  'not-submitted': { label: '未提交', color: '#86909C', bg: '#F2F3F5' },
  submitted: { label: '已提交', color: '#2563EB', bg: '#EFF6FF' },
  late: { label: '逾期提交', color: '#D97706', bg: '#FFFBEB' }
};

const reviewMeta = {
  unreviewed: { label: '待批改', color: '#C83E3E', bg: '#FFF1F0' },
  draft: { label: '批改草稿', color: '#7C3AED', bg: '#F5F3FF' },
  reviewed: { label: '已批改', color: '#059669', bg: '#ECFDF5' }
};

function StatCard({ label, value, suffix, color = '#1D2129' }: { label: string; value: string | number; suffix?: string; color?: string }) {
  return (
    <Box bg="white" border="1px solid #E5E6EB" borderRadius="16px" p={4} boxShadow="0 5px 18px rgba(31,35,41,.045)">
      <Text fontSize="xs" color="#86909C">{label}</Text>
      <Text mt={1} fontSize="2xl" fontWeight={750} color={color}>{value}<Text as="span" ml={1} fontSize="xs" fontWeight={500} color="#86909C">{suffix}</Text></Text>
    </Box>
  );
}

export function TrainingTaskDetail({ task, submissions, onBack, onEdit, onGrade, onAbility }: Props) {
  const [keyword, setKeyword] = useState('');
  const [submitFilter, setSubmitFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');

  const summary = useMemo(() => {
    const submitted = submissions.filter((item) => item.submitStatus !== 'not-submitted');
    const reviewed = submitted.filter((item) => item.review.status === 'reviewed');
    const pending = submitted.filter((item) => item.review.status !== 'reviewed');
    const scores = reviewed.map((item) => reviewTotalScore(task, item.review));
    const abilityScores = reviewed.flatMap((item) => calculateAbilityResults(task, item.review).map((ability) => ability.score));
    return {
      total: submissions.length,
      submitted: submitted.length,
      notSubmitted: submissions.length - submitted.length,
      pending: pending.length,
      reviewed: reviewed.length,
      average: scores.length ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : 0,
      ability: abilityScores.length ? Math.round(abilityScores.reduce((sum, value) => sum + value, 0) / abilityScores.length) : 0
    };
  }, [submissions, task]);

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return submissions
      .filter((item) => !text || `${item.studentName}${item.studentCode}`.toLowerCase().includes(text))
      .filter((item) => submitFilter === 'all' || item.submitStatus === submitFilter)
      .filter((item) => reviewFilter === 'all' || item.review.status === reviewFilter)
      .sort((a, b) => {
        const order = { unreviewed: 0, draft: 1, reviewed: 2 };
        return order[a.review.status] - order[b.review.status];
      });
  }, [keyword, reviewFilter, submissions, submitFilter]);

  const maxScore = totalRubricScore(task);

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align={{ base: 'stretch', md: 'center' }} justify="space-between" gap={3} direction={{ base: 'column', md: 'row' }}>
        <Button variant="tertiary" alignSelf="flex-start" leftIcon={<ArrowLeft size={17} />} onClick={onBack}>返回实训任务</Button>
        <Button variant="secondary" leftIcon={<Pencil size={15} />} onClick={onEdit}>编辑任务</Button>
      </Flex>

      <Box bg="linear-gradient(135deg,#6F1D1D 0%,#C83E3E 65%,#E66A5F 100%)" color="white" borderRadius="20px" p={{ base: 5, md: 6 }} boxShadow="0 14px 32px rgba(140,30,36,.2)" position="relative" overflow="hidden">
        <Box position="absolute" w="260px" h="260px" borderRadius="full" bg="whiteAlpha.100" right="-80px" top="-130px" />
        <Flex gap={2} flexWrap="wrap" mb={3} position="relative">
          <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={2.5}>{task.status === 'ended' ? '已结束' : task.status === 'draft' ? '草稿' : '进行中'}</Badge>
          <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={2.5}>{task.courseName}</Badge>
        </Flex>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={760} position="relative">{task.title}</Text>
        <Text fontSize="sm" color="whiteAlpha.800" mt={2} maxW="820px" lineHeight="1.75" position="relative">{task.description}</Text>
        <Flex gap={{ base: 3, md: 6 }} flexWrap="wrap" mt={4} fontSize="sm" position="relative">
          <HStack><UsersRound size={15} /><Text>{task.classNames.join('、')}</Text></HStack>
          <Text>截止 {task.deadline.replace('T', ' ')}</Text>
          <Text>{task.rubrics.length} 个评价项 · {maxScore} 分</Text>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: 'repeat(2,minmax(0,1fr))', xl: 'repeat(6,minmax(0,1fr))' }} gap={3}>
        <StatCard label="学生总数" value={summary.total} suffix="人" />
        <StatCard label="已提交" value={summary.submitted} suffix="人" color="#2563EB" />
        <StatCard label="未提交" value={summary.notSubmitted} suffix="人" color="#86909C" />
        <StatCard label="待批改" value={summary.pending} suffix="人" color="#C83E3E" />
        <StatCard label="已批改" value={summary.reviewed} suffix="人" color="#059669" />
        <StatCard label="平均成绩 / 能力" value={`${summary.average} / ${summary.ability}%`} />
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0,1.1fr) minmax(0,.9fr)' }} gap={4}>
        <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
          <HStack mb={4}><ClipboardCheck size={18} color="#C83E3E" /><Text fontWeight={700}>实训要求</Text></HStack>
          <VStack align="stretch" spacing={3}>
            {task.requirements.map((requirement, index) => (
              <Flex key={requirement} gap={3} align="flex-start">
                <Flex w="24px" h="24px" borderRadius="8px" bg="#FFF1F0" color="#C83E3E" align="center" justify="center" fontSize="xs" fontWeight={700} flexShrink={0}>{index + 1}</Flex>
                <Text fontSize="sm" color="#4E5969" lineHeight="1.7">{requirement}</Text>
              </Flex>
            ))}
          </VStack>
        </Box>
        <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
          <HStack mb={4}><BarChart3 size={18} color="#C83E3E" /><Text fontWeight={700}>关联岗位能力</Text></HStack>
          <VStack align="stretch" spacing={2.5}>
            {task.abilities.map((ability) => (
              <Box key={`${ability.graphId}-${ability.abilityCode}`} p={3} borderRadius="12px" bg="#F7F8FA">
                <Flex justify="space-between" gap={2} align="center">
                  <Text fontSize="sm" fontWeight={700}>{ability.abilityCode} · {ability.abilityName}</Text>
                  <Badge borderRadius="full" bg="#FFF1F0" color="#C83E3E">{ability.graphVersion}</Badge>
                </Flex>
                <Text fontSize="xs" color="#86909C" mt={1}>{ability.graphName} / {ability.taskName}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Grid>

      <Box bg="white" border="1px solid #E5E6EB" borderRadius="20px" overflow="hidden" boxShadow="0 8px 28px rgba(31,35,41,.055)">
        <Flex p={{ base: 4, md: 5 }} borderBottom="1px solid #F0F1F3" gap={3} align={{ base: 'stretch', lg: 'center' }} justify="space-between" direction={{ base: 'column', lg: 'row' }}>
          <Box>
            <Text fontWeight={750} color="#1D2129">学生提交与批改</Text>
            <Text fontSize="xs" color="#86909C" mt={1}>当前显示 {filtered.length} / {submissions.length} 名学生</Text>
          </Box>
          <Flex gap={2} direction={{ base: 'column', sm: 'row' }}>
            <Box position="relative">
              <Box position="absolute" left="12px" top="10px" color="#86909C"><Search size={16} /></Box>
              <Input h="40px" pl="36px" w={{ base: '100%', sm: '220px' }} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索姓名 / 学号" />
            </Box>
            <Select h="40px" w={{ base: '100%', sm: '132px' }} value={submitFilter} onChange={(event) => setSubmitFilter(event.target.value)}><option value="all">全部提交</option><option value="submitted">已提交</option><option value="late">逾期提交</option><option value="not-submitted">未提交</option></Select>
            <Select h="40px" w={{ base: '100%', sm: '132px' }} value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}><option value="all">全部批改</option><option value="unreviewed">待批改</option><option value="draft">批改草稿</option><option value="reviewed">已批改</option></Select>
          </Flex>
        </Flex>
        <Box overflowX="auto">
          <Table size="sm" minW="920px">
            <Thead bg="#FAFAFB"><Tr><Th py={3.5} color="#646A73">学生</Th><Th color="#646A73">提交状态</Th><Th color="#646A73">提交时间</Th><Th color="#646A73">批改状态</Th><Th color="#646A73">成绩</Th><Th color="#646A73">能力达成</Th><Th color="#646A73" textAlign="right">操作</Th></Tr></Thead>
            <Tbody>
              {filtered.map((submission) => {
                const submit = submitMeta[submission.submitStatus];
                const review = reviewMeta[submission.review.status];
                const score = submission.review.status === 'reviewed' ? reviewTotalScore(task, submission.review) : null;
                const abilityValues = submission.review.status === 'reviewed' ? calculateAbilityResults(task, submission.review) : [];
                const ability = abilityValues.length ? Math.round(abilityValues.reduce((sum, item) => sum + item.score, 0) / abilityValues.length) : null;
                return (
                  <Tr key={submission.id} _hover={{ bg: '#FCFCFD' }}>
                    <Td py={3.5}><Text fontSize="sm" fontWeight={650}>{submission.studentName}</Text><Text fontSize="xs" color="#86909C">{submission.studentCode} · {submission.className}</Text></Td>
                    <Td><Badge bg={submit.bg} color={submit.color} borderRadius="full" px={2}>{submit.label}</Badge></Td>
                    <Td fontSize="xs" color="#646A73">{submission.submittedAt ?? '--'}</Td>
                    <Td><Badge bg={review.bg} color={review.color} borderRadius="full" px={2}>{review.label}</Badge></Td>
                    <Td><Text fontWeight={700} color={score === null ? '#C9CDD4' : '#1D2129'}>{score === null ? '--' : `${score} / ${maxScore}`}</Text></Td>
                    <Td>{ability === null ? <Text color="#C9CDD4">--</Text> : <HStack spacing={2}><Progress value={ability} colorScheme={ability >= 70 ? 'green' : 'orange'} size="sm" w="70px" borderRadius="full" /><Text fontSize="xs" fontWeight={700}>{ability}%</Text></HStack>}</Td>
                    <Td><Flex justify="flex-end" gap={2}><Button size="sm" variant={submission.review.status === 'reviewed' ? 'secondary' : 'primary'} isDisabled={submission.submitStatus === 'not-submitted'} onClick={() => onGrade(submission)}>{submission.review.status === 'reviewed' ? '查看批改' : '批改'}</Button><Button size="sm" variant="tertiary" isDisabled={submission.review.status !== 'reviewed'} onClick={() => onAbility(submission)}>查看能力</Button></Flex></Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
        {filtered.length === 0 ? <Text textAlign="center" color="#86909C" fontSize="sm" py={10}>没有符合条件的学生</Text> : null}
      </Box>
    </VStack>
  );
}

