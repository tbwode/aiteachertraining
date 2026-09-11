'use client';

/**
 * AI视频课 工作台 - 字幕设置内容（共享组件）
 * 用于画布左上角「字幕设置」弹层与点击视频画面字幕弹出的设置层
 * 支持：字号调整 / 颜色调整 / 关闭字幕（宽度在画布上拖拽字幕条边缘调整）
 */
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { CaptionsOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SubtitleConfig } from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  SUBTITLE_COLOR_OPTIONS,
  SUBTITLE_FONT_SIZE_KEYS
} from '../../constants';

type SubtitleSettingsProps = {
  subtitle: SubtitleConfig;
  onPatch: (patch: Partial<SubtitleConfig>) => void;
  /** 关闭字幕后收起弹层（可选） */
  onClose?: () => void;
};

export function SubtitleSettings({ subtitle, onPatch, onClose }: SubtitleSettingsProps) {
  const { t } = useTranslation('teacher');

  return (
    <VStack align="stretch" spacing={4}>
      {/* 字号 */}
      <Flex align="center" justify="space-between">
        <Text fontSize="12px" color="gray.500">
          {t('aiVideo.studio.subtitle.fontSize')}
        </Text>
        <Flex gap={1} bg="gray.100" borderRadius="8px" p={0.5}>
          {SUBTITLE_FONT_SIZE_KEYS.map((size) => (
            <Flex
              key={size}
              as="button"
              type="button"
              px={2}
              py={0.5}
              borderRadius="6px"
              fontSize="11px"
              bg={subtitle.fontSize === size ? 'white' : 'transparent'}
              color={subtitle.fontSize === size ? AI_VIDEO_PRIMARY : 'gray.500'}
              fontWeight={subtitle.fontSize === size ? 600 : 400}
              boxShadow={subtitle.fontSize === size ? 'sm' : 'none'}
              onClick={() => onPatch({ fontSize: size })}
            >
              {t(`aiVideo.studio.subtitle.size.${size}`)}
            </Flex>
          ))}
        </Flex>
      </Flex>
      {/* 颜色 */}
      <Flex align="center" justify="space-between">
        <Text fontSize="12px" color="gray.500">
          {t('aiVideo.studio.subtitle.color')}
        </Text>
        <Flex gap={2}>
          {SUBTITLE_COLOR_OPTIONS.map((color) => (
            <Box
              key={color}
              as="button"
              type="button"
              w="18px"
              h="18px"
              borderRadius="full"
              bg={color}
              border="2px solid"
              borderColor={subtitle.color === color ? AI_VIDEO_PRIMARY : '#E7E7E7'}
              onClick={() => onPatch({ color })}
            />
          ))}
        </Flex>
      </Flex>
      {/* 关闭字幕 */}
      <Flex
        as="button"
        type="button"
        align="center"
        justify="center"
        gap={1}
        py={1.5}
        borderRadius="8px"
        bg="gray.50"
        color="gray.500"
        fontSize="12px"
        _hover={{ color: 'red.500', bg: 'red.50' }}
        onClick={() => {
          onPatch({ visible: false });
          onClose?.();
        }}
      >
        <CaptionsOff size={13} />
        {t('aiVideo.studio.canvas.subtitleOff')}
      </Flex>
    </VStack>
  );
}
