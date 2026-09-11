'use client';

/**
 * AI视频课 工作台 - 讲稿面板
 * 展示当前音色（配音/语速），分镜讲稿逐条编辑，支持试听（浏览器 TTS，无语音包时按时长模拟）
 * 字幕样式：字号/颜色/自动断句
 */
import { useEffect, useRef, useState } from 'react';
import { Box, Flex, IconButton, Switch, Text, Textarea, VStack } from '@chakra-ui/react';
import { Mic, Play, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { updateStoryboard } from '@/teacher/api/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  SUBTITLE_COLOR_OPTIONS,
  SUBTITLE_FONT_SIZE_KEYS
} from '../../constants';
import type { SubtitleCue } from './StudioPlayer';

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

type SubtitlePanelProps = {
  project: AiVideoProject;
  cues: SubtitleCue[];
  /** 左侧分镜栏当前选中的分镜 */
  selectedShotId: string | null;
  onProjectChange: (project: AiVideoProject) => void;
  onConfigChange: (patch: Partial<Pick<AiVideoProject, 'subtitle'>>) => void;
};

export function SubtitlePanel({
  project,
  cues,
  selectedShotId,
  onProjectChange,
  onConfigChange
}: SubtitlePanelProps) {
  const { t } = useTranslation('teacher');
  const subtitle = project.subtitle!;
  const audio = project.audio!;
  const currentCue = cues.find((cue) => cue.id === selectedShotId) ?? null;
  const currentShot = project.storyboard.find((shot) => shot.id === selectedShotId) ?? null;
  const currentIndex = currentShot
    ? project.storyboard.findIndex((shot) => shot.id === currentShot.id)
    : -1;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 卸载时停止试听 */
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** 试听：优先浏览器 SpeechSynthesis 真实朗读（按语速），无语音包时按文本长度模拟播放时长 */
  const audition = (id: string, text: string) => {
    const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    synth?.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(id);
    const done = () => setPlayingId((cur) => (cur === id ? null : cur));
    // 估算时长：约 5 字/秒 × 语速，限制在 1.5-12s
    const estimate = Math.min(12000, Math.max(1500, (text.length / (5 * audio.speed)) * 1000));
    let spoken = false;
    if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = audio.speed;
        const voices = synth.getVoices();
        const wantMale = audio.voice.startsWith('male');
        const zhVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('zh'));
        const matched =
          zhVoices.find((voice) => (wantMale ? /male|kang|yun|jian/i.test(voice.name) && !/female/i.test(voice.name) : /female|xiaoxiao|ting|mei|hui|ya/i.test(voice.name))) ??
          zhVoices[0];
        if (matched) utter.voice = matched;
        utter.onend = done;
        utter.onerror = done;
        synth.speak(utter);
        spoken = true;
      } catch {
        spoken = false;
      }
    }
    // 兜底定时器：无 TTS 或 onend 不触发时按估算时长结束
    timerRef.current = setTimeout(done, spoken ? estimate + 1500 : estimate);
  };

  const handleNarrationChange = (shotId: string, text: string) => {
    void updateStoryboard(
      project.id,
      project.storyboard.map((shot) => (shot.id === shotId ? { ...shot, narration: text } : shot))
    ).then((next) => next && onProjectChange(next));
  };

  return (
    <VStack align="stretch" spacing={5}>
      {/* 当前音色 */}
      <Box>
        <Text fontSize="13px" fontWeight={600} color="gray.700" mb={3}>
          {t('aiVideo.studio.script.currentVoice')}
        </Text>
        <Flex
          align="center"
          gap={3}
          p={3}
          borderRadius="12px"
          border="1px solid"
          borderColor="#EEF0F4"
          bg="gray.50"
        >
          <Flex
            w="36px"
            h="36px"
            borderRadius="10px"
            bg={AI_VIDEO_PRIMARY_BG}
            color={AI_VIDEO_PRIMARY}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Mic size={17} />
          </Flex>
          <VStack align="flex-start" spacing={0} flex="1" minW={0}>
            <Text fontSize="13px" fontWeight={600} color="gray.700">
              {t(`aiVideo.create.voiceOption.${audio.voice}`)}
            </Text>
            <Text fontSize="11px" color="gray.400">
              {t('aiVideo.studio.script.speed')} ×{audio.speed}
            </Text>
          </VStack>
          <Flex
            as="button"
            type="button"
            align="center"
            gap={1}
            px={3}
            py={1.5}
            borderRadius="full"
            fontSize="12px"
            border="1px solid"
            borderColor={playingId === '__voice__' ? AI_VIDEO_PRIMARY : '#E7E7E7'}
            color={playingId === '__voice__' ? AI_VIDEO_PRIMARY : 'gray.600'}
            bg={playingId === '__voice__' ? AI_VIDEO_PRIMARY_BG : 'white'}
            onClick={() => audition('__voice__', cues[0]?.text ?? project.title)}
          >
            {playingId === '__voice__' ? <Square size={11} /> : <Play size={11} />}
            {playingId === '__voice__'
              ? t('aiVideo.studio.script.auditioning')
              : t('aiVideo.studio.script.audition')}
          </Flex>
        </Flex>
        <Text fontSize="11px" color="gray.400" mt={2}>
          {t('aiVideo.studio.script.voiceTip')}
        </Text>
      </Box>

      {/* 当前分镜讲稿：编辑 + 试听 */}
      <Box>
        <Flex justify="space-between" align="baseline" mb={3}>
          <Text fontSize="13px" fontWeight={600} color="gray.700">
            {t('aiVideo.studio.script.currentScript')}
          </Text>
          <Text fontSize="11px" color="gray.400">
            {t('aiVideo.studio.subtitle.editTip')}
          </Text>
        </Flex>
        {currentCue && currentShot ? (
          <Box borderRadius="12px" border="1px solid" borderColor="#EEF0F4" p={3}>
            {/* 分镜信息行 */}
            <Flex align="center" gap={2} mb={3}>
              <Flex
                w="20px"
                h="20px"
                borderRadius="6px"
                bg={AI_VIDEO_PRIMARY}
                color="white"
                fontSize="11px"
                align="center"
                justify="center"
                flexShrink={0}
              >
                {currentIndex + 1}
              </Flex>
              <Text fontSize="13px" fontWeight={600} color="gray.700" noOfLines={1} flex="1">
                {currentShot.title}
              </Text>
              <Text fontSize="11px" color="gray.400" fontFamily="mono" flexShrink={0}>
                {formatSeconds(currentCue.start)}
              </Text>
              <IconButton
                aria-label={t('aiVideo.studio.script.audition')}
                icon={playingId === currentCue.id ? <Square size={11} /> : <Play size={12} />}
                size="sm"
                variant="ghost"
                flexShrink={0}
                color={playingId === currentCue.id ? AI_VIDEO_PRIMARY : 'gray.400'}
                onClick={() => audition(currentCue.id, currentCue.text)}
              />
            </Flex>
            {/* 讲稿编辑 */}
            <Textarea
              value={currentCue.text}
              rows={4}
              fontSize="13px"
              lineHeight="1.7"
              borderRadius="8px"
              borderColor="#E7E7E7"
              _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              onChange={(event) => handleNarrationChange(currentCue.id, event.target.value)}
            />
          </Box>
        ) : (
          <Flex p={4} borderRadius="12px" border="1px dashed" borderColor="gray.200" bg="gray.50">
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.studio.script.noShot')}
            </Text>
          </Flex>
        )}
      </Box>

      {/* 样式设置 */}
      <Box>
        <Text fontSize="13px" fontWeight={600} color="gray.700" mb={3}>
          {t('aiVideo.studio.subtitle.styleTitle')}
        </Text>
        <VStack align="stretch" spacing={4}>
          <Flex align="center" justify="space-between">
            <Text fontSize="13px" color="gray.500">
              {t('aiVideo.studio.subtitle.fontSize')}
            </Text>
            <Flex gap={1} bg="gray.100" borderRadius="8px" p={1}>
              {SUBTITLE_FONT_SIZE_KEYS.map((size) => (
                <Flex
                  key={size}
                  as="button"
                  type="button"
                  px={3}
                  py={1}
                  borderRadius="6px"
                  fontSize="12px"
                  bg={subtitle.fontSize === size ? 'white' : 'transparent'}
                  color={subtitle.fontSize === size ? AI_VIDEO_PRIMARY : 'gray.500'}
                  fontWeight={subtitle.fontSize === size ? 600 : 400}
                  boxShadow={subtitle.fontSize === size ? 'sm' : 'none'}
                  onClick={() =>
                    onConfigChange({ subtitle: { ...subtitle, fontSize: size } })
                  }
                >
                  {t(`aiVideo.studio.subtitle.size.${size}`)}
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Flex align="center" justify="space-between">
            <Text fontSize="13px" color="gray.500">
              {t('aiVideo.studio.subtitle.color')}
            </Text>
            <Flex gap={2}>
              {SUBTITLE_COLOR_OPTIONS.map((color) => (
                <Flex
                  key={color}
                  as="button"
                  type="button"
                  w="22px"
                  h="22px"
                  borderRadius="full"
                  bg={color}
                  border="2px solid"
                  borderColor={subtitle.color === color ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                  boxShadow={subtitle.color === color ? `0 0 0 2px ${AI_VIDEO_PRIMARY_BG}` : 'none'}
                  onClick={() => onConfigChange({ subtitle: { ...subtitle, color } })}
                />
              ))}
            </Flex>
          </Flex>
          <Flex align="center" justify="space-between">
            <Box>
              <Text fontSize="13px" color="gray.500">
                {t('aiVideo.studio.subtitle.autoBreak')}
              </Text>
              <Text fontSize="11px" color="gray.400">
                {t('aiVideo.studio.subtitle.autoBreakTip')}
              </Text>
            </Box>
            <Switch
              isChecked={subtitle.autoBreak}
              onChange={(event) =>
                onConfigChange({ subtitle: { ...subtitle, autoBreak: event.target.checked } })
              }
              colorScheme="red"
            />
          </Flex>
        </VStack>
      </Box>
    </VStack>
  );
}
