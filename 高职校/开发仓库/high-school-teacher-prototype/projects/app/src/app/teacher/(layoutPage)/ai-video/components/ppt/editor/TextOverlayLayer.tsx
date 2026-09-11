'use client';

/**
 * PPT/文档转视频 预览编辑 - 画布文本框叠加层
 * 文本框按百分比定位渲染在画面上：点击选中（选中态显示删除按钮与缩放手柄）、
 * 拖拽调整位置、拖动右下角手柄调整大小；文本支持水平/垂直对齐
 * 字号按画布宽度等比缩放（container query cqw）
 * 动画：进场（淡入/四向滑入）随选中片段播放，出场（淡出/四向滑出）在播放片段末段预览
 */
import { useRef } from 'react';
import { Box, IconButton, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  PptTextAlign,
  PptTextAnimation,
  PptTextEnterAnimation,
  PptTextExitAnimation,
  PptTextFont,
  PptTextOverlay,
  PptTextVAlign
} from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY } from '../../../constants';

/** 字体族映射 */
export const TEXT_FONT_STACKS: Record<PptTextFont, string> = {
  sans: `-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`,
  serif: `'SimSun', 'Songti SC', serif`,
  kai: `'KaiTi', 'STKaiti', 'Kaiti SC', serif`,
  yuanti: `'Yuanti SC', 'YouYuan', sans-serif`
};

/** 进出场动画 keyframes（注入一次；transform 自带居中基线 translate(-50%,-50%)） */
const ANIMATION_CSS = `
@keyframes pptTextFadeIn { from { opacity: 0; } to { opacity: var(--ppt-text-opacity, 1); } }
@keyframes pptTextFadeOut { from { opacity: var(--ppt-text-opacity, 1); } to { opacity: 0; } }
@keyframes pptTextSlideInRight {
  from { transform: translate(-50%, -50%) translateX(-28px); opacity: 0; }
  to { transform: translate(-50%, -50%) translateX(0); opacity: var(--ppt-text-opacity, 1); }
}
@keyframes pptTextSlideInLeft {
  from { transform: translate(-50%, -50%) translateX(28px); opacity: 0; }
  to { transform: translate(-50%, -50%) translateX(0); opacity: var(--ppt-text-opacity, 1); }
}
@keyframes pptTextSlideInUp {
  from { transform: translate(-50%, -50%) translateY(24px); opacity: 0; }
  to { transform: translate(-50%, -50%) translateY(0); opacity: var(--ppt-text-opacity, 1); }
}
@keyframes pptTextSlideInDown {
  from { transform: translate(-50%, -50%) translateY(-24px); opacity: 0; }
  to { transform: translate(-50%, -50%) translateY(0); opacity: var(--ppt-text-opacity, 1); }
}
@keyframes pptTextSlideOutRight {
  from { transform: translate(-50%, -50%) translateX(0); opacity: var(--ppt-text-opacity, 1); }
  to { transform: translate(-50%, -50%) translateX(28px); opacity: 0; }
}
@keyframes pptTextSlideOutLeft {
  from { transform: translate(-50%, -50%) translateX(0); opacity: var(--ppt-text-opacity, 1); }
  to { transform: translate(-50%, -50%) translateX(-28px); opacity: 0; }
}
@keyframes pptTextSlideOutUp {
  from { transform: translate(-50%, -50%) translateY(0); opacity: var(--ppt-text-opacity, 1); }
  to { transform: translate(-50%, -50%) translateY(-24px); opacity: 0; }
}
@keyframes pptTextSlideOutDown {
  from { transform: translate(-50%, -50%) translateY(0); opacity: var(--ppt-text-opacity, 1); }
  to { transform: translate(-50%, -50%) translateY(24px); opacity: 0; }
}
`;

const ENTER_ANIMATION_STYLES: Record<Exclude<PptTextEnterAnimation, 'none'>, string> = {
  fadeIn: 'pptTextFadeIn 0.6s ease both',
  slideInRight: 'pptTextSlideInRight 0.6s ease both',
  slideInLeft: 'pptTextSlideInLeft 0.6s ease both',
  slideInUp: 'pptTextSlideInUp 0.6s ease both',
  slideInDown: 'pptTextSlideInDown 0.6s ease both'
};

const EXIT_ANIMATION_STYLES: Record<Exclude<PptTextExitAnimation, 'none'>, string> = {
  fadeOut: 'pptTextFadeOut 0.6s ease both',
  slideOutRight: 'pptTextSlideOutRight 0.6s ease both',
  slideOutLeft: 'pptTextSlideOutLeft 0.6s ease both',
  slideOutUp: 'pptTextSlideOutUp 0.6s ease both',
  slideOutDown: 'pptTextSlideOutDown 0.6s ease both'
};

/** 画布参考宽度（字号基准） */
const TEXT_STAGE_WIDTH = 760;
/** 默认文本框尺寸（画布百分比） */
const DEFAULT_BOX_WIDTH = 40;
const DEFAULT_BOX_HEIGHT = 18;

/** 旧版单动画字段迁移为进场动画 */
export function legacyEnterAnimation(overlay: PptTextOverlay): PptTextEnterAnimation {
  if (overlay.enterAnimation) return overlay.enterAnimation;
  const legacy: PptTextAnimation | undefined = overlay.animation;
  if (legacy === 'slideUp') return 'slideInUp';
  if (legacy === 'fadeIn' || legacy === 'zoomIn' || legacy === 'typewriter') return 'fadeIn';
  return 'none';
}

const TEXT_JUSTIFY: Record<PptTextAlign, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end'
};
const TEXT_VALIGN: Record<PptTextVAlign, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end'
};

function TextBox({
  overlay,
  selected,
  interactive,
  exiting,
  onSelect,
  onDelete,
  onGeometry
}: {
  overlay: PptTextOverlay;
  selected: boolean;
  /** 预览弹窗等非交互场景为 false（仅静态渲染 + 进场动画） */
  interactive: boolean;
  /** 播放片段末段：播放出场动画 */
  exiting: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** 拖拽/缩放位置尺寸变化（persist=true 表示操作结束需持久化） */
  onGeometry?: (
    id: string,
    patch: Partial<Pick<PptTextOverlay, 'x' | 'y' | 'width' | 'height'>>,
    persist: boolean
  ) => void;
}) {
  const { t } = useTranslation('teacher');
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    baseW: number;
    baseH: number;
  } | null>(null);

  const width = overlay.width ?? DEFAULT_BOX_WIDTH;
  const height = overlay.height ?? DEFAULT_BOX_HEIGHT;
  const vAlign = overlay.vAlign ?? 'middle';
  const enterAnimation = legacyEnterAnimation(overlay);
  const exitAnimation = overlay.exitAnimation ?? 'none';
  const animation = exiting
    ? exitAnimation !== 'none'
      ? EXIT_ANIMATION_STYLES[exitAnimation]
      : undefined
    : enterAnimation !== 'none'
      ? ENTER_ANIMATION_STYLES[enterAnimation]
      : undefined;

  const stageRect = () => boxRef.current?.parentElement?.getBoundingClientRect();

  /** 拖拽位置钳制：按文本框尺寸把整个框约束在画布内，保证删除按钮与手柄始终可达 */
  const clampPos = (x: number, y: number) => {
    const xMin = Math.min(50, width / 2);
    const xMax = Math.max(50, 100 - width / 2);
    const yMin = Math.min(50, height / 2);
    const yMax = Math.max(50, 100 - height / 2);
    return {
      x: Math.round(Math.min(xMax, Math.max(xMin, x)) * 10) / 10,
      y: Math.round(Math.min(yMax, Math.max(yMin, y)) * 10) / 10
    };
  };

  /* ---------- 拖拽移动 ---------- */
  const handlePointerDown = (event: React.PointerEvent) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect?.(overlay.id);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: overlay.x,
      baseY: overlay.y
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const rect = stageRect();
    if (!drag || !rect) return;
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    onGeometry?.(overlay.id, clampPos(drag.baseX + dx, drag.baseY + dy), false);
  };
  const handlePointerUp = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    const rect = stageRect();
    if (!drag || !rect) return;
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    if (Math.abs(dx) + Math.abs(dy) < 0.3) return;
    onGeometry?.(overlay.id, clampPos(drag.baseX + dx, drag.baseY + dy), true);
  };

  /* ---------- 右下角缩放手柄 ---------- */
  const handleResizeDown = (event: React.PointerEvent) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect?.(overlay.id);
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseW: width,
      baseH: height
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handleResizeMove = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    const rect = stageRect();
    if (!resize || !rect) return;
    const dw = ((event.clientX - resize.startX) / rect.width) * 100;
    const dh = ((event.clientY - resize.startY) / rect.height) * 100;
    onGeometry?.(
      overlay.id,
      {
        width: Math.min(90, Math.max(10, Math.round(resize.baseW + dw))),
        height: Math.min(60, Math.max(8, Math.round(resize.baseH + dh)))
      },
      false
    );
  };
  const handleResizeUp = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    resizeRef.current = null;
    const rect = stageRect();
    if (!resize || !rect) return;
    const dw = ((event.clientX - resize.startX) / rect.width) * 100;
    const dh = ((event.clientY - resize.startY) / rect.height) * 100;
    onGeometry?.(
      overlay.id,
      {
        width: Math.min(90, Math.max(10, Math.round(resize.baseW + dw))),
        height: Math.min(60, Math.max(8, Math.round(resize.baseH + dh)))
      },
      true
    );
  };

  return (
    <Box
      ref={boxRef}
      position="absolute"
      left={`${overlay.x}%`}
      top={`${overlay.y}%`}
      transform="translate(-50%, -50%)"
      w={`${width}%`}
      h={`${height}%`}
      cursor={interactive ? 'move' : 'default'}
      userSelect="none"
      borderRadius="6px"
      outline={selected ? `1.5px dashed ${AI_VIDEO_PRIMARY}` : 'none'}
      outlineOffset="3px"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        '--ppt-text-opacity': String(overlay.opacity / 100),
        animation
      }}
      opacity={overlay.opacity / 100}
      zIndex={selected ? 3 : 2}
      role={interactive ? 'button' : undefined}
      aria-label={overlay.content}
      overflow="hidden"
    >
      {/* 内容区：水平/垂直对齐 */}
      <Box
        w="100%"
        h="100%"
        display="flex"
        justifyContent={TEXT_JUSTIFY[overlay.align]}
        alignItems={TEXT_VALIGN[vAlign]}
        px={1}
      >
        <Text
          fontFamily={TEXT_FONT_STACKS[overlay.fontFamily]}
          fontSize={`${(overlay.fontSize / TEXT_STAGE_WIDTH) * 100}cqw`}
          fontWeight={600}
          color={overlay.color}
          textAlign={overlay.align}
          lineHeight="1.4"
          whiteSpace="pre-wrap"
          textShadow="0 1px 4px rgba(0,0,0,0.35)"
        >
          {overlay.content}
        </Text>
      </Box>

      {/* 选中态：右上角删除按钮 */}
      {interactive && selected && (
        <IconButton
          aria-label={t('aiVideo.ppt.editor.text.deleteText')}
          icon={<X size={10} />}
          size="xs"
          minW="18px"
          h="18px"
          borderRadius="full"
          bg={AI_VIDEO_PRIMARY}
          color="white"
          position="absolute"
          top="2px"
          right="2px"
          boxShadow="0 1px 4px rgba(0,0,0,0.3)"
          _hover={{ bg: '#A80009' }}
          onPointerDown={(event: React.PointerEvent) => event.stopPropagation()}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
            onDelete?.(overlay.id);
          }}
        />
      )}

      {/* 选中态：右下角缩放手柄 */}
      {interactive && selected && (
        <Box
          position="absolute"
          right="2px"
          bottom="2px"
          w="14px"
          h="14px"
          borderRadius="4px"
          bg="white"
          border="2px solid"
          borderColor={AI_VIDEO_PRIMARY}
          cursor="nwse-resize"
          boxShadow="0 1px 4px rgba(0,0,0,0.3)"
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          aria-label={t('aiVideo.ppt.editor.text.resizeHandle')}
        />
      )}
    </Box>
  );
}

export function TextOverlayLayer({
  overlays,
  selectedId,
  interactive = true,
  exiting = false,
  onSelect,
  onDelete,
  onGeometry
}: {
  overlays: PptTextOverlay[];
  selectedId: string | null;
  interactive?: boolean;
  /** 播放片段末段：触发出场动画 */
  exiting?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGeometry?: (
    id: string,
    patch: Partial<Pick<PptTextOverlay, 'x' | 'y' | 'width' | 'height'>>,
    persist: boolean
  ) => void;
}) {
  if (overlays.length === 0) return null;
  return (
    <>
      <style>{ANIMATION_CSS}</style>
      {overlays.map((overlay) => (
        <TextBox
          key={`${overlay.id}-${overlay.enterAnimation}-${overlay.exitAnimation}-${overlay.content}`}
          overlay={overlay}
          selected={selectedId === overlay.id}
          interactive={interactive}
          exiting={exiting}
          onSelect={onSelect}
          onDelete={onDelete}
          onGeometry={onGeometry}
        />
      ))}
    </>
  );
}
