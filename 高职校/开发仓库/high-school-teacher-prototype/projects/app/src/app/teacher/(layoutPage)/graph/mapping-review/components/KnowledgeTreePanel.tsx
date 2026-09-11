import { useMemo, useState } from 'react';
import { Box, Flex, Input, InputGroup, InputLeftElement, Text, VStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, CheckIcon, CloseIcon, TimeIcon } from '@chakra-ui/icons';
import { knowledgeTree, type MappingStatus } from '../mockData';

type StatusMap = Record<string, MappingStatus>;

type KnowledgeTreePanelProps = {
  statusByKnowledgeId: StatusMap;
  selectedKnowledgeId: string | null;
  onSelectKnowledge: (knowledgeId: string) => void;
};

function countByStatus(ids: string[], statusByKnowledgeId: StatusMap) {
  let pending = 0;
  let rejected = 0;
  ids.forEach((id) => {
    const status = statusByKnowledgeId[id];
    if (status === 'pending') pending += 1;
    if (status === 'rejected') rejected += 1;
  });
  return { total: ids.length, pending, rejected };
}

function StatusChip({ pending, rejected, total }: { pending: number; rejected: number; total: number }) {
  if (pending > 0) {
    return (
      <Flex align="center" gap={0.5} flexShrink={0} color="orange.600">
        <TimeIcon boxSize={2.5} />
        <Text as="span" fontSize="11px">
          {pending}
        </Text>
      </Flex>
    );
  }
  if (rejected > 0) {
    return (
      <Flex align="center" gap={0.5} flexShrink={0} color="red.500">
        <CloseIcon boxSize={2.5} />
        <Text as="span" fontSize="11px">
          {rejected}
        </Text>
      </Flex>
    );
  }
  return (
    <Flex align="center" gap={0.5} flexShrink={0} color="green.600">
      <CheckIcon boxSize={2.5} />
      <Text as="span" fontSize="11px">
        {total}
      </Text>
    </Flex>
  );
}

function LeafStatus({ status }: { status?: MappingStatus }) {
  if (status === 'pending') {
    return (
      <Text as="span" fontSize="11px" color="orange.600" flexShrink={0}>
        待审
      </Text>
    );
  }
  if (status === 'rejected') {
    return <CloseIcon boxSize={2.5} color="red.500" />;
  }
  return <CheckIcon boxSize={2.5} color="green.500" />;
}

export default function KnowledgeTreePanel({
  statusByKnowledgeId,
  selectedKnowledgeId,
  onSelectKnowledge
}: KnowledgeTreePanelProps) {
  const [keyword, setKeyword] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalPoints = useMemo(
    () => knowledgeTree.reduce((sum, mod) => sum + mod.sections.reduce((s, sec) => s + sec.points.length, 0), 0),
    []
  );

  const kw = keyword.trim();

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" boxShadow="sm" overflow="hidden">
      <Flex px={3.5} py={3} borderBottom="1px solid" borderColor="gray.200" align="center" justify="space-between">
        <Text fontWeight={700} fontSize="sm" color="gray.800">
          课程知识树
        </Text>
        <Text fontSize="xs" color="gray.500">
          {totalPoints} 个知识点
        </Text>
      </Flex>
      <Box px={3.5} py={2.5} borderBottom="1px solid" borderColor="gray.200">
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" boxSize={3.5} />
          </InputLeftElement>
          <Input
            placeholder="搜索知识点…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            bg="white"
          />
        </InputGroup>
      </Box>

      <VStack
        as="div"
        align="stretch"
        spacing={0}
        p={2}
        maxH="calc(100vh - 380px)"
        minH="320px"
        overflowY="auto"
      >
        {knowledgeTree.map((mod) => {
          const modIds = mod.sections.flatMap((sec) => sec.points.map((p) => p.id));
          const modCount = countByStatus(modIds, statusByKnowledgeId);
          const modCollapsed = collapsed[mod.id] ?? false;
          const visibleSections = mod.sections
            .map((sec) => ({
              ...sec,
              points: kw ? sec.points.filter((p) => p.name.includes(kw)) : sec.points
            }))
            .filter((sec) => (kw ? sec.points.length > 0 : true));
          if (kw && visibleSections.length === 0) return null;

          return (
            <Box key={mod.id}>
              <Flex
                align="center"
                gap={1.5}
                px={2}
                py={1.5}
                rounded="md"
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => toggle(mod.id)}
              >
                {modCollapsed ? (
                  <ChevronRightIcon boxSize={4} color="gray.500" />
                ) : (
                  <ChevronDownIcon boxSize={4} color="gray.500" />
                )}
                <Text fontSize="13px" fontWeight={600} color="gray.700" flex={1} noOfLines={1}>
                  {mod.name}
                </Text>
                <StatusChip {...modCount} />
              </Flex>

              {!modCollapsed &&
                visibleSections.map((sec) => {
                  const secIds = sec.points.map((p) => p.id);
                  const secCount = countByStatus(secIds, statusByKnowledgeId);
                  const secCollapsed = (collapsed[sec.id] ?? false) && !kw;
                  return (
                    <Box key={sec.id} pl={4}>
                      <Flex
                        align="center"
                        gap={1.5}
                        px={2}
                        py={1.5}
                        rounded="md"
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => toggle(sec.id)}
                      >
                        {secCollapsed ? (
                          <ChevronRightIcon boxSize={4} color="gray.500" />
                        ) : (
                          <ChevronDownIcon boxSize={4} color="gray.500" />
                        )}
                        <Text fontSize="13px" color="gray.600" flex={1} noOfLines={1}>
                          {sec.name}
                        </Text>
                        <StatusChip {...secCount} />
                      </Flex>
                      {!secCollapsed &&
                        sec.points.map((point) => {
                          const selected = point.id === selectedKnowledgeId;
                          return (
                            <Flex
                              key={point.id}
                              align="center"
                              gap={1.5}
                              pl={8}
                              pr={2}
                              py={1.5}
                              rounded="md"
                              cursor="pointer"
                              bg={selected ? 'red.50' : undefined}
                              _hover={{ bg: selected ? 'red.50' : 'gray.50' }}
                              onClick={() => onSelectKnowledge(point.id)}
                            >
                              <Text
                                fontSize="13px"
                                color={selected ? 'primary.500' : 'gray.600'}
                                fontWeight={selected ? 600 : 400}
                                flex={1}
                                noOfLines={1}
                              >
                                {point.name}
                              </Text>
                              <LeafStatus status={statusByKnowledgeId[point.id]} />
                            </Flex>
                          );
                        })}
                    </Box>
                  );
                })}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
