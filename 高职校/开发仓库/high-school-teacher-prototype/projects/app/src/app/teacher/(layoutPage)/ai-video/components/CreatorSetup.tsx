'use client';

/**
 * AI 视频统一创作配置。
 * 交互结构参考 Leadde：素材类型切换、主输入区、紧凑生成设置、模板推荐，
 * 三类入口最终进入同一套分镜编辑与合成链路。
 */
import { useRouter } from 'next/navigation';
import {
  AspectRatio,
  Box,
  Flex,
  Grid,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text
} from '@chakra-ui/react';
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  FileText,
  Languages,
  LayoutTemplate,
  Presentation,
  Settings2,
  Sparkles,
  UserRound,
  WandSparkles
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type {
  AiVideoDuration,
  AiVideoStyle,
  AiVideoVoice,
  DigitalHumanAvatarId
} from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  DURATION_OPTIONS,
  styleThumbnail,
  VOICE_OPTIONS
} from '../constants';

type SourceType = 'text' | 'ppt';
export type CreatorPresenter = DigitalHumanAvatarId | 'none';

const STYLE_LABELS: Record<AiVideoStyle, string> = {
  realistic: '写实课堂',
  anime: '动漫讲解',
  tech: '科技解析',
  simpleCourseware: '简约课件',
  corporate: '专业汇报',
  documentary: '纪实故事',
  knowledgeTalk: '知识口播',
  flashCut: '快闪节奏'
};

const DURATION_LABELS: Record<AiVideoDuration, string> = {
  smart: '智能匹配',
  compact: '约 1 分钟',
  balanced: '1–3 分钟',
  relaxed: '3–5 分钟',
  special: '5 分钟以上'
};

const VOICE_LABELS: Record<AiVideoVoice, string> = {
  femaleClear: '清晰女声',
  femaleGentle: '温柔女声',
  maleDeep: '沉稳男声',
  maleEnergetic: '活力男声'
};

const PRESENTERS: Array<{
  id: CreatorPresenter;
  name: string;
  src?: string;
}> = [
  { id: 'yunshu', name: '云舒老师', src: '/media/ai-video/avatar-yunshu.svg' },
  { id: 'bailuwei', name: '白露微', src: '/media/ai-video/avatar-bailuwei.svg' },
  { id: 'wenyicheng', name: '温亦程', src: '/media/ai-video/avatar-wenyicheng.svg' },
  { id: 'none', name: '不使用数字人' }
];

const FLOW_STEPS = ['素材输入', '分镜脚本', '视频合成', '预览导出'];

export function CreatorFlowHeader({ active }: { active: SourceType }) {
  const router = useRouter();
  const sources: Array<{ key: SourceType; label: string; icon: typeof FileText }> = [
    { key: 'text', label: '文本或提示词', icon: FileText },
    { key: 'ppt', label: 'PPT / 文档', icon: Presentation }
  ];

  return (
    <Box>
      <Button
        size="sm"
        variant="ghost"
        color="#4E5969"
        leftIcon={<ChevronLeft size={15} />}
        onClick={() => router.push('/teacher/ai-video')}
        px={1}
        mb={4}
      >
        返回 AI 视频课
      </Button>

      <Flex
        align={{ base: 'flex-start', lg: 'center' }}
        justify="space-between"
        gap={5}
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box>
          <Flex align="center" gap={2} mb={2}>
            <Tag borderRadius="full" bg={AI_VIDEO_PRIMARY_BG} color={AI_VIDEO_PRIMARY}>
              <WandSparkles size={11} style={{ marginRight: 5 }} /> AI 深度解析视频
            </Tag>
          </Flex>
          <Text
            as="h1"
            fontSize={{ base: '24px', md: '30px' }}
            lineHeight="1.25"
            fontWeight={750}
            color="#1D2129"
          >
            将教学内容转化为可编辑的讲解视频
          </Text>
          <Text fontSize="13px" color="#86909C" mt={2}>
            AI 自动整理内容、生成分镜与讲稿，进入编辑器后可继续调整画面、数字人、配音和字幕。
          </Text>
        </Box>

        <Flex align="center" gap={1} flexWrap="wrap" aria-label="视频创作流程">
          {FLOW_STEPS.map((step, index) => (
            <Flex key={step} align="center" gap={1}>
              <Flex
                align="center"
                gap={1.5}
                px={2.5}
                py={1.5}
                borderRadius="full"
                bg={index === 0 ? AI_VIDEO_PRIMARY_BG : 'white'}
                color={index === 0 ? AI_VIDEO_PRIMARY : '#86909C'}
                border="1px solid"
                borderColor={index === 0 ? '#FFD5D7' : '#ECEEF2'}
                fontSize="11px"
                fontWeight={index === 0 ? 600 : 400}
              >
                <Text as="span" fontFamily="mono" fontSize="10px">
                  {index + 1}
                </Text>
                {step}
              </Flex>
              {index < FLOW_STEPS.length - 1 ? (
                <Text color="#C9CDD4" fontSize="11px">
                  →
                </Text>
              ) : null}
            </Flex>
          ))}
        </Flex>
      </Flex>

      <Flex
        mt={6}
        p={1}
        bg="#F2F3F5"
        borderRadius="12px"
        w="fit-content"
        role="tablist"
        aria-label="输入素材类型"
      >
        {sources.map(({ key, label, icon: Icon }) => {
          const selected = active === key;
          return (
            <Flex
              key={key}
              as="button"
              type="button"
              role="tab"
              aria-selected={selected}
              align="center"
              gap={2}
              px={{ base: 3, md: 5 }}
              py={2.5}
              borderRadius="9px"
              bg={selected ? 'white' : 'transparent'}
              color={selected ? '#1D2129' : '#86909C'}
              boxShadow={selected ? '0 1px 5px rgba(0,0,0,.08)' : 'none'}
              fontSize="13px"
              fontWeight={selected ? 650 : 400}
              onClick={() =>
                router.push(`/teacher/ai-video/create/${key === 'ppt' ? 'ppt' : 'text'}`)
              }
              _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
            >
              <Icon size={15} /> {label}
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

type CreatorControlBarProps = {
  style: AiVideoStyle;
  ratio: '16:9' | '9:16';
  duration: AiVideoDuration;
  voice: AiVideoVoice;
  presenter: CreatorPresenter;
  onStyleChange: (style: AiVideoStyle) => void;
  onDurationChange: (duration: AiVideoDuration) => void;
  onVoiceChange: (voice: AiVideoVoice) => void;
  onPresenterChange: (presenter: CreatorPresenter) => void;
  onAdvanced: () => void;
  advancedOpen: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
};

export function CreatorControlBar({
  style,
  ratio,
  duration,
  voice,
  presenter,
  onStyleChange,
  onDurationChange,
  onVoiceChange,
  onPresenterChange,
  onAdvanced,
  advancedOpen,
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  submitLabel = '生成分镜'
}: CreatorControlBarProps) {
  const presenterOption = PRESENTERS.find((item) => item.id === presenter) ?? PRESENTERS[0];

  return (
    <Flex
      align="center"
      gap={1}
      flexWrap="wrap"
      pt={3}
      mt={3}
      borderTop="1px solid #F0F1F3"
    >
      <Menu placement="bottom-start">
        <SetupMenuButton
          icon={
            presenterOption.src ? (
              <Image
                src={presenterOption.src}
                alt=""
                w="24px"
                h="24px"
                borderRadius="full"
                bg="#F2F3F5"
                objectFit="cover"
              />
            ) : (
              <UserRound size={16} />
            )
          }
          label={presenterOption.name}
          ariaLabel="选择数字人"
        />
        <MenuList minW="210px" p={1.5} borderRadius="12px" boxShadow="0 10px 30px rgba(0,0,0,.14)">
          {PRESENTERS.map((item) => (
            <MenuItem
              key={item.id}
              borderRadius="8px"
              fontSize="13px"
              bg={item.id === presenter ? AI_VIDEO_PRIMARY_BG : undefined}
              color={item.id === presenter ? AI_VIDEO_PRIMARY : '#4E5969'}
              onClick={() => onPresenterChange(item.id)}
              icon={
                item.src ? (
                  <Image src={item.src} alt="" w="26px" h="26px" borderRadius="full" />
                ) : (
                  <UserRound size={15} />
                )
              }
            >
              {item.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      <Menu placement="bottom-start">
        <SetupMenuButton
          icon={
            <Image
              src={styleThumbnail(style, ratio)}
              alt=""
              w="28px"
              h="20px"
              borderRadius="5px"
              objectFit="cover"
            />
          }
          label={STYLE_LABELS[style]}
          ariaLabel="选择视频模板"
        />
        <MenuList minW="190px" p={1.5} borderRadius="12px" boxShadow="0 10px 30px rgba(0,0,0,.14)">
          {(Object.keys(STYLE_LABELS) as AiVideoStyle[]).map((item) => (
            <MenuItem
              key={item}
              borderRadius="8px"
              fontSize="13px"
              bg={item === style ? AI_VIDEO_PRIMARY_BG : undefined}
              color={item === style ? AI_VIDEO_PRIMARY : '#4E5969'}
              onClick={() => onStyleChange(item)}
            >
              {STYLE_LABELS[item]}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      <Menu placement="bottom-start">
        <SetupMenuButton
          icon={<Languages size={15} />}
          label="中文"
          ariaLabel="选择视频语言"
        />
        <MenuList minW="155px" p={1.5} borderRadius="12px">
          <MenuItem borderRadius="8px" fontSize="13px" bg={AI_VIDEO_PRIMARY_BG} color={AI_VIDEO_PRIMARY}>
            中文（普通话）
          </MenuItem>
          <MenuItem borderRadius="8px" fontSize="13px" isDisabled>
            English · 敬请期待
          </MenuItem>
        </MenuList>
      </Menu>

      <Menu placement="bottom-start">
        <SetupMenuButton
          icon={<Sparkles size={15} />}
          label={DURATION_LABELS[duration]}
          ariaLabel="选择视频时长"
        />
        <MenuList minW="190px" p={1.5} borderRadius="12px">
          {DURATION_OPTIONS.map((item) => (
            <MenuItem
              key={item}
              borderRadius="8px"
              fontSize="13px"
              bg={item === duration ? AI_VIDEO_PRIMARY_BG : undefined}
              color={item === duration ? AI_VIDEO_PRIMARY : '#4E5969'}
              onClick={() => onDurationChange(item)}
            >
              {DURATION_LABELS[item]}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      <Menu placement="bottom-start">
        <SetupMenuButton
          icon={<UserRound size={15} />}
          label={VOICE_LABELS[voice]}
          ariaLabel="选择配音音色"
        />
        <MenuList minW="180px" p={1.5} borderRadius="12px">
          {VOICE_OPTIONS.map((item) => (
            <MenuItem
              key={item}
              borderRadius="8px"
              fontSize="13px"
              bg={item === voice ? AI_VIDEO_PRIMARY_BG : undefined}
              color={item === voice ? AI_VIDEO_PRIMARY : '#4E5969'}
              onClick={() => onVoiceChange(item)}
            >
              {VOICE_LABELS[item]}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      <Flex
        as="button"
        type="button"
        align="center"
        gap={1.5}
        px={2.5}
        h="38px"
        borderRadius="9px"
        color={advancedOpen ? AI_VIDEO_PRIMARY : '#4E5969'}
        bg={advancedOpen ? AI_VIDEO_PRIMARY_BG : 'transparent'}
        fontSize="12px"
        onClick={onAdvanced}
        aria-expanded={advancedOpen}
        _hover={{ bg: advancedOpen ? AI_VIDEO_PRIMARY_BG : '#F5F6F7' }}
        _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
      >
        <Settings2 size={15} /> 高级设置
      </Flex>

      <Box flex="1" minW={{ base: 0, md: 3 }} />
      <Flex
        as="button"
        type="button"
        align="center"
        justify="center"
        gap={2}
        minW={{ base: '100%', sm: 'auto' }}
        h="40px"
        px={4}
        mt={{ base: 2, sm: 0 }}
        borderRadius={{ base: '10px', sm: 'full' }}
        bg={submitDisabled ? '#C9CDD4' : AI_VIDEO_PRIMARY}
        color="white"
        fontSize="13px"
        fontWeight={650}
        cursor={submitDisabled ? 'not-allowed' : 'pointer'}
        disabled={submitDisabled || isSubmitting}
        onClick={onSubmit}
        aria-label={submitLabel}
        _hover={submitDisabled ? undefined : { bg: '#A80009' }}
        _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
      >
        {isSubmitting ? '创建中…' : submitLabel}
        {!isSubmitting ? <ArrowUp size={15} /> : null}
      </Flex>
    </Flex>
  );
}

function SetupMenuButton({
  icon,
  label,
  ariaLabel
}: {
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
}) {
  return (
    <MenuButton
      as={Flex}
      align="center"
      gap={1.5}
      px={2.5}
      h="38px"
      borderRadius="9px"
      color="#4E5969"
      fontSize="12px"
      cursor="pointer"
      aria-label={ariaLabel}
      _hover={{ bg: '#F5F6F7' }}
      _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
    >
      {icon}
      <Text noOfLines={1}>{label}</Text>
      <ChevronDown size={12} />
    </MenuButton>
  );
}

const TEMPLATE_CATEGORIES = ['推荐', '通用教育', '实训教学', '知识解析'];

export function CreatorTemplateStrip({
  options,
  selected,
  ratio,
  onChange
}: {
  options: AiVideoStyle[];
  selected: AiVideoStyle;
  ratio: '16:9' | '9:16';
  onChange: (style: AiVideoStyle) => void;
}) {
  return (
    <Box pt={2}>
      <Flex align="center" justify="space-between" mb={3} gap={3} flexWrap="wrap">
        <Flex align="center" gap={2}>
          <LayoutTemplate size={16} color={AI_VIDEO_PRIMARY} />
          <Text fontSize="14px" fontWeight={650} color="#1D2129">
            选择视频模板
          </Text>
          <Tag size="sm" borderRadius="full" bg={AI_VIDEO_PRIMARY_BG} color={AI_VIDEO_PRIMARY}>
            可在编辑器中更换
          </Tag>
        </Flex>
        <Flex gap={1.5} flexWrap="wrap" color="#86909C" fontSize="11px">
          {TEMPLATE_CATEGORIES.map((item, index) => (
            <Box
              key={item}
              px={2.5}
              py={1}
              borderRadius="full"
              bg={index === 0 ? '#F2F3F5' : 'transparent'}
              color={index === 0 ? '#4E5969' : '#86909C'}
            >
              {item}
            </Box>
          ))}
        </Flex>
      </Flex>
      <Grid
        templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))` }}
        gap={3}
      >
        {options.map((style) => {
          const active = selected === style;
          return (
            <Box
              key={style}
              as="button"
              type="button"
              textAlign="left"
              borderRadius="12px"
              overflow="hidden"
              border="2px solid"
              borderColor={active ? AI_VIDEO_PRIMARY : '#ECEEF2'}
              bg="white"
              onClick={() => onChange(style)}
              aria-pressed={active}
              transition="all .16s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,.08)' }}
              _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
            >
              <AspectRatio ratio={ratio === '9:16' ? 9 / 12 : 16 / 8.5} bg="#F2F3F5">
                <Box position="relative">
                  <Image
                    src={styleThumbnail(style, ratio)}
                    alt={`${STYLE_LABELS[style]}模板预览`}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                  {active ? (
                    <Tag
                      position="absolute"
                      top={2}
                      right={2}
                      size="sm"
                      borderRadius="full"
                      bg={AI_VIDEO_PRIMARY}
                      color="white"
                      fontSize="10px"
                    >
                      已选择
                    </Tag>
                  ) : null}
                </Box>
              </AspectRatio>
              <Text
                px={3}
                py={2.5}
                fontSize="12px"
                fontWeight={active ? 650 : 500}
                color={active ? AI_VIDEO_PRIMARY : '#4E5969'}
              >
                {STYLE_LABELS[style]}
              </Text>
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}
