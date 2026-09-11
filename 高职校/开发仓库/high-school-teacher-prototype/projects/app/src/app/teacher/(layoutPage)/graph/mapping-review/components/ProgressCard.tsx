import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { AI_FINISHED_AT, AI_PIPELINE } from '../mockData';

type ProgressCardProps = {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
};

function Stat({ num, label, color }: { num: number; label: string; color?: string }) {
  return (
    <VStack spacing={0} align="flex-start" minW="56px">
      <Text fontSize="xl" fontWeight={700} lineHeight={1.2} color={color || 'gray.800'}>
        {num}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
    </VStack>
  );
}

export default function ProgressCard({ total, pending, confirmed, rejected }: ProgressCardProps) {
  const percent = total === 0 ? 0 : Math.round((confirmed / total) * 100);
  const confirmedPct = total === 0 ? 0 : (confirmed / total) * 100;
  const pendingPct = total === 0 ? 0 : (pending / total) * 100;
  const rejectedPct = total === 0 ? 0 : (rejected / total) * 100;
  const etaMinutes = Math.ceil(pending * 0.6);

  return (
    <Flex
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="xl"
      px={5}
      py={3.5}
      boxShadow="sm"
      align="center"
      gap={7}
    >
      <HStack spacing={6} flexShrink={0}>
        <Stat num={total} label="总映射" />
        <Stat num={pending} label="待审核" color="orange.600" />
        <Stat num={confirmed} label="已确认" color="green.600" />
        <Stat num={rejected} label="已驳回" color="red.500" />
      </HStack>

      <VStack flex={1} align="stretch" spacing={1.5}>
        <Flex h="8px" rounded="full" bg="gray.100" overflow="hidden">
          <Box w={`${confirmedPct}%`} bg="green.500" transition="width 0.3s ease" />
          <Box w={`${pendingPct}%`} bg="orange.400" transition="width 0.3s ease" />
          <Box w={`${rejectedPct}%`} bg="red.400" transition="width 0.3s ease" />
        </Flex>
        <Text fontSize="xs" color="gray.500">
          审核进度 {percent}%{pending > 0 ? ` · 预计还需 ${etaMinutes} 分钟` : ' · 全部完成'}
        </Text>
      </VStack>

      <Box textAlign="right" flexShrink={0}>
        <Text fontSize="xs" color="gray.500" lineHeight={1.7}>
          AI 打标完成于{' '}
          <Text as="b" color="gray.600">
            {AI_FINISHED_AT}
          </Text>
          <br />
          流程:{AI_PIPELINE}
        </Text>
      </Box>
    </Flex>
  );
}
