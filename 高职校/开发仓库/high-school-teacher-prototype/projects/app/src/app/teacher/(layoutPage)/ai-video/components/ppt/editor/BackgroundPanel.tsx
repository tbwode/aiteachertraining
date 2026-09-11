'use client';

/**
 * PPT/文档转视频 预览编辑 - 背景面板
 * 系统背景预设展示与替换（作用于全部片段画布）；
 * 支持本地上传图片作为自定义背景（≤10MB）
 */
import { useRef } from 'react';
import { Box, Flex, IconButton, Image, SimpleGrid, Text, useToast, VStack } from '@chakra-ui/react';
import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AI_VIDEO_PRIMARY, CARD_SHADOW, PPT_BACKGROUND_PRESETS } from '../../../constants';

/** 背景图大小上限 10MB */
const BACKGROUND_MAX_BYTES = 10 * 1024 * 1024;

export function BackgroundPanel({
  background,
  onChange
}: {
  /** 当前背景：预设 id 或 dataURL（undefined 表示跟随模板） */
  background: string | undefined;
  onChange: (background: string | undefined) => void;
}) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCustom = Boolean(background?.startsWith('data:'));

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('aiVideo.ppt.editor.background.typeTip'),
        status: 'info',
        duration: 2500,
        position: 'top'
      });
      return;
    }
    if (file.size > BACKGROUND_MAX_BYTES) {
      toast({
        title: t('aiVideo.ppt.editor.background.oversizeTip'),
        status: 'warning',
        duration: 2500,
        position: 'top'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* 系统背景 */}
      <Box>
        <Text fontSize="12px" color="gray.500" mb={2}>
          {t('aiVideo.ppt.editor.background.system')}
        </Text>
        <SimpleGrid columns={2} spacing={2.5}>
          {PPT_BACKGROUND_PRESETS.map((preset) => {
            const selected = background === preset.id;
            return (
              <Flex
                key={preset.id}
                as="button"
                type="button"
                direction="column"
                align="stretch"
                gap={1.5}
                p={1.5}
                borderRadius="12px"
                border="2px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#F0F0F0'}
                position="relative"
                onClick={() => onChange(selected ? undefined : preset.id)}
                transition="all 0.15s"
                _hover={{ borderColor: AI_VIDEO_PRIMARY }}
              >
                <Box
                  w="100%"
                  sx={{ aspectRatio: '16 / 9' }}
                  borderRadius="8px"
                  bg={preset.css}
                  boxShadow={CARD_SHADOW}
                />
                <Text
                  fontSize="11px"
                  textAlign="center"
                  color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
                  fontWeight={selected ? 600 : 400}
                  noOfLines={1}
                >
                  {t(`aiVideo.ppt.editor.background.preset.${preset.id}`)}
                </Text>
                {selected && (
                  <Flex
                    position="absolute"
                    top="6px"
                    right="6px"
                    w="18px"
                    h="18px"
                    borderRadius="full"
                    bg={AI_VIDEO_PRIMARY}
                    color="white"
                    align="center"
                    justify="center"
                    boxShadow="0 1px 4px rgba(0,0,0,0.25)"
                  >
                    <Check size={11} />
                  </Flex>
                )}
              </Flex>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* 自定义背景（本地上传） */}
      <Box>
        <Text fontSize="12px" color="gray.500" mb={2}>
          {t('aiVideo.ppt.editor.background.custom')}
        </Text>
        {isCustom ? (
          <Box position="relative" role="group">
            <Image
              src={background}
              alt=""
              w="100%"
              sx={{ aspectRatio: '16 / 9' }}
              objectFit="cover"
              borderRadius="10px"
              border="2px solid"
              borderColor={AI_VIDEO_PRIMARY}
            />
            <Flex
              position="absolute"
              inset={0}
              bg="blackAlpha.500"
              borderRadius="10px"
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
                color={AI_VIDEO_PRIMARY}
                fontSize="11px"
                fontWeight={600}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus size={11} />
                {t('aiVideo.ppt.editor.background.replace')}
              </Flex>
              <Flex
                as="button"
                type="button"
                align="center"
                gap={1}
                px={2.5}
                py={1}
                borderRadius="full"
                bg="white"
                color="red.500"
                fontSize="11px"
                fontWeight={600}
                onClick={() => onChange(undefined)}
              >
                <Trash2 size={11} />
                {t('aiVideo.ppt.editor.background.remove')}
              </Flex>
            </Flex>
            <Flex
              position="absolute"
              top="6px"
              right="6px"
              w="18px"
              h="18px"
              borderRadius="full"
              bg={AI_VIDEO_PRIMARY}
              color="white"
              align="center"
              justify="center"
              boxShadow="0 1px 4px rgba(0,0,0,0.25)"
            >
              <Check size={11} />
            </Flex>
          </Box>
        ) : (
          <Flex
            as="button"
            type="button"
            align="center"
            justify="center"
            gap={1.5}
            py={3}
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
            {t('aiVideo.ppt.editor.background.upload')}
          </Flex>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </Box>

      <Text fontSize="11px" color="gray.400" lineHeight="1.6">
        {t('aiVideo.ppt.editor.background.tip')}
      </Text>
    </VStack>
  );
}
