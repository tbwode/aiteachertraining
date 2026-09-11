'use client';

/**
 * AI视频课 工作台 - 音色面板
 * 配音音色、语速、人声音量
 */
import { Box, Flex, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject, AiVideoVoice } from '@/teacher/types/aiVideo';
import { VOICE_OPTIONS, AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';

function VolumeSlider({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Flex align="center" gap={3}>
      <Text fontSize="13px" color="gray.500" w="64px" flexShrink={0}>
        {label}
      </Text>
      <Slider value={value} min={0} max={100} step={5} onChange={onChange} focusThumbOnChange={false}>
        <SliderTrack bg="gray.100">
          <SliderFilledTrack bg={AI_VIDEO_PRIMARY} />
        </SliderTrack>
        <SliderThumb boxSize={4} />
      </Slider>
      <Text fontSize="13px" fontWeight={600} color={AI_VIDEO_PRIMARY} w="36px" textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

type VoicePanelProps = {
  project: AiVideoProject;
  onConfigChange: (patch: Partial<Pick<AiVideoProject, 'audio'>>) => void;
};

export function VoicePanel({ project, onConfigChange }: VoicePanelProps) {
  const { t } = useTranslation('teacher');
  const audio = project.audio!;

  return (
    <VStack align="stretch" spacing={5}>
      <Box>
        <Text fontSize="13px" fontWeight={600} color="gray.700" mb={3}>
          {t('aiVideo.studio.audio.voice')}
        </Text>
        <Flex gap={2} flexWrap="wrap">
          {VOICE_OPTIONS.map((voice: AiVideoVoice) => (
            <Flex
              key={voice}
              as="button"
              type="button"
              px={3}
              py={2}
              borderRadius="10px"
              border="1px solid"
              borderColor={audio.voice === voice ? AI_VIDEO_PRIMARY : '#E7E7E7'}
              bg={audio.voice === voice ? AI_VIDEO_PRIMARY_BG : 'white'}
              color={audio.voice === voice ? AI_VIDEO_PRIMARY : 'gray.600'}
              fontSize="12px"
              onClick={() => onConfigChange({ audio: { ...audio, voice } })}
            >
              {t(`aiVideo.create.voiceOption.${voice}`)}
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* 语速 */}
      <Flex align="center" gap={3}>
        <Text fontSize="13px" color="gray.500" w="64px" flexShrink={0}>
          {t('aiVideo.create.speed')}
        </Text>
        <Slider
          value={audio.speed}
          min={0.7}
          max={1.3}
          step={0.1}
          onChange={(value) => onConfigChange({ audio: { ...audio, speed: value } })}
          focusThumbOnChange={false}
        >
          <SliderTrack bg="gray.100">
            <SliderFilledTrack bg={AI_VIDEO_PRIMARY} />
          </SliderTrack>
          <SliderThumb boxSize={4} />
        </Slider>
        <Text fontSize="13px" fontWeight={600} color={AI_VIDEO_PRIMARY} w="36px" textAlign="right">
          {audio.speed.toFixed(1)}x
        </Text>
      </Flex>

      <VolumeSlider
        label={t('aiVideo.studio.audio.voiceVolume')}
        value={audio.voiceVolume}
        onChange={(value) => onConfigChange({ audio: { ...audio, voiceVolume: value } })}
      />

      <Text fontSize="11px" color="gray.400">
        {t('aiVideo.studio.audio.tip')}
      </Text>
    </VStack>
  );
}
