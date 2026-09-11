'use client';

/**
 * PPT/文档转视频 预览编辑 - 分镜画布
 * 版式跟随「布局」配置（课件版式 × 数字人形态 六选一）：
 * 左课件/居中课件/全屏课件 × 讲师侧立/无数字人/讲师镜头
 * 底部字幕条（字幕高亮时对「」与数字标色）、AI 生成标识、智能进度条
 */
import {
  Box,
  Flex,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text
} from '@chakra-ui/react';
import type {
  AiVideoProject,
  DigitalHumanPlacement,
  PptLayoutId,
  PptMediaOverlay,
  PptTextOverlay,
  StoryboardShot
} from '@/teacher/types/aiVideo';
import { DIGITAL_HUMAN_AVATARS, PPT_BACKGROUND_PRESETS } from '../../../constants';
import { DH_FIGURE_STYLES } from '../../studio/StudioPlayer';
import { SubtitleSettings } from '../../studio/SubtitleSettings';
import { DhCanvasLayer } from './DhCanvasLayer';
import { ProgressChapterBar } from './ProgressChapterBar';
import { resolveProgressChapters } from './progressUtils';
import { MediaOverlayLayer } from './MediaOverlayLayer';
import { TextOverlayLayer } from './TextOverlayLayer';

/** 模板氛围背景（画布底色随模板切换） */
const TEMPLATE_BACKDROP: Record<string, string> = {
  simpleCourseware: 'linear-gradient(135deg, #EAF2FF 0%, #D6E6FF 55%, #C3D9FB 100%)',
  realistic: 'linear-gradient(135deg, #EDEBE6 0%, #DDD8CC 55%, #CFC8B8 100%)',
  corporate: 'linear-gradient(135deg, #E8ECF3 0%, #D3DAE8 55%, #BEC9DD 100%)',
  documentary: 'linear-gradient(135deg, #EFEFEA 0%, #DEDED4 55%, #CCCCC0 100%)'
};

/** 字幕字号映射（与成片工作台播放器一致） */
const SUBTITLE_FONT_SIZE_MAP = { small: '13px', medium: '17px', large: '22px' } as const;

/** 数字人画布参考宽度（与成片工作台播放器一致，用于像素宽换算画面百分比） */
const DH_STAGE_WIDTH = 760;

type PageRect = { left: string; top: string; w: string; h: string; radius: string | number };

/** 课件版式对应的页面摆放 */
const PAGE_RECTS: Record<'left' | 'center' | 'full', PageRect> = {
  left: { left: '7%', top: '8%', w: '72%', h: '84%', radius: '8px' },
  center: { left: '10%', top: '5%', w: '80%', h: '90%', radius: '8px' },
  full: { left: '0', top: '0', w: '100%', h: '100%', radius: 0 }
};

/** 布局 → 课件版式 + 数字人形态（null = 无数字人） */
const LAYOUT_MAP: Record<
  PptLayoutId,
  { page: keyof typeof PAGE_RECTS; dh: 'halfBody' | 'floatingAvatar' | null }
> = {
  leftDh: { page: 'left', dh: 'halfBody' },
  centerNone: { page: 'center', dh: null },
  fullNone: { page: 'full', dh: null },
  fullDh: { page: 'full', dh: 'halfBody' },
  fullAvatar: { page: 'full', dh: 'floatingAvatar' },
  centerAvatar: { page: 'center', dh: 'floatingAvatar' }
};

/** 讲师镜头（圆形头像）默认站位：右上角 */
const AVATAR_PLACEMENT: DigitalHumanPlacement = { x: 88, y: 18, scale: 1 };

/** 解析当前分镜的画布视图：页面摆放 + 数字人渲染参数（片段栏缩略图复用） */
export function resolvePptLayoutView(project: AiVideoProject, shot: StoryboardShot) {
  const layout = LAYOUT_MAP[project.pptConfig?.layout ?? 'leftDh'];
  const pageRect = PAGE_RECTS[layout.page];

  const dhConfig = project.digitalHuman;
  const dhOverride = shot.digitalHumanOverride;
  const dhEnabled = Boolean(dhConfig?.enabled) && layout.dh !== null && !dhOverride?.hidden;

  if (!dhEnabled || !dhConfig) return { pageRect, dh: null as null };

  const figure = DH_FIGURE_STYLES[layout.dh ?? dhConfig.mode ?? 'halfBody'];
  const basePlacement = layout.dh === 'floatingAvatar' ? AVATAR_PLACEMENT : dhConfig.placement;
  const placement: DigitalHumanPlacement = { ...basePlacement, ...dhOverride?.placement };
  const avatar =
    DIGITAL_HUMAN_AVATARS.find((item) => item.id === (dhOverride?.avatar ?? dhConfig.avatar)) ??
    DIGITAL_HUMAN_AVATARS[0];

  return {
    pageRect,
    dh: {
      src: avatar.src,
      placement,
      widthPercent: ((figure.w(false) * placement.scale) / DH_STAGE_WIDTH) * 100,
      aspect: figure.w(false) / figure.h(false),
      borderRadius: figure.borderRadius,
      objectPosition: figure.objectPosition
    }
  };
}

/** 字幕高亮：按分镜设置的高亮子串标黄（选中文稿文字设置为高亮） */
function highlightSubtitle(text: string, highlights: string[]): React.ReactNode {
  const patterns = highlights
    .filter((item) => item.trim().length > 0)
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (patterns.length === 0) return text;
  const regex = new RegExp(`(${patterns.join('|')})`, 'g');
  return text.split(regex).map((part, index) =>
    index % 2 === 1 ? (
      <Text as="span" color="#FFE58F" fontWeight={700} key={index}>
        {part}
      </Text>
    ) : (
      <Text as="span" key={index}>
        {part}
      </Text>
    )
  );
}

export function ShotCanvas({
  project,
  shot,
  script,
  subtitleOn,
  aiBadgeOn,
  shotIndex,
  onSelectShot,
  playPercent,
  selectedTextId,
  textInteractive = true,
  onSelectText,
  onDeleteText,
  onTextGeometry,
  onProjectChange,
  onConfigChange,
  onBeforeChange,
  selectedMediaId,
  onSelectMedia,
  onDeleteMedia,
  onMediaGeometry,
  children
}: {
  project: AiVideoProject;
  shot: StoryboardShot;
  /** 当前口播稿（字幕条取首句摘要） */
  script: string;
  subtitleOn: boolean;
  aiBadgeOn: boolean;
  /** 当前片段下标（智能进度条章节高亮） */
  shotIndex: number;
  /** 点击章节跳转其首个片段 */
  onSelectShot?: (shotIndex: number) => void;
  /** 播放进度 0-100（undefined 表示未播放） */
  playPercent?: number;
  /** 文本框选中 id（编辑态） */
  selectedTextId?: string | null;
  /** 文本框是否可交互（预览弹窗传 false 仅静态渲染） */
  textInteractive?: boolean;
  onSelectText?: (id: string) => void;
  onDeleteText?: (id: string) => void;
  onTextGeometry?: (
    id: string,
    patch: Partial<Pick<PptTextOverlay, 'x' | 'y' | 'width' | 'height'>>,
    persist: boolean
  ) => void;
  /** 项目变更回写（提供后数字人可交互：拖拽/缩放/关闭，与成片工作台一致） */
  onProjectChange?: (project: AiVideoProject) => void;
  /** 字幕配置变更（提供后点击字幕条弹出字幕设置，与成片工作台一致） */
  onConfigChange?: (patch: Partial<Pick<AiVideoProject, 'subtitle'>>) => void;
  /** 数字人持久化变更前调用（撤销历史入栈） */
  onBeforeChange?: () => void;
  /** 媒体叠加层选中 id（编辑态） */
  selectedMediaId?: string | null;
  onSelectMedia?: (id: string) => void;
  onDeleteMedia?: (id: string) => void;
  onMediaGeometry?: (
    id: string,
    patch: Partial<Pick<PptMediaOverlay, 'x' | 'y' | 'width'>>,
    persist: boolean
  ) => void;
  children?: React.ReactNode;
}) {
  const { pageRect, dh } = resolvePptLayoutView(project, shot);
  /** 画布背景：系统背景预设 / 本地上传图片 > 模板氛围背景 */
  const backgroundValue = project.pptConfig?.background;
  const backgroundPreset = PPT_BACKGROUND_PRESETS.find((item) => item.id === backgroundValue);
  const backgroundCustomUrl = backgroundValue?.startsWith('data:') ? backgroundValue : null;
  const backdrop =
    backgroundPreset?.css ??
    TEMPLATE_BACKDROP[project.params.style] ??
    TEMPLATE_BACKDROP.simpleCourseware;
  const subtitleText = script.split(/[。！？\n]/).find((line) => line.trim()) ?? '';
  /** 智能进度条：开关与章节（容错片段数变化） */
  const progressEnabled = project.pptConfig?.progressBar === true;
  const progressChapters = progressEnabled ? resolveProgressChapters(project) : [];
  /** 字幕样式跟随字幕配置（与文字生成视频编辑预览页一致） */
  const subtitleConfig = project.subtitle;
  const subtitleFontSize =
    SUBTITLE_FONT_SIZE_MAP[subtitleConfig?.fontSize ?? 'medium'] ?? SUBTITLE_FONT_SIZE_MAP.medium;
  const subtitleColor = subtitleConfig?.color ?? '#FFFFFF';

  return (
    <Box
      position="relative"
      w="100%"
      sx={{ aspectRatio: '16 / 9', containerType: 'inline-size' }}
      borderRadius="16px"
      overflow="hidden"
      bg={backdrop}
      boxShadow="0 4px 20px rgba(0,0,0,0.10)"
    >
      {/* 自定义背景图（本地上传，铺满画布） */}
      {backgroundCustomUrl && (
        <Image
          src={backgroundCustomUrl}
          alt=""
          position="absolute"
          inset={0}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      )}

      {/* PPT 页面（按布局摆放于氛围背景之上） */}
      <Image
        src={shot.imageUrl}
        alt={shot.title}
        position="absolute"
        left={pageRect.left}
        top={pageRect.top}
        w={pageRect.w}
        h={pageRect.h}
        objectFit="cover"
        borderRadius={pageRect.radius}
        boxShadow={pageRect.radius === 0 ? 'none' : '0 6px 24px rgba(0,0,0,0.18)'}
        bg="white"
      />

      {/* 媒体叠加层（素材添加到画面：图片/视频，可移动/缩放/删除） */}
      <MediaOverlayLayer
        overlays={shot.mediaOverlays ?? []}
        selectedId={selectedMediaId ?? null}
        interactive={textInteractive}
        onSelect={onSelectMedia}
        onDelete={onDeleteMedia}
        onGeometry={onMediaGeometry}
      />

      {/* 数字人（布局为无数字人时不展示；可交互时支持拖拽/缩放/关闭，与成片工作台一致） */}
      {/* 可交互时始终渲染交互层（内部处理可见性，保证关闭数字人后询问条不随组件卸载） */}
      {onProjectChange && (
        <DhCanvasLayer
          project={project}
          shot={shot}
          onProjectChange={onProjectChange}
          onBeforeChange={onBeforeChange}
        />
      )}
      {dh && !onProjectChange && (
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
          border="1px solid rgba(255,255,255,0.85)"
          boxShadow="0 4px 16px rgba(0,0,0,0.28)"
          bg="white"
          pointerEvents="none"
        />
      )}

      {/* AI 生成标识 */}
      {aiBadgeOn && (
        <Text
          position="absolute"
          top={3}
          right={3}
          fontSize="10px"
          color="white"
          bg="blackAlpha.600"
          borderRadius="6px"
          px={2}
          py={0.5}
        >
          AI生成
        </Text>
      )}

      {/* 智能进度条（画布底部章节进度条，标题展示在进度条上） */}
      {progressEnabled && progressChapters.length > 0 && (
        <ProgressChapterBar
          chapters={progressChapters}
          shotIndex={shotIndex}
          onSelectChapter={onSelectShot}
        />
      )}

      {/* 播放进度（播放片段时展示） */}
      {playPercent !== undefined && (
        <Box
          position="absolute"
          left={0}
          right={0}
          bottom={progressEnabled ? '22px' : subtitleOn && subtitleText ? '52px' : 0}
          h="3px"
          bg="blackAlpha.300"
        >
          <Box h="100%" w={`${playPercent}%`} bg="white" />
        </Box>
      )}

      {/* 字幕条（可配置时点击弹出字幕设置，与成片工作台一致） */}
      {subtitleOn && subtitleText && (
        <Popover placement="top" gutter={8} isLazy>
          {({ onClose }) => (
            <>
              <PopoverTrigger>
                <Flex
                  as="button"
                  type="button"
                  position="absolute"
                  left="50%"
                  bottom={progressEnabled ? '30px' : 3}
                  transform="translateX(-50%)"
                  maxW="86%"
                  bg="blackAlpha.700"
                  borderRadius="8px"
                  px={3}
                  py={1.5}
                  justify="center"
                  cursor={onConfigChange ? 'pointer' : 'default'}
                >
                  <Text
                    fontSize={subtitleFontSize}
                    color={subtitleColor}
                    noOfLines={1}
                    textAlign="center"
                  >
                    {highlightSubtitle(subtitleText, shot.subtitleHighlights ?? [])}
                  </Text>
                </Flex>
              </PopoverTrigger>
              {onConfigChange && subtitleConfig && (
                <PopoverContent w="230px" borderRadius="12px" boxShadow="lg">
                  <PopoverBody p={4}>
                    <SubtitleSettings
                      subtitle={subtitleConfig}
                      onPatch={(patch) =>
                        onConfigChange({ subtitle: { ...subtitleConfig, ...patch } })
                      }
                      onClose={onClose}
                    />
                  </PopoverBody>
                </PopoverContent>
              )}
            </>
          )}
        </Popover>
      )}

      {/* 文本框叠加层（播放片段末段触发出场动画） */}
      <TextOverlayLayer
        overlays={shot.textOverlays ?? []}
        selectedId={selectedTextId ?? null}
        interactive={textInteractive}
        exiting={playPercent !== undefined && playPercent >= 80}
        onSelect={onSelectText}
        onDelete={onDeleteText}
        onGeometry={onTextGeometry}
      />

      {children}
    </Box>
  );
}
