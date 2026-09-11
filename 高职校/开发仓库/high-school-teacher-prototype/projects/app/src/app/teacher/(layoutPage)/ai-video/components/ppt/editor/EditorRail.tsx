'use client';

/**
 * PPT/文档转视频 预览编辑 - 右侧图标工具栏 + 面板
 * 模板 / 布局 / 数字人 / 声音 / 文字 / 素材 / 背景 / 背景音
 * 数字人、声音、背景音面板直接复用成片工作台（文字生成视频预览编辑页）的 panel 组件，保持一致体验；
 * 数字人面板下追加 PPT 专属：智能避让开关 + 当前页播报开关
 * 布局：课件版式 × 数字人形态 六选一（缩略图选择，实时作用于画布）
 */
import { Box, Divider, Flex, Image, SimpleGrid, Switch, Text, VStack } from '@chakra-ui/react';
import {
  Bot,
  Check,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  LayoutTemplate,
  Mic,
  Music,
  ScanFace,
  Type
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  AiVideoProject,
  AiVideoStyle,
  PptLayoutId,
  PptMaterialItem,
  PptTextOverlay,
  StoryboardShot
} from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  CARD_SHADOW,
  styleThumbnail
} from '../../../constants';
import { DigitalHumanPanel } from '../../studio/DigitalHumanPanel';
import { VoicePanel } from '../../studio/VoicePanel';
import { MusicPanel } from '../../studio/MusicPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { MaterialPanel } from './MaterialPanel';
import { TextPanel } from './TextPanel';

export type RailKey =
  | 'template'
  | 'layout'
  | 'digitalHuman'
  | 'voice'
  | 'text'
  | 'material'
  | 'background'
  | 'music';

const RAIL_ITEMS: Array<{ key: RailKey; icon: React.ReactNode }> = [
  { key: 'template', icon: <LayoutTemplate size={19} /> },
  { key: 'layout', icon: <LayoutGrid size={19} /> },
  { key: 'digitalHuman', icon: <Bot size={19} /> },
  { key: 'voice', icon: <Mic size={19} /> },
  { key: 'text', icon: <Type size={19} /> },
  { key: 'material', icon: <Images size={19} /> },
  { key: 'background', icon: <ImageIcon size={19} /> },
  { key: 'music', icon: <Music size={19} /> }
];

const TEMPLATE_OPTIONS: AiVideoStyle[] = [
  'simpleCourseware',
  'realistic',
  'corporate',
  'documentary'
];

/** 布局选项（课件版式 × 数字人形态） */
const LAYOUT_OPTIONS: Array<{
  id: PptLayoutId;
  page: 'left' | 'center' | 'full';
  dh: 'halfBody' | 'floatingAvatar' | null;
}> = [
  { id: 'leftDh', page: 'left', dh: 'halfBody' },
  { id: 'centerNone', page: 'center', dh: null },
  { id: 'fullNone', page: 'full', dh: null },
  { id: 'fullDh', page: 'full', dh: 'halfBody' },
  { id: 'fullAvatar', page: 'full', dh: 'floatingAvatar' },
  { id: 'centerAvatar', page: 'center', dh: 'floatingAvatar' }
];

/** 讲师侧立剪影 */
function FigureStanding() {
  return (
    <svg viewBox="0 0 20 28" width="100%" height="100%" aria-hidden>
      <circle cx="10" cy="4.5" r="3.5" fill="white" />
      <rect x="5" y="9" width="10" height="17" rx="4.5" fill="white" />
    </svg>
  );
}

/** 讲师镜头（圆形头像）剪影 */
function FigureAvatar() {
  return (
    <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="white" />
      <circle cx="10" cy="7.6" r="2.8" fill="#8B7CF0" />
      <path d="M4.6 16.2c1-3.2 3-4.6 5.4-4.6s4.4 1.4 5.4 4.6" fill="#8B7CF0" />
    </svg>
  );
}

/** 布局缩略图：紫色氛围底 + 页面版式 + 数字人形态剪影 */
function LayoutThumb({
  page,
  dh
}: {
  page: 'left' | 'center' | 'full';
  dh: 'halfBody' | 'floatingAvatar' | null;
}) {
  const rect =
    page === 'left'
      ? { left: '7%', top: '16%', w: '58%', h: '68%' }
      : page === 'center'
        ? { left: '17%', top: '10%', w: '66%', h: '80%' }
        : { left: '0', top: '0', w: '100%', h: '100%' };
  return (
    <Box
      position="relative"
      w="100%"
      sx={{ aspectRatio: '16 / 10' }}
      borderRadius="8px"
      overflow="hidden"
      bg="linear-gradient(135deg, #B79BF7 0%, #8B7CF0 60%, #7A68E8 100%)"
    >
      {/* 页面 */}
      <Box
        position="absolute"
        left={rect.left}
        top={rect.top}
        w={rect.w}
        h={rect.h}
        bg="white"
        borderRadius={page === 'full' ? 0 : '4px'}
        p="6%"
      >
        <Box w="70%" h="2px" bg="#C9C4EF" borderRadius="full" mb="8%" />
        <Box w="90%" h="2px" bg="#E3E0F7" borderRadius="full" mb="8%" />
        <Box w="80%" h="2px" bg="#E3E0F7" borderRadius="full" mb="8%" />
        <Box w="85%" h="2px" bg="#E3E0F7" borderRadius="full" />
      </Box>
      {/* 数字人形态 */}
      {dh === 'halfBody' && (
        <Box position="absolute" right="6%" bottom="8%" w="16%" h="52%">
          <FigureStanding />
        </Box>
      )}
      {dh === 'floatingAvatar' && (
        <Box position="absolute" right="6%" top="8%" w="18%" sx={{ aspectRatio: '1' }}>
          <FigureAvatar />
        </Box>
      )}
    </Box>
  );
}

/** 面板容器（宽度/内边距与成片工作台一致） */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      w="340px"
      flexShrink={0}
      bg="white"
      borderRadius="16px"
      boxShadow={CARD_SHADOW}
      p={5}
      h="100%"
      overflowY="auto"
      display="flex"
      flexDirection="column"
    >
      <Text fontSize="14px" fontWeight={700} color="gray.800" mb={4}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

export function EditorRail({
  project,
  selectedShot,
  active,
  onSelect,
  onTemplateChange,
  onLayoutChange,
  onConfigChange,
  onSmartAvoidChange,
  onShotDigitalHumanToggle,
  selectedTextId,
  onSelectText,
  onTextAdd,
  onTextChange,
  onTextDelete,
  onMaterialUpload,
  onMaterialDelete,
  onMaterialAddToCanvas,
  onBackgroundChange
}: {
  project: AiVideoProject;
  selectedShot: StoryboardShot | null;
  active: RailKey | null;
  onSelect: (key: RailKey | null) => void;
  onTemplateChange: (style: AiVideoStyle) => void;
  /** 布局变更（课件版式 × 数字人形态） */
  onLayoutChange: (layout: PptLayoutId) => void;
  /** 音频/数字人配置变更（与成片工作台 handleConfigChange 同一约定） */
  onConfigChange: (patch: Partial<Pick<AiVideoProject, 'audio' | 'digitalHuman'>>) => void;
  /** PPT 专属：智能避让开关 */
  onSmartAvoidChange: (smartAvoid: boolean) => void;
  /** PPT 专属：当前页数字人播报开关 */
  onShotDigitalHumanToggle: (enabled: boolean) => void;
  /** 文本框：当前选中 id */
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onTextAdd: () => void;
  onTextChange: (id: string, patch: Partial<PptTextOverlay>) => void;
  onTextDelete: (id: string) => void;
  /** 素材库：上传/删除/添加到画布 */
  onMaterialUpload: (item: PptMaterialItem) => void;
  onMaterialDelete: (id: string) => void;
  onMaterialAddToCanvas: (item: PptMaterialItem) => void;
  /** 背景：预设 id / dataURL / undefined（跟随模板） */
  onBackgroundChange: (background: string | undefined) => void;
}) {
  const { t } = useTranslation('teacher');
  const smartAvoid = project.pptConfig?.smartAvoid ?? true;
  const shotDhEnabled = selectedShot ? !selectedShot.digitalHumanOverride?.hidden : true;

  const renderPanel = () => {
    if (!active) return null;

    if (active === 'template') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.template')}>
          <VStack align="stretch" spacing={2}>
            {TEMPLATE_OPTIONS.map((style) => {
              const selected = project.params.style === style;
              return (
                <Flex
                  key={style}
                  as="button"
                  type="button"
                  align="center"
                  gap={2}
                  p={1.5}
                  borderRadius="10px"
                  border="2px solid"
                  borderColor={selected ? AI_VIDEO_PRIMARY : '#EDF0F5'}
                  onClick={() => onTemplateChange(style)}
                  transition="all 0.15s"
                >
                  <Image
                    src={styleThumbnail(style, '16:9')}
                    alt=""
                    w="72px"
                    h="42px"
                    objectFit="cover"
                    borderRadius="6px"
                  />
                  <Text
                    fontSize="12px"
                    color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
                    fontWeight={selected ? 600 : 400}
                  >
                    {t(`aiVideo.create.styleOption.${style}`)}
                  </Text>
                </Flex>
              );
            })}
          </VStack>
        </Panel>
      );
    }

    if (active === 'layout') {
      const currentLayout = project.pptConfig?.layout ?? 'leftDh';
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.layout')}>
          <SimpleGrid columns={2} spacing={3}>
            {LAYOUT_OPTIONS.map((option) => {
              const selected = currentLayout === option.id;
              return (
                <Flex
                  key={option.id}
                  as="button"
                  type="button"
                  direction="column"
                  align="stretch"
                  gap={1.5}
                  p={1.5}
                  borderRadius="12px"
                  border="2px solid"
                  borderColor={selected ? AI_VIDEO_PRIMARY : '#F0F0F0'}
                  bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                  position="relative"
                  onClick={() => onLayoutChange(option.id)}
                  transition="all 0.15s"
                  _hover={{ borderColor: AI_VIDEO_PRIMARY }}
                >
                  <LayoutThumb page={option.page} dh={option.dh} />
                  <Text
                    fontSize="11px"
                    textAlign="center"
                    color={selected ? AI_VIDEO_PRIMARY : 'gray.600'}
                    fontWeight={selected ? 600 : 400}
                    noOfLines={1}
                  >
                    {t(`aiVideo.ppt.editor.layoutOption.${option.id}`)}
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
        </Panel>
      );
    }

    if (active === 'digitalHuman') {
      return (
        <Box
          w="340px"
          flexShrink={0}
          bg="white"
          borderRadius="16px"
          boxShadow={CARD_SHADOW}
          p={5}
          h="100%"
          overflowY="auto"
        >
          {/* 与文字生成视频预览编辑页一致的数字人面板 */}
          <DigitalHumanPanel
            project={project}
            onConfigChange={onConfigChange}
            onClose={() => onSelect(null)}
          />
          {/* PPT 专属适配（5.5）：智能避让 + 当前页播报开关 */}
          {project.digitalHuman?.enabled && (
            <>
              <Divider my={4} borderColor="gray.100" />
              <Flex align="center" justify="space-between" py={1}>
                <Flex align="center" gap={1.5} minW={0}>
                  <Box color={AI_VIDEO_PRIMARY} flexShrink={0}>
                    <ScanFace size={14} />
                  </Box>
                  <Text fontSize="12px" color="gray.700" noOfLines={1}>
                    {t('aiVideo.ppt.digitalHuman.smartAvoid')}
                  </Text>
                </Flex>
                <Switch
                  size="sm"
                  colorScheme="red"
                  isChecked={smartAvoid}
                  onChange={(event) => onSmartAvoidChange(event.target.checked)}
                  flexShrink={0}
                />
              </Flex>
              {selectedShot && (
                <Flex align="center" justify="space-between" py={1} mt={1}>
                  <Text fontSize="12px" color="gray.700" noOfLines={1}>
                    {t('aiVideo.ppt.editor.currentShotDh')}
                  </Text>
                  <Switch
                    size="sm"
                    colorScheme="red"
                    isChecked={shotDhEnabled}
                    onChange={(event) => onShotDigitalHumanToggle(event.target.checked)}
                    flexShrink={0}
                  />
                </Flex>
              )}
            </>
          )}
        </Box>
      );
    }

    if (active === 'text') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.text')}>
          <TextPanel
            shot={selectedShot}
            selectedTextId={selectedTextId}
            onSelectText={onSelectText}
            onAdd={onTextAdd}
            onChange={onTextChange}
            onDelete={onTextDelete}
          />
        </Panel>
      );
    }

    if (active === 'material') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.material')}>
          <MaterialPanel
            materials={project.materials ?? []}
            canAddToCanvas={Boolean(selectedShot)}
            onUpload={onMaterialUpload}
            onDelete={onMaterialDelete}
            onAddToCanvas={onMaterialAddToCanvas}
          />
        </Panel>
      );
    }

    if (active === 'background') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.background')}>
          <BackgroundPanel
            background={project.pptConfig?.background}
            onChange={onBackgroundChange}
          />
        </Panel>
      );
    }

    if (active === 'voice') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.voice')}>
          <VoicePanel project={project} onConfigChange={onConfigChange} />
        </Panel>
      );
    }

    if (active === 'music') {
      return (
        <Panel title={t('aiVideo.ppt.editor.rail.music')}>
          <MusicPanel project={project} onConfigChange={onConfigChange} />
        </Panel>
      );
    }

    return null;
  };

  return (
    <Flex h="100%" gap={3} flexShrink={0}>
      {renderPanel()}
      <VStack w="64px" flexShrink={0} spacing={1} pt={1}>
        {RAIL_ITEMS.slice(0, 4).map((item) => {
          const isActive = active === item.key;
          return (
            <Flex
              key={item.key}
              as="button"
              type="button"
              direction="column"
              align="center"
              justify="center"
              w="56px"
              h="56px"
              borderRadius="12px"
              gap={1}
              bg={isActive ? '#FFF1F0' : 'white'}
              color={isActive ? AI_VIDEO_PRIMARY : 'gray.500'}
              boxShadow={CARD_SHADOW}
              _hover={{ bg: isActive ? '#FFF1F0' : 'blackAlpha.50' }}
              onClick={() => onSelect(isActive ? null : item.key)}
              transition="all 0.15s"
            >
              {item.icon}
              <Text fontSize="11px" fontWeight={isActive ? 600 : 400}>
                {t(`aiVideo.ppt.editor.rail.${item.key}`)}
              </Text>
            </Flex>
          );
        })}
        <Divider w="32px" borderColor="gray.200" my={1} />
        {RAIL_ITEMS.slice(4).map((item) => {
          const isActive = active === item.key;
          return (
            <Flex
              key={item.key}
              as="button"
              type="button"
              direction="column"
              align="center"
              justify="center"
              w="56px"
              h="48px"
              borderRadius="12px"
              gap={1}
              bg={isActive ? '#FFF1F0' : 'white'}
              color={isActive ? AI_VIDEO_PRIMARY : 'gray.500'}
              boxShadow={CARD_SHADOW}
              _hover={{ bg: isActive ? '#FFF1F0' : 'blackAlpha.50' }}
              onClick={() => onSelect(isActive ? null : item.key)}
              transition="all 0.15s"
            >
              {item.icon}
              <Text fontSize="11px" fontWeight={isActive ? 600 : 400}>
                {t(`aiVideo.ppt.editor.rail.${item.key}`)}
              </Text>
            </Flex>
          );
        })}
      </VStack>
    </Flex>
  );
}
