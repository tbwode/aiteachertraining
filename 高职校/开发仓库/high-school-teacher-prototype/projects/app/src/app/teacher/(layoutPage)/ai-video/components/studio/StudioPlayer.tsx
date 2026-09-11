'use client';

/**
 * AI视频课 工作台 - 播放器（编辑器版式）
 * 无原生控制条（仅时间轴播放按钮控制播放）；字幕叠加
 * 数字人叠加层：可拖拽移动；选中显示边框（缩放手柄+关闭）与应用状态条（切换范围/撤销）；删除后画面无占位图标
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  chakra,
  Flex,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text
} from '@chakra-ui/react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  AiBadgePosition,
  AiVideoProject,
  DigitalHumanAvatarId,
  DigitalHumanMode,
  DigitalHumanPlacement,
  DigitalHumanSnapshot
} from '@/teacher/types/aiVideo';
import {
  clampDigitalHumanPlacement,
  INTRO_OUTRO_DURATION,
  setDigitalHumanEnabled,
  syncDigitalHumanPlacement,
  updateShotDigitalHuman
} from '@/teacher/api/aiVideo';
import {
  AI_BADGE_POSITION_OPTIONS,
  AI_VIDEO_PRIMARY,
  CARD_SHADOW,
  DIGITAL_HUMAN_AVATARS
} from '../../constants';
import { SubtitleSettings } from './SubtitleSettings';

export type SubtitleCue = {
  id: string;
  start: number;
  end: number;
  text: string;
};

/** 由分镜计算字幕时间轴（含片头偏移） */
export function computeCues(project: AiVideoProject): SubtitleCue[] {
  const introOffset = project.intro && project.intro !== 'none' ? INTRO_OUTRO_DURATION : 0;
  let cursor = introOffset;
  return project.storyboard.map((shot) => {
    const start = cursor;
    cursor += Number(shot.duration) || 0;
    return { id: shot.id, start, end: cursor, text: shot.narration };
  });
}

const FONT_SIZE_MAP = { small: '13px', medium: '17px', large: '22px' } as const;

const ChakraVideo = chakra('video');

type StudioPlayerProps = {
  project: AiVideoProject;
  videoRef: React.RefObject<HTMLVideoElement>;
  businessTime: number;
  isPlaying?: boolean;
  onLoadedMeta: (duration: number) => void;
  onTimeUpdate: () => void;
  onPlayStateChange: (playing: boolean) => void;
  /** 画布内配置修改（字幕样式 / AI 标识位置），即改即存 */
  onConfigChange: (
    patch: Partial<Pick<AiVideoProject, 'subtitle' | 'aiBadge' | 'aiBadgePosition'>>
  ) => void;
  /** 数字人操作（拖拽/缩放/关闭）写回后的最新项目 */
  onProjectChange: (project: AiVideoProject) => void;
  /** 数字人调整完成（含调整前快照），父级在设置栏底部展示状态条 */
  onRequestSync: (payload: DhBarAskPayload) => void;
  /** 选中/取消选中数字人（选中时父级打开数字人设置栏并展示状态条） */
  onSelect: (selected: boolean) => void;
};

/** 「AI 生成」标识四角定位样式 */
const BADGE_POSITION_STYLE: Record<AiBadgePosition, Record<string, string>> = {
  topRight: { top: '10px', right: '10px' },
  topLeft: { top: '10px', left: '10px' },
  bottomRight: { bottom: '16px', right: '16px' },
  bottomLeft: { bottom: '16px', left: '16px' }
};

/** 数字人三种展示模式的图形样式（半身/全身/悬浮头像）；宽高比固定，拖动/缩放只改 scale，比例保持不变 */
export const DH_FIGURE_STYLES: Record<
  DigitalHumanMode,
  {
    w: (vertical: boolean) => number;
    h: (vertical: boolean) => number;
    borderRadius: string;
    objectPosition: string;
  }
> = {
  halfBody: {
    w: (v) => (v ? 76 : 96),
    h: (v) => (v ? 88 : 108),
    borderRadius: '16px',
    objectPosition: 'top'
  },
  fullBody: {
    w: (v) => (v ? 64 : 80),
    h: (v) => (v ? 122 : 152),
    borderRadius: '14px',
    objectPosition: 'center'
  },
  floatingAvatar: {
    w: (v) => (v ? 52 : 64),
    h: (v) => (v ? 52 : 64),
    borderRadius: 'full',
    objectPosition: 'center'
  }
};

/** 数字人状态条：ask-调整后询问作用域；applied-已应用状态（可切换范围/撤销） */
export type DhBar =
  | { stage: 'ask'; kind: 'move' | 'resize' | 'remove'; placement?: DigitalHumanPlacement }
  | {
      stage: 'applied';
      scope: 'all' | 'shot';
      kind?: 'avatar';
      /** 形象切换时用户新选的形象（避免依赖可能未刷新的 project prop） */
      avatar?: DigitalHumanAvatarId;
    };

/** 叠加层调整完成后的回调载荷（含调整前快照，用于「撤销」） */
export type DhBarAskPayload = {
  kind: 'move' | 'resize' | 'remove';
  placement?: DigitalHumanPlacement;
  snapshot: DigitalHumanSnapshot;
};

/** 数字人边框缩放手柄（四角）：sx/sy 为向外方向系数 */
const DH_RESIZE_HANDLES: Array<{
  key: string;
  sx: number;
  sy: number;
  cursor: string;
  style: Record<string, string>;
}> = [
  { key: 'tl', sx: -1, sy: -1, cursor: 'nwse-resize', style: { left: '-6px', top: '-6px' } },
  { key: 'tr', sx: 1, sy: -1, cursor: 'nesw-resize', style: { right: '-6px', top: '-6px' } },
  { key: 'bl', sx: -1, sy: 1, cursor: 'nesw-resize', style: { left: '-6px', bottom: '-6px' } },
  { key: 'br', sx: 1, sy: 1, cursor: 'nwse-resize', style: { right: '-6px', bottom: '-6px' } }
];

/**
 * 数字人叠加层：拖拽移动 / 选中边框（缩放手柄 + 关闭）/ 分镜级覆盖
 * 调整完成先写入当前分镜覆盖（附调整前快照），再弹顶部状态条询问作用域；删除后画面无占位图标
 */
function DigitalHumanOverlay({
  project,
  activeShotId,
  isVertical,
  isPlaying,
  onProjectChange,
  onRequestSync,
  onSelect
}: {
  project: AiVideoProject;
  /** 当前播放头命中的分镜 id（「仅此片段」操作的作用对象） */
  activeShotId: string | null;
  isVertical: boolean;
  isPlaying: boolean;
  onProjectChange: (project: AiVideoProject) => void;
  /** 调整完成后请求顶部状态条（含调整前快照，用于撤销） */
  onRequestSync: (payload: DhBarAskPayload) => void;
  /** 选中/取消选中数字人（选中时父级展示应用状态条） */
  onSelect: (selected: boolean) => void;
}) {
  const { t } = useTranslation('teacher');
  const config = project.digitalHuman!;
  const override = activeShotId
    ? project.storyboard.find((shot) => shot.id === activeShotId)?.digitalHumanOverride
    : undefined;
  const avatar =
    DIGITAL_HUMAN_AVATARS.find((item) => item.id === (override?.avatar ?? config.avatar)) ??
    DIGITAL_HUMAN_AVATARS[0];
  const hidden = override?.hidden ?? false;
  /* 分镜覆盖优先；覆盖缺失 scale 时回退全局缩放，保证拖动后数字人比例保持不变 */
  const placement: DigitalHumanPlacement = { ...config.placement, ...override?.placement };

  const [selected, setSelected] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeScale, setResizeScale] = useState<number | null>(null);
  /** 已提交待数据回写的摆放（避免回写延迟导致画面弹回旧值） */
  const [pendingPlacement, setPendingPlacement] = useState<DigitalHumanPlacement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    curX: number;
    curY: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    sx: number;
    sy: number;
    startX: number;
    startY: number;
    startScale: number;
    curScale: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const mode = config.mode ?? 'floatingAvatar';
  const figureStyle = DH_FIGURE_STYLES[mode];
  const effective = pendingPlacement ?? placement;
  const pos = dragPos ?? effective;
  const scale = resizeScale ?? effective.scale;
  const figW = figureStyle.w(isVertical) * scale;
  const figH = figureStyle.h(isVertical) * scale;

  /* 提交后等待项目数据回写（含撤销等外部更新）：updatedAt 变化即清除 pending，兜底 3 秒超时 */
  useEffect(() => {
    setPendingPlacement(null);
  }, [project.updatedAt]);
  useEffect(() => {
    if (!pendingPlacement) return;
    const timer = setTimeout(() => setPendingPlacement(null), 3000);
    return () => clearTimeout(timer);
  }, [pendingPlacement]);

  /* 点击画面其他位置时取消选中 */
  useEffect(() => {
    if (!selected) return;
    const onDocDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setSelected(false);
        onSelect(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [selected, onSelect]);

  /** 构建当前数字人状态快照（调整前调用，用于「撤销」整体还原） */
  const buildSnapshot = (): DigitalHumanSnapshot => ({
    config: { ...config, placement: { ...config.placement } },
    overrides: project.storyboard.map((shot) => ({
      shotId: shot.id,
      override: shot.digitalHumanOverride
        ? {
            ...shot.digitalHumanOverride,
            placement: shot.digitalHumanOverride.placement
              ? { ...shot.digitalHumanOverride.placement }
              : undefined
          }
        : undefined
    }))
  });

  /** 调整完成：优先写入当前分镜覆盖并弹顶部状态条（附调整前快照）；无命中分镜时直接全局同步 */
  const commitPlacement = (next: DigitalHumanPlacement, kind: 'move' | 'resize') => {
    const clamped = clampDigitalHumanPlacement(next);
    setPendingPlacement(clamped);
    if (activeShotId) {
      const snapshot = buildSnapshot();
      void updateShotDigitalHuman(project.id, activeShotId, { placement: clamped }).then(
        (updated) => updated && onProjectChange(updated)
      );
      onRequestSync({ kind, placement: clamped, snapshot });
    } else {
      void syncDigitalHumanPlacement(project.id, clamped).then(
        (updated) => updated && onProjectChange(updated)
      );
    }
  };

  /** 关闭：当前分镜隐藏 + 弹顶部状态条（附调整前快照）；无命中分镜时全局停用 */
  const handleRemove = () => {
    setSelected(false);
    onSelect(false);
    if (activeShotId) {
      const snapshot = buildSnapshot();
      void updateShotDigitalHuman(project.id, activeShotId, { hidden: true }).then(
        (updated) => updated && onProjectChange(updated)
      );
      onRequestSync({ kind: 'remove', snapshot });
    } else {
      void setDigitalHumanEnabled(project.id, false).then(
        (updated) => updated && onProjectChange(updated)
      );
    }
  };

  /* ---- 拖拽移动（相对画面容器的百分比换算，偏移量基于按下时的生效位置） ---- */
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: effective.x,
      baseY: effective.y,
      curX: effective.x,
      curY: effective.y,
      moved: false
    };
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const stage = rootRef.current?.offsetParent as HTMLElement | null;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) {
      return;
    }
    drag.moved = true;
    drag.curX = drag.baseX + dx;
    drag.curY = drag.baseY + dy;
    setDragPos({ x: drag.curX, y: drag.curY });
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) {
      suppressClickRef.current = true;
      commitPlacement({ x: drag.curX, y: drag.curY, scale: effective.scale }, 'move');
    }
    setDragPos(null);
  };

  /* ---- 边框缩放手柄（向外位移换算 scale，松开时提交） ---- */
  const handleResizeDown = (event: React.PointerEvent<HTMLElement>, sx: number, sy: number) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      sx,
      sy,
      startX: event.clientX,
      startY: event.clientY,
      startScale: effective.scale,
      curScale: effective.scale
    };
  };
  const handleResizeMove = (event: React.PointerEvent<HTMLElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    const dx = (event.clientX - resize.startX) * resize.sx;
    const dy = (event.clientY - resize.startY) * resize.sy;
    const outward = (dx + dy) / 2;
    /* 等比例缩放：宽高统一乘同一 scale，只按手柄向外位移调整 */
    const next = clampDigitalHumanPlacement({
      ...effective,
      scale: resize.startScale + outward / figureStyle.w(isVertical)
    });
    resize.curScale = next.scale;
    setResizeScale(next.scale);
  };
  const handleResizeUp = (event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    const resize = resizeRef.current;
    resizeRef.current = null;
    if (resize && Math.abs(resize.curScale - resize.startScale) > 0.001) {
      suppressClickRef.current = true;
      commitPlacement({ ...effective, scale: resize.curScale }, 'resize');
    }
    setResizeScale(null);
  };

  const handleFigureClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const next = !selected;
    setSelected(next);
    onSelect(next);
  };

  /* 当前分镜已删除数字人：画面不再展示占位图标 */
  if (hidden) return null;

  return (
    <Box
      ref={rootRef}
      position="absolute"
      left={`${pos.x}%`}
      top={`${pos.y}%`}
      transform="translate(-50%, -50%)"
      zIndex={5}
    >
      {/* 数字人本体（拖拽手柄；选中显示边框 + 缩放手柄 + 关闭） */}
      <Flex direction="column" align="center" gap={1} pointerEvents="none">
        <Box
          position="relative"
          pointerEvents="auto"
          cursor={dragPos ? 'grabbing' : 'grab'}
          borderRadius={figureStyle.borderRadius}
          outline={selected ? `2px solid ${AI_VIDEO_PRIMARY}` : 'none'}
          outlineOffset={selected ? '2px' : '0'}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleFigureClick}
          title={t('aiVideo.studio.digitalHuman.canvas.move')}
        >
          {isPlaying && (
            <Box
              position="absolute"
              inset="-4px"
              borderRadius={figureStyle.borderRadius}
              border="2px solid"
              borderColor="whiteAlpha.700"
              animation="dhPulse 1.6s ease-out infinite"
              pointerEvents="none"
              sx={{
                '@keyframes dhPulse': {
                  '0%': { transform: 'scale(0.9)', opacity: 0.9 },
                  '100%': { transform: 'scale(1.25)', opacity: 0 }
                }
              }}
            />
          )}
          <Image
            src={avatar.src}
            alt=""
            w={`${figW}px`}
            h={`${figH}px`}
            objectFit="cover"
            objectPosition={figureStyle.objectPosition}
            borderRadius={figureStyle.borderRadius}
            border="2px solid rgba(255,255,255,0.9)"
            boxShadow="0 2px 10px rgba(0,0,0,0.35)"
            bg="white"
            draggable={false}
          />
          {selected && (
            <>
              {/* 四角缩放手柄 */}
              {DH_RESIZE_HANDLES.map((handle) => (
                <Box
                  key={handle.key}
                  position="absolute"
                  {...handle.style}
                  w="10px"
                  h="10px"
                  bg="white"
                  border="1.5px solid"
                  borderColor={AI_VIDEO_PRIMARY}
                  borderRadius="3px"
                  cursor={handle.cursor}
                  zIndex={2}
                  onPointerDown={(event: React.PointerEvent<HTMLElement>) =>
                    handleResizeDown(event, handle.sx, handle.sy)
                  }
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeUp}
                  onClick={(event: React.MouseEvent) => event.stopPropagation()}
                />
              ))}
              {/* 关闭按钮（边框右上角上方） */}
              <Flex
                as="button"
                type="button"
                position="absolute"
                top="-26px"
                right="-6px"
                w="18px"
                h="18px"
                borderRadius="full"
                bg="#171F38"
                border="1.5px solid rgba(255,255,255,0.9)"
                color="white"
                align="center"
                justify="center"
                cursor="pointer"
                zIndex={3}
                boxShadow="0 2px 6px rgba(0,0,0,0.35)"
                aria-label={t('aiVideo.studio.digitalHuman.canvas.remove')}
                onPointerDown={(event: React.PointerEvent) => event.stopPropagation()}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  handleRemove();
                }}
              >
                <X size={11} />
              </Flex>
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

export function StudioPlayer({
  project,
  videoRef,
  businessTime,
  isPlaying = false,
  onLoadedMeta,
  onTimeUpdate,
  onPlayStateChange,
  onConfigChange,
  onProjectChange,
  onRequestSync,
  onSelect
}: StudioPlayerProps) {
  const { t } = useTranslation('teacher');
  const cues = useMemo(() => computeCues(project), [project]);
  const isVertical = project.params.ratio === '9:16';

  const subtitle = project.subtitle!;
  const subtitleVisible = subtitle.visible !== false;
  const showAiBadge = project.aiBadge !== false;
  const badgePosition = project.aiBadgePosition ?? 'topRight';
  const activeCue = cues.find((cue) => businessTime >= cue.start && businessTime < cue.end);
  /* 字幕在画面上仅单行展示 */
  const subtitleText = subtitleVisible && activeCue ? activeCue.text : '';

  /* 数字人：启用时叠加在画面上（可拖拽/缩放/关闭），跟随当前分镜讲解；支持分镜级覆盖 */
  const digitalHumanOn = Boolean(project.digitalHuman?.enabled);

  /* 字幕位置：画布内拖动调整（百分比坐标），拖动结束一次性落库 */
  const frameRef = useRef<HTMLDivElement>(null);
  const [subtitlePos, setSubtitlePos] = useState<{ x: number; y: number } | null>(null);
  const subtitlePosRef = useRef<{ x: number; y: number } | null>(null);
  const subtitleDragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const subtitleMovedRef = useRef(false);
  const [isSubtitleSettingsOpen, setIsSubtitleSettingsOpen] = useState(false);

  const savedSubtitlePos = subtitle.position ?? { x: 50, y: 88 };
  const currentSubtitlePos = subtitlePos ?? savedSubtitlePos;

  /* 字幕条宽度：选中后拖拽左右边缘手柄调整（占画面宽度百分比），松手一次性落库 */
  const subtitleBoxRef = useRef<HTMLDivElement>(null);
  const [subtitleWidth, setSubtitleWidth] = useState<number | null>(null);
  const subtitleWidthRef = useRef<number | null>(null);
  const subtitleResizeRef = useRef<{ startX: number; baseWidth: number } | null>(null);
  const currentSubtitleWidth = subtitleWidth ?? subtitle.width ?? null;

  /** 读取当前字幕条实际渲染宽度（未显式设置时按内容自适应宽度计算基准） */
  const measureSubtitleWidth = () => {
    if (!subtitleBoxRef.current || !frameRef.current) return 40;
    return (
      (subtitleBoxRef.current.getBoundingClientRect().width /
        frameRef.current.getBoundingClientRect().width) *
      100
    );
  };

  const handleSubtitleResizeDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const base = subtitle.width ?? measureSubtitleWidth();
    subtitleResizeRef.current = { startX: event.clientX, baseWidth: base };
    subtitleMovedRef.current = true; /* 抑制松手后的 click 触发设置层开关 */
    subtitleWidthRef.current = base;
    setSubtitleWidth(base);
  };

  const handleSubtitleResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const resize = subtitleResizeRef.current;
    if (!resize || !frameRef.current) return;
    const dx =
      ((event.clientX - resize.startX) / frameRef.current.getBoundingClientRect().width) * 100;
    const next = Math.min(96, Math.max(10, resize.baseWidth + dx));
    subtitleWidthRef.current = next;
    setSubtitleWidth(next);
  };

  const handleSubtitleResizeUp = () => {
    const resize = subtitleResizeRef.current;
    if (!resize) return;
    subtitleResizeRef.current = null;
    const finalWidth = subtitleWidthRef.current;
    if (finalWidth != null && Math.abs(finalWidth - (subtitle.width ?? resize.baseWidth)) > 0.1) {
      /* 保留乐观宽度，待落库后由 effect 清除（同位置拖拽） */
      onConfigChange({ subtitle: { ...subtitle, width: Math.round(finalWidth) } });
    } else {
      subtitleWidthRef.current = null;
      setSubtitleWidth(null);
    }
  };

  /* 字幕宽度落库完成后清除乐观宽度 */
  useEffect(() => {
    if (
      subtitleWidth != null &&
      subtitle.width != null &&
      Math.abs(subtitle.width - subtitleWidth) < 0.5
    ) {
      subtitleWidthRef.current = null;
      setSubtitleWidth(null);
    }
  }, [subtitleWidth, subtitle.width]);

  const handleSubtitlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    subtitleDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: savedSubtitlePos.x,
      baseY: savedSubtitlePos.y
    };
    subtitleMovedRef.current = false;
    const initial = { ...savedSubtitlePos };
    subtitlePosRef.current = initial;
    setSubtitlePos(initial);
  };

  const handleSubtitlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = subtitleDragRef.current;
    if (!drag || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    if (
      Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) >
      4
    ) {
      subtitleMovedRef.current = true;
    }
    const next = {
      x: Math.min(
        96,
        Math.max(4, drag.baseX + ((event.clientX - drag.startX) / rect.width) * 100)
      ),
      y: Math.min(
        96,
        Math.max(6, drag.baseY + ((event.clientY - drag.startY) / rect.height) * 100)
      )
    };
    subtitlePosRef.current = next;
    setSubtitlePos(next);
  };

  const handleSubtitlePointerUp = () => {
    const drag = subtitleDragRef.current;
    if (!drag) return;
    subtitleDragRef.current = null;
    const finalPos = subtitlePosRef.current;
    const changed =
      subtitleMovedRef.current &&
      finalPos &&
      (Math.abs(finalPos.x - savedSubtitlePos.x) > 0.1 ||
        Math.abs(finalPos.y - savedSubtitlePos.y) > 0.1);
    if (changed && finalPos) {
      /* 落库为异步：保留乐观位置避免回弹闪烁，由下方 effect 在落库后清除 */
      onConfigChange({ subtitle: { ...subtitle, position: finalPos } });
    } else {
      subtitlePosRef.current = null;
      setSubtitlePos(null);
    }
  };

  /* 字幕位置落库完成（saved 追上拖动结果）后清除乐观位置 */
  useEffect(() => {
    if (
      subtitlePos &&
      Math.abs(savedSubtitlePos.x - subtitlePos.x) < 0.5 &&
      Math.abs(savedSubtitlePos.y - subtitlePos.y) < 0.5
    ) {
      subtitlePosRef.current = null;
      setSubtitlePos(null);
    }
  }, [subtitlePos, savedSubtitlePos.x, savedSubtitlePos.y]);

  return (
    <Flex
      ref={frameRef}
      bg="black"
      borderRadius="14px"
      overflow="hidden"
      justify="center"
      boxShadow={CARD_SHADOW}
      position="relative"
    >
      <ChakraVideo
        ref={videoRef}
        key={project.videoUrl ?? 'empty'}
        src={project.videoUrl ?? undefined}
        poster={project.coverUrl ?? undefined}
        w="100%"
        maxH={isVertical ? '46vh' : '40vh'}
        objectFit="contain"
        bg="black"
        onLoadedMetadata={(event: React.SyntheticEvent<HTMLVideoElement>) =>
          onLoadedMeta(event.currentTarget.duration || 0)
        }
        onTimeUpdate={onTimeUpdate}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
      />
      {/* AI 生成标识：点击可移动位置（四角） */}
      {showAiBadge && (
        <Popover placement="bottom" gutter={6} isLazy>
          <PopoverTrigger>
            <Text
              as="button"
              type="button"
              position="absolute"
              {...BADGE_POSITION_STYLE[badgePosition]}
              fontSize="10px"
              color="white"
              bg="blackAlpha.500"
              borderRadius="4px"
              px={1.5}
              py={0.5}
              cursor="pointer"
              title={t('aiVideo.studio.canvas.badgePosition')}
              onClick={(event: React.MouseEvent) => event.stopPropagation()}
            >
              {t('aiVideo.studio.player.aiBadge')}
            </Text>
          </PopoverTrigger>
          <PopoverContent w="150px" borderRadius="12px" boxShadow="lg">
            <PopoverBody p={2}>
              <Text fontSize="11px" color="gray.400" px={2} py={1}>
                {t('aiVideo.studio.canvas.badgePosition')}
              </Text>
              {AI_BADGE_POSITION_OPTIONS.map((pos) => (
                <Flex
                  key={pos}
                  as="button"
                  type="button"
                  w="100%"
                  align="center"
                  justify="space-between"
                  px={2}
                  py={1.5}
                  borderRadius="8px"
                  fontSize="12px"
                  color={badgePosition === pos ? AI_VIDEO_PRIMARY : 'gray.600'}
                  fontWeight={badgePosition === pos ? 600 : 400}
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => onConfigChange({ aiBadgePosition: pos })}
                >
                  {t(`aiVideo.studio.canvas.position.${pos}`)}
                  {badgePosition === pos && <Check size={13} />}
                </Flex>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}

      {/* 数字人叠加层（可拖拽移动；选中显示边框：缩放手柄/关闭） */}
      {digitalHumanOn && (
        <DigitalHumanOverlay
          project={project}
          activeShotId={activeCue?.id ?? null}
          isVertical={isVertical}
          isPlaying={isPlaying}
          onProjectChange={onProjectChange}
          onRequestSync={onRequestSync}
          onSelect={onSelect}
        />
      )}

      {/* 字幕叠加层：单行展示，可拖动位置；点击选中显示描边与宽度手柄，并弹出字幕设置（字号/颜色/关闭字幕） */}
      {subtitleText && (
        <Popover
          placement="top"
          gutter={8}
          isLazy
          isOpen={isSubtitleSettingsOpen}
          onClose={() => setIsSubtitleSettingsOpen(false)}
        >
          <PopoverTrigger>
            <Box
              ref={subtitleBoxRef}
              as="button"
              type="button"
              position="absolute"
              left={`${currentSubtitlePos.x}%`}
              top={`${currentSubtitlePos.y}%`}
              transform="translate(-50%, -50%)"
              w={currentSubtitleWidth != null ? `${currentSubtitleWidth}%` : undefined}
              maxW={currentSubtitleWidth != null ? undefined : '92%'}
              px={3}
              py={1}
              borderRadius="6px"
              bg="blackAlpha.600"
              outline={isSubtitleSettingsOpen ? `1.5px solid ${AI_VIDEO_PRIMARY}` : undefined}
              cursor={subtitlePos ? 'grabbing' : 'grab'}
              textAlign="center"
              touchAction="none"
              onPointerDown={handleSubtitlePointerDown}
              onPointerMove={handleSubtitlePointerMove}
              onPointerUp={handleSubtitlePointerUp}
              onPointerCancel={handleSubtitlePointerUp}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                /* 拖动后的 click 不触发设置弹层 */
                if (subtitleMovedRef.current) {
                  subtitleMovedRef.current = false;
                  return;
                }
                setIsSubtitleSettingsOpen((prev) => !prev);
              }}
            >
              {/* 永远单行、字号固定：显示数量随字幕条宽度动态截断（省略号） */}
              <Text
                as="span"
                display="block"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                color={subtitle.color ?? '#FFFFFF'}
                fontSize={FONT_SIZE_MAP[subtitle.fontSize ?? 'medium']}
                fontWeight={500}
                lineHeight="1.5"
                textShadow="0 1px 3px rgba(0,0,0,0.8)"
              >
                {subtitleText}
              </Text>
              {/* 选中状态：左右宽度调整手柄 */}
              {isSubtitleSettingsOpen && (
                <>
                  <Box
                    position="absolute"
                    left="-6px"
                    top="50%"
                    transform="translateY(-50%)"
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="white"
                    border={`2px solid ${AI_VIDEO_PRIMARY}`}
                    cursor="ew-resize"
                    onPointerDown={handleSubtitleResizeDown}
                    onPointerMove={handleSubtitleResizeMove}
                    onPointerUp={handleSubtitleResizeUp}
                    onPointerCancel={handleSubtitleResizeUp}
                  />
                  <Box
                    position="absolute"
                    right="-6px"
                    top="50%"
                    transform="translateY(-50%)"
                    w="12px"
                    h="12px"
                    borderRadius="full"
                    bg="white"
                    border={`2px solid ${AI_VIDEO_PRIMARY}`}
                    cursor="ew-resize"
                    onPointerDown={handleSubtitleResizeDown}
                    onPointerMove={handleSubtitleResizeMove}
                    onPointerUp={handleSubtitleResizeUp}
                    onPointerCancel={handleSubtitleResizeUp}
                  />
                </>
              )}
            </Box>
          </PopoverTrigger>
          <PopoverContent w="230px" borderRadius="12px" boxShadow="lg">
            <PopoverBody p={4}>
              <SubtitleSettings
                subtitle={subtitle}
                onPatch={(patch) => onConfigChange({ subtitle: { ...subtitle, ...patch } })}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </Flex>
  );
}
