'use client';

/**
 * AI视频课 工作台 - 导出弹窗
 */
import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: AiVideoProject;
};

export function ExportModal({ isOpen, onClose, project }: ExportModalProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const canExport = project.status === 'success' && Boolean(project.videoUrl);

  const handleDownload = () => {
    if (!canExport || !project.videoUrl) {
      toast({ title: t('aiVideo.preview.notExportable'), status: 'warning', duration: 2500 });
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = project.videoUrl;
    anchor.download = `${project.title || 'ai-video'}.mp4`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast({ title: t('aiVideo.preview.downloadStarted'), status: 'success', duration: 2000 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent borderRadius="xl">
        <ModalHeader fontSize="md">{t('aiVideo.studio.exportModal.title')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="12px" color="gray.500">
              {t('aiVideo.preview.resolution')}
            </Text>
            {(['720p', '1080p', '4k'] as const).map((level) => {
              const isVip = level !== '720p';
              return (
                <Flex
                  key={level}
                  align="center"
                  justify="space-between"
                  border="1px solid"
                  borderColor={level === '720p' ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                  bg={level === '720p' ? AI_VIDEO_PRIMARY_BG : 'gray.50'}
                  borderRadius="10px"
                  px={3}
                  py={2}
                  opacity={isVip ? 0.6 : 1}
                >
                  <Text fontSize="13px" color="gray.700">
                    {t(`aiVideo.preview.resolutionOption.${level}`)}
                  </Text>
                  <Tag
                    size="sm"
                    borderRadius="full"
                    bg={isVip ? 'orange.100' : 'green.100'}
                    color={isVip ? 'orange.600' : 'green.600'}
                  >
                    {isVip ? t('aiVideo.preview.vipOnly') : t('aiVideo.preview.free')}
                  </Tag>
                </Flex>
              );
            })}
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.preview.watermarkTip')}
            </Text>
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.preview.format')}
            </Text>
            <Button
              mt={1}
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              leftIcon={<Download size={14} />}
              isDisabled={!canExport}
              onClick={handleDownload}
            >
              {t('aiVideo.preview.download')}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
