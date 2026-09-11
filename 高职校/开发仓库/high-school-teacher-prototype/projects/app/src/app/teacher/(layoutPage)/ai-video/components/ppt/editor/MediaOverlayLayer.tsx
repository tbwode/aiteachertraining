'use client';

/**
 * PPT/文档转视频 预览编辑 - 画布媒体叠加层（素材添加到画面）
 * 图片/视频按百分比定位渲染在画面上：点击选中（选中态显示删除按钮与缩放手柄）、
 * 拖拽移动位置、拖动右下角手柄调整大小（保持宽高比）
 */
import { useRef } from 'react';
import { Box, IconButton, Image } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PptMediaOverlay } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY } from '../../../constants';

function MediaBox({
  overlay,
  selected,
  interactive,
  onSelect,
  onDelete,
  onGeometry
}: {
  overlay: PptMediaOverlay;
  selected: boolean;
  interactive: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGeometry?: (
    id: string,
    patch: Partial<Pick<PptMediaOverlay, 'x' | 'y' | 'width'>>,
    persist: boolean
  ) => void;
}) {
  const { t } = useTranslation('teacher');
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const resizeRef = useRef<{ startX: number; baseW: number } | null>(null);

  const stageRect = () => boxRef.current?.parentElement?.getBoundingClientRect();

  /** 拖拽位置钳制：按叠加层尺寸把整个框约束在画布内（16:9 画布，高% = 宽% × 16/9 ÷ 宽高比） */
  const clampPos = (x: number, y: number) => {
    const heightPct = (overlay.width * (16 / 9)) / Math.max(0.1, overlay.aspect);
    const xMin = Math.min(50, overlay.width / 2);
    const xMax = Math.max(50, 100 - overlay.width / 2);
    const yMin = Math.min(50, heightPct / 2);
    const yMax = Math.max(50, 100 - heightPct / 2);
    return {
      x: Math.round(Math.min(xMax, Math.max(xMin, x)) * 10) / 10,
      y: Math.round(Math.min(yMax, Math.max(yMin, y)) * 10) / 10
    };
  };

  /* ---- 拖拽移动 ---- */
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

  /* ---- 缩放手柄（保持宽高比，仅调宽度） ---- */
  const handleResizeDown = (event: React.PointerEvent) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect?.(overlay.id);
    resizeRef.current = { startX: event.clientX, baseW: overlay.width };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handleResizeMove = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    const rect = stageRect();
    if (!resize || !rect) return;
    const dw = ((event.clientX - resize.startX) / rect.width) * 100;
    onGeometry?.(
      overlay.id,
      { width: Math.min(90, Math.max(5, Math.round(resize.baseW + dw))) },
      false
    );
  };
  const handleResizeUp = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    resizeRef.current = null;
    const rect = stageRect();
    if (!resize || !rect) return;
    const dw = ((event.clientX - resize.startX) / rect.width) * 100;
    onGeometry?.(
      overlay.id,
      { width: Math.min(90, Math.max(5, Math.round(resize.baseW + dw))) },
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
      w={`${overlay.width}%`}
      sx={{ aspectRatio: String(overlay.aspect) }}
      cursor={interactive ? 'move' : 'default'}
      userSelect="none"
      borderRadius="8px"
      outline={selected ? `1.5px dashed ${AI_VIDEO_PRIMARY}` : 'none'}
      outlineOffset="3px"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      zIndex={selected ? 3 : 2}
      role={interactive ? 'button' : undefined}
      aria-label={t('aiVideo.ppt.editor.material.overlayLabel')}
    >
      {overlay.type === 'image' ? (
        <Image
          src={overlay.url}
          alt=""
          w="100%"
          h="100%"
          objectFit="cover"
          borderRadius="8px"
          boxShadow="0 2px 10px rgba(0,0,0,0.22)"
          pointerEvents="none"
        />
      ) : (
        <Box
          as="video"
          src={overlay.url}
          w="100%"
          h="100%"
          objectFit="cover"
          borderRadius="8px"
          boxShadow="0 2px 10px rgba(0,0,0,0.22)"
          pointerEvents="none"
          muted
          loop
          autoPlay
          playsInline
        />
      )}

      {/* 选中态：右上角删除按钮 */}
      {interactive && selected && (
        <IconButton
          aria-label={t('aiVideo.ppt.editor.material.deleteOverlay')}
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

export function MediaOverlayLayer({
  overlays,
  selectedId,
  interactive = true,
  onSelect,
  onDelete,
  onGeometry
}: {
  overlays: PptMediaOverlay[];
  selectedId: string | null;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onGeometry?: (
    id: string,
    patch: Partial<Pick<PptMediaOverlay, 'x' | 'y' | 'width'>>,
    persist: boolean
  ) => void;
}) {
  if (overlays.length === 0) return null;
  return (
    <>
      {overlays.map((overlay) => (
        <MediaBox
          key={overlay.id}
          overlay={overlay}
          selected={selectedId === overlay.id}
          interactive={interactive}
          onSelect={onSelect}
          onDelete={onDelete}
          onGeometry={onGeometry}
        />
      ))}
    </>
  );
}
