/**
 * FilePreviewModal 组件 - 文件预览弹窗
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  HStack,
  Icon,
  Flex,
  IconButton
} from '@chakra-ui/react';
import React, { useState } from 'react';
import FilePreview from './index';

type FilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: string;
  fileName?: string;
  bizType?: string;
};

// 根据文件类型返回图标
function getFileTypeIcon(fileType: string) {
  const type = fileType.toLowerCase();

  // 视频类型
  if (type === 'video' || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'flv'].includes(type)) {
    return '▶';
  }

  // 文档类型
  if (type === 'document' || ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(type)) {
    return '📄';
  }

  // 图片类型
  if (
    type === 'image' ||
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(type)
  ) {
    return '🖼';
  }

  // 音频类型
  if (type === 'audio' || ['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(type)) {
    return '🎵';
  }

  // PDF 特殊处理
  if (type === 'pdf') {
    return '📕';
  }

  return '📎';
}

/**
 * FilePreviewModal 组件
 */
const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileType,
  fileName = '文件预览',
  bizType
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // openmaic 或 digital 类型文件支持全屏
  const showFullscreen = true;

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={isFullscreen ? 'full' : '6xl'}
      isCentered={!isFullscreen}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        maxW={isFullscreen ? '100vw' : '90vw'}
        maxH={isFullscreen ? '100vh' : '90vh'}
        h={isFullscreen ? '100vh' : '90vh'}
        borderRadius={isFullscreen ? 0 : undefined}
        m={isFullscreen ? 0 : undefined}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader borderBottom="1px solid" borderColor="gray.200">
          <HStack spacing={2}>
            <Text fontSize="lg">{getFileTypeIcon(fileType)}</Text>
            <Text fontSize="lg" fontWeight={600} noOfLines={1}>
              {fileName}
            </Text>
          </HStack>
        </ModalHeader>
        {/* 关闭按钮和全屏按钮用 Flex 容器统一管理位置 */}
        <Flex position="absolute" right="3" top="3" align="center" gap={1} zIndex={1}>
          {/* openmaic 或 digital 类型文件显示全屏按钮 */}
          {showFullscreen && (
            <IconButton
              aria-label={isFullscreen ? '退出全屏' : '全屏'}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isFullscreen ? (
                    <>
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </>
                  ) : (
                    <>
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </>
                  )}
                </svg>
              }
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen((prev) => !prev)}
            />
          )}
          <ModalCloseButton position="static" m={0} />
        </Flex>
        <ModalBody p={0} overflow="hidden" flex="1">
          <FilePreview url={fileUrl} type={fileType} name={fileName} bizType={bizType} width="100%" height="100%" />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FilePreviewModal;
