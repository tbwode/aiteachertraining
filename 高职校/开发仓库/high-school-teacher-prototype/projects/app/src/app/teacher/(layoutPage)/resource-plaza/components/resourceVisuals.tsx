import { Box, Flex, Text } from '@chakra-ui/react';
import {
  BookOpenCheck,
  ClipboardCheck,
  FlaskConical,
  MousePointerClick,
  PlayCircle,
  Presentation,
  type LucideIcon
} from 'lucide-react';
import type { PlazaResourceVO, ResourceSourceType } from '@/api/teacher/resource/resource-plaza';

type CategoryStyle = {
  icon: LucideIcon;
  color: string;
  bg: string;
  glow: string;
};

const categoryStyles: Record<number, CategoryStyle> = {
  1: { icon: Presentation, color: '#B4232D', bg: '#FFF1F0', glow: '#FECACA' },
  2: { icon: BookOpenCheck, color: '#7A5AF8', bg: '#F4F3FF', glow: '#DDD6FE' },
  3: { icon: FlaskConical, color: '#087A68', bg: '#ECFDF3', glow: '#A7F3D0' },
  4: { icon: ClipboardCheck, color: '#B54708', bg: '#FFFAEB', glow: '#FDE68A' },
  5: { icon: PlayCircle, color: '#175CD3', bg: '#EFF8FF', glow: '#BFDBFE' },
  6: { icon: MousePointerClick, color: '#C11574', bg: '#FDF2FA', glow: '#FBCFE8' }
};

export const getCategoryStyle = (categoryId: number): CategoryStyle =>
  categoryStyles[categoryId] ?? categoryStyles[1];

export const sourceLabelMap: Record<ResourceSourceType, string> = {
  teacher: '教师上传',
  school: '校本资源库',
  ai: 'AI 资源库'
};

export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export function ResourceCover({
  resource,
  compact = false
}: {
  resource: PlazaResourceVO;
  compact?: boolean;
}) {
  const style = getCategoryStyle(resource.categoryId);
  const Icon = style.icon;
  return (
    <Flex
      position="relative"
      overflow="hidden"
      minH={compact ? '116px' : '152px'}
      p={compact ? 4 : 5}
      direction="column"
      justify="space-between"
      bg={`linear-gradient(145deg, ${style.bg} 0%, #FFFFFF 68%)`}
      borderBottom="1px solid"
      borderColor="#EEF0F3"
    >
      <Box
        position="absolute"
        top="-38px"
        right="-26px"
        w="126px"
        h="126px"
        borderRadius="50%"
        bg={style.glow}
        opacity={0.52}
        filter="blur(1px)"
      />
      <Flex position="relative" align="center" justify="space-between">
        <Flex
          w="42px"
          h="42px"
          borderRadius="12px"
          align="center"
          justify="center"
          bg="white"
          color={style.color}
          boxShadow="0 6px 18px rgba(15,23,42,.08)"
        >
          <Icon size={22} aria-hidden="true" />
        </Flex>
        <Text
          px={2.5}
          py={1}
          borderRadius="999px"
          bg="rgba(255,255,255,.82)"
          color={style.color}
          fontSize="11px"
          fontWeight={700}
          textTransform="uppercase"
          boxShadow="0 2px 10px rgba(15,23,42,.06)"
        >
          {resource.fileFormat}
        </Text>
      </Flex>
      <Box position="relative">
        <Text color={style.color} fontSize="12px" fontWeight={700}>
          {resource.categoryName}
        </Text>
        <Text
          mt={1}
          color="#344054"
          fontSize={compact ? '13px' : '14px'}
          fontWeight={600}
          noOfLines={2}
        >
          {resource.courseName}
        </Text>
      </Box>
    </Flex>
  );
}
