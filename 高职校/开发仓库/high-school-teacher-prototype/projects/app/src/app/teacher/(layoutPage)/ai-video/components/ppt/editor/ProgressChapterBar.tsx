'use client';

/**
 * PPT/文档转视频 预览编辑 - 画布底部智能进度条
 * 章节式进度条：按章节包含片段数占比铺开，标题展示在进度条上；
 * 当前片段已覆盖的章节高亮填充，点击章节跳转到其首个片段
 */
import { Flex, Text } from '@chakra-ui/react';
import type { PptProgressChapter } from '@/teacher/types/aiVideo';
import { chapterIndexOfShot } from './progressUtils';

export function ProgressChapterBar({
  chapters,
  shotIndex,
  onSelectChapter
}: {
  chapters: PptProgressChapter[];
  /** 当前片段下标（用于高亮已覆盖章节） */
  shotIndex: number;
  onSelectChapter?: (shotIndex: number) => void;
}) {
  /* 未设置标题的分段不展示在进度条上（仅添加标题后显示） */
  const titledChapters = chapters.filter((chapter) => chapter.title.trim().length > 0);
  const currentChapter = chapterIndexOfShot(chapters, Math.max(0, shotIndex));
  /* 各分段起始片段下标（在完整章节序列中的位置，用于点击跳转） */
  const titledStarts = titledChapters.map((chapter) => {
    const start = chapters.indexOf(chapter);
    return start >= 0 ? chapters.slice(0, start).reduce((acc, item) => acc + item.count, 0) : 0;
  });
  if (titledChapters.length === 0) return null;

  return (
    <Flex
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      h="22px"
      zIndex={4}
      bg="blackAlpha.500"
      role="navigation"
      aria-label="progress chapters"
    >
      {titledChapters.map((chapter, index) => {
        const start = titledStarts[index];
        const covered = chapters.indexOf(chapter) <= currentChapter;
        return (
          <Flex
            key={chapter.id}
            as="button"
            type="button"
            flex={chapter.count}
            h="100%"
            align="center"
            justify="center"
            bg={covered ? 'rgba(200,0,11,0.72)' : 'transparent'}
            borderRight={index < chapters.length - 1 ? '1px solid rgba(255,255,255,0.35)' : 'none'}
            onClick={() => onSelectChapter?.(start)}
            cursor={onSelectChapter ? 'pointer' : 'default'}
            transition="background 0.2s"
            overflow="hidden"
          >
            <Text
              fontSize="10px"
              color="white"
              noOfLines={1}
              px={1}
              textShadow="0 1px 2px rgba(0,0,0,0.5)"
            >
              {chapter.title}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
