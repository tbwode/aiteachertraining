'use client';

/**
 * AI视频课 工作台 - 右侧图标工具栏
 * AI编辑 / 讲稿 / 数字人 / 音色 / 音乐
 */
import { Flex, Text, VStack } from '@chakra-ui/react';
import { Bot, Mic, Music, ScrollText, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';

export type RailKey = 'aiEdit' | 'script' | 'digitalHuman' | 'voice' | 'music';

const PRIMARY_ITEMS: Array<{ key: RailKey; icon: React.ReactNode }> = [
  { key: 'aiEdit', icon: <Sparkles size={19} /> },
  { key: 'script', icon: <ScrollText size={19} /> },
  { key: 'digitalHuman', icon: <Bot size={19} /> },
  { key: 'voice', icon: <Mic size={19} /> },
  { key: 'music', icon: <Music size={19} /> }
];

type ToolRailProps = {
  active: RailKey | null;
  onSelect: (key: RailKey | null) => void;
};

export function ToolRail({ active, onSelect }: ToolRailProps) {
  const { t } = useTranslation('teacher');

  const renderItem = (item: { key: RailKey; icon: React.ReactNode }) => {
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
        bg={isActive ? AI_VIDEO_PRIMARY_BG : 'transparent'}
        color={isActive ? AI_VIDEO_PRIMARY : 'gray.500'}
        _hover={{ bg: isActive ? AI_VIDEO_PRIMARY_BG : 'blackAlpha.50' }}
        onClick={() => onSelect(isActive ? null : item.key)}
        transition="all 0.15s"
      >
        {item.icon}
        <Text fontSize="11px" fontWeight={isActive ? 600 : 400}>
          {t(`aiVideo.studio.rail.${item.key}`)}
        </Text>
      </Flex>
    );
  };

  return (
    <VStack w="64px" flexShrink={0} spacing={1} pt={1}>
      {PRIMARY_ITEMS.map((item) => renderItem(item))}
    </VStack>
  );
}
