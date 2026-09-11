'use client';

/**
 * PPT/文档转视频 预览编辑 - 数字人画布交互层
 * 与文字生成视频编辑预览（成片工作台）交互一致：
 * 点击选中（边框 + 四角缩放手柄 + 关闭按钮）、拖拽移动、四角手柄等比缩放、关闭隐藏当前片段数字人
 * 调整完成先写入当前片段覆盖，再弹出画面顶部询问条（同步到所有片段 / 仅此片段）
 */
import { useEffect, useRef, useState } from 'react';
import { Box, Flex, IconButton, Image } from '@chakra-ui/react';
import { X } from 'lucide-react';
import type {
  AiVideoProject,
  DigitalHumanPlacement,
  StoryboardShot
} from '@/teacher/types/aiVideo';
import {
  clampDigitalHumanPlacement,
  setDigitalHumanEnabled,
  syncDigitalHumanPlacement,
  updateShotDigitalHuman
} from '@/teacher/api/aiVideo';
import { AI_VIDEO_PRIMARY } from '../../../constants';
import { DigitalHumanCanvasBar } from '../../studio/DigitalHumanCanvasBar';
import { resolvePptLayoutView } from './ShotCanvas';

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

type AskState = { kind: 'move' | 'resize' | 'remove'; placement?: DigitalHumanPlacement } | null;

export function DhCanvasLayer({
  project,
  shot,
  onProjectChange,
  onBeforeChange
}: {
  project: AiVideoProject;
  shot: StoryboardShot;
  onProjectChange: (project: AiVideoProject) => void;
  /** 每次持久化变更前调用（撤销历史入栈） */
  onBeforeChange?: () => void;
}) {
  const { pageRect: _pageRect, dh } = resolvePptLayoutView(project, shot);
  const [selected, setSelected] = useState(false);
  const [ask, setAsk] = useState<AskState>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeScale, setResizeScale] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startScale: number;
    sx: number;
    sy: number;
  } | null>(null);

  /* 切换片段后清除本地调整态（含询问条） */
  useEffect(() => {
    setDragPos(null);
    setResizeScale(null);
    setSelected(false);
    setAsk(null);
  }, [shot.id]);

  /* 项目数据回写后仅清除拖拽/缩放临时态，保留作用域询问条直至用户选择 */
  useEffect(() => {
    setDragPos(null);
    setResizeScale(null);
  }, [project.updatedAt]);

  /* 点击画面其他位置取消选中 */
  useEffect(() => {
    if (!selected) return undefined;
    const onDocDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [selected]);

  /* 关闭数字人后 dh 为 null，但询问条需保持展示直至用户选择作用域 */
  if (!dh && !ask) return null;

  const basePlacement = dh?.placement ?? { x: 86, y: 78, scale: 1 };
  const placement: DigitalHumanPlacement = {
    ...basePlacement,
    ...(dragPos ?? {}),
    scale: resizeScale ?? basePlacement.scale
  };
  const widthPercent = (dh?.widthPercent ?? 0) * (placement.scale / basePlacement.scale || 1);

  /** 调整完成：写入当前片段覆盖并询问作用域 */
  const commit = (next: DigitalHumanPlacement, kind: 'move' | 'resize') => {
    onBeforeChange?.();
    const clamped = clampDigitalHumanPlacement(next);
    void updateShotDigitalHuman(project.id, shot.id, { placement: clamped }).then((updated) => {
      if (updated) onProjectChange(updated);
    });
    setAsk({ kind, placement: clamped });
  };

  /** 关闭：当前片段隐藏并询问作用域 */
  const handleRemove = () => {
    onBeforeChange?.();
    setSelected(false);
    void updateShotDigitalHuman(project.id, shot.id, { hidden: true }).then((updated) => {
      if (updated) onProjectChange(updated);
    });
    setAsk({ kind: 'remove' });
  };

  /** 作用域：仅此片段（覆盖已写入，直接收起询问条） */
  const handleThisShot = () => setAsk(null);

  /** 作用域：同步到所有片段（移动/缩放写全局配置；关闭则全局停用数字人） */
  const handleSyncAll = () => {
    onBeforeChange?.();
    if (ask?.kind === 'remove') {
      void setDigitalHumanEnabled(project.id, false).then((updated) => {
        if (updated) onProjectChange(updated);
      });
    } else if (ask?.placement) {
      void syncDigitalHumanPlacement(project.id, ask.placement).then((updated) => {
        if (updated) onProjectChange(updated);
      });
    }
    setAsk(null);
  };

  /* ---- 拖拽移动 ---- */
  const handlePointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    setSelected(true);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: placement.x,
      baseY: placement.y,
      moved: false
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const stage = rootRef.current?.parentElement;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) drag.moved = true;
    setDragPos({ x: drag.baseX + dx, y: drag.baseY + dy });
  };
  const handlePointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved || !dragPos) {
      setDragPos(null);
      return;
    }
    const next = clampDigitalHumanPlacement({ ...placement, x: dragPos.x, y: dragPos.y });
    setDragPos(null);
    commit(next, 'move');
  };

  /* ---- 四角手柄等比缩放 ---- */
  const handleResizeDown = (event: React.PointerEvent, sx: number, sy: number) => {
    event.stopPropagation();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startScale: placement.scale,
      sx,
      sy
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handleResizeMove = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    const stage = rootRef.current?.parentElement;
    if (!resize || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((event.clientX - resize.startX) / rect.width) * 100 * resize.sx;
    const dy = ((event.clientY - resize.startY) / rect.height) * 100 * resize.sy;
    const delta = (dx + dy) / 20;
    setResizeScale(resize.startScale + delta);
  };
  const handleResizeUp = () => {
    const resize = resizeRef.current;
    resizeRef.current = null;
    if (resizeScale === null || resize === null) return;
    const next = clampDigitalHumanPlacement({ ...placement, scale: resizeScale });
    setResizeScale(null);
    commit(next, 'resize');
  };

  return (
    <>
      {dh && (
        <Box
          ref={rootRef}
          position="absolute"
          left={`${placement.x}%`}
          top={`${placement.y}%`}
          transform="translate(-50%, -50%)"
          w={`${widthPercent}%`}
          sx={{ aspectRatio: String(dh.aspect) }}
          cursor="move"
          userSelect="none"
          zIndex={selected ? 4 : 2}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="button"
          aria-label="digital human"
        >
          <Image
            src={dh.src}
            alt=""
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition={dh.objectPosition}
            borderRadius={dh.borderRadius}
            border={
              selected ? `1.5px dashed ${AI_VIDEO_PRIMARY}` : '1px solid rgba(255,255,255,0.85)'
            }
            boxShadow="0 4px 16px rgba(0,0,0,0.28)"
            bg="white"
            pointerEvents="none"
          />
          {selected && (
            <>
              {/* 四角缩放手柄 */}
              {DH_RESIZE_HANDLES.map((handle) => (
                <Box
                  key={handle.key}
                  position="absolute"
                  w="12px"
                  h="12px"
                  borderRadius="3px"
                  bg="white"
                  border="2px solid"
                  borderColor={AI_VIDEO_PRIMARY}
                  boxShadow="0 1px 4px rgba(0,0,0,0.3)"
                  cursor={handle.cursor}
                  style={handle.style}
                  onPointerDown={(event: React.PointerEvent) =>
                    handleResizeDown(event, handle.sx, handle.sy)
                  }
                  onPointerMove={handleResizeMove}
                  onPointerUp={handleResizeUp}
                />
              ))}
              {/* 关闭按钮 */}
              <IconButton
                aria-label="remove digital human"
                icon={<X size={10} />}
                size="xs"
                minW="18px"
                h="18px"
                borderRadius="full"
                bg="#171F38"
                color="white"
                position="absolute"
                top="-9px"
                right="-9px"
                boxShadow="0 1px 4px rgba(0,0,0,0.35)"
                _hover={{ bg: 'black' }}
                onPointerDown={(event: React.PointerEvent) => event.stopPropagation()}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  handleRemove();
                }}
              />
            </>
          )}
        </Box>
      )}

      {/* 画面顶部询问条：同步到所有片段 / 仅此片段（与成片工作台一致） */}
      {ask && (
        <DigitalHumanCanvasBar
          kind={ask.kind}
          onSyncAll={handleSyncAll}
          onThisShot={handleThisShot}
        />
      )}
    </>
  );
}
