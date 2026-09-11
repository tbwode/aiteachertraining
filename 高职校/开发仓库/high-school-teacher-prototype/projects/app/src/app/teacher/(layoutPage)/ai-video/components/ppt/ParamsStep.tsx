'use client';

/**
 * PPT/文档转视频 - 第二步：参数配置
 * 选择模板（缩略图 + 点击预览大图）/ 配音音色 / 讲解脚本模式
 * 其余参数（语速、字幕、BGM、数字人等）在第三步预览编辑页按需调整
 */
import { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AiVideoStyle, AiVideoVoice, PptScriptMode } from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  AI_VIDEO_PRIMARY_HOVER,
  CARD_SHADOW,
  styleThumbnail,
  VOICE_OPTIONS
} from '../../constants';

export type PptParamsValue = {
  /** 视频模板（主题风格） */
  template: AiVideoStyle;
  voice: AiVideoVoice;
  scriptMode: PptScriptMode;
};

/** PPT 课件场景可选模板（16:9 横屏组） */
const TEMPLATE_OPTIONS: AiVideoStyle[] = [
  'simpleCourseware',
  'realistic',
  'corporate',
  'documentary'
];

const SCRIPT_MODE_OPTIONS: PptScriptMode[] = ['concise', 'detailed', 'formal', 'minimal'];

function Label({ text, tip }: { text: string; tip?: string }) {
  return (
    <Flex align="baseline" gap={2} mb={3}>
      <Text fontSize="13px" color="gray.500">
        {text}
      </Text>
      {tip && (
        <Text fontSize="11px" color="gray.400">
          {tip}
        </Text>
      )}
    </Flex>
  );
}

export function ParamsStep({
  value,
  onChange
}: {
  value: PptParamsValue;
  onChange: (patch: Partial<PptParamsValue>) => void;
}) {
  const { t } = useTranslation('teacher');
  const [previewStyle, setPreviewStyle] = useState<AiVideoStyle | null>(null);

  return (
    <VStack align="stretch" spacing={5}>
      {/* 选择模板（支持预览） */}
      <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={5}>
        <Label text={t('aiVideo.ppt.params.template')} tip={t('aiVideo.ppt.params.templateTip')} />
        <Grid templateColumns="repeat(4, 1fr)" gap={3}>
          {TEMPLATE_OPTIONS.map((style) => {
            const selected = value.template === style;
            return (
              <Flex
                key={style}
                direction="column"
                align="stretch"
                borderRadius="12px"
                overflow="hidden"
                border="2px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#EDF0F5'}
                transition="all 0.15s"
                _hover={{ borderColor: selected ? AI_VIDEO_PRIMARY : '#D9DEE7' }}
                role="group"
                position="relative"
              >
                <Box
                  as="button"
                  type="button"
                  position="relative"
                  display="block"
                  w="100%"
                  onClick={() => onChange({ template: style })}
                >
                  <Image
                    src={styleThumbnail(style, '16:9')}
                    alt={t(`aiVideo.create.styleOption.${style}`)}
                    w="100%"
                    h="84px"
                    objectFit="cover"
                  />
                  {/* 预览入口（hover 显现；仅预览按钮可点，点击卡片其余位置直接选中） */}
                </Box>
                {/* 预览入口：右上角小按钮（hover 显现），与选中按钮平级避免按钮嵌套 */}
                <Flex
                  as="button"
                  type="button"
                  position="absolute"
                  top={1.5}
                  right={1.5}
                  align="center"
                  gap={1}
                  color="white"
                  fontSize="11px"
                  bg="blackAlpha.700"
                  borderRadius="full"
                  px={2}
                  py={1}
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  transition="opacity 0.15s"
                  _hover={{ bg: 'blackAlpha.900' }}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    setPreviewStyle(style);
                  }}
                >
                  <Eye size={12} />
                  {t('aiVideo.ppt.params.previewTemplate')}
                </Flex>
                <Text
                  as="button"
                  type="button"
                  fontSize="12px"
                  py={1.5}
                  textAlign="center"
                  bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                  color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
                  fontWeight={selected ? 600 : 400}
                  onClick={() => onChange({ template: style })}
                >
                  {t(`aiVideo.create.styleOption.${style}`)}
                </Text>
              </Flex>
            );
          })}
        </Grid>
      </Box>

      {/* 配音音色 */}
      <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={5}>
        <Label text={t('aiVideo.ppt.params.voice')} tip={t('aiVideo.ppt.params.voiceTip')} />
        <Flex gap={2} flexWrap="wrap">
          {VOICE_OPTIONS.map((voice) => {
            const selected = value.voice === voice;
            return (
              <Flex
                key={voice}
                as="button"
                type="button"
                align="center"
                justify="center"
                px={4}
                py={2}
                borderRadius="10px"
                border="1px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
                fontSize="13px"
                fontWeight={selected ? 600 : 400}
                transition="all 0.15s"
                onClick={() => onChange({ voice })}
              >
                {t(`aiVideo.create.voiceOption.${voice}`)}
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* 讲解脚本模式 */}
      <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW} p={5}>
        <Label
          text={t('aiVideo.ppt.params.scriptMode')}
          tip={t('aiVideo.ppt.params.scriptModeTip')}
        />
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          {SCRIPT_MODE_OPTIONS.map((mode) => {
            const selected = value.scriptMode === mode;
            return (
              <Flex
                key={mode}
                as="button"
                type="button"
                direction="column"
                align="flex-start"
                gap={1}
                px={4}
                py={3}
                borderRadius="12px"
                border="1px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                textAlign="left"
                transition="all 0.15s"
                onClick={() => onChange({ scriptMode: mode })}
              >
                <Text
                  fontSize="13px"
                  fontWeight={600}
                  color={selected ? AI_VIDEO_PRIMARY : 'gray.700'}
                >
                  {t(`aiVideo.ppt.params.scriptModeOption.${mode}`)}
                </Text>
                <Text fontSize="12px" color={selected ? AI_VIDEO_PRIMARY : 'gray.400'}>
                  {t(`aiVideo.ppt.params.scriptModeDesc.${mode}`)}
                </Text>
              </Flex>
            );
          })}
        </Grid>
      </Box>

      {/* 模板预览弹窗 */}
      <Modal
        isOpen={Boolean(previewStyle)}
        onClose={() => setPreviewStyle(null)}
        isCentered
        size="2xl"
      >
        <ModalOverlay />
        <ModalContent borderRadius="16px" mx={4} overflow="hidden">
          {previewStyle && (
            <ModalBody p={0}>
              <Image
                src={styleThumbnail(previewStyle, '16:9')}
                alt={t(`aiVideo.create.styleOption.${previewStyle}`)}
                w="100%"
                h="360px"
                objectFit="cover"
              />
              <Flex align="center" justify="space-between" px={5} py={4} gap={4}>
                <Box minW={0}>
                  <Text fontSize="15px" fontWeight={600} color="gray.800">
                    {t(`aiVideo.create.styleOption.${previewStyle}`)}
                  </Text>
                  <Text fontSize="12px" color="gray.400" mt={0.5}>
                    {t(`aiVideo.ppt.params.templateDesc.${previewStyle}`)}
                  </Text>
                </Box>
                <Button
                  variant="primary"
                  bg={AI_VIDEO_PRIMARY}
                  borderColor={AI_VIDEO_PRIMARY}
                  _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
                  flexShrink={0}
                  onClick={() => {
                    onChange({ template: previewStyle });
                    setPreviewStyle(null);
                  }}
                >
                  {t('aiVideo.ppt.params.useTemplate')}
                </Button>
              </Flex>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </VStack>
  );
}
