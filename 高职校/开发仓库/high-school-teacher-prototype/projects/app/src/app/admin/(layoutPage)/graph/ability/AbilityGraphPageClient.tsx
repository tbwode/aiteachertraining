'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Skeleton,
  Stack,
  Text
} from '@chakra-ui/react';
import { ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import { countNodes, getPublishGate, listGraphs } from './_mock/store';
import type { AbilityGraph, GraphStatus } from './_mock/types';

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF1F0';

const statusMeta: Record<GraphStatus, { label: string; colorScheme: string }> = {
  published: { label: '已发布', colorScheme: 'green' },
  draft: { label: '有草稿待审', colorScheme: 'orange' }
};

const GRID_COLUMNS = '2fr 1.4fr 1.3fr 0.9fr 1fr 0.8fr 1.1fr 1.2fr';

export default function AbilityGraphPageClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [graphs, setGraphs] = useState<AbilityGraph[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setGraphs(listGraphs());
    setMounted(true);
  }, []);

  const filteredGraphs = useMemo(() => {
    const value = keyword.trim();
    if (!value) return graphs;
    return graphs.filter(
      (item) => item.jobName.includes(value) || item.majorDirection.includes(value)
    );
  }, [graphs, keyword]);

  const stats = useMemo(() => {
    const draftCount = graphs.filter((item) => item.status === 'draft').length;
    const deprecationTodos = graphs.reduce(
      (sum, item) =>
        sum +
        item.versions
          .filter((v) => v.status === 'draft')
          .reduce(
            (inner, version) =>
              inner + version.deprecations.filter((d) => d.status === 'pending').length,
            0
          ),
      0
    );
    return [
      { label: '图谱总数', value: graphs.length, icon: 'layers' as const },
      { label: '已发布图谱', value: graphs.length - draftCount, icon: 'check-circle' as const },
      { label: '草稿待审核', value: draftCount, icon: 'clock' as const },
      { label: '版本治理待办', value: deprecationTodos, icon: 'bell' as const }
    ];
  }, [graphs]);

  const todoGraphs = useMemo(
    () =>
      graphs.filter((g) =>
        g.versions.some(
          (v) => v.status === 'draft' && v.deprecations.some((d) => d.status === 'pending')
        )
      ),
    [graphs]
  );

  return (
    <Stack spacing={6}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
      >
        <Box>
          <HStack spacing={3}>
            <Flex
              w="44px"
              h="44px"
              rounded="14px"
              bg={ACCENT_SOFT}
              color={ACCENT}
              align="center"
              justify="center"
            >
              <AdminIcon name="layers" style={{ width: 22, height: 22 }} />
            </Flex>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                岗位能力图谱
              </Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                校级共享资产：AI 生成岗位能力图谱，人工审核后按版本发布，供课程映射、测评诊断等业务调用。
              </Text>
            </Box>
          </HStack>
        </Box>
        <ButtonGroup isAttached variant="solid">
          <Button
            leftIcon={<AdminIcon name="sparkles" style={{ width: 16, height: 16 }} />}
            bg={ACCENT}
            color="white"
            rounded="12px"
            _hover={{ bg: '#A80009' }}
            onClick={() => router.push('/admin/graph/ability/create/ai')}
          >
            AI 生成图谱
          </Button>
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="更多创建方式"
              icon={<ChevronDownIcon />}
              bg={ACCENT}
              color="white"
              rounded="12px"
              _hover={{ bg: '#A80009' }}
              borderLeft="1px solid"
              borderColor="whiteAlpha.400"
            />
            <MenuList minW="180px">
              <MenuItem onClick={() => router.push('/admin/graph/ability/create/ai')}>
                AI 生成（推荐）
              </MenuItem>
              <MenuItem onClick={() => router.push('/admin/graph/ability/new')}>
                手工搭建
              </MenuItem>
            </MenuList>
          </Menu>
        </ButtonGroup>
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>
        {stats.map((item) => (
          <HStack
            key={item.label}
            bg="white"
            rounded="20px"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            px={5}
            py={4}
            spacing={4}
          >
            <Flex
              w="40px"
              h="40px"
              rounded="12px"
              bg={ACCENT_SOFT}
              color={ACCENT}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <AdminIcon name={item.icon} style={{ width: 20, height: 20 }} />
            </Flex>
            <Box>
              {mounted ? (
                <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
                  {item.value}
                </Text>
              ) : (
                <Skeleton h="28px" w="40px" />
              )}
              <Text fontSize="xs" color="gray.500">
                {item.label}
              </Text>
            </Box>
          </HStack>
        ))}
      </SimpleGrid>

      {mounted && todoGraphs.length > 0 && (
        <Box
          bg="orange.50"
          borderWidth="1px"
          borderColor="orange.200"
          rounded="16px"
          px={5}
          py={4}
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={3}
          >
            <HStack spacing={3} align="flex-start">
              <Box color="orange.500" mt="2px">
                <AdminIcon name="bell" style={{ width: 18, height: 18 }} />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="orange.700">
                  版本治理提醒
                </Text>
                {todoGraphs.map((g) => {
                  const draft = g.versions.find((v) => v.status === 'draft');
                  const pendings = draft?.deprecations.filter((d) => d.status === 'pending') ?? [];
                  const mappingCount = pendings.reduce(
                    (sum, d) => sum + d.affectedCourses.reduce((s, c) => s + c.mappingCount, 0),
                    0
                  );
                  return (
                    <Text key={g.id} fontSize="sm" color="orange.700" mt={0.5}>
                      「{g.jobName}」{draft?.version} 草稿建议废弃 {pendings.map((d) => `${d.code}（${d.name}）`).join('、')}
                      。发布后将有 {mappingCount} 条课程映射进入教师治理待办，请先处理废弃影响。
                    </Text>
                  );
                })}
              </Box>
            </HStack>
            <Button
              size="sm"
              variant="outline"
              colorScheme="orange"
              rounded="10px"
              flexShrink={0}
              onClick={() => router.push(`/admin/graph/ability/${todoGraphs[0].id}?tab=impact`)}
            >
              前往处理
            </Button>
          </Flex>
        </Box>
      )}

      <Box bg="white" rounded="24px" borderWidth="1px" borderColor="blackAlpha.100" p={6}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          mb={5}
        >
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            图谱列表
          </Text>
          <InputGroup maxW={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索岗位名称 / 专业方向"
              rounded="12px"
              bg="gray.50"
            />
          </InputGroup>
        </Flex>

        <Grid
          templateColumns={GRID_COLUMNS}
          gap={3}
          px={4}
          py={3}
          bg="gray.50"
          rounded="12px"
          display={{ base: 'none', lg: 'grid' }}
        >
          {['岗位名称', '专业方向', '节点规模', '当前版本', '状态', '关联课程', '更新时间', '操作'].map(
            (head) => (
              <Text key={head} fontSize="xs" fontWeight="semibold" color="gray.500">
                {head}
              </Text>
            )
          )}
        </Grid>

        <Stack spacing={3} mt={3}>
          {!mounted &&
            [0, 1, 2].map((i) => <Skeleton key={i} h="64px" rounded="16px" />)}
          {mounted && filteredGraphs.length === 0 && (
            <Flex direction="column" align="center" py={12} gap={2}>
              <AdminIcon name="folder-open" style={{ width: 28, height: 28, color: '#A0AEC0' }} />
              <Text fontSize="sm" color="gray.500">
                未找到匹配的图谱，换个关键词试试
              </Text>
            </Flex>
          )}
          {mounted &&
            filteredGraphs.map((graph) => {
              const meta = statusMeta[graph.status];
              const counts = countNodes(graph.tasks);
              const gate = getPublishGate(graph);
              const isAiDraft = graph.status === 'draft' && graph.sourceDocs.length > 0;
              return (
                <Grid
                  key={graph.id}
                  templateColumns={{ base: '1fr', lg: GRID_COLUMNS }}
                  gap={3}
                  px={4}
                  py={4}
                  rounded="16px"
                  borderWidth="1px"
                  borderColor="blackAlpha.100"
                  alignItems="center"
                  _hover={{ borderColor: 'red.200', bg: 'red.50' }}
                  transition="all 0.15s"
                >
                  <HStack spacing={3}>
                    <Flex
                      w="36px"
                      h="36px"
                      rounded="10px"
                      bg={ACCENT_SOFT}
                      color={ACCENT}
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <AdminIcon name="layers" style={{ width: 18, height: 18 }} />
                    </Flex>
                    <Box>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                          {graph.jobName}
                        </Text>
                        {isAiDraft && (
                          <Badge colorScheme="purple" rounded="full" px={2} fontSize="10px">
                            AI 生成待审定
                          </Badge>
                        )}
                      </HStack>
                      {graph.status === 'draft' && !gate.ok && (
                        <Text fontSize="11px" color="orange.500" mt={0.5}>
                          {gate.reasons.length} 项发布前待处理
                        </Text>
                      )}
                    </Box>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {graph.majorDirection}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {counts.tasks} 任务 · {counts.abilities} 能力 · {counts.knowledges} 知识点
                  </Text>
                  <Button
                    variant="link"
                    size="sm"
                    color={ACCENT}
                    fontWeight="medium"
                    justifyContent="flex-start"
                    onClick={() => router.push(`/admin/graph/ability/${graph.id}?tab=versions`)}
                  >
                    {graph.currentVersion || '未发布'}
                  </Button>
                  <Box>
                    <Badge colorScheme={meta.colorScheme} rounded="full" px={2.5} py={0.5}>
                      {meta.label}
                    </Badge>
                  </Box>
                  <Text fontSize="sm" color="gray.600">
                    {graph.linkedCourses.length} 门
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {graph.updatedAt}
                  </Text>
                  <Box>
                    <Button
                      size="sm"
                      bg={ACCENT}
                      color="white"
                      rounded="10px"
                      _hover={{ bg: '#A80009' }}
                      rightIcon={<AdminIcon name="arrow-right" style={{ width: 14, height: 14 }} />}
                      onClick={() => router.push(`/admin/graph/ability/${graph.id}`)}
                    >
                      进入工作台
                    </Button>
                  </Box>
                </Grid>
              );
            })}
        </Stack>
      </Box>
    </Stack>
  );
}
