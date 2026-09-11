import { Box, Flex, Text } from '@chakra-ui/react';
import type { SystemStyleObject } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { CARD_SHADOW, CARD_SHADOW_HOVER } from '../constants';

type MetricCardProps = {
  label: string;
  value: string;
  suffix: string;
  icon: LucideIcon;
  accent: string;
  accentBg: string;
  sx?: SystemStyleObject;
};

export function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent,
  accentBg,
  sx
}: MetricCardProps) {
  return (
    <Box
      as="article"
      bg="white"
      border="1px solid"
      borderColor="#ECEEF2"
      borderRadius={{ base: '14px', md: '18px' }}
      p={{ base: 3, md: 5 }}
      boxShadow={CARD_SHADOW}
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: 'translateY(-2px)', boxShadow: CARD_SHADOW_HOVER }}
      sx={sx}
    >
      <Flex align={{ base: 'flex-start', sm: 'center' }} justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontSize={{ base: '11px', md: '13px' }} color="#86909C" mb={1} noOfLines={1}>
            {label}
          </Text>
          <Text
            fontSize={{ base: '22px', md: '30px' }}
            fontWeight={750}
            color="#1D2129"
            lineHeight="1.15"
          >
            {value}
            <Text
              as="span"
              ml={1}
              fontSize={{ base: '11px', md: '14px' }}
              fontWeight={400}
              color="#86909C"
            >
              {suffix}
            </Text>
          </Text>
        </Box>
        <Flex
          w={{ base: '34px', md: '44px' }}
          h={{ base: '34px', md: '44px' }}
          flexShrink={0}
          borderRadius={{ base: '10px', md: '13px' }}
          bg={accentBg}
          color={accent}
          align="center"
          justify="center"
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.8} />
        </Flex>
      </Flex>
    </Box>
  );
}
