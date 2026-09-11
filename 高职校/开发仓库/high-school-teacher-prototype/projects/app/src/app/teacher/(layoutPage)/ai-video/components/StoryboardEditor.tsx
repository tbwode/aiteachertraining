'use client';

/**
 * AI视频课 项目工作台 - 分镜脚本编辑器（模块5）
 * 分镜卡片：分镜标题（只读）、时长、画面设计、分镜讲稿、制作细节（无画面，画面在生成视频阶段产出）
 * 分镜脚本逐步生成：创建/全部重生成后逐条追加，生成中禁止提交
 */
import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  Progress,
  Skeleton,
  Spinner,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  ArrowDown,
  ArrowUp,
  Palette,
  Plus,
  RefreshCw,
  ScrollText,
  Trash2,
  Wrench
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject, StoryboardShot } from '@/teacher/types/aiVideo';
import {
  buildGaussStoryboard,
  findSensitiveWord,
  resolveDuration,
  shotImageUrl,
  submitGenerateTask,
  updateStoryboard
} from '@/teacher/api/aiVideo';
import { useStoryboardGenerator } from '../hooks/useStoryboardGenerator';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_HOVER, CARD_SHADOW } from '../constants';
import { ConfirmModal } from './ConfirmModal';

type StoryboardEditorProps = {
  project: AiVideoProject;
  onProjectChange: (project: AiVideoProject) => void;
};

/** 字段标签（带图标） */
function FieldLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Flex align="center" gap={1} mb={1}>
      <Box color="gray.400">{icon}</Box>
      <Text fontSize="12px" color="gray.500">
        {text}
      </Text>
    </Flex>
  );
}

export function StoryboardEditor({ project, onProjectChange }: StoryboardEditorProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const [isRegenerateAllOpen, setIsRegenerateAllOpen] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 逐步生成分镜：pending 时逐条追加 */
  const isGenerating = useStoryboardGenerator(project, onProjectChange);
  const storyboard = project.storyboard;
  /** 计划生成的分镜总数（由时长预设推导） */
  const totalShots = useMemo(
    () =>
      project.demoVideo === 'gauss'
        ? buildGaussStoryboard().length
        : resolveDuration(project.params.duration, project.prompt).shots,
    [project.demoVideo, project.params.duration, project.prompt]
  );
  const generatePercent = Math.min(100, Math.round((storyboard.length / totalShots) * 100));

  const totalDuration = useMemo(
    () => storyboard.reduce((sum, shot) => sum + (Number(shot.duration) || 0), 0),
    [storyboard]
  );

  /** 本地变更 + 即写存储（自动保存） */
  const applyStoryboard = (next: StoryboardShot[]) => {
    void updateStoryboard(project.id, next).then((updated) => {
      if (updated) onProjectChange(updated);
    });
  };

  const updateShot = (shotId: string, patch: Partial<StoryboardShot>) => {
    applyStoryboard(
      storyboard.map((shot) => (shot.id === shotId ? { ...shot, ...patch } : shot))
    );
  };

  const moveShot = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= storyboard.length) return;
    const next = [...storyboard];
    [next[index], next[target]] = [next[target], next[index]];
    applyStoryboard(next);
  };

  const removeShot = (shotId: string) => {
    applyStoryboard(storyboard.filter((shot) => shot.id !== shotId));
    toast({ title: t('aiVideo.storyboard.shotDeleted'), status: 'success', duration: 1500 });
  };

  const addShot = () => {
    applyStoryboard([
      ...storyboard,
      {
        id: `shot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        title: `分镜 ${storyboard.length + 1}`,
        sceneDescription: '',
        narration: '',
        productionNotes: '',
        duration: 8,
        imageUrl: shotImageUrl(storyboard.length)
      }
    ]);
    toast({ title: t('aiVideo.storyboard.shotAdded'), status: 'success', duration: 1500 });
  };

  const handleRegenerateAll = async () => {
    setIsRegeneratingAll(true);
    try {
      const { regenerateStoryboard } = await import('@/teacher/api/aiVideo');
      const updated = await regenerateStoryboard(project.id);
      if (updated) onProjectChange(updated);
    } finally {
      setIsRegeneratingAll(false);
      setIsRegenerateAllOpen(false);
    }
  };

  const handleSubmit = async () => {
    // 生成前内容安全校验（分镜内容可能已被手动改违规）
    const fullText = storyboard
      .flatMap((shot) => [shot.sceneDescription, shot.narration, shot.productionNotes])
      .join('\n');
    if (findSensitiveWord(fullText)) {
      toast({
        title: t('aiVideo.storyboard.moderationMessage'),
        status: 'error',
        duration: 3000
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await submitGenerateTask(project.id);
      if (updated) onProjectChange(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack align="stretch" spacing={5}>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="xl" fontWeight={700} color="gray.800">
            {t('aiVideo.storyboard.title')}
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {isGenerating
              ? t('aiVideo.storyboard.generatingTip')
              : t('aiVideo.storyboard.subtitle')}
          </Text>
        </Box>
        <Text fontSize="sm" color="gray.500">
          {t('aiVideo.storyboard.totalDuration', { value: totalDuration })}
        </Text>
      </Flex>

      {/* 分镜生成进度 */}
      {isGenerating && (
        <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={5}>
          <Flex align="center" gap={3} mb={3}>
            <Spinner size="sm" color={AI_VIDEO_PRIMARY} />
            <Text fontSize="sm" fontWeight={600} color="gray.700">
              {t('aiVideo.storyboard.generatingTip')}
            </Text>
            <Text fontSize="sm" color={AI_VIDEO_PRIMARY} fontWeight={600} ml="auto" fontFamily="mono">
              {t('aiVideo.storyboard.generatingProgress', {
                current: storyboard.length,
                total: totalShots
              })}
            </Text>
          </Flex>
          <Progress
            value={generatePercent}
            size="sm"
            borderRadius="full"
            colorScheme="red"
            bg="gray.100"
            hasStripe
            isAnimated
          />
        </Box>
      )}

      {/* 分镜卡片（无画面：标题只读 + 时长 + 画面设计/讲稿/制作细节） */}
      {storyboard.map((shot, index) => (
        <Box key={shot.id} bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={5}>
          {/* 头部：序号 + 标题（只读）+ 时长 + 排序/删除 */}
          <Flex align="center" gap={3} mb={4} flexWrap="wrap">
            <Flex
              px={2}
              h="22px"
              borderRadius="6px"
              bg={AI_VIDEO_PRIMARY}
              color="white"
              fontSize="12px"
              fontWeight={600}
              align="center"
              flexShrink={0}
            >
              {index + 1}
            </Flex>
            <Text fontSize="15px" fontWeight={600} color="gray.800">
              {shot.title}
            </Text>
            <Flex ml="auto" align="center" gap={2}>
              <Flex align="center" gap={1}>
                <Text fontSize="12px" color="gray.400">
                  {t('aiVideo.storyboard.durationLabel')}
                </Text>
                <NumberInput
                  value={shot.duration}
                  min={1}
                  max={120}
                  size="sm"
                  w="76px"
                  onChange={(_, value) =>
                    updateShot(shot.id, { duration: Number.isNaN(value) ? 1 : value })
                  }
                >
                  <NumberInputField
                    borderRadius="8px"
                    borderColor="#E7E7E7"
                    fontSize="13px"
                    _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
                  />
                </NumberInput>
              </Flex>
              <IconButton
                aria-label={t('aiVideo.storyboard.moveUp')}
                icon={<ArrowUp size={13} />}
                size="xs"
                variant="ghost"
                isDisabled={index === 0 || isGenerating}
                onClick={() => moveShot(index, -1)}
              />
              <IconButton
                aria-label={t('aiVideo.storyboard.moveDown')}
                icon={<ArrowDown size={13} />}
                size="xs"
                variant="ghost"
                isDisabled={index === storyboard.length - 1 || isGenerating}
                onClick={() => moveShot(index, 1)}
              />
              <IconButton
                aria-label={t('aiVideo.storyboard.deleteShot')}
                icon={<Trash2 size={13} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                isDisabled={isGenerating}
                onClick={() => removeShot(shot.id)}
              />
            </Flex>
          </Flex>

          {/* 字段：画面设计 / 分镜讲稿 / 制作细节 */}
          <VStack align="stretch" spacing={3}>
            <Box>
              <FieldLabel
                icon={<Palette size={12} />}
                text={t('aiVideo.storyboard.sceneLabel')}
              />
              <Textarea
                value={shot.sceneDescription}
                onChange={(event) =>
                  updateShot(shot.id, { sceneDescription: event.target.value })
                }
                rows={2}
                fontSize="13px"
                borderRadius="10px"
                borderColor="#E7E7E7"
                isDisabled={isGenerating}
                _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              />
            </Box>
            <Box>
              <FieldLabel
                icon={<ScrollText size={12} />}
                text={t('aiVideo.storyboard.narrationLabel')}
              />
              <Textarea
                value={shot.narration}
                onChange={(event) => updateShot(shot.id, { narration: event.target.value })}
                rows={2}
                fontSize="13px"
                borderRadius="10px"
                borderColor="#E7E7E7"
                isDisabled={isGenerating}
                _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              />
            </Box>
            <Box>
              <FieldLabel
                icon={<Wrench size={12} />}
                text={t('aiVideo.storyboard.notesLabel')}
              />
              <Textarea
                value={shot.productionNotes}
                onChange={(event) =>
                  updateShot(shot.id, { productionNotes: event.target.value })
                }
                rows={1}
                fontSize="13px"
                borderRadius="10px"
                borderColor="#E7E7E7"
                isDisabled={isGenerating}
                _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              />
            </Box>
          </VStack>
        </Box>
      ))}

      {/* 逐步生成中的占位卡片 */}
      {isGenerating && (
        <Flex
          bg="white"
          borderRadius="16px"
          boxShadow={CARD_SHADOW}
          p={5}
          align="center"
          gap={3}
        >
          <Spinner size="sm" color={AI_VIDEO_PRIMARY} />
          <VStack align="stretch" spacing={2} flex="1">
            <Text fontSize="13px" color="gray.500">
              {t('aiVideo.storyboard.generatingShot', { index: storyboard.length + 1 })}
            </Text>
            <Skeleton h="10px" borderRadius="4px" />
            <Skeleton h="10px" w="70%" borderRadius="4px" />
          </VStack>
        </Flex>
      )}

      {/* 空态（非生成中） */}
      {storyboard.length === 0 && !isGenerating && (
        <Flex
          bg="white"
          borderRadius="16px"
          boxShadow={CARD_SHADOW}
          minH="180px"
          align="center"
          justify="center"
        >
          <Text color="gray.400" fontSize="sm">
            {t('aiVideo.storyboard.empty')}
          </Text>
        </Flex>
      )}

      {/* 底部操作栏 */}
      <Flex
        bg="white"
        borderRadius="16px"
        boxShadow={CARD_SHADOW}
        p={4}
        justify="space-between"
        align="center"
        flexWrap="wrap"
        gap={3}
        position="sticky"
        bottom={4}
      >
        <Flex gap={2}>
          <Button
            size="sm"
            variant="outline"
            bg="white"
            color="gray.700"
            leftIcon={<Plus size={13} />}
            isDisabled={isGenerating}
            onClick={addShot}
          >
            {t('aiVideo.storyboard.addShot')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            bg="white"
            color="gray.700"
            leftIcon={isRegeneratingAll ? <Spinner size="xs" /> : <RefreshCw size={13} />}
            isDisabled={isRegeneratingAll || isGenerating || storyboard.length === 0}
            onClick={() => setIsRegenerateAllOpen(true)}
          >
            {t('aiVideo.storyboard.regenerateAll')}
          </Button>
        </Flex>
        <Button
          variant="primary"
          bg={AI_VIDEO_PRIMARY}
          borderColor={AI_VIDEO_PRIMARY}
          _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
          isDisabled={storyboard.length === 0 || isSubmitting || isGenerating}
          onClick={() => void handleSubmit()}
          minW="140px"
        >
          {isSubmitting ? <Spinner size="sm" /> : t('aiVideo.storyboard.generate')}
        </Button>
      </Flex>

      <ConfirmModal
        isOpen={isRegenerateAllOpen}
        onClose={() => setIsRegenerateAllOpen(false)}
        onConfirm={() => void handleRegenerateAll()}
        title={t('aiVideo.storyboard.regenerateAllTitle')}
        message={t('aiVideo.storyboard.regenerateAllMessage')}
      />
    </VStack>
  );
}
