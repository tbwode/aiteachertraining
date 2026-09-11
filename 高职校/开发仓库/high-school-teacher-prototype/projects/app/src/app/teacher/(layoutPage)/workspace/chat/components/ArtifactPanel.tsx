'use client';

import { Box, Button, Flex, Grid, HStack, Text } from '@chakra-ui/react';
import {
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Eye,
  FileSliders,
  MousePointerClick,
  Presentation,
  ShoppingCart,
  Video,
  Wrench
} from 'lucide-react';
import type { MockArtifact } from '../mockSkillConversation';

const getArtifactMeta = (artifact: MockArtifact) => {
  if (artifact.type === 'lesson') {
    return {
      label: '教案',
      count: `${artifact.timeline.length} 环节`,
      icon: BookOpenCheck,
      color: '#2563EB',
      bg: '#EFF6FF'
    };
  }
  if (artifact.type === 'slides') {
    return {
      label: '幻灯片',
      count: `${artifact.slides.length} 页`,
      icon: Presentation,
      color: '#4F46E5',
      bg: '#EEF2FF'
    };
  }
  if (artifact.type === 'interactive') {
    return {
      label: '互动课件',
      count: `${artifact.modules.length} 模块`,
      icon: MousePointerClick,
      color: '#0284C7',
      bg: '#F0F9FF'
    };
  }
  if (artifact.type === 'video') {
    return {
      label: '视频课件',
      count: artifact.duration,
      icon: Video,
      color: '#DB2777',
      bg: '#FDF2F8'
    };
  }
  if (artifact.type === 'quiz') {
    return {
      label: '随堂测验',
      count: `${artifact.questions.length} 题`,
      icon: ClipboardCheck,
      color: '#9333EA',
      bg: '#FAF5FF'
    };
  }
  if (artifact.type === 'practice') {
    return {
      label: '实训工单',
      count: `${artifact.steps.length} 步`,
      icon: FileSliders,
      color: '#0F766E',
      bg: '#F0FDFA'
    };
  }
  if (artifact.type === 'campus') {
    const domainMeta = {
      'school-affairs': { icon: Building2, color: '#C83E3E', bg: '#FEF2F2' },
      procurement: { icon: ShoppingCart, color: '#7C3AED', bg: '#F5F3FF' },
      logistics: { icon: Wrench, color: '#0F766E', bg: '#F0FDFA' },
      meeting: { icon: CalendarCheck, color: '#2563EB', bg: '#EFF6FF' }
    }[artifact.domain];
    return {
      label: `${artifact.domainLabel}结果`,
      count: `${artifact.records.length} 项`,
      ...domainMeta
    };
  }
  return {
    label: '标准对齐表',
    count: `${artifact.coverage}%`,
    icon: BadgeCheck,
    color: '#D97706',
    bg: '#FFFBEB'
  };
};

export default function ArtifactPanel({
  artifacts,
  onPreview,
  compact = false
}: {
  artifacts: MockArtifact[];
  onPreview: (artifact: MockArtifact) => void;
  compact?: boolean;
}) {
  if (artifacts.length === 0) {
    return (
      <Flex
        h="180px"
        direction="column"
        align="center"
        justify="center"
        border="1px dashed #CBD5E1"
        borderRadius="14px"
        color="#94A3B8"
        textAlign="center"
        px={5}
      >
        <FileSliders size={24} />
        <Text mt={2} fontSize="12px">
          本轮未生成可预览产物
        </Text>
      </Flex>
    );
  }

  return (
    <Grid
      templateColumns={
        compact ? { base: '1fr', md: 'repeat(auto-fit, minmax(210px, 1fr))' } : '1fr'
      }
      gap={3}
    >
      {artifacts.map((artifact) => {
        const meta = getArtifactMeta(artifact);
        const ArtifactIcon = meta.icon;
        return (
          <Box
            key={artifact.id}
            border="1px solid #E2E8F0"
            borderRadius="14px"
            bg="white"
            p={compact ? 3 : 4}
            boxShadow="0 6px 18px rgba(15,23,42,.035)"
          >
            <Flex align="flex-start" justify="space-between" gap={3}>
              <Flex
                w="34px"
                h="34px"
                align="center"
                justify="center"
                flexShrink={0}
                borderRadius="10px"
                bg={meta.bg}
                color={meta.color}
              >
                <ArtifactIcon size={17} />
              </Flex>
              <HStack spacing={1.5}>
                <Text fontSize="9px" color="#64748B" bg="#F1F5F9" px={2} py={1} borderRadius="full">
                  {meta.count}
                </Text>
                <Text fontSize="9px" color="#059669" bg="#ECFDF5" px={2} py={1} borderRadius="full">
                  已就绪
                </Text>
              </HStack>
            </Flex>
            <Text mt={3} fontSize="12px" fontWeight={700} color="#1E293B" noOfLines={2}>
              {artifact.title}
            </Text>
            <Text
              mt={1.5}
              fontSize="10px"
              color="#64748B"
              lineHeight="1.6"
              noOfLines={compact ? 2 : 3}
            >
              {artifact.description}
            </Text>
            <Button
              type="button"
              mt={3}
              w="100%"
              size="sm"
              h="34px"
              borderRadius="9px"
              variant="outline"
              borderColor="#E2E8F0"
              color="#334155"
              leftIcon={<Eye size={14} />}
              fontSize="11px"
              _hover={{ borderColor: '#FDCCC8', bg: '#FFF1F0', color: '#C8000B' }}
              _focusVisible={{ outline: 'none', boxShadow: '0 0 0 3px rgba(200,0,11,.16)' }}
              onClick={() => onPreview(artifact)}
            >
              预览{meta.label}
            </Button>
          </Box>
        );
      })}
    </Grid>
  );
}
