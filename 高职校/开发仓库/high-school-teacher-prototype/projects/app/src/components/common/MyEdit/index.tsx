'use client';

import { Box, useColorModeValue, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { uploadFilePublic } from '@/teacher/api/file';
import ErrorBoundary from './components/ErrorBoundary';
import Toolbar from './components/Toolbar';
import { useEditor } from './hooks/useEditor';
import { useImageResize } from './hooks/useImageResize';
import {
  createMediaEventHandlers,
  generateMediaHTML,
  isMediaElement,
  setupMediaElement
} from './utils/mediaUtils';
import type { MyEditProps } from './type';
import { DEFAULT_EDITOR_CONFIG } from './type';

const MyEdit: React.FC<MyEditProps> = ({
  id,
  value = '',
  onChange,
  placeholder = DEFAULT_EDITOR_CONFIG.placeholder,
  height = DEFAULT_EDITOR_CONFIG.height,
  onInsertText,
  onGetContent,
  onCursorChange,
  disabled = false
}) => {
  const toast = useToast();
  const { t } = useTranslation('common');

  // 使用自定义 Hook 管理编辑器状态和逻辑
  const {
    editorRef,
    currentContent,
    setCurrentContent,
    getContent,
    setContent,
    insertText,
    execCommand,
    undoHistory,
    redoHistory,
    isComposing,
    setIsComposing,
    isUserTyping,
    isUpdating,
    isInitialized,
    lastContent,
    savedCursorRange,
    saveCursorPosition,
    insertMediaWithCursor,
    handleInput: handleEditorInput,
    handleBlur: handleEditorBlur
  } = useEditor({ value, onChange, disabled });

  // 图片大小调整功能
  useImageResize(editorRef, onChange);

  // UI 状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('16px');
  const [selectedColor, setSelectedColor] = useState('#000000');

  // 文件输入引用
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 主题颜色
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 媒体元素事件处理器
  const mediaEventHandlers = useMemo(() => createMediaEventHandlers(), []);

  // 初始化编辑器设置
  useEffect(() => {
    if (editorRef.current) {
      // 设置编辑器的语言属性，有助于输入法识别
      editorRef.current.setAttribute('lang', 'zh-CN');
      editorRef.current.setAttribute('spellcheck', 'false');

      // 添加媒体元素事件监听器
      editorRef.current.addEventListener('click', mediaEventHandlers.handleMediaClick, true);
      editorRef.current.addEventListener('keydown', mediaEventHandlers.handleMediaKeyDown, true);

      // 清理事件监听器
      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener('click', mediaEventHandlers.handleMediaClick, true);
          editorRef.current.removeEventListener(
            'keydown',
            mediaEventHandlers.handleMediaKeyDown,
            true
          );
        }
      };
    }
  }, [mediaEventHandlers]);

  // 处理动态插入的媒体元素
  useEffect(() => {
    if (editorRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                // 为新插入的媒体元素设置属性
                const mediaElements = element.querySelectorAll('audio, video, iframe, img');
                mediaElements.forEach((mediaEl) => {
                  setupMediaElement(mediaEl as HTMLElement);
                });
                // 如果插入的就是媒体元素本身
                if (isMediaElement(element)) {
                  setupMediaElement(element);
                }
              }
            });
          }
        });
      });

      observer.observe(editorRef.current, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('myEdit.toast.imageTooLarge'),
          status: 'error',
          duration: 3000
        });
        return;
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('myEdit.toast.invalidImageFormat'),
          status: 'error',
          duration: 3000
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadFilePublic(formData);
        const imgTag = generateMediaHTML.image(result.fileUrl || '');
        execCommand('insertHTML', imgTag);

        toast({
          title: t('myEdit.toast.imageInsertSuccess'),
          status: 'success',
          duration: 2000
        });
      } catch (err: any) {
        console.error('图片上传失败:', err);
        toast({
          title: err?.message || t('myEdit.toast.imageUploadFailed'),
          status: 'error',
          duration: 3000
        });
      } finally {
        setIsUploading(false);
        // 清空 input 值，允许重复选择同一文件
        e.target.value = '';
      }
    },
    [execCommand, toast]
  );

  // 处理视频上传
  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 检查文件大小（限制为200MB）
      if (file.size > 200 * 1024 * 1024) {
        toast({
          title: t('myEdit.toast.videoTooLarge'),
          status: 'error',
          duration: 3000
        });
        return;
      }

      // 检查文件类型
      const allowedTypes = [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/webm',
        'video/ogg'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('myEdit.toast.invalidVideoFormat'),
          status: 'error',
          duration: 3000
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadFilePublic(formData);
        const videoTag = generateMediaHTML.video(result.fileUrl || '', true);
        execCommand('insertHTML', videoTag);

        toast({
          title: t('myEdit.toast.videoInsertSuccess'),
          status: 'success',
          duration: 2000
        });
      } catch (err: any) {
        console.error('视频上传失败:', err);
        toast({
          title: err?.msg || t('myEdit.toast.videoUploadFailed'),
          status: 'error',
          duration: 3000
        });
      } finally {
        setIsUploading(false);
        // 清空 input 值，允许重复选择同一文件
        e.target.value = '';
      }
    },
    [execCommand, toast]
  );

  // 字体大小处理
  const mapCssFontToLegacy = useCallback((css: string) => {
    const px = parseInt(css, 10);
    if (isNaN(px)) return 4;
    if (px <= 12) return 2;
    if (px <= 14) return 3;
    if (px <= 16) return 4;
    if (px <= 18) return 5;
    if (px <= 24) return 6;
    return 7;
  }, []);

  const applyFontSize = useCallback(
    (cssSize: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      try {
        // 使用 CSS 方式应用字号
        try {
          document.execCommand('styleWithCSS', false, true as any);
        } catch {}
        const legacy = String(mapCssFontToLegacy(cssSize));
        document.execCommand('fontSize', false, legacy);

        // 将可能产生的 <font> 标签统一替换为 span 样式，避免后续修改失效
        const root = editorRef.current;
        const fonts = root.querySelectorAll('font[size]');
        fonts.forEach((fontEl) => {
          const span = document.createElement('span');
          span.style.fontSize = cssSize;
          span.innerHTML = fontEl.innerHTML;
          fontEl.parentNode?.replaceChild(span, fontEl);
        });

        // 同步内部内容缓存
        const newHtml = root.innerHTML;
        lastContent.current = newHtml;
        setCurrentContent(newHtml);
      } catch (e) {
        console.warn('applyFontSize failed:', e);
      }
    },
    [mapCssFontToLegacy]
  );

  // 光标位置处理
  const handleCursorChange = useCallback(() => {
    if (onCursorChange) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          onCursorChange(range.cloneRange());
        } else {
          onCursorChange(null);
        }
      } else {
        onCursorChange(null);
      }
    }
  }, [onCursorChange]);

  const handleClick = useCallback(() => {
    setShowToolbar(true);
    setTimeout(() => {
      handleCursorChange();
    }, 0);
  }, [handleCursorChange]);

  const handleKeyUp = useCallback(() => {
    setShowToolbar(true);
    handleCursorChange();
  }, [handleCursorChange]);

  const handleBlur = useCallback(() => {
    // 延迟隐藏工具栏，给用户时间点击工具栏按钮
    setTimeout(() => {
      // 如果光标/选区仍在编辑器内，则不隐藏
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          return;
        }
      }
    }, 300);
  }, [editorRef]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // 暴露方法给父组件
  useEffect(() => {
    if (onInsertText) {
      onInsertText(insertText);
    }
  }, [onInsertText, insertText]);

  useEffect(() => {
    if (onGetContent) {
      onGetContent(getContent);
    }
  }, [onGetContent, getContent]);

  return (
    <ErrorBoundary>
      <Box
        position={isFullscreen ? 'fixed' : 'relative'}
        top={isFullscreen ? 0 : 'auto'}
        left={isFullscreen ? 0 : 'auto'}
        right={isFullscreen ? 0 : 'auto'}
        bottom={isFullscreen ? 0 : 'auto'}
        zIndex={isFullscreen ? 1000 : 'auto'}
        bg={bgColor}
        border={isFullscreen ? 'none' : `1px solid ${borderColor}`}
        borderRadius={isFullscreen ? 0 : '8px'}
        overflow="hidden"
        width="100%"
        height={isFullscreen ? '100vh' : height}
        display="flex"
        flexDirection="column"
      >
        {/* 隐藏的文件输入框 */}
        <input
          type="file"
          ref={imageInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleImageUpload}
        />
        <input
          type="file"
          ref={videoInputRef}
          style={{ display: 'none' }}
          accept="video/*"
          onChange={handleVideoUpload}
        />

        {/* 工具栏 */}
        {showToolbar && (
          <Toolbar
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onExecCommand={(command, value) => {
              execCommand(command, value);
              // 执行命令后重新聚焦到编辑器
              if (editorRef.current) {
                editorRef.current.focus();
              }
            }}
            selectedFontSize={selectedFontSize}
            onFontSizeChange={(size) => {
              setSelectedFontSize(size);
              applyFontSize(size);
            }}
            selectedColor={selectedColor}
            onColorChange={(color) => {
              setSelectedColor(color);
              if (editorRef.current) {
                editorRef.current.focus();
                try {
                  document.execCommand('foreColor', false, color);
                } catch (error) {
                  console.warn('execCommand foreColor failed:', error);
                }
              }
            }}
            onInsertImage={() => {
              saveCursorPosition();
              imageInputRef.current?.click();
            }}
            onInsertVideo={() => {
              saveCursorPosition();
              videoInputRef.current?.click();
            }}
            undoHistory={undoHistory}
            redoHistory={redoHistory}
            disabled={disabled || isUploading}
          />
        )}

        {/* 编辑区域 */}
        <Box
          id={id}
          ref={editorRef}
          contentEditable={!disabled}
          p={3}
          flex="1"
          outline="none"
          fontSize={selectedFontSize}
          lineHeight="1.6"
          overflowY="auto"
          position="relative"
          onInput={
            disabled
              ? undefined
              : (e) => {
                  // 确保任何输入都标记为正在输入，防止useEffect覆盖
                  isUserTyping.current = true;
                  handleEditorInput(e);
                }
          }
          onFocus={disabled ? undefined : () => setShowToolbar(true)}
          onBlur={
            disabled
              ? undefined
              : () => {
                  handleEditorBlur();
                  handleBlur();
                }
          }
          onCompositionStart={
            disabled
              ? undefined
              : () => {
                  setIsComposing(true);
                  isUserTyping.current = true;
                }
          }
          onCompositionEnd={
            disabled
              ? undefined
              : () => {
                  setIsComposing(false);
                  // 延迟重置isUserTyping，防止useEffect过早覆盖用户输入
                  setTimeout(() => {
                    isUserTyping.current = false;
                  }, 300);
                }
          }
          onKeyDown={
            disabled
              ? undefined
              : (e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    document.execCommand('insertLineBreak', false);
                  }
                }
          }
          onMouseUp={disabled ? undefined : handleClick}
          onKeyUp={disabled ? undefined : handleKeyUp}
          onDragStart={
            disabled
              ? undefined
              : (e) => {
                  const target = e.target as HTMLElement;
                  if (isMediaElement(target)) {
                    e.preventDefault();
                    return false;
                  }
                }
          }
          onDrop={
            disabled
              ? undefined
              : (e) => {
                  const target = e.target as HTMLElement;
                  if (isMediaElement(target)) {
                    e.preventDefault();
                    return false;
                  }
                }
          }
          onContextMenu={
            disabled
              ? undefined
              : (e) => {
                  const target = e.target as HTMLElement;
                  if (isMediaElement(target)) {
                    e.preventDefault();
                    toast({
                      title: t('myEdit.toast.mediaNoContextMenu'),
                      status: 'info',
                      duration: 2000
                    });
                    return false;
                  }
                }
          }
          onClick={
            disabled
              ? undefined
              : (e) => {
                  const target = e.target as HTMLElement;
                  // 如果是图片，不触发编辑器的点击处理
                  if (target.tagName === 'IMG') {
                    // 图片点击由 useImageResize 处理
                    return;
                  }
                  if (isMediaElement(target)) {
                    e.stopPropagation();
                    return;
                  }
                  handleClick();
                }
          }
          _focus={{ bg: 'transparent' }}
          sx={{
            // 使用CSS的:empty:before伪元素实现占位符
            '&:empty:before': {
              content: `"${placeholder}"`,
              color: 'gray.400',
              pointerEvents: 'none',
              display: 'block',
              width: '100%',
              whiteSpace: 'normal',
              overflow: 'visible'
            },
            // 确保音频和视频元素能够正确显示和交互
            'audio, video': {
              display: 'block',
              maxWidth: '100%'
            },
            iframe: {
              display: 'block',
              border: '1px solid #ccc'
            },
            // 图片在无换行符的情况下与文本同一行显示
            img: {
              display: 'inline-block',
              verticalAlign: 'middle',
              margin: 0,
              maxWidth: '100%',
              height: 'auto',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9
              }
            },
            // 选中的图片样式
            'img[style*="outline: 2px solid #C8000B"]': {
              cursor: 'nwse-resize !important'
            },
            // 确保媒体元素不会被contentEditable影响
            'audio, video, iframe': {
              pointerEvents: 'auto'
            },
            // 确保段落标签有最小高度，方便光标定位
            p: {
              minHeight: '1em',
              margin: '0.5em 0'
            },
            // 调整手柄样式
            '.img-resize-handle': {
              position: 'absolute',
              width: '12px',
              height: '12px',
              backgroundColor: '#C8000B',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'nwse-resize',
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }
          }}
          bg={disabled ? 'gray.50' : 'transparent'}
          cursor={disabled ? 'not-allowed' : 'text'}
          opacity={disabled ? 0.6 : 1}
        />
      </Box>
    </ErrorBoundary>
  );
};

export default MyEdit;
