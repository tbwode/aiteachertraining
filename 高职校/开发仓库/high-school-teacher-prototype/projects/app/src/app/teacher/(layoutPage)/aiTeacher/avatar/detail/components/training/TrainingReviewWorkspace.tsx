'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Divider,
  Flex,
  Grid,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Progress,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock3,
  Database,
  Eye,
  FileText,
  Image as ImageIcon,
  Play,
  Save,
  ShieldCheck
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type {
  ReviewStatus,
  TrainingAttachment,
  TrainingReview,
  TrainingSubmission,
  TrainingTask
} from './types';
import { calculateAbilityResults, reviewTotalScore, totalRubricScore } from './types';

type Props = {
  task: TrainingTask;
  submission: TrainingSubmission;
  onBack: () => void;
  onSave: (review: TrainingReview, status: ReviewStatus) => void;
  onAbility: () => void;
};

const strengthOptions = ['操作规范', '数据分析', '故障定位', '思路清晰', '记录完整', '安全意识'];
const improvementOptions = ['复核测量', '原因论证', '报告规范', '工具使用', '数据解读', '时间管理'];

const attachmentIcon = {
  document: FileText,
  image: ImageIcon,
  video: Play,
  data: Database
};

function toggleValue(value: string, values: string[]) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function TrainingReviewWorkspace({ task, submission, onBack, onSave, onAbility }: Props) {
  const toast = useToast();
  const invalidRef = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState<TrainingReview>(submission.review);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<TrainingAttachment | null>(null);

  useEffect(() => {
    setReview(JSON.parse(JSON.stringify(submission.review)) as TrainingReview);
    setInvalidIds([]);
  }, [submission]);

  const maxScore = totalRubricScore(task);
  const totalScore = reviewTotalScore(task, review);
  const abilityResults = useMemo(() => calculateAbilityResults(task, review), [review, task]);

  const setRubricScore = (rubricId: string, score: number | null) => {
    setReview((previous) => ({
      ...previous,
      scores: [
        ...previous.scores.filter((item) => item.rubricId !== rubricId),
        { rubricId, score }
      ]
    }));
    setInvalidIds((previous) => previous.filter((id) => id !== rubricId));
  };

  const handleSave = (status: ReviewStatus) => {
    if (status === 'reviewed') {
      const invalid = task.rubrics
        .filter((rubric) => {
          const score = review.scores.find((item) => item.rubricId === rubric.id)?.score;
          return score === null || score === undefined || score < 0 || score > rubric.maxScore;
        })
        .map((rubric) => rubric.id);
      if (invalid.length > 0) {
        setInvalidIds(invalid);
        invalidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast({ title: `还有 ${invalid.length} 个评价项未完成评分`, status: 'warning', position: 'top', duration: 2200 });
        return;
      }
    }
    const next: TrainingReview = {
      ...review,
      status,
      reviewedAt: status === 'reviewed' ? new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-') : review.reviewedAt
    };
    setReview(next);
    onSave(next, status);
    toast({ title: status === 'reviewed' ? `已完成 ${submission.studentName} 的实训批改` : '批改草稿已保存', status: 'success', position: 'top', duration: 1800 });
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align={{ base: 'stretch', md: 'center' }} justify="space-between" gap={3} direction={{ base: 'column', md: 'row' }}>
        <Button variant="tertiary" alignSelf="flex-start" leftIcon={<ArrowLeft size={17} />} onClick={onBack}>返回学生列表</Button>
        <Flex gap={2}>
          {submission.review.status === 'reviewed' ? <Button variant="secondary" leftIcon={<BarChart3 size={16} />} onClick={onAbility}>查看能力结果</Button> : null}
          <Button variant="secondary" leftIcon={<Save size={15} />} onClick={() => handleSave('draft')}>保存草稿</Button>
        </Flex>
      </Flex>

      <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={{ base: 4, md: 5 }}>
        <Flex justify="space-between" gap={4} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
          <Box>
            <HStack spacing={2} mb={1}><Badge bg="#FFF1F0" color="#C83E3E" borderRadius="full">{submission.review.status === 'reviewed' ? '已批改' : '待批改'}</Badge><Text fontSize="lg" fontWeight={750}>{submission.studentName}</Text><Text fontSize="sm" color="#86909C">{submission.studentCode}</Text></HStack>
            <Text fontSize="sm" color="#646A73">{task.title} · {submission.className}</Text>
          </Box>
          <HStack spacing={5} fontSize="sm">
            <Box textAlign="right"><Text color="#86909C" fontSize="xs">提交时间</Text><Text fontWeight={650}>{submission.submittedAt ?? '--'}</Text></Box>
            <Box textAlign="right"><Text color="#86909C" fontSize="xs">当前得分</Text><Text fontSize="xl" fontWeight={760} color="#C83E3E">{totalScore}<Text as="span" fontSize="xs" color="#86909C"> / {maxScore}</Text></Text></Box>
          </HStack>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0,1.25fr) minmax(390px,.75fr)' }} gap={4} alignItems="start">
        <VStack align="stretch" spacing={4}>
          <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
            <HStack mb={4}><FileText size={18} color="#C83E3E" /><Text fontWeight={750}>学生实训成果</Text></HStack>
            <Box bg="#F7F8FA" borderRadius="12px" p={4}>
              <Text fontSize="xs" fontWeight={700} color="#86909C" mb={2}>实训报告摘要</Text>
              <Text fontSize="sm" color="#4E5969" lineHeight="1.8">{submission.report}</Text>
            </Box>
            <Text fontSize="sm" fontWeight={700} mt={5} mb={3}>成果附件</Text>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2,minmax(0,1fr))' }} gap={3}>
              {submission.attachments.map((attachment) => {
                const Icon = attachmentIcon[attachment.type];
                return (
                  <Flex key={attachment.id} border="1px solid #E5E6EB" borderRadius="12px" p={3} align="center" gap={3}>
                    <Flex w="38px" h="38px" borderRadius="10px" bg="#FFF1F0" color="#C83E3E" align="center" justify="center" flexShrink={0}><Icon size={18} /></Flex>
                    <Box flex={1} minW={0}><Text fontSize="sm" fontWeight={650} noOfLines={1}>{attachment.name}</Text><Text fontSize="xs" color="#86909C">{attachment.size}</Text></Box>
                    <Button aria-label={`预览 ${attachment.name}`} variant="tertiary" minW="36px" px={0} leftIcon={<Eye size={16} />} onClick={() => setPreview(attachment)} />
                  </Flex>
                );
              })}
            </Grid>
          </Box>

          <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
            <HStack mb={4}><Clock3 size={18} color="#2563EB" /><Text fontWeight={750}>操作步骤记录</Text></HStack>
            <VStack align="stretch" spacing={0}>
              {submission.operationSteps.map((step, index) => (
                <Flex key={`${step.time}-${step.name}`} gap={3} position="relative" pb={index < submission.operationSteps.length - 1 ? 4 : 0}>
                  {index < submission.operationSteps.length - 1 ? <Box position="absolute" left="9px" top="22px" bottom="0" w="1px" bg="#E5E6EB" /> : null}
                  <Flex w="20px" h="20px" borderRadius="full" bg="#ECFDF5" color="#059669" align="center" justify="center" flexShrink={0} zIndex={1}><Check size={12} /></Flex>
                  <Box flex={1}><Flex justify="space-between" gap={3}><Text fontSize="sm" fontWeight={650}>{step.name}</Text><Text fontSize="xs" color="#86909C">{step.time}</Text></Flex><Text fontSize="xs" color="#646A73" mt={1}>{step.result}</Text></Box>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={5}>
            <HStack mb={4}><Database size={18} color="#7C3AED" /><Text fontWeight={750}>实训过程数据</Text></HStack>
            <Grid templateColumns={{ base: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }} gap={3}>
              {submission.processData.map((item) => <Box key={item.label} p={3} borderRadius="12px" bg={item.status === 'warning' ? '#FFFBEB' : '#F7F8FA'} border="1px solid" borderColor={item.status === 'warning' ? '#FDE68A' : 'transparent'}><Text fontSize="xs" color="#86909C">{item.label}</Text><Text mt={1} fontWeight={750} color={item.status === 'warning' ? '#D97706' : '#1D2129'}>{item.value}</Text></Box>)}
            </Grid>
            <Divider my={4} />
            <Text fontSize="xs" fontWeight={700} color="#86909C" mb={2}>学生自评</Text>
            <Text fontSize="sm" color="#4E5969" lineHeight="1.8">{submission.selfReview}</Text>
          </Box>
        </VStack>

        <Box ref={invalidRef} position={{ xl: 'sticky' }} top={{ xl: '16px' }} bg="white" border="1px solid #E5E6EB" borderRadius="18px" overflow="hidden" boxShadow="0 10px 28px rgba(31,35,41,.07)">
          <Flex p={5} align="center" justify="space-between" bg="#FAFAFB" borderBottom="1px solid #F0F1F3"><Box><Text fontWeight={750}>教师评分</Text><Text fontSize="xs" color="#86909C" mt={1}>逐项评分后自动计算能力达成度</Text></Box><Flex w="48px" h="48px" borderRadius="14px" bg="#FFF1F0" color="#C83E3E" align="center" justify="center"><ShieldCheck size={23} /></Flex></Flex>
          <VStack align="stretch" spacing={0}>
            {task.rubrics.map((rubric, index) => {
              const value = review.scores.find((item) => item.rubricId === rubric.id)?.score;
              const invalid = invalidIds.includes(rubric.id);
              return (
                <Box key={rubric.id} p={4} borderBottom="1px solid #F0F1F3" bg={invalid ? '#FFF7F7' : 'white'}>
                  <Flex gap={3} align="flex-start">
                    <Text w="20px" color="#86909C" fontSize="sm" fontWeight={700}>{index + 1}.</Text>
                    <Box flex={1}><Text fontSize="sm" fontWeight={700}>{rubric.name}</Text><Text fontSize="xs" color="#86909C" mt={1}>{rubric.description}</Text><Flex gap={1} flexWrap="wrap" mt={2}>{rubric.abilityWeights.map((mapping) => <Badge key={`${rubric.id}-${mapping.abilityCode}`} bg="#F5F3FF" color="#7C3AED" borderRadius="full">{mapping.abilityName} {mapping.weight}%</Badge>)}</Flex></Box>
                    <HStack spacing={1} flexShrink={0}><NumberInput w="70px" min={0} max={rubric.maxScore} value={value ?? ''} onChange={(_, number) => setRubricScore(rubric.id, Number.isFinite(number) ? number : null)}><NumberInputField h="38px" textAlign="center" borderColor={invalid ? '#DC2626' : '#D8DAE0'} /></NumberInput><Text fontSize="xs" color="#86909C">/ {rubric.maxScore}</Text></HStack>
                  </Flex>
                  {invalid ? <Text fontSize="xs" color="#DC2626" textAlign="right" mt={1}>请输入 0–{rubric.maxScore} 分</Text> : null}
                </Box>
              );
            })}
          </VStack>

          <Box p={5}>
            <Flex align="center" justify="space-between" mb={4}><Text fontWeight={700}>实时总分</Text><Text fontSize="3xl" fontWeight={800} color="#C83E3E">{totalScore}<Text as="span" ml={1} fontSize="sm" color="#86909C">/ {maxScore}</Text></Text></Flex>
            {abilityResults.length > 0 ? <VStack align="stretch" spacing={2} mb={5}>{abilityResults.map((ability) => <Box key={ability.abilityCode}><Flex justify="space-between" mb={1}><Text fontSize="xs" color="#646A73">{ability.abilityName}</Text><Text fontSize="xs" fontWeight={700}>{ability.score}%</Text></Flex><Progress value={ability.score} size="sm" colorScheme={ability.score >= 70 ? 'green' : 'orange'} borderRadius="full" /></Box>)}</VStack> : null}

            <Text fontSize="sm" fontWeight={700} mb={2}>综合评语</Text>
            <Textarea rows={4} value={review.comment} onChange={(event) => setReview((previous) => ({ ...previous, comment: event.target.value }))} placeholder="说明学生表现、证据和改进建议" />

            <Text fontSize="sm" fontWeight={700} mt={4} mb={2}>优点标签</Text>
            <Flex gap={2} flexWrap="wrap">{strengthOptions.map((option) => { const active = review.strengths.includes(option); return <Box key={option} as="button" px={2.5} py={1.5} borderRadius="full" fontSize="xs" border="1px solid" borderColor={active ? '#059669' : '#E5E6EB'} bg={active ? '#ECFDF5' : 'white'} color={active ? '#059669' : '#646A73'} onClick={() => setReview((previous) => ({ ...previous, strengths: toggleValue(option, previous.strengths) }))}>{option}</Box>; })}</Flex>

            <Text fontSize="sm" fontWeight={700} mt={4} mb={2}>待改进标签</Text>
            <Flex gap={2} flexWrap="wrap">{improvementOptions.map((option) => { const active = review.improvements.includes(option); return <Box key={option} as="button" px={2.5} py={1.5} borderRadius="full" fontSize="xs" border="1px solid" borderColor={active ? '#D97706' : '#E5E6EB'} bg={active ? '#FFFBEB' : 'white'} color={active ? '#D97706' : '#646A73'} onClick={() => setReview((previous) => ({ ...previous, improvements: toggleValue(option, previous.improvements) }))}>{option}</Box>; })}</Flex>

            <Button w="100%" mt={5} onClick={() => handleSave('reviewed')}>{submission.review.status === 'reviewed' ? '更新批改' : '提交批改'}</Button>
          </Box>
        </Box>
      </Grid>

      <Modal isOpen={Boolean(preview)} onClose={() => setPreview(null)} isCentered size="2xl" scrollBehavior="inside">
        <ModalOverlay bg="rgba(17,24,39,.58)" backdropFilter="blur(3px)" />
        <ModalContent mx={3} maxH="calc(100vh - 40px)" borderRadius="18px" overflow="hidden">
          <ModalHeader py={4} borderBottom="1px solid #F0F1F3"><Text fontSize="md" fontWeight={750}>{preview?.name}</Text><Text fontSize="xs" color="#86909C" fontWeight={400} mt={1}>{preview?.size} · Mock 在线预览</Text></ModalHeader>
          <ModalCloseButton top={4} />
          <ModalBody p={5} bg="#F7F8FA">
            <Flex minH="280px" border="1px solid #E5E6EB" borderRadius="14px" bg="white" align="center" justify="center" direction="column" p={8} textAlign="center">
              {preview ? (() => { const Icon = attachmentIcon[preview.type]; return <Icon size={44} color="#C83E3E" />; })() : null}
              <Text fontWeight={700} mt={4}>{preview?.name}</Text>
              <Text maxW="480px" fontSize="sm" color="#646A73" lineHeight="1.8" mt={2}>{preview?.preview}</Text>
              {preview?.type === 'video' ? <Button mt={5} leftIcon={<Play size={15} />}>播放演示片段</Button> : null}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

