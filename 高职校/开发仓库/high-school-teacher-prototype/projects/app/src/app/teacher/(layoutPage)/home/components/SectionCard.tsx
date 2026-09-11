import type { ReactNode } from 'react';
import { useId } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { CARD_SHADOW } from '../constants';

type SectionCardProps = {
  title: string;
  right?: ReactNode;
  minHeight?: string;
  contentHeight?: string; // 内容区域的固定高度
  children: ReactNode;
};

export function SectionCard({
  title,
  right,
  minHeight = '280px',
  contentHeight,
  children
}: SectionCardProps) {
  const titleId = useId();

  return (
    <Box
      as="section"
      aria-labelledby={titleId}
      bg="white"
      border="1px solid"
      borderColor="#ECEEF2"
      borderRadius={{ base: '18px', md: '20px' }}
      p={{ base: 4, md: 5 }}
      minH={minHeight}
      boxShadow={CARD_SHADOW}
      display="flex"
      flexDirection="column"
    >
      <Flex align="center" justify="space-between" mb={4} gap={4}>
        <Flex align="center" gap={2}>
          <Box w="4px" h="18px" bg="#C8000B" borderRadius="full" aria-hidden="true" />
          <Text id={titleId} as="h2" fontSize="16px" fontWeight={700} color="#1D2129">
            {title}
          </Text>
        </Flex>
        {right}
      </Flex>
      <Box
        {...(contentHeight
          ? {
              height: contentHeight,
              overflowY: 'auto' as const,
              overflowX: 'hidden' as const,
              sx: {
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  bg: 'gray.100',
                  borderRadius: 'full'
                },
                '&::-webkit-scrollbar-thumb': {
                  bg: 'gray.300',
                  borderRadius: 'full',
                  _hover: {
                    bg: 'gray.400'
                  }
                }
              }
            }
          : {
              flex: '1'
            })}
      >
        {children}
      </Box>
    </Box>
  );
}
