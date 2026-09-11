'use client';

/**
 * AI视频课 首页 - 生成模式卡片
 */
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { ArrowUpRight } from 'lucide-react';
import { CARD_SHADOW, CARD_SHADOW_HOVER } from '../constants';

type ModeCardProps = {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  accent: string;
  accentBg: string;
  actionLabel: string;
  onClick: () => void;
};

export function ModeCard({
  icon,
  eyebrow,
  title,
  description,
  steps,
  accent,
  accentBg,
  actionLabel,
  onClick
}: ModeCardProps) {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      textAlign="left"
      w="100%"
      bg="white"
      borderRadius="18px"
      boxShadow={CARD_SHADOW}
      border="1px solid"
      borderColor="#ECEEF2"
      p={{ base: 5, lg: 6 }}
      position="relative"
      overflow="hidden"
      transition="all 0.2s"
      cursor="pointer"
      _hover={{ boxShadow: CARD_SHADOW_HOVER, transform: 'translateY(-3px)', borderColor: accent }}
      _focusVisible={{ boxShadow: `0 0 0 3px ${accentBg}` }}
    >
      <Box
        position="absolute"
        top="-52px"
        right="-42px"
        w="130px"
        h="130px"
        borderRadius="full"
        bg={accentBg}
        opacity={0.9}
      />
      <VStack align="flex-start" spacing={5} position="relative">
        <Flex w="100%" align="flex-start" justify="space-between">
          <Flex
            w="50px"
            h="50px"
            borderRadius="15px"
            bg={accentBg}
            align="center"
            justify="center"
            color={accent}
          >
            {icon}
          </Flex>
          <Flex
            w="32px"
            h="32px"
            borderRadius="full"
            bg="whiteAlpha.800"
            align="center"
            justify="center"
            color={accent}
          >
            <ArrowUpRight size={17} />
          </Flex>
        </Flex>
        <Box>
          <Text
            fontSize="11px"
            fontWeight={700}
            letterSpacing="0.08em"
            color={accent}
            textTransform="uppercase"
            mb={1.5}
          >
            {eyebrow}
          </Text>
          <Text fontSize="18px" fontWeight={700} color="#1D2129" mb={2}>
            {title}
          </Text>
          <Text
            fontSize="13px"
            color="#6B7280"
            lineHeight="1.7"
            minH={{ base: 'auto', lg: '44px' }}
          >
            {description}
          </Text>
        </Box>
        <Flex gap={2} flexWrap="wrap">
          {steps.map((step, index) => (
            <Flex key={step} align="center" gap={1.5}>
              <Flex
                w="18px"
                h="18px"
                borderRadius="full"
                align="center"
                justify="center"
                bg={accentBg}
                color={accent}
                fontSize="9px"
                fontWeight={700}
              >
                {index + 1}
              </Flex>
              <Text fontSize="11px" color="#86909C">
                {step}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex
          w="100%"
          minH="38px"
          borderRadius="10px"
          bg={accentBg}
          align="center"
          justify="center"
          color={accent}
          fontSize="12px"
          fontWeight={650}
        >
          {actionLabel}
        </Flex>
      </VStack>
    </Box>
  );
}
