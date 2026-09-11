import { useState } from 'react';
import { Box, Flex, Input, InputGroup, InputLeftElement, Text, VStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import { abilityTree, TARGET_GRAPH } from '../mockData';

type AbilityTreePanelProps = {
  refCountByCode: Record<string, number>;
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
};

export default function AbilityTreePanel({ refCountByCode, selectedCode, onSelect }: AbilityTreePanelProps) {
  const [keyword, setKeyword] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (code: string) => setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }));
  const kw = keyword.trim();

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" boxShadow="sm" overflow="hidden">
      <Flex px={3.5} py={3} borderBottom="1px solid" borderColor="gray.200" align="center" justify="space-between">
        <Text fontWeight={700} fontSize="sm" color="gray.800">
          岗位能力树
        </Text>
        <Text fontSize="xs" color="gray.500">
          {TARGET_GRAPH.abilityCount} 个能力点
        </Text>
      </Flex>
      <Box px={3.5} py={2.5} borderBottom="1px solid" borderColor="gray.200">
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" boxSize={3.5} />
          </InputLeftElement>
          <Input
            placeholder="搜索能力点…"
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
        {abilityTree.map((domain) => {
          const visiblePoints = kw
            ? domain.points.filter((p) => `${p.code} ${p.name}`.includes(kw))
            : domain.points;
          if (kw && visiblePoints.length === 0) return null;
          const domainCollapsed = (collapsed[domain.code] ?? false) && !kw;

          return (
            <Box key={domain.code}>
              <Flex
                align="center"
                gap={1.5}
                px={2}
                py={1.5}
                rounded="md"
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => toggle(domain.code)}
              >
                {domainCollapsed ? (
                  <ChevronRightIcon boxSize={4} color="gray.500" />
                ) : (
                  <ChevronDownIcon boxSize={4} color="gray.500" />
                )}
                <Text fontSize="13px" fontWeight={600} color="gray.700" flex={1} noOfLines={1}>
                  {domain.name}
                </Text>
                <Text fontSize="11px" color="gray.400" flexShrink={0}>
                  {domain.points.length}
                </Text>
              </Flex>

              {!domainCollapsed &&
                visiblePoints.map((point) => {
                  const refCount = refCountByCode[point.code] ?? 0;
                  const selected = point.code === selectedCode;
                  const deprecated = point.status === 'deprecated';
                  return (
                    <Flex
                      key={point.code}
                      align="center"
                      gap={1.5}
                      pl={6}
                      pr={2}
                      py={1.5}
                      rounded="md"
                      cursor="pointer"
                      bg={selected ? 'red.50' : undefined}
                      _hover={{ bg: selected ? 'red.50' : 'gray.50' }}
                      onClick={() => onSelect(selected ? null : point.code)}
                    >
                      <Text
                        fontSize="13px"
                        flex={1}
                        noOfLines={1}
                        color={deprecated ? 'red.500' : selected ? 'primary.500' : 'gray.600'}
                        fontWeight={selected ? 600 : 400}
                        textDecoration={deprecated ? 'line-through' : undefined}
                      >
                        {point.code} {point.name}
                      </Text>
                      {deprecated ? (
                        <Text fontSize="11px" color="red.500" flexShrink={0}>
                          已废弃
                        </Text>
                      ) : point.status === 'new' ? (
                        <Text
                          fontSize="11px"
                          color="blue.600"
                          bg="blue.50"
                          px={1}
                          rounded="md"
                          flexShrink={0}
                        >
                          {point.versionTag}
                        </Text>
                      ) : refCount === 0 ? (
                        <Text fontSize="11px" color="orange.600" flexShrink={0}>
                          未覆盖
                        </Text>
                      ) : (
                        <Text fontSize="11px" color="green.600" flexShrink={0}>
                          引{refCount}
                        </Text>
                      )}
                    </Flex>
                  );
                })}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
