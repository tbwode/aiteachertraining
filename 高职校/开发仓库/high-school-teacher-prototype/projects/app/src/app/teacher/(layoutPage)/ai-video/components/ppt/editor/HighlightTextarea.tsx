'use client';

/**
 * 高亮输入框：在 Textarea 下层叠加镜像文本层，把已设为字幕高亮的子串同步显示高亮底色
 * （原生 textarea 不支持富文本；镜像层同字体/字号/行高/内边距保证逐字对齐，滚动同步）
 */
import { useRef } from 'react';
import { Box, Textarea } from '@chakra-ui/react';
import { AI_VIDEO_PRIMARY } from '../../../constants';

/** 高亮底色（与画布字幕标黄 #FFE58F 同色系，半透明保证文字可读） */
const HIGHLIGHT_BG = 'rgba(255, 213, 79, 0.45)';

type Segment = { text: string; hit: boolean };

/** 按高亮子串切分文本（与画布字幕条同一匹配规则） */
export function splitByHighlights(text: string, highlights: string[]): Segment[] {
  const patterns = highlights
    .filter((item) => item.trim().length > 0)
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!text || patterns.length === 0) return [{ text, hit: false }];
  const regex = new RegExp(`(${patterns.join('|')})`, 'g');
  return text
    .split(regex)
    .map((part, index) => ({ text: part, hit: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

export function HighlightTextarea({
  value,
  highlights,
  textareaRef,
  onChange,
  onSelect,
  placeholder,
  isDisabled,
  maxLength,
  rows = 3
}: {
  value: string;
  highlights: string[];
  textareaRef: { current: HTMLTextAreaElement | null };
  onChange: (value: string) => void;
  onSelect?: () => void;
  placeholder?: string;
  isDisabled?: boolean;
  maxLength?: number;
  rows?: number;
}) {
  const backdropRef = useRef<HTMLDivElement | null>(null);

  /** 滚动同步：镜像层跟随 textarea 滚动位置 */
  const syncScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const segments = splitByHighlights(value, highlights);

  return (
    <Box position="relative">
      {/* 镜像高亮层（不可交互，逐字对齐 textarea 排版） */}
      <Box
        ref={backdropRef}
        aria-hidden
        position="absolute"
        top="1px"
        left="1px"
        right="1px"
        bottom="1px"
        px="10.5px"
        py="7px"
        fontSize="13px"
        lineHeight="1.7"
        fontFamily="inherit"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        overflow="hidden"
        pointerEvents="none"
        color="transparent"
        zIndex={0}
      >
        {segments.map((segment, index) =>
          segment.hit ? (
            <Box as="span" key={index} bg={HIGHLIGHT_BG} borderRadius="3px">
              {segment.text}
            </Box>
          ) : (
            <span key={index}>{segment.text}</span>
          )
        )}
      </Box>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={onSelect}
        onScroll={syncScroll}
        placeholder={placeholder}
        isDisabled={isDisabled}
        maxLength={maxLength}
        rows={rows}
        resize="none"
        fontSize="13px"
        lineHeight="1.7"
        bg="transparent"
        borderColor="gray.200"
        borderRadius="12px"
        position="relative"
        zIndex={1}
        _focus={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: `0 0 0 1px ${AI_VIDEO_PRIMARY}` }}
      />
    </Box>
  );
}
