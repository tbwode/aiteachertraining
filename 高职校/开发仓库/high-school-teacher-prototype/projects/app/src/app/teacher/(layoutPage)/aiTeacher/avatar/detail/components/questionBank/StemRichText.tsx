'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import RemarkMath from 'remark-math';
import RehypeKatex from 'rehype-katex';
import { Box, Image, Text } from '@chakra-ui/react';
import 'katex/dist/katex.min.css';
import type { QuestionImage } from './types';

type StemRichTextProps = {
  text: string;
  images?: QuestionImage[];
  fontSize?: string;
  fontWeight?: number;
  color?: string;
};

// 题干富文本渲染：$LaTeX$ 公式 + ![名称](id) 图片 + 【n】填空标识高亮
export function StemRichText({ text, images = [], fontSize = 'sm', fontWeight, color }: StemRichTextProps) {
  // 填空标识转成行内代码，视觉高亮
  const processed = useMemo(() => text.replace(/【(\d+)】/g, '`【$1】`'), [text]);

  return (
    <Box
      fontSize={fontSize}
      fontWeight={fontWeight}
      color={color}
      sx={{
        '& .katex': { fontSize: '1em' },
        '& .katex-display': { margin: '4px 0' }
      }}
    >
      <ReactMarkdown
        remarkPlugins={[RemarkMath]}
        rehypePlugins={[[RehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          p: ({ children }) => (
            <Text as="p" mb={1} _last={{ mb: 0 }} lineHeight="1.7">
              {children}
            </Text>
          ),
          code: ({ children }) => (
            <Box
              as="span"
              px={1.5}
              py={0.5}
              mx={0.5}
              borderRadius="md"
              bg="orange.50"
              color="orange.600"
              fontWeight={600}
              fontSize="0.85em"
              border="1px dashed"
              borderColor="orange.300"
            >
              {children}
            </Box>
          ),
          img: ({ src, alt }) => {
            const hit = images.find((img) => img.id === src || img.name === alt);
            const url = hit?.url || (typeof src === 'string' && /^(data:|https?:)/.test(src) ? src : '');
            if (!url) {
              return (
                <Box as="span" px={2} py={0.5} borderRadius="md" bg="gray.100" color="gray.400" fontSize="xs">
                  🖼 {alt || src}
                </Box>
              );
            }
            return (
              <Image
                src={url}
                alt={alt || '题目配图'}
                display="block"
                maxH="160px"
                maxW="100%"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.100"
                my={2}
              />
            );
          }
        }}
      >
        {processed}
      </ReactMarkdown>
    </Box>
  );
}
