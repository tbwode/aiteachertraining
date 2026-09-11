'use client';

/**
 * PPT/文档转视频 预览编辑 - 智能进度条编辑器（悬浮卡片）
 * 显示开关；章节标题修改（点击进入编辑）、删除；拖动章节边界调整包含的片段数；
 * 删除后可添加标题；智能生成进度（按片段内容自动划分章节）
 */
import { useRef, useState } from 'react';
import { Box, Flex, IconButton, Image, Input, Switch, Text, VStack } from '@chakra-ui/react';
import { Activity, Plus, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoProject, PptProgressChapter } from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  AI_VIDEO_PRIMARY_HOVER,
  CARD_SHADOW
} from '../../../constants';

export function ProgressEditor({
  project,
  chapters,
  enabled,
  onToggleEnabled,
  onGenerate,
  onRename,
  onDelete,
  onResize,
  onClose
}: {
  project: AiVideoProject;
  chapters: PptProgressChapter[];
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onGenerate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  /** 调整章节包含片段数（相邻章节互补，persist=true 时落库） */
  onResize: (id: string, count: number, persist: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('teacher');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const chipsRowRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<{
    id: string;
    startX: number;
    baseCount: number;
    nextBaseCount: number;
    pxPerShot: number;
  } | null>(null);

  const totalShots = chapters.reduce((acc, chapter) => acc + chapter.count, 0);

  /* ---- 拖动章节右边界调整包含片段数（与下一章互补） ---- */
  const handleBoundaryDown = (
    event: React.PointerEvent,
    chapter: PptProgressChapter,
    nextChapter: PptProgressChapter
  ) => {
    event.stopPropagation();
    const rowWidth = chipsRowRef.current?.getBoundingClientRect().width ?? 1;
    resizeRef.current = {
      id: chapter.id,
      startX: event.clientX,
      baseCount: chapter.count,
      nextBaseCount: nextChapter.count,
      pxPerShot: rowWidth / Math.max(1, totalShots)
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const handleBoundaryMove = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    if (!resize) return;
    const deltaShots = Math.round((event.clientX - resize.startX) / resize.pxPerShot);
    // 允许拖到 0：对侧分段（含未设置标题的分段）被完全吸收合并
    const next = Math.min(
      resize.baseCount + resize.nextBaseCount,
      Math.max(0, resize.baseCount + deltaShots)
    );
    onResize(resize.id, next, false);
  };
  const handleBoundaryUp = (event: React.PointerEvent) => {
    const resize = resizeRef.current;
    resizeRef.current = null;
    if (!resize) return;
    const deltaShots = Math.round((event.clientX - resize.startX) / resize.pxPerShot);
    const next = Math.min(
      resize.baseCount + resize.nextBaseCount,
      Math.max(0, resize.baseCount + deltaShots)
    );
    onResize(resize.id, next, true);
  };

  /* ---- 标题编辑 ---- */
  const commitRename = () => {
    if (editingId && editingText.trim()) onRename(editingId, editingText.trim());
    setEditingId(null);
    setEditingText('');
  };

  /* 章节 → 片段缩略图分组 */
  let shotCursor = 0;
  const chapterShots = chapters.map((chapter) => {
    const start = shotCursor;
    shotCursor += chapter.count;
    return { chapter, start, shots: project.storyboard.slice(start, shotCursor) };
  });

  return (
    <Box bg="white" borderRadius="16px" boxShadow="0 8px 32px rgba(0,0,0,0.16)" p={4}>
      {/* 头部：标题 + 显示开关 + 智能生成 + 关闭 */}
      <Flex align="center" gap={3} mb={3}>
        <Flex align="center" gap={1.5}>
          <Flex
            w="22px"
            h="22px"
            borderRadius="8px"
            bg={AI_VIDEO_PRIMARY_BG}
            color={AI_VIDEO_PRIMARY}
            align="center"
            justify="center"
          >
            <Activity size={13} />
          </Flex>
          <Text fontSize="14px" fontWeight={600} color="gray.800">
            {t('aiVideo.ppt.editor.progress.title')}
          </Text>
        </Flex>
        <Flex align="center" gap={1.5}>
          <Text fontSize="12px" color="gray.500">
            {t('aiVideo.ppt.editor.progress.show')}
          </Text>
          <Switch
            size="sm"
            colorScheme="red"
            isChecked={enabled}
            onChange={(event) => onToggleEnabled(event.target.checked)}
          />
        </Flex>
        <Box flex="1" />
        <Button
          size="sm"
          variant="primary"
          bg={AI_VIDEO_PRIMARY}
          borderColor={AI_VIDEO_PRIMARY}
          _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
          leftIcon={<Sparkles size={13} />}
          onClick={onGenerate}
        >
          {t('aiVideo.ppt.editor.progress.generate')}
        </Button>
        <IconButton
          aria-label={t('aiVideo.common.close')}
          icon={<X size={15} />}
          size="sm"
          variant="ghost"
          color="gray.400"
          onClick={onClose}
        />
      </Flex>

      {/* 章节标题条（宽度按包含片段数占比，拖动边界调整） */}
      <Flex ref={chipsRowRef} gap={1.5} mb={1} align="stretch">
        {chapters.map((chapter, index) => {
          const editing = editingId === chapter.id;
          return (
            <Flex
              key={chapter.id}
              flex={chapter.count}
              minW={0}
              position="relative"
              align="center"
              justify="center"
              gap={1}
              px={2}
              py={1.5}
              borderRadius="full"
              border="1px solid"
              borderColor={editing ? AI_VIDEO_PRIMARY : '#D9DEE7'}
              bg={editing ? AI_VIDEO_PRIMARY_BG : 'white'}
            >
              {editing ? (
                <Input
                  size="xs"
                  value={editingText}
                  autoFocus
                  maxLength={20}
                  borderRadius="full"
                  borderColor={AI_VIDEO_PRIMARY}
                  _focusVisible={{ boxShadow: 'none' }}
                  onChange={(event) => setEditingText(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename();
                    if (event.key === 'Escape') {
                      setEditingId(null);
                      setEditingText('');
                    }
                  }}
                />
              ) : chapter.title ? (
                <Text
                  fontSize="12px"
                  color="gray.700"
                  noOfLines={1}
                  cursor="text"
                  title={t('aiVideo.ppt.editor.progress.editTitle')}
                  onClick={() => {
                    setEditingId(chapter.id);
                    setEditingText(chapter.title);
                  }}
                >
                  {chapter.title}
                </Text>
              ) : (
                <Flex
                  as="button"
                  type="button"
                  align="center"
                  justify="center"
                  gap={1}
                  w="100%"
                  py={0.5}
                  borderRadius="full"
                  color="gray.400"
                  fontSize="12px"
                  _hover={{ color: AI_VIDEO_PRIMARY }}
                  transition="all 0.15s"
                  onClick={() => {
                    setEditingId(chapter.id);
                    setEditingText('');
                  }}
                >
                  <Plus size={12} />
                  {t('aiVideo.ppt.editor.progress.addChapter')}
                </Flex>
              )}
              {/* 删除标题（标题为空时无标题可删） */}
              {chapter.title !== '' && !editing && (
                <IconButton
                  aria-label={t('aiVideo.ppt.editor.progress.deleteChapter')}
                  icon={<X size={10} />}
                  size="xs"
                  minW="16px"
                  h="16px"
                  borderRadius="full"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: 'red.500' }}
                  flexShrink={0}
                  onClick={() => onDelete(chapter.id)}
                />
              )}
              {/* 右边界拖拽手柄（调整包含片段数） */}
              {index < chapters.length - 1 && !editing && (
                <Box
                  position="absolute"
                  right="-7px"
                  top="50%"
                  transform="translateY(-50%)"
                  w="12px"
                  h="22px"
                  borderRadius="4px"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.300"
                  cursor="col-resize"
                  zIndex={2}
                  _hover={{ borderColor: AI_VIDEO_PRIMARY }}
                  onPointerDown={(event: React.PointerEvent) =>
                    handleBoundaryDown(event, chapter, chapters[index + 1])
                  }
                  onPointerMove={handleBoundaryMove}
                  onPointerUp={handleBoundaryUp}
                  aria-label={t('aiVideo.ppt.editor.progress.resizeTip')}
                />
              )}
            </Flex>
          );
        })}
      </Flex>

      {/* 片段缩略图分组（与章节一一对应；空标题分段在片段上方显示「添加标题」；支持横向滚动） */}
      <Flex gap={1.5} mb={2} overflowX="auto" pb={1}>
        {chapterShots.map(({ chapter, start, shots }) => (
          <Flex
            key={chapter.id}
            direction="column"
            flexShrink={0}
            gap={1}
            p={1}
            borderRadius="10px"
            bg="gray.50"
            border="1px solid"
            borderColor="#EDF0F5"
          >
            <Flex gap={1}>
              {shots.map((shot, offset) => (
                <Box key={shot.id} position="relative" w="72px" flexShrink={0}>
                  <Image
                    src={shot.imageUrl}
                    alt={shot.title}
                    w="72px"
                    h="48px"
                    objectFit="cover"
                    borderRadius="6px"
                    bg="gray.200"
                  />
                  <Flex
                    position="absolute"
                    top={0.5}
                    left={0.5}
                    w="16px"
                    h="16px"
                    borderRadius="5px"
                    bg="blackAlpha.600"
                    color="white"
                    fontSize="10px"
                    align="center"
                    justify="center"
                  >
                    {start + offset + 1}
                  </Flex>
                </Box>
              ))}
            </Flex>
          </Flex>
        ))}
      </Flex>

      <Text fontSize="11px" color="gray.400">
        {t('aiVideo.ppt.editor.progress.resizeTip')}
      </Text>
    </Box>
  );
}
