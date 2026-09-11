'use client';

/**
 * PPT/文档转视频 预览编辑 - 生成视频合成设置弹框
 * 视频名称；视频参数：分辨率（默认1080/720/480）、画面质量（默认中/高/低）、帧率（25fps/30fps）
 * 实时显示生成预估：视频大小（按时长×码率）、视频时长、预计耗时
 */
import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { Clock, FileVideo, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject, PptVideoConfig } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG, AI_VIDEO_PRIMARY_HOVER } from '../../../constants';

export type RenderSettings = {
  title: string;
  resolution: NonNullable<PptVideoConfig['resolution']>;
  quality: NonNullable<PptVideoConfig['quality']>;
  frameRate: NonNullable<PptVideoConfig['frameRate']>;
};

const RESOLUTION_OPTIONS: RenderSettings['resolution'][] = ['1080p', '720p', '480p'];
const QUALITY_OPTIONS: RenderSettings['quality'][] = ['high', 'medium', 'low'];
const FRAME_RATE_OPTIONS: RenderSettings['frameRate'][] = [25, 30];

/** 各分辨率 × 画面质量码率（Mbps，用于预估视频大小） */
const BITRATE_MAP: Record<
  RenderSettings['resolution'],
  Record<RenderSettings['quality'], number>
> = {
  '1080p': { high: 8, medium: 5, low: 2.5 },
  '720p': { high: 5, medium: 3, low: 1.5 },
  '480p': { high: 2.5, medium: 1.5, low: 0.8 }
};

function Chip({
  selected,
  onClick,
  children
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Flex
      as="button"
      type="button"
      align="center"
      justify="center"
      px={3.5}
      py={1.5}
      borderRadius="10px"
      border="1px solid"
      borderColor={selected ? AI_VIDEO_PRIMARY : '#E7E7E7'}
      bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
      color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
      fontSize="13px"
      fontWeight={selected ? 600 : 400}
      transition="all 0.15s"
      onClick={onClick}
    >
      {children}
    </Flex>
  );
}

export function RenderSettingsModal({
  project,
  totalDuration,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm
}: {
  project: AiVideoProject;
  /** 视频总时长（秒） */
  totalDuration: number;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (settings: RenderSettings) => void;
}) {
  const { t } = useTranslation('teacher');
  const [title, setTitle] = useState(project.title);
  const [resolution, setResolution] = useState<RenderSettings['resolution']>(
    project.pptConfig?.resolution ?? '1080p'
  );
  const [quality, setQuality] = useState<RenderSettings['quality']>(
    project.pptConfig?.quality ?? 'medium'
  );
  const [frameRate, setFrameRate] = useState<RenderSettings['frameRate']>(
    project.pptConfig?.frameRate ?? 25
  );

  /** 生成预估：大小（码率×时长/8）、时长、耗时（约 0.8× 时长 + 20s 基础） */
  const estimate = useMemo(() => {
    const sizeMB = Math.max(1, Math.round((BITRATE_MAP[resolution][quality] * totalDuration) / 8));
    const costSeconds = Math.max(15, Math.round(totalDuration * 0.8 + 20));
    return { sizeMB, costSeconds };
  }, [resolution, quality, totalDuration]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="16px" mx={4} maxW="480px">
        <ModalHeader fontSize="16px" pb={2}>
          {t('aiVideo.ppt.editor.render.title')}
        </ModalHeader>
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* 视频名称 */}
            <Box>
              <Text fontSize="13px" color="gray.500" mb={1.5}>
                {t('aiVideo.ppt.editor.render.videoName')}
              </Text>
              <Input
                value={title}
                maxLength={60}
                size="sm"
                borderRadius="10px"
                borderColor="#E7E7E7"
                fontSize="13px"
                _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Box>

            {/* 分辨率 */}
            <Box>
              <Text fontSize="13px" color="gray.500" mb={1.5}>
                {t('aiVideo.ppt.editor.render.resolution')}
              </Text>
              <Flex gap={2}>
                {RESOLUTION_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    selected={resolution === option}
                    onClick={() => setResolution(option)}
                  >
                    {t(`aiVideo.ppt.editor.render.resOption.${option}`)}
                  </Chip>
                ))}
              </Flex>
            </Box>

            {/* 画面质量 */}
            <Box>
              <Text fontSize="13px" color="gray.500" mb={1.5}>
                {t('aiVideo.ppt.editor.render.quality')}
              </Text>
              <Flex gap={2}>
                {QUALITY_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    selected={quality === option}
                    onClick={() => setQuality(option)}
                  >
                    {t(`aiVideo.ppt.editor.render.qualityOption.${option}`)}
                  </Chip>
                ))}
              </Flex>
            </Box>

            {/* 帧率 */}
            <Box>
              <Text fontSize="13px" color="gray.500" mb={1.5}>
                {t('aiVideo.ppt.editor.render.frameRate')}
              </Text>
              <Flex gap={2}>
                {FRAME_RATE_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    selected={frameRate === option}
                    onClick={() => setFrameRate(option)}
                  >
                    {option}fps
                  </Chip>
                ))}
              </Flex>
            </Box>

            {/* 生成预估 */}
            <Flex bg="gray.50" borderRadius="12px" px={4} py={3} gap={4}>
              <Flex align="center" gap={1.5} flex="1">
                <Box color={AI_VIDEO_PRIMARY} flexShrink={0}>
                  <FileVideo size={14} />
                </Box>
                <Box minW={0}>
                  <Text fontSize="11px" color="gray.400">
                    {t('aiVideo.ppt.editor.render.estSize')}
                  </Text>
                  <Text fontSize="13px" fontWeight={600} color="gray.700">
                    ~{estimate.sizeMB}MB
                  </Text>
                </Box>
              </Flex>
              <Flex align="center" gap={1.5} flex="1">
                <Box color={AI_VIDEO_PRIMARY} flexShrink={0}>
                  <Timer size={14} />
                </Box>
                <Box minW={0}>
                  <Text fontSize="11px" color="gray.400">
                    {t('aiVideo.ppt.editor.render.estDuration')}
                  </Text>
                  <Text fontSize="13px" fontWeight={600} color="gray.700">
                    {totalDuration}s
                  </Text>
                </Box>
              </Flex>
              <Flex align="center" gap={1.5} flex="1">
                <Box color={AI_VIDEO_PRIMARY} flexShrink={0}>
                  <Clock size={14} />
                </Box>
                <Box minW={0}>
                  <Text fontSize="11px" color="gray.400">
                    {t('aiVideo.ppt.editor.render.estCost')}
                  </Text>
                  <Text fontSize="13px" fontWeight={600} color="gray.700">
                    ~{estimate.costSeconds}s
                  </Text>
                </Box>
              </Flex>
            </Flex>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3} pt={2}>
          <Button variant="outline" bg="white" color="gray.600" onClick={onClose}>
            {t('aiVideo.common.cancel')}
          </Button>
          <Button
            variant="primary"
            bg={AI_VIDEO_PRIMARY}
            borderColor={AI_VIDEO_PRIMARY}
            _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
            isDisabled={isSubmitting || !title.trim()}
            onClick={() =>
              onConfirm({
                title: title.trim(),
                resolution,
                quality,
                frameRate
              })
            }
            minW="120px"
          >
            {isSubmitting ? t('aiVideo.ppt.creating') : t('aiVideo.ppt.editor.render.confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
