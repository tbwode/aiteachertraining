'use client';

import { Box, Flex, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import {
  BookOpenCheck,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  FlaskConical,
  ListChecks,
  MousePointerClick,
  Presentation,
  ShoppingCart,
  Video,
  Wrench
} from 'lucide-react';
import type { WorkspaceSkillKey } from '../../workbuddyConfig';
import { WORKSPACE_SKILL_META, type MockSkillInvocation } from '../mockSkillConversation';

const skillIcons: Record<WorkspaceSkillKey, typeof BookOpenCheck> = {
  lesson: BookOpenCheck,
  slides: Presentation,
  interactive: MousePointerClick,
  video: Video,
  quiz: ListChecks,
  practice: FlaskConical,
  standards: BadgeCheck,
  'school-affairs': Building2,
  procurement: ShoppingCart,
  logistics: Wrench,
  meeting: CalendarCheck
};

export default function SkillInvocationCard({
  invocations,
  isRunning = false
}: {
  invocations: MockSkillInvocation[];
  isRunning?: boolean;
}) {
  return (
    <Box
      as="section"
      aria-label="技能调用轨迹"
      border="1px solid #E2E8F0"
      borderRadius="14px"
      bg="#F8FAFC"
      overflow="hidden"
    >
      <Flex px={4} py={3} align="center" justify="space-between" borderBottom="1px solid #E2E8F0">
        <HStack spacing={2}>
          <Flex
            w="26px"
            h="26px"
            align="center"
            justify="center"
            borderRadius="8px"
            bg="#FFF1F0"
            color="#C8000B"
          >
            <FlaskConical size={14} />
          </Flex>
          <Text fontSize="13px" fontWeight={700} color="#1E293B">
            技能调用轨迹
          </Text>
        </HStack>
        <Text fontSize="11px" color={isRunning ? '#D97706' : '#059669'} aria-live="polite">
          {isRunning ? '编排中…' : `${invocations.length} 项技能已完成`}
        </Text>
      </Flex>

      <VStack spacing={0} align="stretch">
        {invocations.map((invocation, index) => {
          const meta = WORKSPACE_SKILL_META[invocation.skill];
          const SkillIcon = skillIcons[invocation.skill];
          const running = isRunning && index === 0;
          const queued = isRunning && index > 0;

          return (
            <Flex
              key={invocation.id}
              px={4}
              py={3}
              gap={3}
              align="flex-start"
              borderBottom={index < invocations.length - 1 ? '1px solid #E8EDF3' : undefined}
              opacity={queued ? 0.55 : 1}
            >
              <Flex
                w="30px"
                h="30px"
                flexShrink={0}
                align="center"
                justify="center"
                borderRadius="9px"
                bg={meta.softBackground}
                color={meta.color}
              >
                <SkillIcon size={15} />
              </Flex>
              <Box flex="1" minW={0}>
                <Flex align="center" justify="space-between" gap={3}>
                  <Text fontSize="12px" fontWeight={700} color="#334155">
                    {invocation.title}
                  </Text>
                  <HStack spacing={1.5} color={running ? '#D97706' : '#059669'} flexShrink={0}>
                    {running ? (
                      <Spinner size="xs" />
                    ) : queued ? (
                      <Box w="6px" h="6px" borderRadius="full" bg="#94A3B8" />
                    ) : (
                      <Flex
                        w="16px"
                        h="16px"
                        borderRadius="full"
                        bg="#DCFCE7"
                        align="center"
                        justify="center"
                      >
                        <Check size={10} strokeWidth={3} />
                      </Flex>
                    )}
                    <Text fontSize="10px">
                      {running ? '调用中' : queued ? '等待中' : `${invocation.durationMs} ms`}
                    </Text>
                  </HStack>
                </Flex>
                <Text fontSize="10px" color="#94A3B8" fontFamily="mono" mt={0.5} noOfLines={1}>
                  {invocation.toolName}
                </Text>
                <Text fontSize="11px" color="#64748B" mt={1} lineHeight="1.55">
                  {invocation.summary}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
}
