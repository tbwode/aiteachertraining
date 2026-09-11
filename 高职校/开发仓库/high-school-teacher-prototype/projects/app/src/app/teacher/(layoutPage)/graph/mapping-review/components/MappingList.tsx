import { useEffect, useRef } from 'react';
import { Box, Flex, HStack, Tag, TagCloseButton, TagLabel, Text, VStack } from '@chakra-ui/react';
import MappingCard from './MappingCard';
import type { Mapping, Mastery } from '../mockData';
import { abilityIndex } from '../mockData';

export type MappingTab = 'pending' | 'high' | 'confirmed' | 'rejected' | 'governance';

type TabDef = {
  key: MappingTab;
  label: string;
  count: number;
  danger?: boolean;
};

type MappingListProps = {
  mappings: Mapping[];
  activeTab: MappingTab;
  onTabChange: (tab: MappingTab) => void;
  abilityFilter: string | null;
  onClearAbilityFilter: () => void;
  highlightKnowledgeId: string | null;
  onConfirm: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onUndo: (id: string) => void;
  onMasteryChange: (id: string, mastery: Mastery) => void;
  onWeightChange: (id: string, weight: number) => void;
  onRebind: (id: string) => void;
  onIgnoreGovernance: (id: string) => void;
};

export function countByTab(mappings: Mapping[]): Record<MappingTab, number> {
  return {
    pending: mappings.filter((m) => m.status === 'pending').length,
    high: mappings.filter((m) => m.status === 'pending' && m.confidence >= 0.9).length,
    confirmed: mappings.filter((m) => m.status === 'confirmed').length,
    rejected: mappings.filter((m) => m.status === 'rejected').length,
    governance: mappings.filter((m) => m.status === 'pending' && m.governance && !m.governance.ignored).length
  };
}

function filterByTab(mappings: Mapping[], tab: MappingTab): Mapping[] {
  switch (tab) {
    case 'pending':
      return mappings.filter((m) => m.status === 'pending');
    case 'high':
      return mappings.filter((m) => m.status === 'pending' && m.confidence >= 0.9);
    case 'confirmed':
      return mappings.filter((m) => m.status === 'confirmed');
    case 'rejected':
      return mappings.filter((m) => m.status === 'rejected');
    case 'governance':
      return mappings.filter((m) => m.status === 'pending' && m.governance && !m.governance.ignored);
  }
}

export default function MappingList({
  mappings,
  activeTab,
  onTabChange,
  abilityFilter,
  onClearAbilityFilter,
  highlightKnowledgeId,
  ...handlers
}: MappingListProps) {
  const counts = countByTab(mappings);
  const listRef = useRef<HTMLDivElement>(null);

  const tabs: TabDef[] = [
    { key: 'pending', label: '待审核', count: counts.pending },
    { key: 'high', label: '高置信度', count: counts.high },
    { key: 'confirmed', label: '已确认', count: counts.confirmed },
    { key: 'rejected', label: '已驳回', count: counts.rejected },
    { key: 'governance', label: '治理待办', count: counts.governance, danger: true }
  ];

  const visible = filterByTab(mappings, activeTab).filter((m) =>
    abilityFilter ? m.abilityCode === abilityFilter : true
  );

  useEffect(() => {
    if (!highlightKnowledgeId) return;
    const el = document.getElementById(`mapping-card-${highlightKnowledgeId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightKnowledgeId, activeTab]);

  const filterName = abilityFilter ? abilityIndex[abilityFilter]?.name : null;

  return (
    <Box>
      <Flex gap={1} mb={3} flexWrap="wrap">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Flex
              key={tab.key}
              as="button"
              align="center"
              gap={1.5}
              px={3.5}
              py={2}
              rounded="lg"
              bg={active ? 'white' : 'transparent'}
              border="1px solid"
              borderColor={active ? 'gray.200' : 'transparent'}
              boxShadow={active ? 'sm' : undefined}
              fontWeight={active ? 600 : 400}
              color={active ? 'gray.800' : 'gray.500'}
              fontSize="sm"
              onClick={() => onTabChange(tab.key)}
              _hover={{ bg: active ? 'white' : 'whiteAlpha.700' }}
            >
              {tab.label}
              <Text
                as="span"
                fontSize="xs"
                color={tab.danger && tab.count > 0 ? 'red.500' : 'gray.400'}
                fontWeight={tab.danger && tab.count > 0 ? 700 : 400}
              >
                {tab.count}
              </Text>
            </Flex>
          );
        })}
      </Flex>

      {abilityFilter && (
        <HStack mb={3} spacing={2}>
          <Text fontSize="xs" color="gray.500">
            正在按能力点筛选:
          </Text>
          <Tag size="sm" colorScheme="primary" variant="subtle" rounded="full">
            <TagLabel>
              {abilityFilter} {filterName}
            </TagLabel>
            <TagCloseButton onClick={onClearAbilityFilter} />
          </Tag>
        </HStack>
      )}

      <VStack
        ref={listRef}
        align="stretch"
        spacing={3}
        maxH="calc(100vh - 380px)"
        minH="320px"
        overflowY="auto"
        pr={1}
        pb={2}
      >
        {visible.length === 0 ? (
          <Flex
            bg="white"
            border="1px dashed"
            borderColor="gray.300"
            rounded="xl"
            py={12}
            align="center"
            justify="center"
            direction="column"
            gap={1}
          >
            <Text fontSize="sm" color="gray.500">
              该分类下暂无映射
            </Text>
            <Text fontSize="xs" color="gray.400">
              切换上方页签或清除能力点筛选查看
            </Text>
          </Flex>
        ) : (
          visible.map((mapping) => (
            <Box key={mapping.id} id={`mapping-card-${mapping.knowledgeId}`}>
              <MappingCard
                mapping={mapping}
                highlighted={mapping.knowledgeId === highlightKnowledgeId}
                {...handlers}
              />
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
}
