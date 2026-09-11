'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Flex, HStack, IconButton, Link, Text, Tooltip } from '@chakra-ui/react';
import { Bookmark, Download, Eye, Link2 } from 'lucide-react';
import type { PlazaResourceVO } from '@/api/teacher/resource/resource-plaza';
import { ResourceCover, sourceLabelMap } from './resourceVisuals';

const compactCount = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value);

type ResourceCardProps = {
  resource: PlazaResourceVO;
  rank?: number;
  onToggleFavorite?: (resource: PlazaResourceVO) => Promise<void> | void;
};

export default function ResourceCard({ resource, rank, onToggleFavorite }: ResourceCardProps) {
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const handleFavorite = async () => {
    if (!onToggleFavorite || favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      await onToggleFavorite(resource);
    } finally {
      setFavoriteBusy(false);
    }
  };

  return (
    <Box
      as="article"
      position="relative"
      overflow="hidden"
      bg="white"
      border="1px solid"
      borderColor="#E4E7EC"
      borderRadius="16px"
      transition="transform .2s ease, box-shadow .2s ease, border-color .2s ease"
      _hover={{
        transform: 'translateY(-3px)',
        boxShadow: '0 14px 32px rgba(15,23,42,.10)',
        borderColor: '#D0D5DD'
      }}
      _focusWithin={{ boxShadow: '0 0 0 3px rgba(180,35,45,.14)' }}
    >
      {rank ? (
        <Flex
          position="absolute"
          zIndex={2}
          top={3}
          left={3}
          minW="30px"
          h="30px"
          px={2}
          align="center"
          justify="center"
          borderRadius="9px"
          bg={rank <= 3 ? '#B4232D' : 'rgba(24,34,48,.82)'}
          color="white"
          fontSize="12px"
          fontWeight={800}
          boxShadow="0 6px 14px rgba(15,23,42,.16)"
          aria-label={`排名第 ${rank}`}
        >
          {rank < 10 ? `0${rank}` : rank}
        </Flex>
      ) : null}
      <ResourceCover resource={resource} compact />
      <Box p={4}>
        <Flex align="flex-start" justify="space-between" gap={3}>
          <Box minW={0}>
            <HStack spacing={2} mb={2}>
              <Badge
                px={2}
                py={0.5}
                borderRadius="999px"
                bg="#FFF1F0"
                color="#B4232D"
                fontSize="10px"
                textTransform="none"
              >
                {resource.categoryName}
              </Badge>
              <Text color="#98A2B3" fontSize="11px">
                {sourceLabelMap[resource.sourceType]}
              </Text>
            </HStack>
            <Link
              as={NextLink}
              href={`/teacher/resource-plaza/detail?id=${resource.id}`}
              display="block"
              color="#182230"
              fontSize="15px"
              fontWeight={700}
              lineHeight="1.55"
              noOfLines={2}
              _hover={{ color: '#B4232D', textDecoration: 'none' }}
              _focusVisible={{ boxShadow: 'none', color: '#B4232D', textDecoration: 'underline' }}
            >
              {resource.title}
            </Link>
          </Box>
          <Tooltip label={resource.isFavorite ? '取消收藏' : '收藏资源'} hasArrow>
            <IconButton
              aria-label={
                resource.isFavorite ? `取消收藏${resource.title}` : `收藏${resource.title}`
              }
              icon={
                <Bookmark
                  size={17}
                  fill={resource.isFavorite ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              }
              size="sm"
              minW="38px"
              h="38px"
              borderRadius="10px"
              variant="ghost"
              color={resource.isFavorite ? '#B4232D' : '#667085'}
              bg={resource.isFavorite ? '#FFF1F0' : '#F9FAFB'}
              isLoading={favoriteBusy}
              onClick={() => void handleFavorite()}
              _hover={{ bg: '#FFF1F0', color: '#B4232D' }}
              _focusVisible={{ boxShadow: '0 0 0 3px rgba(180,35,45,.18)' }}
            />
          </Tooltip>
        </Flex>

        <Text mt={2} color="#667085" fontSize="12px" noOfLines={1}>
          {resource.uploaderName} · {resource.courseName}
        </Text>

        <Flex
          mt={4}
          pt={3}
          borderTop="1px solid"
          borderColor="#F2F4F7"
          align="center"
          justify="space-between"
          color="#667085"
          fontSize="11px"
        >
          <HStack spacing={3.5}>
            <HStack spacing={1} title="预览次数">
              <Eye size={14} aria-hidden="true" />
              <Text>{compactCount(resource.previewCount)}</Text>
            </HStack>
            <HStack spacing={1} title="下载次数">
              <Download size={14} aria-hidden="true" />
              <Text>{compactCount(resource.downloadCount)}</Text>
            </HStack>
            <HStack spacing={1} title="引用次数">
              <Link2 size={14} aria-hidden="true" />
              <Text>{compactCount(resource.referenceCount)}</Text>
            </HStack>
          </HStack>
          <Text color="#98A2B3">{resource.publishTime.slice(5, 10)}</Text>
        </Flex>
      </Box>
    </Box>
  );
}
