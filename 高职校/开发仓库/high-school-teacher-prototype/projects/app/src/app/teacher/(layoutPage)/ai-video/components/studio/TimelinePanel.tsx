'use client';

/**
 * AI视频课 工作台 - 底部多轨时间轴
 * 轨道：视频（片头/分镜/片尾块）· 讲稿 · 音乐 · 数字人（占位）
 * 播放头实时同步，点击轨道定位；控制栏：回到起点 / 上一片段 / 播放暂停 / 下一片段；裁剪区间外置灰；支持 50%-200% 缩放
 */
import { useMemo, useRef, useState } from 'react';
import { Box, Flex, IconButton, Image, Tag, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject } from '@/teacher/types/aiVideo';
import { INTRO_OUTRO_DURATION } from '@/teacher/api/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  CARD_SHADOW,
  DIGITAL_HUMAN_AVATARS
} from '../../constants';
import { buildTicks, chooseTickInterval, formatTimecode, timeToPercent } from './timelineUtils';

type TimelinePanelProps = {
  project: AiVideoProject;
  total: number;
  businessTime: number;
  isPlaying: boolean;
  selectedShotId: string | null;
  onTogglePlay: () => void;
  onSeek: (businessSeconds: number) => void;
  onSelectShot: (shotId: string, cueStart: number) => void;
};

const LABEL_W = '52px';
const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];

export function TimelinePanel({
  project,
  total,
  businessTime,
  isPlaying,
  selectedShotId,
  onTogglePlay,
  onSeek,
  onSelectShot
}: TimelinePanelProps) {
  const { t } = useTranslation('teacher');
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2); // 默认 100%
  const zoom = ZOOM_LEVELS[zoomIndex];

  const ticks = useMemo(() => buildTicks(total, chooseTickInterval(total)), [total]);
  const playheadLeft = timeToPercent(businessTime, total);
  const trim = project.trim ?? { start: 0, end: total };
  const hasIntro = Boolean(project.intro && project.intro !== 'none');
  const hasOutro = Boolean(project.outro && project.outro !== 'none');

  /** 分镜块时间区间（id/start/end，用于轨道布局与定位） */
  const cues = useMemo<Array<{ id: string; start: number; end: number }>>(() => {
    let cursor = hasIntro ? INTRO_OUTRO_DURATION : 0;
    return project.storyboard.map((shot) => {
      const start = cursor;
      cursor += Number(shot.duration) || 0;
      return { id: shot.id, start, end: cursor };
    });
  }, [hasIntro, project.storyboard]);

  const percent = (value: number) => `${timeToPercent(value, total)}%`;
  const widthPercent = (duration: number) => `${total > 0 ? (duration / total) * 100 : 0}%`;

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || total <= 0) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek(ratio * total);
  };

  /** 播放头当前所在分镜下标（-1 表示片头/片尾等非分镜区间） */
  const currentCueIndex = cues.findIndex(
    (cue) => businessTime >= cue.start && businessTime < cue.end
  );

  /** 回到起点：定位到起点，同时分镜选中同步回到第一个分镜 */
  const handleBackToStart = () => {
    const first = cues[0];
    if (first) {
      onSelectShot(first.id, trim.start);
    } else {
      onSeek(trim.start);
    }
  };

  /** 上一片段：切到前一个分镜并选中；处于片尾时回最后一个分镜；片头/首个分镜时回到起点 */
  const handlePrevSegment = () => {
    if (!cues.length) return;
    if (currentCueIndex > 0) {
      const prev = cues[currentCueIndex - 1];
      onSelectShot(prev.id, prev.start);
    } else if (currentCueIndex === -1 && businessTime >= cues[cues.length - 1].end) {
      const last = cues[cues.length - 1];
      onSelectShot(last.id, last.start);
    } else {
      onSeek(trim.start);
    }
  };

  /** 下一片段：切到后一个分镜并选中；处于片头时进入首个分镜；末尾时定位到结束点 */
  const handleNextSegment = () => {
    if (!cues.length) return;
    if (currentCueIndex >= 0 && currentCueIndex < cues.length - 1) {
      const next = cues[currentCueIndex + 1];
      onSelectShot(next.id, next.start);
    } else if (currentCueIndex === -1 && businessTime < cues[0].start) {
      onSelectShot(cues[0].id, cues[0].start);
    } else {
      onSeek(trim.end);
    }
  };

  return (
    <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={3} flexShrink={0}>
      {/* 控制行：时间码 / 播放控制 / 缩放 */}
      <Flex align="center" mb={2} px={1}>
        <Text fontSize="13px" fontFamily="mono" color={AI_VIDEO_PRIMARY} fontWeight={600} w="150px">
          {formatTimecode(businessTime, true)}
          <Text as="span" color="gray.400" fontWeight={400}>
            {' '}
            / {formatTimecode(total)}
          </Text>
        </Text>
        <Flex flex="1" justify="center" gap={2} align="center">
          <IconButton
            aria-label="to-start"
            title="回到起点"
            icon={<SkipBack size={15} />}
            size="sm"
            variant="ghost"
            isDisabled={businessTime <= trim.start + 0.05}
            onClick={handleBackToStart}
          />
          <IconButton
            aria-label="prev-segment"
            title="上一片段"
            icon={<ChevronLeft size={16} />}
            size="sm"
            variant="ghost"
            isDisabled={businessTime <= trim.start + 0.05}
            onClick={handlePrevSegment}
          />
          <IconButton
            aria-label="play-pause"
            icon={isPlaying ? <Pause size={15} /> : <Play size={15} />}
            size="md"
            borderRadius="full"
            bg={AI_VIDEO_PRIMARY}
            color="white"
            _hover={{ bg: AI_VIDEO_PRIMARY }}
            onClick={onTogglePlay}
          />
          <IconButton
            aria-label="next-segment"
            title="下一片段"
            icon={<ChevronRight size={16} />}
            size="sm"
            variant="ghost"
            isDisabled={businessTime >= trim.end - 0.05}
            onClick={handleNextSegment}
          />
        </Flex>
        <Flex w="150px" justify="flex-end" align="center" gap={1}>
          <IconButton
            aria-label="zoom-out"
            icon={<ZoomOut size={14} />}
            size="xs"
            variant="ghost"
            isDisabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          />
          <Text fontSize="11px" color="gray.500" w="36px" textAlign="center" fontFamily="mono">
            {zoom}%
          </Text>
          <IconButton
            aria-label="zoom-in"
            icon={<ZoomIn size={14} />}
            size="xs"
            variant="ghost"
            isDisabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          />
        </Flex>
      </Flex>

      <Flex>
        {/* 固定标签列 */}
        <Flex w={LABEL_W} flexShrink={0} direction="column">
          <Box h="22px" />
          <Flex h="44px" align="center" pl={2} mb="4px">
            <Text fontSize="11px" color="gray.400">
              {t('aiVideo.studio.timeline.video')}
            </Text>
          </Flex>
          <Flex h="28px" align="center" pl={2} mb="4px">
            <Text fontSize="11px" color="gray.400">
              {t('aiVideo.studio.timeline.script')}
            </Text>
          </Flex>
          <Flex h="24px" align="center" pl={2} mb="4px">
            <Text fontSize="11px" color="gray.400">
              {t('aiVideo.studio.timeline.music')}
            </Text>
          </Flex>
          <Flex h="22px" align="center" pl={2}>
            <Text fontSize="11px" color="gray.400">
              {t('aiVideo.studio.timeline.digitalHuman')}
            </Text>
          </Flex>
        </Flex>

        {/* 可缩放轨道区（横向滚动） */}
        <Box flex="1" overflowX="auto" minW={0}>
          <Box
            ref={trackRef}
            position="relative"
            w={`${zoom}%`}
            minW="100%"
            cursor="pointer"
            onClick={handleTrackClick}
          >
            {/* 刻度尺 */}
            <Box position="relative" h="22px">
              {ticks.map((tick) => (
                <Text
                  key={tick}
                  position="absolute"
                  left={percent(tick)}
                  transform="translateX(-50%)"
                  fontSize="10px"
                  color="gray.400"
                  fontFamily="mono"
                >
                  {formatTimecode(tick)}
                </Text>
              ))}
            </Box>

            {/* 视频轨道 */}
            <Flex h="44px" gap="2px" overflow="hidden" borderRadius="8px" mb="4px">
              {hasIntro && (
                <Flex
                  w={widthPercent(INTRO_OUTRO_DURATION)}
                  minW="36px"
                  bg="linear-gradient(135deg,#2B6CB0,#90CDF4)"
                  borderRadius="6px"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Text fontSize="10px" color="white">
                    {t('aiVideo.studio.timeline.intro')}
                  </Text>
                </Flex>
              )}
              {project.storyboard.map((shot, index) => {
                const cue = cues[index];
                const selected = selectedShotId === shot.id;
                return (
                  <Flex
                    key={shot.id}
                    w={widthPercent(shot.duration)}
                    minW="40px"
                    flexShrink={0}
                    borderRadius="6px"
                    overflow="hidden"
                    border="2px solid"
                    borderColor={selected ? AI_VIDEO_PRIMARY : 'transparent'}
                    position="relative"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectShot(shot.id, cue?.start ?? 0);
                    }}
                  >
                    <Image
                      src={shot.customMediaUrl ?? shot.imageUrl}
                      alt={shot.title}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                    <Text
                      position="absolute"
                      bottom={0.5}
                      left={1}
                      fontSize="9px"
                      color="white"
                      bg="blackAlpha.600"
                      borderRadius="3px"
                      px={0.5}
                    >
                      {index + 1}
                    </Text>
                  </Flex>
                );
              })}
              {hasOutro && (
                <Flex
                  w={widthPercent(INTRO_OUTRO_DURATION)}
                  minW="36px"
                  bg="linear-gradient(135deg,#553C9A,#D6BCFA)"
                  borderRadius="6px"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Text fontSize="10px" color="white">
                    {t('aiVideo.studio.timeline.outro')}
                  </Text>
                </Flex>
              )}
            </Flex>

            {/* 讲稿轨道 */}
            <Flex h="28px" gap="2px" overflow="hidden" mb="4px">
              {hasIntro && (
                <Box w={widthPercent(INTRO_OUTRO_DURATION)} minW="36px" flexShrink={0} />
              )}
              {project.storyboard.map((shot, index) => {
                const cue = cues[index];
                return (
                  <Flex
                    key={shot.id}
                    w={widthPercent(shot.duration)}
                    minW="40px"
                    flexShrink={0}
                    bg={AI_VIDEO_PRIMARY_BG}
                    borderRadius="6px"
                    align="center"
                    px={2}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectShot(shot.id, cue?.start ?? 0);
                    }}
                  >
                    <Text fontSize="11px" color="gray.600" noOfLines={1}>
                      {shot.narration}
                    </Text>
                  </Flex>
                );
              })}
              {hasOutro && (
                <Box w={widthPercent(INTRO_OUTRO_DURATION)} minW="36px" flexShrink={0} />
              )}
            </Flex>

            {/* 音乐轨道 */}
            <Box h="24px" mb="4px">
              {project.audio && project.audio.bgm !== 'none' ? (
                <Flex
                  h="100%"
                  bg="linear-gradient(90deg,#C6F6D5,#9AE6B4)"
                  borderRadius="6px"
                  align="center"
                  px={2}
                >
                  <Text fontSize="11px" color="green.700">
                    ♪ {t(`aiVideo.create.bgmOption.${project.audio.bgm}`)}
                  </Text>
                </Flex>
              ) : (
                <Flex
                  h="100%"
                  border="1px dashed"
                  borderColor="gray.200"
                  borderRadius="6px"
                  align="center"
                  px={2}
                >
                  <Text fontSize="11px" color="gray.300">
                    {t('aiVideo.studio.timeline.noBgm')}
                  </Text>
                </Flex>
              )}
            </Box>

            {/* 数字人轨道：启用后贯穿全片，显示当前形象 */}
            {project.digitalHuman?.enabled ? (
              <Flex
                h="24px"
                bg="linear-gradient(90deg,#E9D8FD,#D6BCFA)"
                borderRadius="6px"
                align="center"
                px={2}
                gap={1.5}
              >
                <Image
                  src={
                    (
                      DIGITAL_HUMAN_AVATARS.find(
                        (item) => item.id === project.digitalHuman?.avatar
                      ) ?? DIGITAL_HUMAN_AVATARS[0]
                    ).src
                  }
                  alt=""
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg="white"
                />
                <Text fontSize="11px" color="purple.700" noOfLines={1}>
                  {t(
                    `aiVideo.studio.digitalHuman.avatar.${project.digitalHuman?.avatar ?? 'femaleTeacher'}`
                  )}
                </Text>
              </Flex>
            ) : (
              <Flex
                h="24px"
                border="1px dashed"
                borderColor="gray.200"
                borderRadius="6px"
                align="center"
                px={2}
              >
                <Text fontSize="11px" color="gray.300">
                  {t('aiVideo.studio.digitalHuman.disabled')}
                </Text>
              </Flex>
            )}

            {/* 裁剪区间外遮罩 */}
            {trim.start > 0 && (
              <Box
                position="absolute"
                top={0}
                bottom={0}
                left={0}
                w={percent(trim.start)}
                bg="whiteAlpha.700"
                pointerEvents="none"
                zIndex={1}
              />
            )}
            {trim.end < total && (
              <Box
                position="absolute"
                top={0}
                bottom={0}
                left={percent(trim.end)}
                right={0}
                bg="whiteAlpha.700"
                pointerEvents="none"
                zIndex={1}
              />
            )}

            {/* 播放头 */}
            <Box
              position="absolute"
              top={0}
              bottom={0}
              left={`${playheadLeft}%`}
              w="2px"
              bg={AI_VIDEO_PRIMARY}
              pointerEvents="none"
              zIndex={2}
            >
              <Box
                position="absolute"
                top="-4px"
                left="50%"
                transform="translateX(-50%)"
                w="10px"
                h="10px"
                borderRadius="full"
                bg={AI_VIDEO_PRIMARY}
              />
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
