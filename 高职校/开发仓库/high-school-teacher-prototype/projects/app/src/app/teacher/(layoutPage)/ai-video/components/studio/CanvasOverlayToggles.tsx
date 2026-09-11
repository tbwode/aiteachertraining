'use client';

/**
 * AI视频课 工作台 - 画布左上角开关组
 * 「字幕」开关：控制字幕是否展示在视频画面；选中后弹出字号/颜色调整与关闭字幕
 * 「AI 标识」开关：控制「AI 生成」标识是否展示在视频画面
 */
import { Flex, Popover, PopoverBody, PopoverContent, PopoverTrigger, Tag } from '@chakra-ui/react';
import { Captions, CaptionsOff, ChevronDown, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';
import { SubtitleSettings } from './SubtitleSettings';

type CanvasOverlayTogglesProps = {
  project: AiVideoProject;
  onConfigChange: (
    patch: Partial<Pick<AiVideoProject, 'subtitle' | 'aiBadge'>>
  ) => void;
};

export function CanvasOverlayToggles({ project, onConfigChange }: CanvasOverlayTogglesProps) {
  const { t } = useTranslation('teacher');
  const subtitle = project.subtitle!;
  const subtitleOn = subtitle.visible !== false;
  const aiBadgeOn = project.aiBadge !== false;

  const patchSubtitle = (patch: Partial<typeof subtitle>) =>
    onConfigChange({ subtitle: { ...subtitle, ...patch } });

  const chipStyle = (active: boolean) => ({
    bg: active ? AI_VIDEO_PRIMARY_BG : 'white',
    color: active ? AI_VIDEO_PRIMARY : 'gray.500',
    borderColor: active ? AI_VIDEO_PRIMARY : '#E7E7E7'
  });

  return (
    <Flex position="absolute" top={3} left={3} gap={2} zIndex={3}>
      {/* 字幕开关 + 设置弹层 */}
      <Popover placement="bottom-start" gutter={6}>
        {({ onClose }) => (
          <>
            <Flex
              borderRadius="full"
              border="1px solid"
              borderColor={chipStyle(subtitleOn).borderColor}
              bg={chipStyle(subtitleOn).bg}
              overflow="hidden"
              align="center"
              boxShadow="sm"
            >
              <Flex
                as="button"
                type="button"
                align="center"
                gap={1}
                px={3}
                py={1.5}
                fontSize="12px"
                fontWeight={subtitleOn ? 600 : 400}
                color={chipStyle(subtitleOn).color}
                onClick={() => patchSubtitle({ visible: !subtitleOn })}
              >
                {subtitleOn ? <Captions size={13} /> : <CaptionsOff size={13} />}
                {t('aiVideo.studio.canvas.subtitle')}
              </Flex>
              {subtitleOn && (
                <PopoverTrigger>
                  <Flex
                    as="button"
                    type="button"
                    px={1.5}
                    py={1.5}
                    color={AI_VIDEO_PRIMARY}
                    borderLeft="1px solid"
                    borderColor="#F3D8D6"
                    aria-label={t('aiVideo.studio.canvas.subtitleSettings')}
                  >
                    <ChevronDown size={12} />
                  </Flex>
                </PopoverTrigger>
              )}
            </Flex>
            <PopoverContent w="220px" borderRadius="12px" boxShadow="lg">
              <PopoverBody p={4}>
                <SubtitleSettings subtitle={subtitle} onPatch={patchSubtitle} onClose={onClose} />
              </PopoverBody>
            </PopoverContent>
          </>
        )}
      </Popover>

      {/* AI 标识开关 */}
      <Tag
        as="button"
        type="button"
        borderRadius="full"
        border="1px solid"
        borderColor={chipStyle(aiBadgeOn).borderColor}
        bg={chipStyle(aiBadgeOn).bg}
        color={chipStyle(aiBadgeOn).color}
        fontWeight={aiBadgeOn ? 600 : 400}
        px={3}
        py={1.5}
        boxShadow="sm"
        onClick={() => onConfigChange({ aiBadge: !aiBadgeOn })}
      >
        <Flex align="center" gap={1}>
          <Sparkles size={12} />
          {t('aiVideo.studio.canvas.aiMark')}
        </Flex>
      </Tag>
    </Flex>
  );
}
