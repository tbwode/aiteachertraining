'use client';

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Select,
  Text,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import React from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  UndoIcon,
  RedoIcon,
  ImageIcon,
  VideoIcon,
  MaximizeIcon,
  MinimizeIcon
} from './Icons';

interface ToolbarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExecCommand: (command: string, value?: any) => void;
  selectedFontSize: string;
  onFontSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onInsertImage: () => void;
  onInsertVideo: () => void;
  onInsertAudio?: () => void;
  undoHistory: string[];
  redoHistory: string[];
  disabled?: boolean;
}

const fontSizeOptions = [
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '28px', label: '28px' },
  { value: '32px', label: '32px' }
];

const Toolbar: React.FC<ToolbarProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onExecCommand,
  selectedFontSize,
  onFontSizeChange,
  selectedColor,
  onColorChange,
  onInsertImage,
  onInsertVideo,
  onInsertAudio,
  undoHistory,
  redoHistory,
  disabled = false
}) => {
  const { t } = useTranslation('common');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toolbarBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Flex
      bg={toolbarBg}
      borderBottom={`1px solid ${borderColor}`}
      p={2}
      gap={2}
      alignItems="center"
      flexWrap="wrap"
      flexShrink={0}
      minH="44px"
    >
      {/* 全屏按钮 */}
      <HStack spacing={1}>
        <Tooltip
          label={isFullscreen ? t('myEdit.toolbar.exitFullscreen') : t('myEdit.toolbar.fullscreen')}
          placement="bottom"
        >
          <IconButton
            aria-label={
              isFullscreen ? t('myEdit.toolbar.exitFullscreen') : t('myEdit.toolbar.fullscreen')
            }
            icon={isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={onToggleFullscreen}
            color={isFullscreen ? 'blue.500' : 'gray.700'}
            isDisabled={disabled}
          />
        </Tooltip>
      </HStack>

      {/* 分隔线 */}
      <Box w="1px" h="20px" bg={borderColor} />

      {/* 基础格式按钮 */}
      <HStack spacing={1}>
        <Tooltip label={t('myEdit.toolbar.bold')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.bold')}
            icon={<BoldIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('bold')}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
        <Tooltip label={t('myEdit.toolbar.italic')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.italic')}
            icon={<ItalicIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('italic')}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
        <Tooltip label={t('myEdit.toolbar.underline')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.underline')}
            icon={<UnderlineIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('underline')}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
        <Tooltip label={t('myEdit.toolbar.strikethrough')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.strikethrough')}
            icon={<StrikethroughIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('strikethrough')}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
      </HStack>

      {/* 分隔线 */}
      <Box w="1px" h="20px" bg={borderColor} />

      {/* 字号选择 */}
      <HStack spacing={2}>
        <Text fontSize="12px" color="gray.600">
          {t('myEdit.toolbar.fontSize')}:
        </Text>
        <Select
          size="sm"
          value={selectedFontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          w="70px"
          isDisabled={disabled}
        >
          {fontSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </HStack>

      {/* 颜色选择 */}
      <HStack spacing={2}>
        <Text fontSize="12px" color="gray.600">
          {t('myEdit.toolbar.color')}:
        </Text>
        <Box
          as="input"
          type="color"
          value={selectedColor}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onColorChange(e.target.value)}
          w="28px"
          h="28px"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="4px"
          cursor="pointer"
          disabled={disabled}
        />
      </HStack>

      {/* 分隔线 */}
      <Box w="1px" h="20px" bg={borderColor} />

      {/* 插入功能 */}
      <HStack spacing={1}>
        <Tooltip label={t('myEdit.toolbar.insertImage')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.insertImage')}
            icon={<ImageIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={onInsertImage}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
        <Tooltip label={t('myEdit.toolbar.insertVideo')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.insertVideo')}
            icon={<VideoIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={onInsertVideo}
            color="gray.700"
            isDisabled={disabled}
          />
        </Tooltip>
      </HStack>

      {/* 分隔线 */}
      <Box w="1px" h="20px" bg={borderColor} />

      {/* 撤销/恢复 */}
      <HStack spacing={1}>
        <Tooltip label={t('myEdit.toolbar.undo')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.undo')}
            icon={<UndoIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('undo')}
            isDisabled={undoHistory.length === 0 || disabled}
            color="gray.700"
          />
        </Tooltip>
        <Tooltip label={t('myEdit.toolbar.redo')} placement="bottom">
          <IconButton
            aria-label={t('myEdit.toolbar.redo')}
            icon={<RedoIcon size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => onExecCommand('redo')}
            isDisabled={redoHistory.length === 0 || disabled}
            color="gray.700"
          />
        </Tooltip>
      </HStack>
    </Flex>
  );
};

export default Toolbar;
