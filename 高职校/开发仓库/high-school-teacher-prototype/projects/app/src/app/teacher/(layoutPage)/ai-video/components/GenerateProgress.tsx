'use client';

/**
 * AI视频课 项目工作台 - 生成任务进度（模块6）
 * 以及失败兜底（超时/安全拦截/繁忙）
 */
import { Box, Flex, Progress, Text, VStack } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { backToDraft, submitGenerateTask } from '@/teacher/api/aiVideo';
import { AI_VIDEO_PRIMARY, CARD_SHADOW, TASK_STAGES } from '../constants';

type GenerateProgressProps = {
  project: AiVideoProject;
  onProjectChange: (project: AiVideoProject) => void;
};

export function GenerateProgress({ project, onProjectChange }: GenerateProgressProps) {
  const { t } = useTranslation('teacher');

  if (project.status === 'failed') {
    return (
      <Flex bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={10} justify="center">
        <VStack spacing={5} maxW="420px" textAlign="center">
          <Flex
            w="64px"
            h="64px"
            borderRadius="full"
            bg="red.50"
            align="center"
            justify="center"
            fontSize="28px"
          >
            ⚠️
          </Flex>
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            {t('aiVideo.task.failedTitle')}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {t(`aiVideo.task.failReason.${project.failReason ?? 'timeout'}`)}
          </Text>
          <Flex gap={3} w="100%">
            <Button
              flex="1"
              variant="outline"
              bg="white"
              color="gray.700"
              onClick={() =>
                void backToDraft(project.id).then((next) => next && onProjectChange(next))
              }
            >
              {t('aiVideo.task.backToEdit')}
            </Button>
            <Button
              flex="1"
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              onClick={() =>
                void submitGenerateTask(project.id).then((next) => next && onProjectChange(next))
              }
            >
              {t('aiVideo.task.retry')}
            </Button>
          </Flex>
        </VStack>
      </Flex>
    );
  }

  const isQueued = project.status === 'queued';
  const currentStageIndex = project.stage ? TASK_STAGES.indexOf(project.stage) : -1;

  return (
    <Flex bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={10} justify="center">
      <VStack spacing={8} w="100%" maxW="640px">
        <VStack spacing={2} textAlign="center">
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            {isQueued ? t('aiVideo.task.queuedTitle') : t('aiVideo.task.generatingTitle')}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isQueued
              ? t('aiVideo.task.queuedDesc', { count: project.queuePosition })
              : t('aiVideo.task.generatingDesc')}
          </Text>
        </VStack>

        <Box w="100%">
          <Flex justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">
              {t('aiVideo.task.progress')}
            </Text>
            <Text fontSize="sm" fontWeight={600} color={AI_VIDEO_PRIMARY}>
              {project.progress}%
            </Text>
          </Flex>
          <Progress
            value={project.progress}
            size="sm"
            borderRadius="full"
            colorScheme="red"
            bg="gray.100"
            hasStripe
            isAnimated
          />
        </Box>

        {/* 五阶段步骤条 */}
        <Flex w="100%" justify="space-between">
          {TASK_STAGES.map((stage, index) => {
            const isDone = !isQueued && currentStageIndex > index;
            const isCurrent = !isQueued && currentStageIndex === index;
            return (
              <VStack key={stage} spacing={2} flex="1">
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  fontSize="13px"
                  fontWeight={600}
                  bg={isDone || isCurrent ? AI_VIDEO_PRIMARY : 'gray.100'}
                  color={isDone || isCurrent ? 'white' : 'gray.400'}
                  transition="all 0.3s"
                >
                  {isDone ? <Check size={13} /> : index + 1}
                </Flex>
                <Text
                  fontSize="12px"
                  color={isCurrent ? AI_VIDEO_PRIMARY : isDone ? 'gray.700' : 'gray.400'}
                  fontWeight={isCurrent ? 600 : 400}
                  textAlign="center"
                >
                  {t(
                    project.mode === 'ppt'
                      ? `aiVideo.task.stage.ppt.${stage}`
                      : `aiVideo.task.stage.${stage}`
                  )}
                </Text>
              </VStack>
            );
          })}
        </Flex>
      </VStack>
    </Flex>
  );
}
