'use client';

/**
 * AI视频课 工作台 - 左侧分镜栏
 * 仅展示分镜标题（缩略图 + 序号 + 时长 + 标题）；选中分镜时显示删除按钮
 * 数字人启用时，缩略图上按摆放百分比同步展示数字人位置（跟随分镜级覆盖）
 */
import { useEffect, useRef } from 'react';
import { Box, Flex, IconButton, Image, Text, useToast, VStack } from '@chakra-ui/react';
import { ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject, DigitalHumanPlacement } from '@/teacher/types/aiVideo';
import { updateStoryboard } from '@/teacher/api/aiVideo';
import { AI_VIDEO_PRIMARY, CARD_SHADOW, DIGITAL_HUMAN_AVATARS } from '../../constants';
import { DH_FIGURE_STYLES, type SubtitleCue } from './StudioPlayer';

/** 播放器画布参考宽度（与 VideoResult 中 maxW 一致），用于将数字人像素宽换算为画面百分比 */
const PLAYER_REFERENCE_WIDTH = { horizontal: 760, vertical: 420 } as const;

type ShotSidebarProps = {
  project: AiVideoProject;
  cues: SubtitleCue[];
  selectedShotId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectShot: (shotId: string, cueStart: number) => void;
  onProjectChange: (project: AiVideoProject) => void;
};

export function ShotSidebar({
  project,
  cues,
  selectedShotId,
  collapsed,
  onToggleCollapse,
  onSelectShot,
  onProjectChange
}: ShotSidebarProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  /* 数字人：启用时各分镜缩略图同步展示位置标记（分镜覆盖优先，缺失 scale 回退全局） */
  const dhConfig = project.digitalHuman;
  const dhEnabled = Boolean(dhConfig?.enabled);
  const isVertical = project.params.ratio === '9:16';
  const dhStageWidth = isVertical
    ? PLAYER_REFERENCE_WIDTH.vertical
    : PLAYER_REFERENCE_WIDTH.horizontal;
  const dhFigureStyle = DH_FIGURE_STYLES[dhConfig?.mode ?? 'floatingAvatar'];

  /* 播放联动/选中变化时，将选中分镜滚动到可视区 */
  useEffect(() => {
    if (!selectedShotId) return;
    itemRefs.current.get(selectedShotId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedShotId]);

  const handleDelete = (shotId: string) => {
    const next = project.storyboard.filter((shot) => shot.id !== shotId);
    void updateStoryboard(project.id, next).then((updated) => {
      if (updated) onProjectChange(updated);
      toast({ title: t('aiVideo.storyboard.shotDeleted'), status: 'success', duration: 1500 });
    });
  };

  if (collapsed) {
    return (
      <Flex w="36px" flexShrink={0} justify="center" pt={3}>
        <IconButton
          aria-label={t('aiVideo.studio.sidebar.expand')}
          icon={<ChevronsRight size={16} />}
          size="xs"
          variant="ghost"
          onClick={onToggleCollapse}
        />
      </Flex>
    );
  }

  return (
    <Box
      w="200px"
      flexShrink={0}
      bg="white"
      borderRadius="16px"
      boxShadow={CARD_SHADOW}
      p={3}
      alignSelf="flex-start"
      maxH="100%"
      overflowY="auto"
    >
      <Flex justify="space-between" align="center" mb={3} px={1}>
        <Text fontSize="13px" fontWeight={600} color="gray.800">
          {t('aiVideo.studio.sidebar.title')}（{project.storyboard.length}）
        </Text>
        <IconButton
          aria-label={t('aiVideo.studio.sidebar.collapse')}
          icon={<ChevronsLeft size={16} />}
          size="xs"
          variant="ghost"
          onClick={onToggleCollapse}
        />
      </Flex>
      <VStack align="stretch" spacing={3}>
        {project.storyboard.length === 0 && (
          <Text fontSize="12px" color="gray.400" textAlign="center" py={6}>
            {t('aiVideo.storyboard.empty')}
          </Text>
        )}
        {project.storyboard.map((shot, index) => {
          const cue = cues.find((item) => item.id === shot.id);
          const selected = selectedShotId === shot.id;
          /* 数字人位置标记：启用且当前分镜未隐藏时展示（支持分镜级形象/摆放覆盖） */
          const dhOverride = shot.digitalHumanOverride;
          const dhMarker = (() => {
            if (!dhEnabled || !dhConfig || dhOverride?.hidden) return null;
            const placement: DigitalHumanPlacement = {
              ...dhConfig.placement,
              ...dhOverride?.placement
            };
            const avatar =
              DIGITAL_HUMAN_AVATARS.find(
                (item) => item.id === (dhOverride?.avatar ?? dhConfig.avatar)
              ) ?? DIGITAL_HUMAN_AVATARS[0];
            return {
              placement,
              avatarSrc: avatar.src,
              widthPercent: ((dhFigureStyle.w(isVertical) * placement.scale) / dhStageWidth) * 100,
              aspect: dhFigureStyle.w(isVertical) / dhFigureStyle.h(isVertical),
              borderRadius: dhFigureStyle.borderRadius,
              objectPosition: dhFigureStyle.objectPosition
            };
          })();
          return (
            <Flex
              key={shot.id}
              ref={(el: HTMLDivElement | null) => {
                if (el) itemRefs.current.set(shot.id, el);
                else itemRefs.current.delete(shot.id);
              }}
              role="button"
              tabIndex={0}
              cursor="pointer"
              direction="column"
              align="stretch"
              textAlign="left"
              borderRadius="10px"
              border="2px solid"
              borderColor={selected ? AI_VIDEO_PRIMARY : 'transparent'}
              bg={selected ? 'red.50' : 'gray.50'}
              p={1.5}
              gap={1.5}
              onClick={() => onSelectShot(shot.id, cue?.start ?? 0)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectShot(shot.id, cue?.start ?? 0);
                }
              }}
              transition="all 0.15s"
              position="relative"
            >
              <Box position="relative">
                <Image
                  src={shot.customMediaUrl ?? shot.imageUrl}
                  alt={shot.title}
                  w="100%"
                  h="86px"
                  objectFit="cover"
                  borderRadius="8px"
                  bg="gray.200"
                />
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
                  {index + 1}
                </Flex>
                <Text
                  position="absolute"
                  bottom={1}
                  right={1}
                  fontSize="10px"
                  color="white"
                  bg="blackAlpha.600"
                  borderRadius="4px"
                  px={1}
                >
                  {t('aiVideo.studio.sidebar.seconds', { value: shot.duration })}
                </Text>
                {/* 数字人位置标记（与画布同一摆放百分比与宽高比） */}
                {dhMarker && (
                  <Image
                    src={dhMarker.avatarSrc}
                    alt=""
                    position="absolute"
                    left={`${dhMarker.placement.x}%`}
                    top={`${dhMarker.placement.y}%`}
                    transform="translate(-50%, -50%)"
                    w={`${dhMarker.widthPercent}%`}
                    sx={{ aspectRatio: String(dhMarker.aspect) }}
                    objectFit="cover"
                    objectPosition={dhMarker.objectPosition}
                    borderRadius={dhMarker.borderRadius}
                    border="1px solid rgba(255,255,255,0.9)"
                    boxShadow="0 1px 4px rgba(0,0,0,0.35)"
                    bg="white"
                    pointerEvents="none"
                  />
                )}
              </Box>
              {/* 仅展示分镜标题 */}
              <Flex align="center" justify="space-between" px={0.5} gap={1}>
                <Text fontSize="12px" fontWeight={600} color="gray.700" noOfLines={1} flex="1">
                  {shot.title}
                </Text>
                {selected && (
                  <IconButton
                    aria-label={t('aiVideo.storyboard.deleteShot')}
                    icon={<Trash2 size={12} />}
                    size="xs"
                    variant="ghost"
                    color="red.400"
                    flexShrink={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(shot.id);
                    }}
                  />
                )}
              </Flex>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
}
