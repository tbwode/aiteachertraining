'use client';

/**
 * PPT/文档转视频 预览编辑 - 全局预览弹窗
 * 布局：标题栏（全局预览 + 静态数字人提示[可不再提示] + 关闭）/ 大画布（含字幕、AI标识、章节进度条）/
 * 播放控制（上一片段 / 播放·暂停 / 下一片段 + 已播/总时长）/ 片段缩略图横向条（选中高亮、点击跳转）
 * 播放流程：音频加载中 → TTS 朗读 → 按分镜时长推进，自动进入下一片段
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Image,
  Modal,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text
} from '@chakra-ui/react';
import { InfoIcon, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY } from '../../../constants';
import { ShotCanvas, resolvePptLayoutView } from './ShotCanvas';

/** 「不再提示」localStorage 键 */
const TIP_DISMISSED_KEY = 'ppt_preview_tip_dismissed';
/** 音频加载（合成）时长 */
const AUDIO_LOADING_MS = 1200;

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function PreviewModal({
  project,
  scripts,
  isOpen,
  onClose
}: {
  project: AiVideoProject;
  scripts: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('teacher');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tipDismissed, setTipDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(TIP_DISMISSED_KEY) === '1'
  );
  const loadingTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const shots = project.storyboard;
  const total = shots.length;
  const shot = shots[Math.min(index, total - 1)];

  /** 各片段起始时间（累计秒）与总时长 */
  const { starts, totalDuration } = useMemo(() => {
    const acc: number[] = [];
    let cursor = 0;
    for (const item of shots) {
      acc.push(cursor);
      cursor += Math.max(1, item.duration);
    }
    return { starts: acc, totalDuration: cursor };
  }, [shots]);

  const stopTimers = useCallback(() => {
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = null;
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    stopTimers();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setAudioLoading(false);
    setProgress(0);
  }, [stopTimers]);

  /** 播放当前片段：音频加载中 → 朗读 → 进度推进 → 自动下一片段 */
  const playCurrentShot = useCallback(
    (shotIndex: number, fromPercent = 0) => {
      stopTimers();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const target = shots[shotIndex];
      if (!target) return;
      setAudioLoading(true);
      setProgress(fromPercent);
      loadingTimerRef.current = window.setTimeout(() => {
        loadingTimerRef.current = null;
        setAudioLoading(false);
        // 合成完成播放语音
        const text = scripts[target.id] ?? target.narration;
        if (window.speechSynthesis && text.trim()) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-CN';
          utterance.rate = project.audio?.speed ?? 1;
          window.speechSynthesis.speak(utterance);
        }
        // 进度按分镜时长推进
        const durationMs = Math.max(1, target.duration) * 1000;
        const startedAt = Date.now() - (fromPercent / 100) * durationMs;
        progressTimerRef.current = window.setInterval(() => {
          const percent = Math.min(100, ((Date.now() - startedAt) / durationMs) * 100);
          setProgress(percent);
          if (percent >= 100) {
            window.clearInterval(progressTimerRef.current!);
            progressTimerRef.current = null;
            if (shotIndex < shots.length - 1) {
              setIndex(shotIndex + 1);
              playCurrentShot(shotIndex + 1);
            } else {
              stopPlayback();
              setIndex(shots.length - 1);
            }
          }
        }, 100);
      }, AUDIO_LOADING_MS);
    },
    [shots, scripts, project.audio?.speed, stopTimers, stopPlayback]
  );

  const handlePlayToggle = () => {
    if (playing) {
      stopPlayback();
      return;
    }
    setPlaying(true);
    playCurrentShot(index, progress);
  };

  const handlePrev = () => {
    if (index <= 0) return;
    const next = index - 1;
    setIndex(next);
    if (playing) playCurrentShot(next);
    else setProgress(0);
  };

  const handleNext = () => {
    if (index >= total - 1) return;
    const next = index + 1;
    setIndex(next);
    if (playing) playCurrentShot(next);
    else setProgress(0);
  };

  const handleSelectThumb = (shotIndex: number) => {
    setIndex(shotIndex);
    if (playing) playCurrentShot(shotIndex);
    else setProgress(0);
  };

  const handleDismissTip = () => {
    localStorage.setItem(TIP_DISMISSED_KEY, '1');
    setTipDismissed(true);
  };

  const handleClose = () => {
    stopPlayback();
    onClose();
  };

  /* 打开时重置到第一片段；关闭时停止播放 */
  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      stopPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  useEffect(() => stopPlayback, [stopPlayback]);

  const elapsed = (starts[index] ?? 0) + ((shot?.duration ?? 0) * progress) / 100;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="5xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="#0F1424" borderRadius="16px" overflow="hidden" maxW="880px">
        {/* 标题栏 */}
        <Flex align="center" px={5} h="52px" flexShrink={0}>
          <Text fontSize="15px" fontWeight={600} color="white">
            {t('aiVideo.ppt.editor.previewTitle')}
          </Text>
          <Box flex="1" />
          {!tipDismissed && (
            <Flex align="center" gap={2} mr={3}>
              <InfoIcon size={13} color="#7C8DB0" />
              <Text fontSize="12px" color="#A8B3CF">
                {t('aiVideo.ppt.editor.previewTip')}
              </Text>
              <Text
                as="button"
                type="button"
                fontSize="12px"
                color="#8FB8FF"
                _hover={{ textDecoration: 'underline' }}
                onClick={handleDismissTip}
              >
                {t('aiVideo.ppt.editor.previewTipDismiss')}
              </Text>
            </Flex>
          )}
          <IconButton
            aria-label={t('aiVideo.common.close')}
            icon={<X size={17} />}
            size="sm"
            variant="ghost"
            color="gray.400"
            _hover={{ color: 'white' }}
            onClick={handleClose}
          />
        </Flex>

        {/* 大画布 */}
        <Box px={5}>
          {shot && (
            <ShotCanvas
              project={project}
              shot={shot}
              script={scripts[shot.id] ?? ''}
              subtitleOn={project.subtitle!.visible}
              aiBadgeOn={project.aiBadge !== false}
              shotIndex={index}
              onSelectShot={handleSelectThumb}
              playPercent={playing && !audioLoading ? progress : undefined}
            >
              {/* 音频加载中 */}
              {audioLoading && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.400"
                  align="center"
                  justify="center"
                  zIndex={5}
                >
                  <Flex direction="column" align="center" gap={3}>
                    <Spinner size="lg" color="white" />
                    <Text fontSize="13px" color="white">
                      {t('aiVideo.ppt.editor.audioLoading')}
                    </Text>
                  </Flex>
                </Flex>
              )}
            </ShotCanvas>
          )}
        </Box>

        {/* 播放控制：时间 + 上一片段/播放/下一片段 */}
        <Flex align="center" px={5} py={3} gap={4}>
          <Text fontSize="12px" color="#A8B3CF" w="90px" flexShrink={0}>
            {formatTime(elapsed)}/{formatTime(totalDuration)}
          </Text>
          <Flex flex="1" justify="center" align="center" gap={6}>
            <IconButton
              aria-label={t('aiVideo.ppt.editor.prevShot')}
              icon={<SkipBack size={17} />}
              size="sm"
              variant="ghost"
              color={index <= 0 ? 'whiteAlpha.300' : 'whiteAlpha.800'}
              isDisabled={index <= 0}
              onClick={handlePrev}
            />
            <Flex
              as="button"
              type="button"
              w="40px"
              h="40px"
              borderRadius="full"
              bg="white"
              color="#0F1424"
              align="center"
              justify="center"
              _hover={{ bg: 'gray.100' }}
              onClick={handlePlayToggle}
              aria-label={playing ? t('aiVideo.ppt.editor.pause') : t('aiVideo.ppt.editor.play')}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </Flex>
            <IconButton
              aria-label={t('aiVideo.ppt.editor.nextShot')}
              icon={<SkipForward size={17} />}
              size="sm"
              variant="ghost"
              color={index >= total - 1 ? 'whiteAlpha.300' : 'whiteAlpha.800'}
              isDisabled={index >= total - 1}
              onClick={handleNext}
            />
          </Flex>
          <Box w="90px" flexShrink={0} />
        </Flex>

        {/* 片段缩略图横向条 */}
        <Flex
          px={5}
          pb={4}
          gap={2}
          overflowX="auto"
          flexShrink={0}
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.35) rgba(255,255,255,0.08)',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-track': { bg: 'rgba(255,255,255,0.08)', borderRadius: 'full' },
            '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.35)', borderRadius: 'full' }
          }}
        >
          {shots.map((item, shotIndex) => {
            const selected = shotIndex === index;
            return (
              <Box
                key={item.id}
                as="button"
                type="button"
                position="relative"
                flexShrink={0}
                w="128px"
                borderRadius="10px"
                overflow="hidden"
                border="2px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : 'transparent'}
                transition="all 0.15s"
                onClick={() => handleSelectThumb(shotIndex)}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  w="100%"
                  h="72px"
                  objectFit="cover"
                  bg="gray-700"
                />
                {/* 数字人标记（与画布同一布局摆放） */}
                {(() => {
                  const { dh } = resolvePptLayoutView(project, item);
                  if (!dh) return null;
                  return (
                    <Image
                      src={dh.src}
                      alt=""
                      position="absolute"
                      left={`${dh.placement.x}%`}
                      top={`${dh.placement.y}%`}
                      transform="translate(-50%, -50%)"
                      w={`${dh.widthPercent}%`}
                      sx={{ aspectRatio: String(dh.aspect) }}
                      objectFit="cover"
                      objectPosition={dh.objectPosition}
                      borderRadius={dh.borderRadius}
                      border="1px solid rgba(255,255,255,0.9)"
                      bg="white"
                      pointerEvents="none"
                    />
                  );
                })()}
                <Flex
                  position="absolute"
                  top={1}
                  left={1}
                  w="18px"
                  h="18px"
                  borderRadius="6px"
                  bg={selected ? AI_VIDEO_PRIMARY : 'blackAlpha.600'}
                  color="white"
                  fontSize="11px"
                  align="center"
                  justify="center"
                >
                  {shotIndex + 1}
                </Flex>
                {/* 选中分段：左下角起始时间戳（mm:ss） */}
                {selected && (
                  <Text
                    position="absolute"
                    left={1}
                    bottom={1}
                    fontSize="11px"
                    fontWeight={600}
                    color="white"
                    textShadow="0 1px 3px rgba(0,0,0,0.7)"
                  >
                    {formatTime(starts[shotIndex] ?? 0)}
                  </Text>
                )}
                {/* 分段时长 */}
                <Text
                  position="absolute"
                  top={1}
                  right={1}
                  fontSize="10px"
                  color="white"
                  bg="blackAlpha.600"
                  borderRadius="4px"
                  px={1}
                >
                  {item.duration}s
                </Text>
                {/* 正在播放状态：底部播放进度条 */}
                {selected && playing && !audioLoading && (
                  <Box
                    position="absolute"
                    left={0}
                    right={0}
                    bottom={0}
                    h="4px"
                    bg="whiteAlpha.400"
                  >
                    <Box
                      h="100%"
                      w={`${progress}%`}
                      bg={AI_VIDEO_PRIMARY}
                      transition="width 0.1s"
                    />
                  </Box>
                )}
                {/* 音频加载中（当前播放片段） */}
                {selected && audioLoading && (
                  <Flex
                    position="absolute"
                    inset={0}
                    bg="blackAlpha.500"
                    align="center"
                    justify="center"
                  >
                    <Text fontSize="11px" color="white">
                      {t('aiVideo.ppt.editor.audioLoading')}
                    </Text>
                  </Flex>
                )}
              </Box>
            );
          })}
        </Flex>
      </ModalContent>
    </Modal>
  );
}
