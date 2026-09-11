'use client';

/**
 * PPT/文档转视频 预览编辑 - 素材面板
 * 支持上传图片/视频（dataURL 入库，单文件 ≤10MB）；素材可添加到画布（当前片段画面），
 * 添加后可在画面上移动位置、调整大小、删除
 */
import { useRef } from 'react';
import { Box, Flex, IconButton, Image, SimpleGrid, Text, useToast, VStack } from '@chakra-ui/react';
import { Clapperboard, ImagePlus, Play, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PptMaterialItem } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../../constants';

/** 单文件大小上限 10MB（dataURL 入 localStorage，控制体积） */
const MATERIAL_MAX_BYTES = 10 * 1024 * 1024;

export function MaterialPanel({
  materials,
  canAddToCanvas,
  onUpload,
  onDelete,
  onAddToCanvas
}: {
  materials: PptMaterialItem[];
  /** 当前有选中片段才可添加到画布 */
  canAddToCanvas: boolean;
  onUpload: (item: PptMaterialItem) => void;
  onDelete: (id: string) => void;
  onAddToCanvas: (item: PptMaterialItem) => void;
}) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast({
        title: t('aiVideo.ppt.editor.material.typeTip'),
        status: 'info',
        duration: 2500,
        position: 'top'
      });
      return;
    }
    if (file.size > MATERIAL_MAX_BYTES) {
      toast({
        title: t('aiVideo.ppt.editor.material.oversizeTip'),
        status: 'warning',
        duration: 2500,
        position: 'top'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpload({
        id: `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        type: isImage ? 'image' : 'video',
        url: String(reader.result),
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* 上传素材 */}
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
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={15} />
        {t('aiVideo.ppt.editor.material.upload')}
      </Flex>
      <Text fontSize="11px" color="gray.400" textAlign="center" mt={-2}>
        {t('aiVideo.ppt.editor.material.uploadTip')}
      </Text>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {/* 素材库 */}
      {materials.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={8} gap={2} color="gray.300">
          <Clapperboard size={20} />
          <Text fontSize="12px" color="gray.400" textAlign="center">
            {t('aiVideo.ppt.editor.material.empty')}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={2} spacing={2.5}>
          {materials.map((item) => (
            <Box key={item.id} position="relative" role="group">
              <Box
                position="relative"
                borderRadius="10px"
                overflow="hidden"
                border="1px solid"
                borderColor="#EDF0F5"
                bg="gray.50"
              >
                {item.type === 'image' ? (
                  <Image src={item.url} alt={item.name} w="100%" h="72px" objectFit="cover" />
                ) : (
                  <Box position="relative">
                    <Box
                      as="video"
                      src={item.url}
                      w="100%"
                      h="72px"
                      objectFit="cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <Flex
                      position="absolute"
                      inset={0}
                      align="center"
                      justify="center"
                      color="white"
                      bg="blackAlpha.300"
                    >
                      <Play size={18} />
                    </Flex>
                  </Box>
                )}
                {/* hover 操作层 */}
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.500"
                  align="center"
                  justify="center"
                  gap={2}
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  transition="opacity 0.15s"
                >
                  <Flex
                    as="button"
                    type="button"
                    align="center"
                    gap={1}
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    bg="white"
                    color={canAddToCanvas ? AI_VIDEO_PRIMARY : 'gray.400'}
                    fontSize="11px"
                    fontWeight={600}
                    cursor={canAddToCanvas ? 'pointer' : 'not-allowed'}
                    onClick={() => {
                      if (canAddToCanvas) onAddToCanvas(item);
                    }}
                  >
                    <Plus size={11} />
                    {t('aiVideo.ppt.editor.material.addToCanvas')}
                  </Flex>
                </Flex>
              </Box>
              <Flex align="center" justify="space-between" mt={1} gap={1}>
                <Text fontSize="10px" color="gray.500" noOfLines={1} flex="1" minW={0}>
                  {item.name}
                </Text>
                <IconButton
                  aria-label={t('aiVideo.ppt.editor.material.deleteMaterial')}
                  icon={<Trash2 size={11} />}
                  size="xs"
                  minW="18px"
                  h="18px"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: 'red.500' }}
                  onClick={() => onDelete(item.id)}
                />
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Text fontSize="11px" color="gray.400" lineHeight="1.6">
        {t('aiVideo.ppt.editor.material.canvasTip')}
      </Text>
    </VStack>
  );
}
