'use client';

import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Clock3, MessageSquarePlus } from 'lucide-react';

export type WorkspaceConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  skillCount: number;
};

export default function ChatHistoryPanel({
  conversations,
  activeId,
  onSelect,
  onCreate
}: {
  conversations: WorkspaceConversationSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <Flex h="100%" direction="column" minH={0}>
      <Button
        type="button"
        h="42px"
        borderRadius="11px"
        bg="linear-gradient(135deg, #C8000B, #E52531)"
        color="white"
        leftIcon={<MessageSquarePlus size={16} />}
        fontSize="13px"
        _hover={{ bg: 'linear-gradient(135deg, #A50008, #C8000B)' }}
        _focusVisible={{ outline: 'none', boxShadow: '0 0 0 3px rgba(200,0,11,.18)' }}
        onClick={onCreate}
      >
        新建备课对话
      </Button>

      <HStack mt={5} mb={3} spacing={2} color="#64748B">
        <Clock3 size={14} />
        <Text fontSize="12px" fontWeight={700} letterSpacing="0.04em">
          最近对话
        </Text>
      </HStack>

      <VStack spacing={2} align="stretch" overflowY="auto" flex="1" pr={1}>
        {conversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <Box
              as="button"
              type="button"
              key={conversation.id}
              textAlign="left"
              px={3}
              py={3}
              borderRadius="11px"
              border="1px solid"
              borderColor={active ? '#FDCCC8' : 'transparent'}
              bg={active ? '#FFF1F0' : 'transparent'}
              transition="background 0.18s ease, border-color 0.18s ease"
              _hover={{ bg: active ? '#FFF1F0' : '#F8FAFC' }}
              _focusVisible={{ outline: 'none', boxShadow: '0 0 0 3px rgba(200,0,11,.16)' }}
              onClick={() => onSelect(conversation.id)}
            >
              <Text fontSize="12px" fontWeight={active ? 700 : 600} color="#334155" noOfLines={2}>
                {conversation.title}
              </Text>
              <Flex align="center" justify="space-between" mt={2} gap={2}>
                <Text fontSize="10px" color="#94A3B8">
                  {conversation.updatedAt}
                </Text>
                <Text
                  fontSize="9px"
                  color={active ? '#C8000B' : '#64748B'}
                  bg={active ? 'white' : '#F1F5F9'}
                  borderRadius="full"
                  px={2}
                  py="2px"
                >
                  {conversation.skillCount} 项技能
                </Text>
              </Flex>
            </Box>
          );
        })}
      </VStack>
    </Flex>
  );
}
