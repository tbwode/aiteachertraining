'use client';

/**
 * AI视频课 工作台 - 顶部操作栏（返回 / 标题 / 保存 / 导出）
 */
import { Flex, IconButton, Text, useToast } from '@chakra-ui/react';
import { ChevronLeft, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_HOVER } from '../../constants';

type StudioTopBarProps = {
  title: string;
  onBack: () => void;
  onExport: () => void;
};

export function StudioTopBar({ title, onBack, onExport }: StudioTopBarProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();

  const handleSave = () => {
    // 工作台所有修改即时保存，这里仅作状态反馈
    toast({ title: t('aiVideo.studio.topbar.saved'), status: 'success', duration: 1500 });
  };

  return (
    <Flex
      h="52px"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.100"
      px={4}
      align="center"
      gap={3}
      flexShrink={0}
    >
      <IconButton
        aria-label={t('aiVideo.workspace.back')}
        icon={<ChevronLeft size={18} />}
        variant="ghost"
        size="sm"
        onClick={onBack}
      />
      <Text fontSize="14px" fontWeight={600} color="gray.800" noOfLines={1} maxW="40%">
        {title}
      </Text>
      <Flex ml="auto" gap={2} align="center">
        <Button
          size="sm"
          variant="outline"
          bg="white"
          color="gray.600"
          fontSize="13px"
          onClick={handleSave}
        >
          {t('aiVideo.studio.topbar.save')}
        </Button>
        <Button
          size="sm"
          variant="primary"
          bg={AI_VIDEO_PRIMARY}
          borderColor={AI_VIDEO_PRIMARY}
          _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
          leftIcon={<Download size={14} />}
          fontSize="13px"
          onClick={onExport}
        >
          {t('aiVideo.studio.topbar.export')}
        </Button>
      </Flex>
    </Flex>
  );
}
