'use client';

/**
 * AI视频课 工作台 - 数字人面板
 * 布局：标题+关闭 / 当前数字人卡（形象+展示模式图标）/ 写实·卡通选项卡 / 搜索+筛选 / 3 列形象网格
 * 选择形象即启用；画面上的数字人可拖拽移动、缩放与关闭（同步到所有片段或仅此片段）
 */
import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  Check,
  CircleUserRound,
  ListFilter,
  PersonStanding,
  Search,
  UserRound,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  AiVideoProject,
  DigitalHumanAvatarId,
  DigitalHumanMode
} from '@/teacher/types/aiVideo';
import { DEFAULT_DIGITAL_HUMAN_CONFIG } from '@/teacher/api/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG, DIGITAL_HUMAN_AVATARS } from '../../constants';

/** 展示模式图标（与当前数字人卡片右侧图标顺序一致：全身/半身/悬浮头像） */
const MODE_OPTIONS: Array<{ id: DigitalHumanMode; icon: React.ReactNode }> = [
  { id: 'fullBody', icon: <PersonStanding size={16} /> },
  { id: 'halfBody', icon: <UserRound size={16} /> },
  { id: 'floatingAvatar', icon: <CircleUserRound size={16} /> }
];

type DigitalHumanPanelProps = {
  project: AiVideoProject;
  onConfigChange: (patch: Partial<Pick<AiVideoProject, 'digitalHuman'>>) => void;
  /** 关闭面板（收起右侧工具面板） */
  onClose: () => void;
};

export function DigitalHumanPanel({ project, onConfigChange, onClose }: DigitalHumanPanelProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const config = project.digitalHuman ?? DEFAULT_DIGITAL_HUMAN_CONFIG;
  const [category, setCategory] = useState<'realistic' | 'cartoon'>('realistic');
  const [keyword, setKeyword] = useState('');

  const patch = (partial: Partial<typeof config>) =>
    onConfigChange({ digitalHuman: { ...config, ...partial } });

  /** 选择形象即启用数字人 */
  const handleSelectAvatar = (avatar: DigitalHumanAvatarId) => {
    patch({ avatar, enabled: true });
  };

  const currentAvatar =
    DIGITAL_HUMAN_AVATARS.find((item) => item.id === config.avatar) ?? DIGITAL_HUMAN_AVATARS[0];

  /* 选项卡 + 搜索过滤形象网格 */
  const avatars = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return DIGITAL_HUMAN_AVATARS.filter((item) => {
      if (item.category !== category) return false;
      if (!kw) return true;
      const name = t(`aiVideo.studio.digitalHuman.avatar.${item.id}`).toLowerCase();
      return name.includes(kw);
    });
  }, [category, keyword, t]);

  return (
    <VStack align="stretch" spacing={4}>
      {/* 头部：标题 + 关闭 */}
      <Flex justify="space-between" align="center" mt={-1}>
        <Text fontSize="14px" fontWeight={700} color="gray.800">
          {t('aiVideo.studio.rail.digitalHuman')}
        </Text>
        <IconButton
          aria-label={t('aiVideo.common.close')}
          icon={<X size={15} />}
          size="sm"
          variant="ghost"
          color="gray.400"
          onClick={onClose}
        />
      </Flex>

      {/* 当前数字人卡片：形象 + 名称 + 展示模式图标 */}
      <Flex
        align="center"
        gap={3}
        p={3}
        borderRadius="12px"
        border="1px solid"
        borderColor="#EEF0F4"
        bg="gray.50"
      >
        <Image
          src={currentAvatar.src}
          alt={t(`aiVideo.studio.digitalHuman.avatar.${currentAvatar.id}`)}
          w="44px"
          h="44px"
          borderRadius="full"
          border="2px solid"
          borderColor={config.enabled ? AI_VIDEO_PRIMARY : '#E7E7E7'}
          bg="white"
          flexShrink={0}
        />
        <VStack align="flex-start" spacing={0} flex="1" minW={0}>
          <Text fontSize="11px" color="gray.400">
            {t('aiVideo.studio.digitalHuman.current')}
          </Text>
          <Flex align="center" gap={2}>
            <Text fontSize="13px" fontWeight={600} color="gray.700" noOfLines={1}>
              {t(`aiVideo.studio.digitalHuman.avatar.${currentAvatar.id}`)}
            </Text>
            {!config.enabled && (
              <Text
                as="button"
                type="button"
                fontSize="10px"
                color={AI_VIDEO_PRIMARY}
                bg={AI_VIDEO_PRIMARY_BG}
                borderRadius="full"
                px={2}
                py={0.5}
                flexShrink={0}
                onClick={() => patch({ enabled: true })}
              >
                {t('aiVideo.studio.digitalHuman.reEnable')}
              </Text>
            )}
          </Flex>
        </VStack>
        {/* 展示模式 */}
        <Flex gap={1.5} flexShrink={0}>
          {MODE_OPTIONS.map(({ id, icon }) => {
            const selected = (config.mode ?? 'floatingAvatar') === id;
            return (
              <Flex
                key={id}
                as="button"
                type="button"
                w="30px"
                h="30px"
                align="center"
                justify="center"
                borderRadius="8px"
                border="1.5px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#E7E7E7'}
                color={selected ? AI_VIDEO_PRIMARY : 'gray.400'}
                bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                title={t(`aiVideo.studio.digitalHuman.mode.${id}`)}
                onClick={() => patch({ mode: id })}
                transition="all 0.15s"
              >
                {icon}
              </Flex>
            );
          })}
        </Flex>
      </Flex>

      {/* 选项卡：写实 / 卡通 */}
      <Flex borderBottom="1px solid" borderColor="#F0F0F0">
        {(['realistic', 'cartoon'] as const).map((item) => {
          const active = category === item;
          return (
            <Flex
              key={item}
              as="button"
              type="button"
              flex="1"
              justify="center"
              py={2}
              fontSize="13px"
              fontWeight={active ? 600 : 400}
              color={active ? AI_VIDEO_PRIMARY : 'gray.500'}
              borderBottom="2px solid"
              borderColor={active ? AI_VIDEO_PRIMARY : 'transparent'}
              mb="-1px"
              onClick={() => setCategory(item)}
            >
              {t(`aiVideo.studio.digitalHuman.category.${item}`)}
            </Flex>
          );
        })}
      </Flex>

      {/* 搜索 + 筛选 */}
      <Flex gap={2}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <Search size={13} color="#A0AEC0" />
          </InputLeftElement>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t('aiVideo.studio.digitalHuman.searchPlaceholder')}
            borderRadius="8px"
            borderColor="#E7E7E7"
            fontSize="12px"
            _focusVisible={{ borderColor: AI_VIDEO_PRIMARY, boxShadow: 'none' }}
          />
        </InputGroup>
        <Flex
          as="button"
          type="button"
          align="center"
          gap={1}
          px={3}
          borderRadius="8px"
          border="1px solid"
          borderColor="#E7E7E7"
          fontSize="12px"
          color="gray.500"
          flexShrink={0}
          _hover={{ borderColor: AI_VIDEO_PRIMARY, color: AI_VIDEO_PRIMARY }}
          onClick={() =>
            toast({
              title: t('aiVideo.home.comingSoonTip'),
              status: 'info',
              duration: 1600,
              position: 'top'
            })
          }
        >
          <ListFilter size={13} />
          {t('aiVideo.studio.digitalHuman.filter')}
        </Flex>
      </Flex>

      {/* 形象网格（3 列） */}
      {avatars.length > 0 ? (
        <SimpleGrid columns={3} spacing={2.5}>
          {avatars.map((avatar) => {
            const selected = config.avatar === avatar.id && config.enabled;
            return (
              <Flex
                key={avatar.id}
                as="button"
                type="button"
                direction="column"
                align="center"
                gap={1.5}
                p={2}
                pb={2.5}
                borderRadius="12px"
                border="2px solid"
                borderColor={selected ? AI_VIDEO_PRIMARY : '#F0F0F0'}
                bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                position="relative"
                onClick={() => handleSelectAvatar(avatar.id)}
                transition="all 0.15s"
                _hover={{ borderColor: AI_VIDEO_PRIMARY }}
              >
                <Image
                  src={avatar.src}
                  alt={t(`aiVideo.studio.digitalHuman.avatar.${avatar.id}`)}
                  w="100%"
                  aspectRatio={1}
                  borderRadius="8px"
                  bg="gray.50"
                />
                <Text fontSize="11px" color="gray.600" fontWeight={selected ? 600 : 400}>
                  {t(`aiVideo.studio.digitalHuman.avatar.${avatar.id}`)}
                </Text>
                {selected && (
                  <Flex
                    position="absolute"
                    right="6px"
                    bottom="30px"
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
      ) : (
        <Flex p={4} borderRadius="12px" border="1px dashed" borderColor="gray.200" bg="gray.50">
          <Text fontSize="12px" color="gray.400">
            {t('aiVideo.studio.digitalHuman.emptySearch')}
          </Text>
        </Flex>
      )}

      <Text fontSize="11px" color="gray.400" lineHeight="1.7">
        {t('aiVideo.studio.digitalHuman.tip')}
      </Text>
    </VStack>
  );
}
