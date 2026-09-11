'use client';

/**
 * PPT/文档转视频 预览编辑 - 文字面板
 * 添加文本框；选中文本框后设置：
 * 字体（下拉选择）/ 字号（数字输入 + 快速加减）/ 颜色（色板 + 调色板自定义）/
 * 对齐（水平 + 垂直）/ 透明度 / 动画（进场 + 出场）/ 位置（九宫格，画面内可拖拽与缩放手柄）
 */
import {
  Box,
  Flex,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  Plus,
  Trash2,
  Type
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  PptTextAlign,
  PptTextEnterAnimation,
  PptTextExitAnimation,
  PptTextFont,
  PptTextOverlay,
  PptTextVAlign,
  StoryboardShot
} from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../../constants';
import { legacyEnterAnimation, TEXT_FONT_STACKS } from './TextOverlayLayer';

const FONT_OPTIONS: PptTextFont[] = ['sans', 'serif', 'kai', 'yuanti'];
const ENTER_OPTIONS: PptTextEnterAnimation[] = [
  'none',
  'fadeIn',
  'slideInRight',
  'slideInLeft',
  'slideInUp',
  'slideInDown'
];
const EXIT_OPTIONS: PptTextExitAnimation[] = [
  'none',
  'fadeOut',
  'slideOutRight',
  'slideOutLeft',
  'slideOutUp',
  'slideOutDown'
];
const COLOR_OPTIONS = ['#FFFFFF', '#1F1F1F', '#C8000B', '#FFE58F', '#2F54EB', '#52C41A'];

const HALIGN_ICONS: Array<{ value: PptTextAlign; icon: React.ReactNode; key: string }> = [
  { value: 'left', icon: <AlignLeft size={14} />, key: 'alignLeft' },
  { value: 'center', icon: <AlignCenter size={14} />, key: 'alignCenter' },
  { value: 'right', icon: <AlignRight size={14} />, key: 'alignRight' }
];
const VALIGN_ICONS: Array<{ value: PptTextVAlign; icon: React.ReactNode; key: string }> = [
  { value: 'top', icon: <AlignStartVertical size={14} />, key: 'alignTop' },
  { value: 'middle', icon: <AlignCenterVertical size={14} />, key: 'alignMiddle' },
  { value: 'bottom', icon: <AlignEndVertical size={14} />, key: 'alignBottom' }
];

function FieldLabel({ text }: { text: string }) {
  return (
    <Text fontSize="12px" color="gray.500" mb={1.5}>
      {text}
    </Text>
  );
}

function Chip({
  selected,
  onClick,
  children,
  ariaLabel
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Flex
      as="button"
      type="button"
      align="center"
      justify="center"
      px={2.5}
      py={1.5}
      borderRadius="8px"
      border="1px solid"
      borderColor={selected ? AI_VIDEO_PRIMARY : '#E7E7E7'}
      bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
      color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
      fontSize="12px"
      transition="all 0.15s"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Flex>
  );
}

export function TextPanel({
  shot,
  selectedTextId,
  onSelectText,
  onAdd,
  onChange,
  onDelete
}: {
  shot: StoryboardShot | null;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<PptTextOverlay>) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation('teacher');
  const overlays = shot?.textOverlays ?? [];
  const selected = overlays.find((item) => item.id === selectedTextId) ?? null;
  const isCustomColor = selected ? !COLOR_OPTIONS.includes(selected.color) : false;

  return (
    <VStack align="stretch" spacing={4}>
      {/* 添加文本框 */}
      <Flex
        as="button"
        type="button"
        align="center"
        justify="center"
        gap={1.5}
        py={2.5}
        borderRadius="10px"
        border="1px dashed"
        borderColor="#D9DEE7"
        color="gray.500"
        fontSize="13px"
        _hover={{ borderColor: AI_VIDEO_PRIMARY, color: AI_VIDEO_PRIMARY }}
        transition="all 0.15s"
        onClick={() => {
          if (shot) onAdd();
        }}
        opacity={shot ? 1 : 0.5}
        cursor={shot ? 'pointer' : 'not-allowed'}
      >
        <Plus size={15} />
        {t('aiVideo.ppt.editor.text.addTextBox')}
      </Flex>

      {/* 文本框列表 */}
      {overlays.length > 0 && (
        <VStack align="stretch" spacing={1.5}>
          {overlays.map((item) => {
            const active = item.id === selectedTextId;
            return (
              <Flex
                key={item.id}
                align="center"
                gap={2}
                px={2.5}
                py={2}
                borderRadius="10px"
                border="1px solid"
                borderColor={active ? AI_VIDEO_PRIMARY : '#EDF0F5'}
                bg={active ? AI_VIDEO_PRIMARY_BG : 'white'}
              >
                <Flex
                  as="button"
                  type="button"
                  flex="1"
                  minW={0}
                  align="center"
                  gap={2}
                  onClick={() => onSelectText(active ? null : item.id)}
                  textAlign="left"
                >
                  <Type size={13} color={active ? AI_VIDEO_PRIMARY : '#A0AEC0'} />
                  <Text
                    fontSize="12px"
                    color={active ? AI_VIDEO_PRIMARY : 'gray.600'}
                    noOfLines={1}
                  >
                    {item.content}
                  </Text>
                </Flex>
                <IconButton
                  aria-label={t('aiVideo.ppt.editor.text.deleteText')}
                  icon={<Trash2 size={12} />}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: 'red.500' }}
                  onClick={() => onDelete(item.id)}
                />
              </Flex>
            );
          })}
        </VStack>
      )}

      {overlays.length === 0 && (
        <Text fontSize="12px" color="gray.400" textAlign="center" py={2}>
          {t('aiVideo.ppt.editor.text.empty')}
        </Text>
      )}

      {/* 选中文本框的属性编辑 */}
      {selected && (
        <VStack align="stretch" spacing={4} pt={1}>
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.content')} />
            <Input
              value={selected.content}
              maxLength={100}
              size="sm"
              borderRadius="8px"
              borderColor="#E7E7E7"
              fontSize="13px"
              _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              onChange={(event) => onChange(selected.id, { content: event.target.value })}
            />
          </Box>

          {/* 字体（下拉选择） */}
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.font')} />
            <Select
              size="sm"
              borderRadius="8px"
              borderColor="#E7E7E7"
              fontSize="13px"
              value={selected.fontFamily}
              fontFamily={TEXT_FONT_STACKS[selected.fontFamily]}
              _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              onChange={(event) =>
                onChange(selected.id, { fontFamily: event.target.value as PptTextFont })
              }
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: TEXT_FONT_STACKS[font] }}>
                  {t(`aiVideo.ppt.editor.text.fontOption.${font}`)}
                </option>
              ))}
            </Select>
          </Box>

          {/* 字号（数字输入 + 快速加减） */}
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.size')} />
            <NumberInput
              size="sm"
              min={14}
              max={72}
              step={2}
              value={selected.fontSize}
              onChange={(_, value) => {
                const next = Math.min(72, Math.max(14, Math.round(value) || 14));
                onChange(selected.id, { fontSize: next });
              }}
            >
              <NumberInputField
                borderRadius="8px"
                borderColor="#E7E7E7"
                fontSize="13px"
                _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper aria-label={t('aiVideo.ppt.editor.text.sizeUp')} />
                <NumberDecrementStepper aria-label={t('aiVideo.ppt.editor.text.sizeDown')} />
              </NumberInputStepper>
            </NumberInput>
          </Box>

          {/* 颜色（色板 + 调色板自定义） */}
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.color')} />
            <Flex gap={2} flexWrap="wrap" align="center">
              {COLOR_OPTIONS.map((color) => (
                <Box
                  key={color}
                  as="button"
                  type="button"
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  bg={color}
                  border="2px solid"
                  borderColor={selected.color === color ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                  boxShadow={color === '#FFFFFF' ? 'inset 0 0 0 1px #E7E7E7' : 'none'}
                  onClick={() => onChange(selected.id, { color })}
                  transition="all 0.15s"
                  aria-label={color}
                />
              ))}
              {/* 调色板自定义 */}
              <Box
                as="label"
                position="relative"
                w="24px"
                h="24px"
                borderRadius="full"
                overflow="hidden"
                cursor="pointer"
                border="2px solid"
                borderColor={isCustomColor ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                title={t('aiVideo.ppt.editor.text.customColor')}
                aria-label={t('aiVideo.ppt.editor.text.customColor')}
              >
                <Box
                  w="100%"
                  h="100%"
                  bg={
                    isCustomColor
                      ? selected.color
                      : 'conic-gradient(#FF4D4F, #FFE58F, #52C41A, #13C2C2, #2F54EB, #B37FEB, #FF4D4F)'
                  }
                />
                <input
                  type="color"
                  value={selected.color}
                  onChange={(event) =>
                    onChange(selected.id, { color: event.target.value.toUpperCase() })
                  }
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  aria-label={t('aiVideo.ppt.editor.text.customColor')}
                />
              </Box>
            </Flex>
          </Box>

          {/* 对齐：水平 + 垂直 */}
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.alignH')} />
            <Flex gap={1.5}>
              {HALIGN_ICONS.map((item) => (
                <Chip
                  key={item.value}
                  selected={selected.align === item.value}
                  onClick={() => onChange(selected.id, { align: item.value })}
                  ariaLabel={t(`aiVideo.ppt.editor.text.${item.key}`)}
                >
                  {item.icon}
                </Chip>
              ))}
            </Flex>
          </Box>
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.alignV')} />
            <Flex gap={1.5}>
              {VALIGN_ICONS.map((item) => (
                <Chip
                  key={item.value}
                  selected={(selected.vAlign ?? 'middle') === item.value}
                  onClick={() => onChange(selected.id, { vAlign: item.value })}
                  ariaLabel={t(`aiVideo.ppt.editor.text.${item.key}`)}
                >
                  {item.icon}
                </Chip>
              ))}
            </Flex>
          </Box>

          <Box>
            <Flex justify="space-between" align="baseline" mb={1.5}>
              <Text fontSize="12px" color="gray.500">
                {t('aiVideo.ppt.editor.text.opacity')}
              </Text>
              <Text fontSize="12px" fontWeight={600} color={AI_VIDEO_PRIMARY}>
                {selected.opacity}%
              </Text>
            </Flex>
            <Slider
              min={10}
              max={100}
              step={5}
              value={selected.opacity}
              onChange={(value) => onChange(selected.id, { opacity: value })}
              colorScheme="red"
              focusThumbOnChange={false}
            >
              <SliderTrack bg="gray.100">
                <SliderFilledTrack bg={AI_VIDEO_PRIMARY} />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </Box>

          {/* 动画：进场 + 出场 */}
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.enterAnimation')} />
            <Flex gap={1.5} flexWrap="wrap">
              {ENTER_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={legacyEnterAnimation(selected) === option}
                  onClick={() => onChange(selected.id, { enterAnimation: option })}
                >
                  {t(`aiVideo.ppt.editor.text.enterAnimOption.${option}`)}
                </Chip>
              ))}
            </Flex>
          </Box>
          <Box>
            <FieldLabel text={t('aiVideo.ppt.editor.text.exitAnimation')} />
            <Flex gap={1.5} flexWrap="wrap">
              {EXIT_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  selected={(selected.exitAnimation ?? 'none') === option}
                  onClick={() => onChange(selected.id, { exitAnimation: option })}
                >
                  {t(`aiVideo.ppt.editor.text.exitAnimOption.${option}`)}
                </Chip>
              ))}
            </Flex>
          </Box>

          {/* 位置：九宫格 + 画面拖拽/缩放 */}
        </VStack>
      )}
    </VStack>
  );
}
