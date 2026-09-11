/**
 * FilePreview 组件 - 文件预览
 * 支持多种文件类型的预览
 */

import { Box, Flex, Text, Image, AspectRatio } from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';

type FilePreviewProps = {
  url: string;
  type: string;
  name?: string;
  width?: string | number;
  height?: string | number;
  bizType?: string;
};

// 支持的文件类型
const OFFICE_FILE_TYPES = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
const IMAGE_FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const VIDEO_FILE_TYPES = ['mp4', 'webm', 'ogg', 'mov'];
const AUDIO_FILE_TYPES = ['mp3', 'wav', 'ogg', 'aac'];
const PDF_FILE_TYPES = ['pdf'];

/**
 * 生成 Office 文档预览 URL (使用微软在线预览)
 */
const generateOfficePreviewUrl = (fileUrl: string): string => {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
};

/**
 * FilePreview 组件
 */
const FilePreview: React.FC<FilePreviewProps> = ({
  url,
  type,
  name = '未命名文件',
  width = '100%',
  height = '100%',
  bizType
}) => {
  const [iframeError, setIframeError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fileType = type?.toLowerCase() || '';
  const bizFileType = bizType?.toLowerCase() || '';

  /**
   * 计算预览 URL 和预览类型
   */
  const previewInfo = useMemo(() => {
    if (!url) {
      return { type: 'none', url: '' };
    }

    // openmaic 类型使用 iframe 直接预览
    if (bizFileType === 'openmaic') {
      return { type: 'iframe', url };
    }

    // 从文件名提取后缀，统一用文件名后缀判断预览格式
    const fileNameLower = (name || '').toLowerCase();
    const ext = fileNameLower.split('.').pop() || '';

    // .html/.htm 后缀使用 iframe 预览
    if (ext === 'html' || ext === 'htm') {
      return { type: 'iframe', url };
    }

    // PDF 文件
    if (PDF_FILE_TYPES.includes(ext)) {
      return { type: 'pdf', url };
    }

    // Office 文档
    if (OFFICE_FILE_TYPES.includes(ext)) {
      return { type: 'office', url: generateOfficePreviewUrl(url) };
    }

    // 图片
    if (IMAGE_FILE_TYPES.includes(ext)) {
      return { type: 'image', url };
    }

    // 视频
    if (VIDEO_FILE_TYPES.includes(ext)) {
      return { type: 'video', url };
    }

    // 音频
    if (AUDIO_FILE_TYPES.includes(ext)) {
      return { type: 'audio', url };
    }

    return { type: 'unsupported', url };
  }, [url, name, bizFileType]);

  // 不支持的文件类型
  if (previewInfo.type === 'unsupported') {
    return (
      <Flex
        w={width}
        h={height}
        justify="center"
        align="center"
        flexDirection="column"
        bg="gray.50"
        gap={4}
      >
        <Text color="gray.500" fontSize="lg" fontWeight="500">
          不支持预览此文件类型
        </Text>
        <Text color="gray.400" fontSize="sm">
          文件格式：.{fileType.toUpperCase()}
        </Text>
        <Text
          color="blue.500"
          fontSize="sm"
          cursor="pointer"
          textDecoration="underline"
          onClick={() => window.open(url, '_blank')}
        >
          点击下载文件
        </Text>
      </Flex>
    );
  }

  // 无有效预览 URL
  if (previewInfo.type === 'none' || !previewInfo.url) {
    return (
      <Flex
        w={width}
        h={height}
        justify="center"
        align="center"
        flexDirection="column"
        bg="gray.50"
        gap={4}
      >
        <Text color="gray.500" fontSize="lg">
          无法生成预览链接
        </Text>
        <Text color="gray.400" fontSize="sm">
          请检查文件 URL 是否有效
        </Text>
      </Flex>
    );
  }

  // 渲染图片预览
  if (previewInfo.type === 'image') {
    return (
      <Flex w={width} h={height} justify="center" align="center" bg="gray.50" overflow="hidden">
        {imageError ? (
          <Flex flexDirection="column" gap={2} align="center">
            <Text color="gray.500" fontSize="lg">
              图片加载失败
            </Text>
            <Text color="gray.400" fontSize="sm">
              请检查图片链接是否有效
            </Text>
          </Flex>
        ) : (
          <Image
            src={previewInfo.url}
            alt={name}
            maxW="100%"
            maxH="100%"
            objectFit="contain"
            onError={() => setImageError(true)}
          />
        )}
      </Flex>
    );
  }

  // 渲染视频预览
  if (previewInfo.type === 'video') {
    return (
      <Flex w={width} h={height} justify="center" align="center" bg="black">
        <video
          src={previewInfo.url}
          controls
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%'
          }}
        >
          您的浏览器不支持视频播放
        </video>
      </Flex>
    );
  }

  // 渲染音频预览
  if (previewInfo.type === 'audio') {
    return (
      <Flex
        w={width}
        h={height}
        justify="center"
        align="center"
        flexDirection="column"
        bg="gray.50"
        gap={4}
      >
        <Text color="gray.700" fontSize="lg" fontWeight="500">
          {name}
        </Text>
        <audio src={previewInfo.url} controls style={{ width: '80%', maxWidth: '500px' }}>
          您的浏览器不支持音频播放
        </audio>
      </Flex>
    );
  }

  // 渲染 PDF 或 Office 文档预览 (使用 iframe)
  return (
    <Box w={width} h={height} overflow="hidden" bg="white" position="relative">
      <iframe
        src={previewInfo.url}
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          border: 'none',
          background: 'white',
          width: '100%',
          height: '100%'
        }}
        title={name}
        onError={() => setIframeError(true)}
      />
      {iframeError && (
        <Flex
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          justify="center"
          align="center"
          flexDirection="column"
          gap={2}
          bg="white"
          p={6}
          borderRadius="md"
          boxShadow="lg"
        >
          <Text color="gray.500" fontSize="lg">
            预览加载失败
          </Text>
          <Text color="gray.400" fontSize="sm">
            请检查网络连接或稍后重试
          </Text>
          <Text
            color="blue.500"
            fontSize="sm"
            cursor="pointer"
            textDecoration="underline"
            onClick={() => window.open(url, '_blank')}
            mt={2}
          >
            在新窗口中打开
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default FilePreview;
