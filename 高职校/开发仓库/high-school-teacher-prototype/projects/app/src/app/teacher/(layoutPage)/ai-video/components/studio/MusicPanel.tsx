'use client';

/**
 * AI视频课 工作台 - 音乐面板
 * 背景音乐选择（会员置灰）、BGM 音量
 */
import { Box, Flex, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Tag, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { BGM_OPTIONS, AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';

type MusicPanelProps = {
  project: AiVideoProject;
  onConfigChange: (patch: Partial<Pick<AiVideoProject, 'audio'>>) => void;
};

export function MusicPanel({ project, onConfigChange }: MusicPanelProps) {
  const { t } = useTranslation('teacher');
  const audio = project.audio!;

  return (
    <VStack align="stretch" spacing={5}>
      <Box>
        <Text fontSize="13px" fontWeight={600} color="gray.700" mb={3}>
          {t('aiVideo.create.bgm')}
        </Text>
        <Flex gap={2} flexWrap="wrap">
          {BGM_OPTIONS.map(({ value, isVip }) => (
            <Flex
              key={value}
              as="button"
              type="button"
              align="center"
              gap={1}
              px={3}
              py={2}
              borderRadius="10px"
              border="1px solid"
              borderColor={audio.bgm === value ? AI_VIDEO_PRIMARY : '#E7E7E7'}
              bg={audio.bgm === value ? AI_VIDEO_PRIMARY_BG : 'white'}
              color={isVip ? 'gray.300' : audio.bgm === value ? AI_VIDEO_PRIMARY : 'gray.600'}
              fontSize="12px"
              cursor={isVip ? 'not-allowed' : 'pointer'}
              opacity={isVip ? 0.7 : 1}
              onClick={() => !isVip && onConfigChange({ audio: { ...audio, bgm: value } })}
            >
              {t(`aiVideo.create.bgmOption.${value}`)}
              {isVip ? (
                <Tag size="sm" borderRadius="full" bg="orange.100" color="orange.600">
                  {t('aiVideo.create.vipTag')}
                </Tag>
              ) : null}
            </Flex>
          ))}
        </Flex>
      </Box>

      <Flex align="center" gap={3}>
        <Text fontSize="13px" color="gray.500" w="64px" flexShrink={0}>
          {t('aiVideo.studio.audio.bgmVolume')}
        </Text>
        <Slider
          value={audio.bgmVolume}
          min={0}
          max={100}
          step={5}
          onChange={(value) => onConfigChange({ audio: { ...audio, bgmVolume: value } })}
          focusThumbOnChange={false}
        >
          <SliderTrack bg="gray.100">
            <SliderFilledTrack bg={AI_VIDEO_PRIMARY} />
          </SliderTrack>
          <SliderThumb boxSize={4} />
        </Slider>
        <Text fontSize="13px" fontWeight={600} color={AI_VIDEO_PRIMARY} w="36px" textAlign="right">
          {audio.bgmVolume}
        </Text>
      </Flex>

      <Text fontSize="11px" color="gray.400">
        {t('aiVideo.studio.audio.tip')}
      </Text>
    </VStack>
  );
}
