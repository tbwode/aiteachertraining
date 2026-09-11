'use client';

/**
 * AI视频课 首页 - 成品预览弹框
 * 列表查看成品：弹框内播放成片视频，支持下载到本地
 */
import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text
} from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_HOVER } from '../constants';

export function ProjectPreviewModal({
  project,
  isOpen,
  onClose
}: {
  project: AiVideoProject | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('teacher');
  if (!project) return null;

  const handleDownload = () => {
    if (!project.videoUrl) return;
    const anchor = document.createElement('a');
    anchor.href = project.videoUrl;
    anchor.download = `${project.title || 'ai-video'}.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="#0F1424" borderRadius="16px" overflow="hidden">
        <ModalHeader px={5} py={3}>
          <Flex align="center" gap={3}>
            <Text fontSize="15px" fontWeight={600} color="white" noOfLines={1} flex="1">
              {project.title}
            </Text>
            <Button
              size="sm"
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
              leftIcon={<Download size={14} />}
              isDisabled={!project.videoUrl}
              onClick={handleDownload}
              flexShrink={0}
            >
              {t('aiVideo.preview.download')}
            </Button>
          </Flex>
        </ModalHeader>
        <ModalBody px={5} pb={5} pt={0}>
          <Box
            as="video"
            src={project.videoUrl ?? undefined}
            controls
            autoPlay
            w="100%"
            borderRadius="12px"
            bg="black"
            sx={{
              aspectRatio: project.params.ratio === '9:16' ? '9 / 16' : '16 / 9',
              maxH: '62vh'
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
